import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-11 Trading Orchestrator product path', () => {
  it('registers orchestrator wizard, plans, history, and run routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="orchestrator"');
    expect(app).toContain('path="orchestrator/plans"');
    expect(app).toContain('path="orchestrator/history"');
    expect(app).toContain('path="orchestrator/runs/:runId"');
    expect(app).toContain('OrchestratorWizardPage');
    expect(app).toContain('OrchestratorPlansPage');
    expect(app).toContain('OrchestratorHistoryPage');
    expect(app).toContain('OrchestratorRunPage');
  });

  it('exposes existing orchestrator REST, not a Session or order engine', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain("'/orchestrations/plans'");
    expect(api).toContain("'/orchestrations/runs'");
    expect(api).toContain('`/orchestrations/runs/${runId}/handoff`');
    expect(api).toContain('emitOrchestrationHandoff');
    expect(api).not.toContain('/create-session');
    expect(api).not.toContain('/orders/submit');
  });

  it('adds Orchestrator to the paper-first shell without Coming Soon or session start', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const page = readSrc('./OrchestratorWizardView.tsx');
    const run = readSrc('./OrchestratorRunView.tsx');
    expect(layout).toContain("label: 'Orchestrator'");
    expect(layout).toContain("to: '/orchestrator'");
    expect(layout).not.toContain('Coming Soon');
    expect(layout).not.toContain("label: 'Live Bots'");
    expect(page).not.toContain('Start session');
    expect(page).not.toContain('Coming Soon');
    expect(run).toContain('Creates Session');
    expect(run).not.toContain('Start session');
    expect(run).not.toContain('Coming Soon');
  });
});
