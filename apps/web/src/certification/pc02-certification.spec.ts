import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-02 Certification product path', () => {
  it('registers Certification Wizard, history, and result routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="strategy-library/certify"');
    expect(app).toContain('path="strategy-library/certifications"');
    expect(app).toContain('path="strategy-library/certifications/:attemptId"');
    expect(app).toContain('CertificationWizardPage');
    expect(app).toContain('CertificationHistoryPage');
    expect(app).toContain('CertificationResultPage');
  });

  it('exposes certify, history, and status over /strategy-library/certifications', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain("'/strategy-library/certifications'");
    expect(api).toContain('`/strategy-library/certifications/${attemptId}`');
    expect(api).toContain('certifyStrategy');
    expect(api).toContain('/strategies');
  });

  it('adds Certify to the paper-first shell without Coming Soon or live claims', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    expect(layout).toContain("label: 'Certify'");
    expect(layout).toContain("to: '/strategy-library/certify'");
    expect(layout).not.toContain('Coming Soon');
    expect(layout).not.toContain("label: 'Live Bots'");
  });
});
