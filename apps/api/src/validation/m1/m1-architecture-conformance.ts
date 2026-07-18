/**
 * M1 architecture conformance checklist (US152).
 * Read-only structural assertions — no architecture changes.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export type ConformanceFinding = Readonly<{
  id: string;
  severity: 'pass' | 'recommendation' | 'blocker';
  detail: string;
}>;

/** Resolved from apps/api cwd (vitest / nest build). */
const LIVE_MARKET_ROOT = join(process.cwd(), 'src/modules/live-market-data');
const EVENT_PROCESSING_ROOT = join(process.cwd(), 'src/modules/event-processing');
const ADR_ROOT = join(process.cwd(), '../../docs/adr');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      out.push(...listTsFiles(full));
    } else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

function fileContains(path: string, pattern: RegExp): boolean {
  return pattern.test(readFileSync(path, 'utf8'));
}

/**
 * Verify M1 Live Market Data slice still respects ADR-012…ADR-018 ownership.
 */
export function evaluateM1ArchitectureConformance(): ReadonlyArray<ConformanceFinding> {
  const findings: ConformanceFinding[] = [];
  const liveFiles = listTsFiles(LIVE_MARKET_ROOT);
  const eventFiles = listTsFiles(EVENT_PROCESSING_ROOT);

  const forbiddenInLiveMarket =
    /\b(PlaceOrder|createOrder|PaperBinanceAdapter|LedgerEntry|KillSwitch|TradingSession)\b/;
  const liveLeak = liveFiles.filter((path) => fileContains(path, forbiddenInLiveMarket));
  findings.push({
    id: 'ADR-017-live-market-no-trading',
    severity: liveLeak.length === 0 ? 'pass' : 'blocker',
    detail:
      liveLeak.length === 0
        ? 'Live Market Data sources do not reference Orders/Sessions/Ledger/KillSwitch.'
        : `Trading leakage in: ${liveLeak.map((p) => p.split('live-market-data/')[1]).join(', ')}`,
  });

  const barrel = readFileSync(join(LIVE_MARKET_ROOT, 'index.ts'), 'utf8');
  const barrelLeaks =
    /BinanceKlineStreamMessage|BinanceBookTickerMessage|mapBinanceKlineMessageToDraft/.test(barrel);
  findings.push({
    id: 'ADR-017-provider-payload-isolation',
    severity: barrelLeaks ? 'blocker' : 'pass',
    detail: barrelLeaks
      ? 'Public live-market-data barrel exports adapter-local Binance payloads/mappers.'
      : 'Public barrel keeps Binance payload mappers adapter-local.',
  });

  const hasOutbox = eventFiles.some((path) => path.includes('outbox'));
  const hasInbox = eventFiles.some((path) => path.includes('inbox'));
  findings.push({
    id: 'ADR-013-outbox-inbox-present',
    severity: hasOutbox && hasInbox ? 'pass' : 'blocker',
    detail:
      hasOutbox && hasInbox
        ? 'Event Processing retains Outbox and Inbox ports/implementations.'
        : 'Missing Outbox/Inbox artifacts under event-processing.',
  });

  const prismaOutbox = eventFiles.some((path) => path.includes('prisma-outbox'));
  findings.push({
    id: 'ADR-013-postgres-driver',
    severity: prismaOutbox ? 'pass' : 'recommendation',
    detail: prismaOutbox
      ? 'Prisma Outbox/Inbox drivers exist for durable integration validation.'
      : 'Prisma Outbox driver not found; runtime may still be InMemory-only.',
  });

  const adrFiles = readdirSync(ADR_ROOT).filter((name) => /^ADR-01[2-8]-/.test(name));
  findings.push({
    id: 'ADR-012-018-present',
    severity: adrFiles.length >= 7 ? 'pass' : 'blocker',
    detail: `Found ${adrFiles.length}/7 frozen ADRs (012–018).`,
  });

  const queryApi = liveFiles.some((path) => path.includes('market-data-query.controller'));
  const sseApi = liveFiles.some((path) => path.includes('market-projection-sse.controller'));
  findings.push({
    id: 'M1-query-sse-surface',
    severity: queryApi && sseApi ? 'pass' : 'blocker',
    detail:
      queryApi && sseApi
        ? 'Workspace query API and SSE projection channel are present.'
        : 'Missing query API and/or SSE projection channel.',
  });

  const moduleSrc = readFileSync(join(EVENT_PROCESSING_ROOT, 'event-processing.module.ts'), 'utf8');
  const runtimeInMemory = /InMemoryOutboxRepository/.test(moduleSrc);
  findings.push({
    id: 'TD-035-runtime-wiring',
    severity: 'recommendation',
    detail: runtimeInMemory
      ? 'EventProcessingModule still wires InMemory Outbox/Inbox by default (TD-035); Prisma drivers validated in US149.'
      : 'EventProcessingModule uses durable Prisma Outbox/Inbox at runtime.',
  });

  return Object.freeze(findings);
}

export function conformanceVerdict(
  findings: ReadonlyArray<ConformanceFinding>,
): 'PASS' | 'PASS WITH MINOR RECOMMENDATIONS' | 'FAIL' {
  if (findings.some((row) => row.severity === 'blocker')) return 'FAIL';
  if (findings.some((row) => row.severity === 'recommendation')) {
    return 'PASS WITH MINOR RECOMMENDATIONS';
  }
  return 'PASS';
}
