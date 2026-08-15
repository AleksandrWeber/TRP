import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-04 Runtime Validation product path', () => {
  it('registers validation, history, and result routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="runtime-validation"');
    expect(app).toContain('path="runtime-validation/history"');
    expect(app).toContain('path="runtime-validation/:validationId"');
    expect(app).toContain('RuntimeValidationPage');
    expect(app).toContain('RuntimeValidationHistoryPage');
    expect(app).toContain('RuntimeValidationResultPage');
  });

  it('exposes validateDeployment over /runtime-validations, not a shadow Gate', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain("'/runtime-validations'");
    expect(api).toContain('`/runtime-validations/${validationId}`');
    expect(api).toContain('runRuntimeValidation');
    expect(api).not.toContain('/bots/');
  });

  it('adds Runtime Validation to the paper-first shell without Coming Soon, override, or live claims', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const page = readSrc('./RuntimeValidationView.tsx');
    expect(layout).toContain("label: 'Runtime Validation'");
    expect(layout).toContain("to: '/runtime-validation'");
    expect(layout).not.toContain('Coming Soon');
    expect(layout).not.toContain("label: 'Live Bots'");
    expect(page).not.toContain('Force');
    expect(page).not.toContain('soft-pass');
    expect(page).not.toContain('Coming Soon');
  });
});
