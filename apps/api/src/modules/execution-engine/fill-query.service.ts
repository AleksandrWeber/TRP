import { Inject, Injectable } from '@nestjs/common';
import type { PaperFill } from './domain/paper-fill';
import { FILL_REPOSITORY, type FillRepository } from './persistence/fill.repository';

/** Read-only public Fill boundary for rebuild and accounting queries. */
@Injectable()
export class FillQueryService {
  constructor(
    @Inject(FILL_REPOSITORY)
    private readonly fills: FillRepository,
  ) {}

  listByAccount(workspaceId: string, paperAccountId: string): Promise<PaperFill[]> {
    return this.fills.listByAccount(workspaceId, paperAccountId);
  }

  findByOrder(workspaceId: string, orderId: string): Promise<PaperFill[]> {
    return this.fills.findByOrder(workspaceId, orderId);
  }
}
