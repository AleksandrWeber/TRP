import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_NEST_MODULE_IDS, V2_PLATFORM_MODULE_CATALOG } from './v2-platform-modules';

const API_ROOT = process.cwd();
const APP_MODULE = join(API_ROOT, 'src/app.module.ts');

describe('RC-28 Epic 1 — compile integrity', () => {
  it('keeps every V2 Nest module on disk with its AppModule symbol', () => {
    const appSource = readFileSync(APP_MODULE, 'utf8');
    for (const id of V2_NEST_MODULE_IDS) {
      const record = V2_PLATFORM_MODULE_CATALOG[id];
      expect(record.nestDir).toBeTruthy();
      expect(existsSync(join(API_ROOT, record.nestDir!))).toBe(true);
      expect(existsSync(join(API_ROOT, record.nestDir!, `${id}.module.ts`))).toBe(true);
      expect(appSource).toContain(record.nestModuleSymbol);
    }
  });

  it('does not register a platform-conformance Nest module', () => {
    const appSource = readFileSync(APP_MODULE, 'utf8');
    expect(appSource).not.toMatch(/platform-conformance/);
    expect(appSource).not.toMatch(/V2Platform/);
    expect(appSource).not.toMatch(/PlatformConformanceModule/);
    expect(existsSync(join(API_ROOT, 'src/modules/platform-conformance'))).toBe(false);
  });

  it('keeps Command Center as the existing web ops surface', () => {
    const webRoot = join(API_ROOT, '../web/src/command-center');
    expect(existsSync(join(webRoot, 'CommandCenterPage.tsx'))).toBe(true);
    expect(existsSync(join(webRoot, 'session-commands.ts'))).toBe(true);
    const commands = readFileSync(join(webRoot, 'session-commands.ts'), 'utf8');
    expect(commands).toMatch(/pauseTradingSession/);
    expect(commands).toMatch(/resumeTradingSession/);
    expect(commands).toMatch(/stopTradingSession/);
    expect(commands).not.toMatch(/submitOrder/);
    expect(commands).not.toMatch(/approveRisk/);
    expect(commands).not.toMatch(/certifyStrategy/);
  });

  it('composes existing boundary files without adding product ports', () => {
    const boundaryPath = join(API_ROOT, 'src/platform-conformance/v2-platform-boundary.ts');
    const source = readFileSync(boundaryPath, 'utf8');
    expect(source).toMatch(/EXISTING_V2_BOUNDARIES/);
    expect(source).not.toMatch(/export const \w+_PORT/);
    expect(source).not.toMatch(/@Module/);
    expect(source).not.toMatch(/@Injectable/);
  });
});
