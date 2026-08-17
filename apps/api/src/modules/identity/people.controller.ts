import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { AssignRoleBodyDto, PeopleUserIdParamDto, VALIDATION_PIPE_OPTIONS } from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { recordRoleChange, type RoleChangeReason } from '../auth/authorization-events';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import {
  LastAdminProtectedError,
  SelfRoleChangeError,
  UnknownRoleError,
} from './role-assignment.errors';
import type { User } from './user';
import { UserDomainService } from './user-domain.service';

export type PeopleOperatorView = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
};

/**
 * People HTTP adapter (V3-S02-c/d).
 * Transports Identity list and role assignment. Not a People bounded context.
 * Authorization is C6 RoleAdmin (Admin only). An Admin cannot change their own role.
 * CSRF remains the S01 cookie guard. Role-change events use the existing Logger.
 */
@Controller({ path: 'people', version: '1' })
@RequirePermission(PermissionClass.RoleAdmin)
export class PeopleController {
  private readonly logger: Logger;

  constructor(
    // Explicit tokens — vitest (esbuild) emits no design:paramtypes metadata.
    @Inject(UserDomainService) private readonly users: UserDomainService,
    @Inject(LOGGER) logger: Logger,
    @Inject(SecurityAuditService) private readonly audit: SecurityAuditService,
  ) {
    this.logger = logger.child('PeopleController');
  }

  @Get()
  list(): { operators: PeopleOperatorView[] } {
    return { operators: this.users.list().map(toOperatorView) };
  }

  @Patch(':userId/role')
  async assignRole(
    @Req() req: { user: AuthUser },
    @Param(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: PeopleUserIdParamDto }))
    params: PeopleUserIdParamDto,
    @Body(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: AssignRoleBodyDto }))
    body: AssignRoleBodyDto,
  ): Promise<PeopleOperatorView> {
    const actorUserId = req.user.userId;
    const existing = this.users.getById(params.userId);
    const fromRole = existing?.role;
    try {
      const user = await this.users.assignRole(params.userId, body.role, actorUserId);
      if (!user) {
        await this.recordAssignment({
          outcome: 'denied',
          actorUserId,
          subjectUserId: params.userId,
          fromRole,
          toRole: body.role,
          reason: 'not_found',
        });
        throw new NotFoundException('User not found');
      }
      if (fromRole !== user.role) {
        await this.recordAssignment({
          outcome: 'assigned',
          actorUserId,
          subjectUserId: user.id,
          fromRole,
          toRole: user.role,
        });
      }
      return toOperatorView(user);
    } catch (error) {
      const reason = roleChangeDenyReason(error);
      if (reason) {
        this.recordAssignment({
          outcome: 'denied',
          actorUserId,
          subjectUserId: params.userId,
          fromRole,
          toRole: body.role,
          reason,
        });
      }
      throw mapRoleAssignmentError(error);
    }
  }

  private async recordAssignment(payload: {
    outcome: 'assigned' | 'denied';
    actorUserId: string;
    subjectUserId: string;
    fromRole?: string;
    toRole?: string;
    reason?: RoleChangeReason;
  }): Promise<void> {
    await recordRoleChange(this.logger, payload, this.audit);
  }
}

function toOperatorView(user: User): PeopleOperatorView {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
}

function roleChangeDenyReason(error: unknown): RoleChangeReason | undefined {
  if (error instanceof SelfRoleChangeError) {
    return 'self_role';
  }
  if (error instanceof LastAdminProtectedError) {
    return 'last_admin';
  }
  return undefined;
}

function mapRoleAssignmentError(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }
  if (error instanceof LastAdminProtectedError || error instanceof SelfRoleChangeError) {
    throw new ConflictException(error.message);
  }
  if (error instanceof UnknownRoleError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
