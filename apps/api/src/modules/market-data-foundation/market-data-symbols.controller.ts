import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import { listMarketDataProviders } from './market-data-provider-catalog';
import type { MarketSymbolDiscoveryView } from './market-symbol.projection';
import { MarketSymbolDiscoveryService } from './market-symbol.service';

type RequestWithUser = { user: AuthUser };

export type MarketDataProviderCatalogView = Readonly<{
  providers: ReadonlyArray<{
    id: string;
    displayName: string;
    capabilities: readonly string[];
    availability: string;
  }>;
}>;

/**
 * Market Data symbol discovery HTTP surface (W2-S03-b).
 *
 * Projection permission only. No trading, ticker, candles, or order book.
 */
@Controller({ path: 'market-data', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class MarketDataSymbolsController {
  constructor(
    private readonly symbols: MarketSymbolDiscoveryService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('providers')
  providers(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): MarketDataProviderCatalogView {
    requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return {
      providers: listMarketDataProviders().map((provider) => ({
        id: provider.id,
        displayName: provider.displayName,
        capabilities: provider.capabilities,
        availability: provider.availability,
      })),
    };
  }

  @Get('connections/:connectionId/symbols')
  cached(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('connectionId') connectionId: string,
  ): MarketSymbolDiscoveryView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const view = this.symbols.cached(workspaceId, connectionId);
    if (!view) {
      throw new NotFoundException('No cached symbols for this connection');
    }
    return view;
  }

  @Post('connections/:connectionId/symbols/discover')
  async discover(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('connectionId') connectionId: string,
  ): Promise<MarketSymbolDiscoveryView> {
    try {
      return await this.symbols.discover({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        actorUserId: request.user.userId,
        connectionId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Symbol discovery could not be completed.');
    }
  }
}

function requireWorkspace(
  access: WorkspaceAccessService,
  user: AuthUser,
  workspaceHeader: string | undefined,
): string {
  const workspaceId = workspaceHeader?.trim();
  if (!workspaceId) {
    throw new BadRequestException('X-Workspace-Id header is required');
  }
  try {
    access.assertMember(workspaceId, user.userId);
  } catch {
    throw new ForbiddenException('workspace access denied');
  }
  return workspaceId;
}
