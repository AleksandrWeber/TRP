import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { OutboxDispatcher } from '../modules/event-processing';
import { AiAnalyticsModule } from '../modules/ai-analytics/ai-analytics.module';
import { ExchangeScopeModule } from '../modules/exchange-scope/exchange-scope.module';
import { NotificationDeliveryModule } from '../modules/notification-delivery/notification-delivery.module';
import { RuntimeEnforcementModule } from '../modules/runtime-enforcement/runtime-enforcement.module';
import { StrategyLibraryModule } from '../modules/strategy-library/strategy-library.module';
import { TradingOrchestratorModule } from '../modules/trading-orchestrator/trading-orchestrator.module';
import { V2_NEST_MODULE_IDS, V2_PLATFORM_MODULE_CATALOG } from './v2-platform-modules';

const API_ROOT = process.cwd();
const APP_MODULE = join(API_ROOT, 'src/app.module.ts');

const silentOutbox = {
  register: () => undefined,
  stop: async () => undefined,
  start: () => undefined,
};

describe('RC-28 Epic 5 — startup integrity', () => {
  it('registers each V2 Nest symbol once in AppModule and never registers platform-conformance', () => {
    const appSource = readFileSync(APP_MODULE, 'utf8');
    for (const id of V2_NEST_MODULE_IDS) {
      const symbol = V2_PLATFORM_MODULE_CATALOG[id].nestModuleSymbol!;
      const importHits = [...appSource.matchAll(new RegExp(`import \\{ ${symbol} \\}`, 'g'))];
      expect(importHits, symbol).toHaveLength(1);
      expect(appSource).toContain(symbol);
    }
    expect(appSource).not.toMatch(/PlatformConformanceModule/);
    expect(appSource).not.toMatch(/platform-conformance/);
    expect(existsSync(join(API_ROOT, 'src/modules/platform-conformance'))).toBe(false);
  });

  it('compiles representative V2 Nest graphs without live venue networks', async () => {
    const modules = [
      StrategyLibraryModule,
      RuntimeEnforcementModule,
      ExchangeScopeModule,
      TradingOrchestratorModule,
      NotificationDeliveryModule,
      AiAnalyticsModule,
    ];
    for (const nestModule of modules) {
      const moduleRef = await Test.createTestingModule({
        imports: [nestModule],
      })
        .overrideProvider(OutboxDispatcher)
        .useValue(silentOutbox)
        .compile();
      expect(moduleRef).toBeTruthy();
      await moduleRef.close();
    }
  });

  it('keeps Command Center session commands loadable as the existing web surface', () => {
    const webRoot = join(API_ROOT, '../web/src/command-center');
    expect(existsSync(join(webRoot, 'session-commands.ts'))).toBe(true);
    const commands = readFileSync(join(webRoot, 'session-commands.ts'), 'utf8');
    expect(commands).toMatch(/executeSessionLifecycleCommand/);
    expect(commands).not.toMatch(/@Injectable/);
    expect(commands).not.toMatch(/@Module/);
  });
});
