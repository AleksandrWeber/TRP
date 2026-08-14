import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NOTIFICATION_DELIVERY_BOUNDARY } from '../modules/notification-delivery/domain/notification-boundary';
import { importPaths, listTsFiles } from './graph-scan';
import { bootNotificationScenario, E2E_AS_OF } from './v2-e2e-fixtures';

const API_ROOT = process.cwd();

describe('RC-28 Epic 4 — notification continuity', () => {
  it('delivers a completed report alert and remains delivery-only', async () => {
    const notify = await bootNotificationScenario();
    const connect = notify.service.connectTelegram({
      workspaceId: 'ws-1',
      userId: 'op-1',
      requestedAt: E2E_AS_OF,
    });
    notify.service.completeTelegramConnect({
      connectionToken: connect.connection.connectionToken!,
      chatId: 'chat-notify',
      completedAt: E2E_AS_OF,
    });
    const delivered = notify.port.deliver({
      workspaceId: 'ws-1',
      userId: 'op-1',
      type: 'daily-report',
      subject: 'Report complete',
      body: 'run-notify-1 finished',
      reportRunId: 'run-notify-1',
      requestedAt: E2E_AS_OF,
    });
    expect(delivered.outcome).toBe('delivered');
    expect(delivered.reportRunId).toBe('run-notify-1');
    expect(notify.telegram.listSent()).toHaveLength(1);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.sourceOfTruth).toBe(false);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.forbiddenCapabilities).toEqual(
      expect.arrayContaining([
        'telegram-control-plane',
        'pause-trading',
        'execute-trades',
        'generate-reports',
      ]),
    );
    await notify.moduleRef.close();
  });

  it('does not import Session/Orders/Reporting as a hidden command path', () => {
    const root = join(API_ROOT, 'src/modules/notification-delivery');
    const hits: string[] = [];
    for (const file of listTsFiles(root)) {
      for (const importPath of importPaths(readFileSync(file, 'utf8'))) {
        if (
          importPath.includes('trading-session') ||
          importPath.includes('/orders') ||
          importPath.includes('reporting') ||
          importPath.includes('runtime-enforcement')
        ) {
          hits.push(`${file.split('/notification-delivery/')[1]} → ${importPath}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
