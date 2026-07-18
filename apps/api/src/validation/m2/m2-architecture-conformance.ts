/**
 * M2 architecture conformance review (US183).
 * Read-only structural checks; no architecture or production changes.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export type M2ConformanceFinding = Readonly<{
  id: string;
  severity: 'pass' | 'recommendation' | 'blocker';
  detail: string;
}>;

const MODULES = join(process.cwd(), 'src/modules');
const ADR_ROOT = join(process.cwd(), '../../docs/adr');
const PRISMA_SCHEMA = join(process.cwd(), 'prisma/schema.prisma');

export function evaluateM2ArchitectureConformance(): readonly M2ConformanceFinding[] {
  const findings: M2ConformanceFinding[] = [];
  const productionFiles = listTsFiles(MODULES);
  const schema = readFileSync(PRISMA_SCHEMA, 'utf8');

  const adrFiles = readdirSync(ADR_ROOT).filter((name) => /^ADR-01[2-8]-/.test(name));
  findings.push({
    id: 'ADR-012-018-present',
    severity: adrFiles.length === 7 ? 'pass' : 'blocker',
    detail: `Found ${adrFiles.length}/7 frozen ADRs.`,
  });

  const adapterModule = source('execution-adapter/execution-adapter.module.ts');
  findings.push({
    id: 'ADR-012-paper-only-adapter',
    severity:
      /useExisting:\s*PaperExecutionAdapter/.test(adapterModule) &&
      !/LiveExecution|BinanceExecution|RealExecution/.test(adapterModule)
        ? 'pass'
        : 'blocker',
    detail: 'Execution Adapter runtime binding is structurally paper-only.',
  });

  const adapterCallLeaks = productionFiles.filter((path) => {
    const relative = path.split('/modules/')[1]!;
    if (
      relative.startsWith('execution-adapter/') ||
      relative === 'execution-engine/execution-engine.service.ts'
    ) {
      return false;
    }
    return /\bEXECUTION_ADAPTER\b|\.adapter\.submit\(/.test(readFileSync(path, 'utf8'));
  });
  findings.push({
    id: 'ADR-012-single-execution-entry',
    severity: adapterCallLeaks.length === 0 ? 'pass' : 'blocker',
    detail:
      adapterCallLeaks.length === 0
        ? 'No production module outside Execution Engine calls the adapter boundary.'
        : `Adapter entry leaked into: ${adapterCallLeaks.join(', ')}`,
  });

  const eventModule = source('event-processing/event-processing.module.ts');
  findings.push({
    id: 'ADR-013-postgres-runtime',
    severity:
      /PrismaOutboxRepository/.test(eventModule) &&
      /PrismaInboxRepository/.test(eventModule) &&
      /PrismaConsumerCheckpointRepository/.test(eventModule)
        ? 'pass'
        : 'blocker',
    detail: 'Runtime Outbox, Inbox, and checkpoints use PostgreSQL-backed repositories.',
  });

  const portfolioService = source('positions/portfolio-projection.service.ts');
  const portfolioDomain = source('positions/domain/portfolio-projection.ts');
  findings.push({
    id: 'ADR-015-portfolio-projection-only',
    severity:
      /LedgerService/.test(portfolioService) &&
      /POSITION_VALUATION_REPOSITORY/.test(portfolioService) &&
      !/live-market-data|MarketMarkPrice|PrismaLedgerRepository/.test(
        `${portfolioService}\n${portfolioDomain}`,
      )
        ? 'pass'
        : 'blocker',
    detail: 'Portfolio consumes Ledger and Position valuation boundaries, not raw market data.',
  });

  const financialModels = [
    modelBlock(schema, 'PaperFill'),
    modelBlock(schema, 'PaperPosition'),
    modelBlock(schema, 'LedgerEntry'),
    modelBlock(schema, 'PositionValuation'),
    modelBlock(schema, 'PaperPortfolioProjection'),
  ].join('\n');
  findings.push({
    id: 'ADR-015-decimal-storage',
    severity: /\bFloat\b/.test(financialModels) ? 'blocker' : 'pass',
    detail: 'M2 financial persistence uses Decimal rather than Float columns.',
  });

  const ledgerRepository = source('ledger/persistence/ledger.repository.ts');
  findings.push({
    id: 'ADR-015-ledger-append-only',
    severity:
      /\bappend\(/.test(ledgerRepository) && !/\b(update|delete)\(/.test(ledgerRepository)
        ? 'pass'
        : 'blocker',
    detail: 'Ledger persistence port exposes append/read operations only.',
  });

  const reconciliationGate = source('execution-engine/execution-engine.service.ts');
  findings.push({
    id: 'ADR-016-reconciliation-fail-closed',
    severity: /assertExecutionEligible/.test(reconciliationGate) ? 'pass' : 'blocker',
    detail: 'Execution Engine checks durable accounting reconciliation state before submission.',
  });

  const accountingController = source('positions/accounting-query.controller.ts');
  findings.push({
    id: 'ADR-017-read-only-accounting-api',
    severity:
      /WorkspaceAccessService/.test(accountingController) &&
      /@Get\(/.test(accountingController) &&
      !/@(?:Post|Put|Patch|Delete)\(/.test(accountingController)
        ? 'pass'
        : 'blocker',
    detail: 'Accounting API is membership-gated and GET-only.',
  });

  const markContract = source('live-market-data/domain/mark-price-event.ts');
  findings.push({
    id: 'M2-exact-mark-source',
    severity: /price:\s*number/.test(markContract) ? 'recommendation' : 'pass',
    detail: /price:\s*number/.test(markContract)
      ? 'M1 mark events still originate as JavaScript numbers; M2 quantizes immediately at the valuation boundary. Move the canonical market contract to decimal text before M3.'
      : 'Canonical mark events carry exact decimal values.',
  });

  findings.push({
    id: 'M2-cross-order-fill-application-order',
    severity: /model\s+PositionFillApplication\b/.test(schema) ? 'pass' : 'recommendation',
    detail: /model\s+PositionFillApplication\b/.test(schema)
      ? 'Position Fill application order is durably explicit.'
      : 'Immediate M2 fills replay deterministically by immutable timestamps/identity. Persist an explicit per-Position Fill application order before concurrent M3 strategy execution.',
  });

  const ledgerQuery = source('ledger/persistence/prisma-ledger.repository.ts');
  findings.push({
    id: 'M2-ledger-query-pagination',
    severity: /cursor|take:/.test(ledgerQuery) ? 'pass' : 'recommendation',
    detail: /cursor|take:/.test(ledgerQuery)
      ? 'Ledger history reads are bounded/cursor-based.'
      : 'US178 Ledger history is workspace/account scoped but unbounded; add cursor pagination before operational history grows.',
  });

  return Object.freeze(findings);
}

export function m2ConformanceVerdict(
  findings: readonly M2ConformanceFinding[],
): 'PASS' | 'PASS WITH MINOR RECOMMENDATIONS' | 'FAIL' {
  if (findings.some((finding) => finding.severity === 'blocker')) return 'FAIL';
  if (findings.some((finding) => finding.severity === 'recommendation')) {
    return 'PASS WITH MINOR RECOMMENDATIONS';
  }
  return 'PASS';
}

function source(relativePath: string): string {
  return readFileSync(join(MODULES, relativePath), 'utf8');
}

function listTsFiles(directory: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (name !== 'dist' && name !== 'node_modules') files.push(...listTsFiles(path));
    } else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) {
      files.push(path);
    }
  }
  return files;
}

function modelBlock(schema: string, model: string): string {
  const match = schema.match(new RegExp(`model\\s+${model}\\s+\\{[\\s\\S]*?\\n\\}`));
  return match?.[0] ?? '';
}
