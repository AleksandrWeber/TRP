import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-03 Deployment product path', () => {
  it('registers Deployment wizard, list, history, and details routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="deployments"');
    expect(app).toContain('path="deployments/new"');
    expect(app).toContain('path="deployments/history"');
    expect(app).toContain('path="deployments/:deploymentId"');
    expect(app).toContain('DeploymentWizardPage');
    expect(app).toContain('DeploymentListPage');
    expect(app).toContain('DeploymentHistoryPage');
    expect(app).toContain('DeploymentDetailPage');
  });

  it('exposes existing Deployment REST, not a second engine', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain("'/strategy-deployments'");
    expect(api).toContain('`/strategy-deployments/${deploymentId}`');
    expect(api).toContain('`/strategy-deployments/${deploymentId}/approve`');
    expect(api).toContain('createStrategyDeployment');
    expect(api).toContain('approveStrategyDeployment');
    expect(api).not.toContain('/deploy-engine');
  });

  it('adds Deployment to the paper-first shell without Coming Soon, auto-deploy, or live claims', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const page = readSrc('./DeploymentWizardView.tsx');
    expect(layout).toContain("label: 'Deployment'");
    expect(layout).toContain("to: '/deployments'");
    expect(layout).not.toContain('Coming Soon');
    expect(layout).not.toContain("label: 'Live Bots'");
    expect(page).not.toContain('Force');
    expect(page).not.toContain('Coming Soon');
    expect(page).not.toContain('Start session');
  });
});
