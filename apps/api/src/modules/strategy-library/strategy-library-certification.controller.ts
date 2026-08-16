import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Body,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import {
  CertificationAttemptIdParamDto,
  CertifyStrategyVersionBodyDto,
  ListCertificationHistoryQueryDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import {
  toCertificationAttemptView,
  toCertificationHistoryView,
  type CertificationAttemptView,
  type CertificationHistoryView,
} from './strategy-library-certification.view';
import {
  STRATEGY_LIBRARY_CERTIFICATION_PORT,
  type StrategyLibraryCertificationPort,
} from './ports/strategy-library-certification.port';

type RequestWithUser = { user: AuthUser };

/**
 * PC-02 — HTTP transport for existing StrategyLibraryCertificationPort.
 * Not a new SoT. Not a new certification authority. Library remains membership SoT.
 */
@Controller({ path: 'strategy-library/certifications', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class StrategyLibraryCertificationController {
  constructor(
    @Inject(STRATEGY_LIBRARY_CERTIFICATION_PORT)
    private readonly certification: StrategyLibraryCertificationPort,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @RequirePermission(PermissionClass.Research)
  @Post()
  certify(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: CertifyStrategyVersionBodyDto,
  ): CertificationAttemptView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    return toCertificationAttemptView(
      this.certification.certify({
        workspaceId,
        certifiedBy: request.user.userId,
        notes: body.notes,
        family: {
          strategyFamilyId: body.family.strategyFamilyId,
          name: body.family.name,
          description: body.family.description,
          registryRef: body.family.registryRef,
        },
        version: {
          version: body.version.version,
          contentHash: body.version.contentHash,
          market: body.version.market,
          supportedExchangeScopeIds: body.version.supportedExchangeScopeIds,
          supportedTimeframes: body.version.supportedTimeframes,
          supportedSymbols: body.version.supportedSymbols,
          universeRef: body.version.universeRef,
        },
        evidence: body.evidence.map((item) => ({
          evidenceId: item.evidenceId,
          type: item.type,
          sourceRef: { owner: item.sourceRef.owner, id: item.sourceRef.id },
          summary: item.summary,
        })),
        tacticalEnvelope: {
          envelopeVersion: body.tacticalEnvelope.envelopeVersion,
          allowedMarkets: body.tacticalEnvelope.allowedMarkets,
          allowedExchangeScopeIds: body.tacticalEnvelope.allowedExchangeScopeIds,
          allowedSymbols: body.tacticalEnvelope.allowedSymbols,
          allowedTimeframes: body.tacticalEnvelope.allowedTimeframes,
          riskPerTrade: body.tacticalEnvelope.riskPerTrade,
          maxPositions: body.tacticalEnvelope.maxPositions,
        },
      }),
    );
  }

  @Get()
  listHistory(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListCertificationHistoryQueryDto,
  ): CertificationHistoryView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const page = this.certification.listHistory({
      workspaceId,
      limit: query.limit,
    });
    return toCertificationHistoryView(page.items);
  }

  @Get(':attemptId')
  getAttempt(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: CertificationAttemptIdParamDto,
  ): CertificationAttemptView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const record = this.certification.getAttempt(params.attemptId, workspaceId);
    if (!record) {
      throw new NotFoundException('Certification attempt not found');
    }
    return toCertificationAttemptView(record);
  }

  private requireWorkspace(user: AuthUser, workspaceHeader: string | undefined): string {
    const workspaceId = workspaceHeader?.trim();
    if (!workspaceId) {
      throw new BadRequestException('X-Workspace-Id header is required');
    }
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
    return workspaceId;
  }
}
