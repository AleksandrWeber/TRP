/**
 * PC-04 — process-local history of Runtime Enforcement Gate decisions.
 *
 * Command log only. Does not decide PASS/FAIL. Does not persist a new SoT.
 * W3-O01-b: snapshot export/import enables durable persistence on this owner
 * via DurableRuntimeValidationStore.
 */

import { Injectable } from '@nestjs/common';
import type {
  RuntimeValidationHistoryPage,
  RuntimeValidationHistoryQuery,
  RuntimeValidationRecord,
} from './runtime-validation.record';

export type RuntimeValidationStoreDurableState = Readonly<{
  records: RuntimeValidationRecord[];
}>;

@Injectable()
export class InMemoryRuntimeValidationStore {
  private readonly records: RuntimeValidationRecord[] = [];

  /** Test helper. */
  clear(): void {
    this.records.length = 0;
  }

  append(record: RuntimeValidationRecord): RuntimeValidationRecord {
    this.records.push(record);
    return record;
  }

  get(validationId: string, workspaceId: string): RuntimeValidationRecord | null {
    const id = validationId?.trim() ?? '';
    const workspace = workspaceId?.trim() ?? '';
    if (!id || !workspace) return null;
    const record = this.records.find((item) => item.validationId === id);
    if (!record || record.workspaceId !== workspace) return null;
    return record;
  }

  list(query: RuntimeValidationHistoryQuery): RuntimeValidationHistoryPage {
    const workspaceId = query.workspaceId?.trim() ?? '';
    if (!workspaceId) {
      return Object.freeze({ items: Object.freeze([]) });
    }
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const items = this.records
      .filter((record) => record.workspaceId === workspaceId)
      .slice()
      .reverse();
    return Object.freeze({
      items: Object.freeze(items.slice(0, limit)),
    });
  }

  exportDurableState(): RuntimeValidationStoreDurableState {
    return Object.freeze({
      records: [...this.records],
    });
  }

  importDurableState(state: RuntimeValidationStoreDurableState): void {
    this.records.length = 0;
    for (const record of state.records ?? []) {
      this.records.push(record);
    }
  }
}
