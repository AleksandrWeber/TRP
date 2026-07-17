import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignSessionStatus } from '../campaign-session/campaign-session-status';
import { CampaignExportController } from './campaign-export.controller';
import { ExportFormat } from './export-format';

const WORKSPACE_ID = 'ws-1';

describe('CampaignExportController', () => {
  let history: { getById: ReturnType<typeof vi.fn> };
  let campaignExport: { export: ReturnType<typeof vi.fn> };
  let workspaces: { getById: ReturnType<typeof vi.fn> };
  let controller: CampaignExportController;
  let reply: {
    status: ReturnType<typeof vi.fn>;
    header: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };

  const session = {
    id: 'sess-1',
    workspaceId: WORKSPACE_ID,
    status: CampaignSessionStatus.COMPLETED,
    createdAt: '2026-07-17T10:00:00.000Z',
    completedAt: '2026-07-17T10:05:00.000Z',
    metadata: {
      engineVersion: '1.0.3',
      datasetId: 'ds-1',
      tags: ['smoke'],
    },
    report: {
      campaignId: 'camp-1',
      strategyId: 'donchian-breakout',
      datasetId: 'ds-1',
      totalRuns: 1,
      passCount: 1,
      failCount: 0,
      needsReviewCount: 0,
      bestExperimentId: 'exp-1',
      bestProfitFactor: 1.2,
      bestReturn: 3,
      bestExpectancy: 1,
      lowestDrawdown: 8,
      verdict: 'PASS' as const,
      recommendations: ['ok'],
      createdAt: '2026-07-17T10:04:00.000Z',
    },
  };

  beforeEach(() => {
    history = { getById: vi.fn() };
    campaignExport = { export: vi.fn() };
    workspaces = { getById: vi.fn().mockReturnValue({ id: WORKSPACE_ID }) };
    controller = new CampaignExportController(
      history as never,
      campaignExport as never,
      workspaces as never,
    );
    reply = {
      status: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('exports JSON with application/json content-type', () => {
    history.getById.mockReturnValue(session);
    campaignExport.export.mockReturnValue('{"id":"sess-1"}');

    controller.export({ sessionId: 'sess-1' }, { format: 'json' }, reply as never, WORKSPACE_ID);

    expect(history.getById).toHaveBeenCalledWith('sess-1', WORKSPACE_ID);
    expect(campaignExport.export).toHaveBeenCalledWith(session, ExportFormat.JSON);
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.header).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(reply.send).toHaveBeenCalledWith('{"id":"sess-1"}');
  });

  it('exports CSV with text/csv content-type', () => {
    history.getById.mockReturnValue(session);
    campaignExport.export.mockReturnValue('sessionId,status\nsess-1,COMPLETED');

    controller.export({ sessionId: 'sess-1' }, { format: 'csv' }, reply as never, WORKSPACE_ID);

    expect(campaignExport.export).toHaveBeenCalledWith(session, ExportFormat.CSV);
    expect(reply.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(reply.send).toHaveBeenCalledWith('sessionId,status\nsess-1,COMPLETED');
  });

  it('rejects unsupported export format with 400', () => {
    expect(() =>
      controller.export({ sessionId: 'sess-1' }, { format: 'xml' }, reply as never, WORKSPACE_ID),
    ).toThrow(BadRequestException);
    expect(history.getById).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it('rejects empty export format (format required)', () => {
    expect(() =>
      controller.export({ sessionId: 'sess-1' }, {}, reply as never, WORKSPACE_ID),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.export({ sessionId: 'sess-1' }, { format: '' }, reply as never, WORKSPACE_ID),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.export({ sessionId: 'sess-1' }, { format: '   ' }, reply as never, WORKSPACE_ID),
    ).toThrow(BadRequestException);
    expect(history.getById).not.toHaveBeenCalled();
  });

  it('returns 404 when session is not found', () => {
    history.getById.mockReturnValue(null);

    expect(() =>
      controller.export({ sessionId: 'missing' }, { format: 'json' }, reply as never, WORKSPACE_ID),
    ).toThrow(NotFoundException);
    expect(campaignExport.export).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it('accepts case-insensitive format values', () => {
    history.getById.mockReturnValue(session);
    campaignExport.export.mockReturnValue('{}');

    controller.export({ sessionId: 'sess-1' }, { format: 'JSON' }, reply as never, WORKSPACE_ID);

    expect(campaignExport.export).toHaveBeenCalledWith(session, ExportFormat.JSON);
  });

  it('rejects missing workspace header', () => {
    expect(() =>
      controller.export({ sessionId: 'sess-1' }, { format: 'json' }, reply as never, undefined),
    ).toThrow(BadRequestException);
  });
});
