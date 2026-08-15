import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  NotFoundException,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import {
  CheckStrategyLibraryEligibilityQueryDto,
  LibraryEntryIdParamDto,
  LibraryFamilyVersionParamDto,
  ListStrategyLibraryQueryDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import {
  parseIncludeArchived,
  parseMembershipStatuses,
  recordMatchesQuery,
  toEligibilityView,
  toLibraryPageView,
  toLibraryRecordView,
  type StrategyLibraryEligibilityView,
  type StrategyLibraryPageView,
  type StrategyLibraryRecordView,
} from './strategy-library.view';
import {
  STRATEGY_LIBRARY_ELIGIBILITY_PORT,
  type EligibilityPurpose,
  type StrategyLibraryEligibilityPort,
} from './ports/strategy-library-eligibility.port';
import {
  STRATEGY_LIBRARY_LOOKUP_PORT,
  type StrategyLibraryLookupPort,
} from './ports/strategy-library-lookup.port';

type RequestWithUser = { user: AuthUser };

/**
 * PC-01 — HTTP transport for existing Strategy Library Lookup + Eligibility ports.
 * Not a new SoT. Not `/strategies`. Registration / Lifecycle write ports stay inactive.
 */
@Controller({ path: 'strategy-library', version: '1' })
export class StrategyLibraryController {
  constructor(
    @Inject(STRATEGY_LIBRARY_LOOKUP_PORT)
    private readonly lookup: StrategyLibraryLookupPort,
    @Inject(STRATEGY_LIBRARY_ELIGIBILITY_PORT)
    private readonly eligibility: StrategyLibraryEligibilityPort,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListStrategyLibraryQueryDto,
  ): StrategyLibraryPageView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    let statuses: ReturnType<typeof parseMembershipStatuses>;
    try {
      statuses = parseMembershipStatuses(query.statuses);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }

    const searching = Boolean(query.q?.trim());
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const page = this.lookup.list({
      workspaceId,
      strategyFamilyId: query.strategyFamilyId?.trim() || undefined,
      statuses,
      exchangeScopeId: query.exchangeScopeId?.trim() || undefined,
      includeArchived: parseIncludeArchived(query.includeArchived),
      limit: searching ? Math.max(limit, 200) : limit,
      cursor: searching ? undefined : query.cursor?.trim() || undefined,
    });

    if (!searching) {
      return toLibraryPageView(page);
    }

    const filtered = page.items.filter((record) => recordMatchesQuery(record, query.q ?? ''));
    const sliced = filtered.slice(0, limit);
    return {
      authorityClass: 'source_of_truth',
      items: sliced.map(toLibraryRecordView),
      nextCursor:
        filtered.length > limit
          ? (sliced[sliced.length - 1]?.version.libraryEntryId ?? null)
          : null,
    };
  }

  @Get('families/:strategyFamilyId/versions/:version')
  getByFamilyVersion(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: LibraryFamilyVersionParamDto,
  ): StrategyLibraryRecordView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const record = this.lookup.getByFamilyVersion(params.strategyFamilyId, params.version);
    if (!record || record.strategy.workspaceId !== workspaceId) {
      throw new NotFoundException('Library entry not found');
    }
    return toLibraryRecordView(record);
  }

  @Get(':libraryEntryId/eligibility')
  checkEligibility(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: LibraryEntryIdParamDto,
    @Query() query: CheckStrategyLibraryEligibilityQueryDto,
  ): StrategyLibraryEligibilityView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    return toEligibilityView(
      this.eligibility.checkEligibility({
        libraryEntryId: params.libraryEntryId,
        workspaceId,
        exchangeScopeId: query.exchangeScopeId?.trim() || undefined,
        purpose: query.purpose as EligibilityPurpose | undefined,
      }),
    );
  }

  @Get(':libraryEntryId')
  getByLibraryEntryId(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: LibraryEntryIdParamDto,
  ): StrategyLibraryRecordView {
    const workspaceId = this.requireWorkspace(request.user, workspaceHeader);
    const record = this.lookup.getByLibraryEntryId(params.libraryEntryId);
    if (!record || record.strategy.workspaceId !== workspaceId) {
      throw new NotFoundException('Library entry not found');
    }
    return toLibraryRecordView(record);
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
