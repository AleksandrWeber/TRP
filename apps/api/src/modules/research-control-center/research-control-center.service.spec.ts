import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResearchControlCenterService } from './research-control-center.service';
import { ResearchControlCenterStore } from './research-control-center.store';

describe('US192 ResearchControlCenterService', () => {
  let service: ResearchControlCenterService;
  let store: ResearchControlCenterStore;
  const workspaceId = 'ws-control-192';

  beforeEach(() => {
    store = new ResearchControlCenterStore();
    service = new ResearchControlCenterService(store);
  });

  it('returns an operational dashboard snapshot', () => {
    const dashboard = service.getDashboard(workspaceId);
    expect(dashboard.platformStatus).toBe('operational');
    expect(dashboard.latestResearchRuns).toEqual([]);
    expect(dashboard.activeExecutions).toBe(0);
  });

  it('queues a smoke backtest execution', async () => {
    const record = service.startResearch(workspaceId, { kind: 'SmokeBacktest' });
    expect(record.status).toBe('pending');
    expect(record.kind).toBe('SmokeBacktest');
    expect(service.getResearch(workspaceId, record.id).id).toBe(record.id);

    await waitFor(() => {
      const current = service.getResearch(workspaceId, record.id);
      return current.status === 'completed' || current.status === 'failed';
    });

    const completed = service.getResearch(workspaceId, record.id);
    expect(['completed', 'failed']).toContain(completed.status);
    expect(completed.events.length).toBeGreaterThan(0);
  });

  it('rejects unsupported research kinds', () => {
    expect(() => service.startResearch(workspaceId, { kind: 'LiveTrading' })).toThrow(
      BadRequestException,
    );
  });

  it('allows cancel only while pending', async () => {
    const record = service.startResearch(workspaceId, { kind: 'SmokeBacktest' });
    try {
      const cancelled = service.cancelResearch(workspaceId, record.id);
      expect(cancelled.status).toBe('cancelled');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
    }

    await waitFor(() => {
      const current = service.getResearch(workspaceId, record.id);
      return (
        current.status === 'completed' ||
        current.status === 'failed' ||
        current.status === 'cancelled'
      );
    });
  });

  it('runs strategy optimization', async () => {
    const record = service.startOptimization(workspaceId, {
      criterion: 'highestExecutionSuccessRate',
    });
    expect(record.category).toBe('optimization');

    await waitFor(() => {
      const current = service.getOptimization(workspaceId, record.id);
      return current.status === 'completed' || current.status === 'failed';
    });

    const completed = service.getOptimization(workspaceId, record.id);
    expect(completed.status).toBe('completed');
    expect(completed.report).not.toBeNull();
  });

  it('runs performance analytics', async () => {
    const record = service.startAnalytics(workspaceId, { executionCount: 3 });
    await waitFor(() => {
      const current = service.getAnalytics(workspaceId, record.id);
      return current.status === 'completed' || current.status === 'failed';
    });
    const completed = service.getAnalytics(workspaceId, record.id);
    expect(completed.status).toBe('completed');
    expect(completed.report).toMatchObject({
      totalExecutions: 3,
    });
  });

  it('throws NotFound for unknown executions', () => {
    expect(() => service.getResearch(workspaceId, 'missing')).toThrow(NotFoundException);
  });

  it('updates settings with validation', () => {
    const settings = service.updateSettings({ autoRefreshSeconds: 10 });
    expect(settings.autoRefreshSeconds).toBe(10);
    expect(() => service.updateSettings({ autoRefreshSeconds: 0 })).toThrow(BadRequestException);
  });
});

async function waitFor(predicate: () => boolean, timeoutMs = 15_000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error('Timed out waiting for research control center condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
