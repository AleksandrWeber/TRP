import { Controller, Headers, MessageEvent, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { requireWorkspaceId } from '../../../common/workspace/require-workspace';
import { WorkspaceDomainService } from '../../workspace';
import { MarketProjectionChannelService } from './market-projection-channel.service';

/**
 * Live market projection SSE channel (US147).
 * Canonical projections only; workspace-isolated; UI cache never authoritative.
 */
@Controller({ path: 'market-data', version: '1' })
export class MarketProjectionSseController {
  constructor(
    private readonly channel: MarketProjectionChannelService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Sse('projections/stream')
  stream(
    @Headers('x-workspace-id') workspaceIdHeader: string | undefined,
    @Query('streamId') streamId?: string,
    @Query('cursorVersion') cursorVersionRaw?: string,
    @Query('cursorStreamId') cursorStreamId?: string,
    @Query('refresh') refreshRaw?: string,
  ): Observable<MessageEvent> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const cursorVersion =
      cursorVersionRaw !== undefined && cursorVersionRaw !== ''
        ? Number(cursorVersionRaw)
        : undefined;
    return this.channel.open({
      workspaceId,
      streamId: streamId !== undefined && streamId !== '' ? streamId : undefined,
      cursorVersion:
        cursorVersion !== undefined && Number.isFinite(cursorVersion) ? cursorVersion : undefined,
      cursorStreamId:
        cursorStreamId !== undefined && cursorStreamId !== '' ? cursorStreamId : undefined,
      refresh: refreshRaw === '1' || refreshRaw === 'true',
    });
  }
}
