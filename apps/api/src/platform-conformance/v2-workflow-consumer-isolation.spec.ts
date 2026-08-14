import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_ANALYTICS_BOUNDARY } from '../modules/ai-analytics/domain/ai-analytics-boundary';
import { ANALYTICAL_NARRATIVE_AUTHORITY_CLASS } from '../modules/ai-analytics/domain/analytical-narrative';
import { NOTIFICATION_DELIVERY_BOUNDARY } from '../modules/notification-delivery/domain/notification-boundary';
import { REPORTING_BOUNDARY } from '../modules/reporting/domain/reporting-boundary';
import { importPaths, listTsFiles } from './graph-scan';

const API_ROOT = process.cwd();

function productionImportsOf(dir: string, fragment: string): string[] {
  const hits: string[] = [];
  for (const file of listTsFiles(dir)) {
    for (const importPath of importPaths(readFileSync(file, 'utf8'))) {
      if (importPath.includes(fragment)) {
        hits.push(`${file.split(`/${dir.split('/').pop()}/`)[1] ?? file} → ${importPath}`);
      }
    }
  }
  return hits;
}

describe('RC-28 Epic 2 — consumer isolation', () => {
  it('keeps Reporting read-only versus money / Gate / Library / Session', () => {
    expect(REPORTING_BOUNDARY.sourceOfTruth).toBe(false);
    expect(REPORTING_BOUNDARY.knowledgeLakeRole).toBe('read-only-consumer');
    expect(REPORTING_BOUNDARY.forbiddenCapabilities).toEqual(
      expect.arrayContaining([
        'become-source-of-truth',
        'shadow-accounting',
        'trade',
        'approve-risk',
        'replace-runtime-enforcement',
      ]),
    );
    const root = join(API_ROOT, 'src/modules/reporting');
    expect(productionImportsOf(root, '/orders')).toEqual([]);
    expect(productionImportsOf(root, 'runtime-enforcement')).toEqual([]);
    expect(productionImportsOf(root, 'strategy-library')).toEqual([]);
    expect(productionImportsOf(root, 'trading-session')).toEqual([]);
  });

  it('keeps AI Analytics narrative-only and never querying Lake or SoT directly', () => {
    expect(AI_ANALYTICS_BOUNDARY.sourceOfTruth).toBe(false);
    expect(AI_ANALYTICS_BOUNDARY.knowledgeLakeRole).toBe('never-direct');
    expect(AI_ANALYTICS_BOUNDARY.reportingRole).toBe('read-only-consumer');
    expect(ANALYTICAL_NARRATIVE_AUTHORITY_CLASS).toBe('narrative');
    const root = join(API_ROOT, 'src/modules/ai-analytics');
    expect(productionImportsOf(root, 'knowledge-lake')).toEqual([]);
    expect(productionImportsOf(root, 'strategy-library')).toEqual([]);
    expect(productionImportsOf(root, 'runtime-enforcement')).toEqual([]);
    expect(productionImportsOf(root, '/orders')).toEqual([]);
    expect(productionImportsOf(root, 'trading-session')).toEqual([]);
  });

  it('keeps Notification Delivery as delivery-only, not a control plane', () => {
    expect(NOTIFICATION_DELIVERY_BOUNDARY.sourceOfTruth).toBe(false);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.reportingRole).toBe('delivery-consumer-only');
    expect(NOTIFICATION_DELIVERY_BOUNDARY.forbiddenCapabilities).toEqual(
      expect.arrayContaining([
        'telegram-control-plane',
        'pause-trading',
        'kill-switch-control',
        'execute-trades',
        'generate-reports',
      ]),
    );
    const root = join(API_ROOT, 'src/modules/notification-delivery');
    expect(productionImportsOf(root, 'reporting')).toEqual([]);
    expect(productionImportsOf(root, 'ai-analytics')).toEqual([]);
    expect(productionImportsOf(root, 'strategy-library')).toEqual([]);
    expect(productionImportsOf(root, 'runtime-enforcement')).toEqual([]);
    expect(productionImportsOf(root, 'trading-session')).toEqual([]);
  });

  it('routes Command Center lifecycle commands through Session APIs only', () => {
    const webRoot = join(API_ROOT, '../web/src/command-center');
    expect(existsSync(join(webRoot, 'session-commands.ts'))).toBe(true);
    const commands = readFileSync(join(webRoot, 'session-commands.ts'), 'utf8');
    expect(commands).toMatch(/pauseTradingSession/);
    expect(commands).toMatch(/resumeTradingSession/);
    expect(commands).toMatch(/stopTradingSession/);
    expect(commands).not.toMatch(/submitOrder/);
    expect(commands).not.toMatch(/certifyStrategy/);
    expect(commands).not.toMatch(/validateDeployment/);
    const emergency = readFileSync(join(webRoot, 'emergency-controls.ts'), 'utf8');
    expect(emergency).toMatch(/never performs emergency logic/);
    expect(emergency).toMatch(/No UI-only kill is allowed/);
  });
});
