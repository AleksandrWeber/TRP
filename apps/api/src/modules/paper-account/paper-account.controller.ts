import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { CreatePaperAccountBodyDto } from '../../validation/dto/paper-account.dto';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { PaperAccountService } from './paper-account.service';
import { toPaperAccountView, type PaperAccountView } from './paper-account.view';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

type RequestWithUser = { user: AuthUser };

/**
 * PC-13 — HTTP transport for existing PaperAccountService.create.
 * Paper mode only. Paper Account remains the account owner.
 */
@Controller({ path: 'paper-accounts', version: '1' })
@RequirePermission(PermissionClass.PaperCommand)
export class PaperAccountController {
  constructor(
    private readonly accounts: PaperAccountService,
    private readonly commandAuthorization: CommandAuthorizationService,
  ) {}

  @Post()
  @Roles(Role.Trader, Role.Admin)
  async create(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('x-idempotency-key') idempotencyHeader: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
    @Body() body: CreatePaperAccountBodyDto,
  ): Promise<PaperAccountView> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    const context = authorize(this.commandAuthorization, request.user, workspaceId, correlationId);
    const now = new Date().toISOString();
    const idempotencyKey =
      body.idempotencyKey?.trim() ||
      idempotencyHeader?.trim() ||
      `paper-account:${context.actorId}:${now}`;
    try {
      const account = await this.accounts.create({
        workspaceId: context.workspaceId,
        currency: body.currency,
        mode: 'paper',
        openingCapital: body.openingCapital,
        idempotencyKey,
        actorId: context.actorId,
        correlationId: context.correlationId ?? undefined,
        openedAt: now,
        recordedAt: now,
      });
      return toPaperAccountView(account);
    } catch (error) {
      throw mapPaperAccountError(error);
    }
  }
}

function authorize(
  commandAuthorization: CommandAuthorizationService,
  user: AuthUser,
  workspaceId: string,
  correlationId: string | undefined,
) {
  try {
    return commandAuthorization.authorizeTradingCommand({
      user,
      workspaceId,
      correlationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'permission denied';
    if (message.includes('Trader') || message.includes('Administrator')) {
      throw new ForbiddenException('Permission denied');
    }
    throw new ForbiddenException('workspace access denied');
  }
}

function requiredHeader(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(`${name} header is required`);
  }
  return normalized;
}

function mapPaperAccountError(error: unknown): Error {
  const text = error instanceof Error ? error.message : 'paper account create failed';
  if (text.includes('idempotency key reused')) {
    return new ConflictException(text);
  }
  return new BadRequestException(text);
}
