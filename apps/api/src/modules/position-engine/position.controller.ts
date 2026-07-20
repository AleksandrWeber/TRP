import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceDomainService } from '../workspace';
import {
  PositionError,
  PositionImmutableError,
  PositionInvalidStateError,
  PositionNotFoundError,
  PositionPortfolioSyncError,
  PositionValidationError,
} from './position-errors';
import { PositionService } from './position.service';

type RequestWithUser = { user: AuthUser };

/**
 * Position Engine REST API (US205).
 * Position lifecycle endpoints. No exchange or execution.
 */
@Controller({ path: 'positions', version: '1' })
export class PositionController {
  constructor(
    private readonly positions: PositionService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  async list(@Req() req: RequestWithUser, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.positions.list(workspaceId, req.user.userId);
    });
  }

  @Get('open')
  async listOpen(
    @Req() req: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.positions.listOpen(workspaceId, req.user.userId);
    });
  }

  @Get('history')
  async listHistory(
    @Req() req: RequestWithUser,
    @Query('positionId') positionId: string | undefined,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.positions.listHistory(workspaceId, req.user.userId, positionId);
    });
  }

  @Get(':id')
  async getById(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.positions.getById(workspaceId, req.user.userId, id);
    });
  }

  /**
   * Position open/increase/reduce/close are intentionally not exposed over REST.
   * Lifecycle mutations must flow Order → Risk → Execution → PositionService.
   * Mark-price updates remain available for valuation without changing size/side.
   */
  @Patch('mark-price')
  async markPrice(
    @Req() req: RequestWithUser,
    @Body() body: { positionId?: string; markPrice?: string },
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    return this.run(async () => {
      const workspaceId = this.workspace(workspaceIdHeader);
      return this.positions.markPrice(workspaceId, req.user.userId, {
        positionId: String(body.positionId ?? ''),
        markPrice: String(body.markPrice ?? ''),
      });
    });
  }

  private workspace(workspaceIdHeader?: string): string {
    return requireWorkspaceId(workspaceIdHeader, this.workspaces);
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      throw mapPositionError(error);
    }
  }
}

function mapPositionError(error: unknown): Error {
  if (error instanceof HttpException) return error;
  if (error instanceof PositionNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (
    error instanceof PositionValidationError ||
    error instanceof PositionInvalidStateError ||
    error instanceof PositionImmutableError ||
    error instanceof PositionPortfolioSyncError
  ) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  if (error instanceof PositionError) {
    return new HttpException(
      { statusCode: HttpStatus.BAD_REQUEST, message: error.message, code: error.code },
      HttpStatus.BAD_REQUEST,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}
