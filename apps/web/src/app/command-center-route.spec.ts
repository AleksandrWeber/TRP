import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMAND_CENTER_PATH } from '../command-center';

describe('Command Center route registration', () => {
  it('registers the Command Center route in App', () => {
    const appSource = readFileSync(resolve(__dirname, './App.tsx'), 'utf8');
    expect(COMMAND_CENTER_PATH).toBe('/command-center');
    expect(appSource).toContain('CommandCenterPage');
    expect(appSource).toContain('path="command-center"');
  });
});
