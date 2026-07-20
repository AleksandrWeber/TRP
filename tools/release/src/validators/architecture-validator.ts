import path from 'node:path';
import type { PhaseResult, ReleaseConfig } from '../types.js';
import { pathExists, readText } from '../utils/fs.js';
import { formatPhaseMarkdown, writeReport } from '../utils/reports.js';

interface Check {
  readonly name: string;
  readonly ok: boolean;
  readonly detail: string;
  readonly critical: boolean;
}

export class ArchitectureValidator {
  async run(config: ReleaseConfig): Promise<PhaseResult> {
    const started = Date.now();
    const apiModules = path.join(config.rootDir, 'apps/api/src/modules');
    const checks: Check[] = [];

    const orderService = path.join(apiModules, 'order-engine/order.service.ts');
    const orderExecution = path.join(apiModules, 'order-engine/order-execution.service.ts');
    const riskService = path.join(apiModules, 'risk-engine/risk.service.ts');
    const positionService = path.join(apiModules, 'position-engine/position.service.ts');
    const positionController = path.join(apiModules, 'position-engine/position.controller.ts');
    const paperCoordinator = path.join(
      apiModules,
      'paper-trading-engine/paper-execution-coordinator.ts',
    );
    const liveCoordinator = path.join(
      apiModules,
      'live-trading-engine/live-execution-coordinator.ts',
    );
    const emergency = path.join(apiModules, 'live-trading-engine/emergency-manager.ts');
    const appModule = path.join(config.rootDir, 'apps/api/src/app.module.ts');

    const orderText = (await pathExists(orderService)) ? await readText(orderService) : '';
    const executionText = (await pathExists(orderExecution)) ? await readText(orderExecution) : '';
    const riskText = (await pathExists(riskService)) ? await readText(riskService) : '';
    const positionText = (await pathExists(positionService)) ? await readText(positionService) : '';
    const positionControllerText = (await pathExists(positionController))
      ? await readText(positionController)
      : '';
    const paperText = (await pathExists(paperCoordinator)) ? await readText(paperCoordinator) : '';
    const liveText = (await pathExists(liveCoordinator)) ? await readText(liveCoordinator) : '';
    const emergencyText = (await pathExists(emergency)) ? await readText(emergency) : '';
    const appModuleText = (await pathExists(appModule)) ? await readText(appModule) : '';

    checks.push({
      name: 'Order → Risk gate',
      ok: /risk\.evaluate|this\.risk\.evaluate/.test(orderText),
      detail: 'OrderService must call Risk.evaluate before submit',
      critical: true,
    });

    checks.push({
      name: 'Execution → Position',
      ok: /PositionService|positions\.(open|apply|increase|reduce|close)/.test(executionText),
      detail: 'OrderExecutionService must update positions on fill',
      critical: true,
    });

    checks.push({
      name: 'Position → Portfolio via PortfolioService',
      ok: /portfolios\.applyFinancials|PortfolioService/.test(positionText),
      detail: 'PositionService syncs portfolio through PortfolioService',
      critical: true,
    });

    checks.push({
      name: 'Risk does not mutate positions/orders',
      ok:
        !/\.open\(|\.close\(|\.increase\(|\.reduce\(|applyFinancials\(/.test(riskText) ||
        /NEVER mutates|does not mutate/i.test(riskText),
      detail: 'Risk engine must evaluate/decide only',
      critical: true,
    });

    const exchangeFiles = [
      'exchange-adapter/exchange-adapter.service.ts',
      'exchange-adapter/exchange-manager.ts',
      'exchange-adapter/exchange-router.ts',
    ];
    let exchangeImportsCore = false;
    for (const rel of exchangeFiles) {
      const full = path.join(apiModules, rel);
      if (!(await pathExists(full))) continue;
      const text = await readText(full);
      if (
        /from ['"].*\/(order-engine|risk-engine|position-engine|portfolio-engine)/.test(text) ||
        /OrderService|RiskService|PositionService|PortfolioService/.test(text)
      ) {
        exchangeImportsCore = true;
      }
    }
    checks.push({
      name: 'Exchange Adapter has no Trading Core business imports',
      ok: !exchangeImportsCore,
      detail: 'Exchange adapter must remain I/O-only',
      critical: true,
    });

    checks.push({
      name: 'Paper Trading orchestrates Trading Core',
      ok:
        /OrderService|orders\.create|orders\.execute/.test(paperText) &&
        (await pathExists(paperCoordinator)),
      detail: 'US208 paper coordinator must call OrderService',
      critical: true,
    });

    checks.push({
      name: 'Live Trading orchestrates Trading Core',
      ok:
        /OrderService|orders\.create|orders\.execute/.test(liveText) &&
        (await pathExists(liveCoordinator)),
      detail: 'US210 live coordinator must call OrderService',
      critical: true,
    });

    const positionMutateRest =
      /@Post\(['"]open['"]\)/.test(positionControllerText) ||
      /@Post\(['"]close['"]\)/.test(positionControllerText) ||
      /@Post\(['"]increase['"]\)/.test(positionControllerText) ||
      /@Post\(['"]reduce['"]\)/.test(positionControllerText);

    checks.push({
      name: 'Position mutations only via Order execution (no mutate REST)',
      ok: !positionMutateRest,
      detail:
        'position.controller must not expose open/increase/reduce/close REST bypassing Order→Risk→Execution',
      critical: true,
    });

    const duplicatePaper =
      /PaperTradingModule/.test(appModuleText) &&
      /PaperTradingExecutorModule/.test(appModuleText) &&
      /PaperTradingEngineModule/.test(appModuleText);

    checks.push({
      name: 'Paper Trading does not duplicate Trading Core stacks',
      ok: !duplicatePaper,
      detail:
        'Legacy PaperTradingModule / PaperTradingExecutorModule must not coexist with PaperTradingEngineModule',
      critical: true,
    });

    const killSwitchBypass = /positions\.close\(/.test(emergencyText);
    checks.push({
      name: 'Kill switch position close via orders (preferred)',
      ok: !killSwitchBypass,
      detail: 'Emergency manager closes positions without order lifecycle',
      critical: false,
    });

    const criticalIssues = checks
      .filter((c) => c.critical && !c.ok)
      .map((c) => `${c.name}: ${c.detail}`);
    const warnings = checks
      .filter((c) => !c.critical && !c.ok)
      .map((c) => `${c.name}: ${c.detail}`);

    const phaseStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';
    const result: PhaseResult = {
      id: 'architecture',
      name: 'Architecture',
      status: phaseStatus,
      durationMs: Date.now() - started,
      summary:
        phaseStatus === 'PASS'
          ? 'Architecture conformance checks passed.'
          : `Architecture conformance failed (${criticalIssues.length} critical).`,
      criticalIssues,
      warnings,
      recommendations: criticalIssues.map(
        (issue) => `Remediate architecture invariant: ${issue.split(':')[0]}`,
      ),
      metrics: {
        checks: checks.length,
        passed: checks.filter((c) => c.ok).length,
        failed: checks.filter((c) => !c.ok).length,
      },
    };

    const table = [
      '## Checks',
      '',
      '| Check | Result | Detail |',
      '|-------|--------|--------|',
      ...checks.map(
        (c) => `| ${c.name} | ${c.ok ? 'PASS' : c.critical ? 'FAIL' : 'WARN'} | ${c.detail} |`,
      ),
    ].join('\n');

    const reportPath = await writeReport(
      config,
      'architecture-conformance.md',
      formatPhaseMarkdown('Architecture Conformance', config, result, [table]),
    );
    return { ...result, reportPath };
  }
}
