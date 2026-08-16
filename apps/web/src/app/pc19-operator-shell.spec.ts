import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-19 product path honesty', () => {
  it('does not mount live, production, exchanges, or epic review pages as product UI', () => {
    const appSource = readSrc('./App.tsx');

    expect(appSource).not.toContain('LiveTradingPage');
    expect(appSource).not.toContain('ProductionPage');
    expect(appSource).not.toContain('ExchangesPage');
    expect(appSource).not.toContain('CommandCenterEpic3ReviewPage');
    expect(appSource).not.toContain('CommandCenterEpic4ReviewPage');
    expect(appSource).not.toContain('CommandCenterEpic5ReviewPage');
    expect(appSource).not.toContain('CommandCenterEpic6ReviewPage');
    expect(appSource).toContain('path="trading/paper"');
    expect(appSource).toContain('path="command-center"');
    expect(appSource).toContain('path="account/sessions"');
    expect(appSource).toContain('SessionsPage');
    expect(appSource).toContain('ForgotPasswordPage');
    expect(appSource).toContain('ResetPasswordPage');
    expect(appSource).toContain('PasswordPage');
    expect(appSource).toContain('PeoplePage');
    expect(appSource).toContain('path="people"');
    expect(appSource).toContain('Navigate to="/trading/paper"');
    expect(appSource).toContain('Navigate to="/"');
  });

  it('keeps portfolio free of developer reset and paper create labeled sandbox', () => {
    const portfolio = readSrc('../pages/PortfolioPage.tsx');
    const paper = readSrc('../pages/PaperTradingPage.tsx');
    const home = readSrc('../pages/HomePage.tsx');
    const catalog = readSrc('../shared/product-ui/catalog.ts');

    expect(portfolio).not.toContain('Reset (dev)');
    expect(portfolio).not.toContain('resetPortfolio');
    expect(paper).toContain('Sandbox');
    expect(paper).not.toContain('Execute Trade');
    expect(paper).not.toContain('executePaperTrade');
    expect(home).not.toContain('/production');
    expect(home).toContain('/trading/paper');
    expect(home).toContain('/command-center');
    expect(home).toContain('/strategy-library');
    expect(home).toContain('OPERATOR_JOURNEY');
    expect(catalog).toContain('/runtime-validation');
    expect(catalog).toContain('/deployments');
    expect(catalog).toContain('/orchestrator');
    expect(catalog).toContain('/qualification');
    expect(catalog).toContain('/reporting');
    expect(catalog).toContain('/knowledge-lake');
    expect(catalog).toContain('/ai-analytics');
    expect(catalog).toContain('/notifications');
    expect(catalog).toContain('/notifications/channels');
    expect(home).toContain('listTradingSessions');
    expect(home).toContain('getRuntimeHealth');
    expect(home).not.toMatch(/['"`]\/reports(?:\/|['"`?]|$)/);
    expect(home).not.toContain('Coming Soon');
  });
});
