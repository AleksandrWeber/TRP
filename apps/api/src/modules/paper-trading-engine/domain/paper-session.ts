import { FinancialDecimal } from '../../financial';
import {
  assertPaperSessionStatus,
  isTerminalPaperSessionStatus,
  type PaperSessionStatus,
} from './session-status';

/**
 * PaperSession aggregate root (US208).
 * Owns exactly one Portfolio; financial mutations go through Portfolio/Position/Order engines.
 */
export type PaperSession = Readonly<{
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  name: string;
  status: PaperSessionStatus;
  initialBalance: string;
  currentBalance: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
}>;

export type CreatePaperSessionInput = Readonly<{
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  name: string;
  initialBalance: string;
  createdAt: string;
  updatedAt: string;
}>;

export function createPaperSession(input: CreatePaperSessionInput): PaperSession {
  const id = required(input.id, 'session id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const ownerId = required(input.ownerId, 'owner id');
  const portfolioId = required(input.portfolioId, 'portfolio id');
  const portfolioWorkspaceKey = required(input.portfolioWorkspaceKey, 'portfolio workspace key');
  const name = required(input.name, 'name');
  const initialBalance = FinancialDecimal.from(input.initialBalance)
    .assertPositive('initialBalance')
    .toString();
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.updatedAt, 'updatedAt');

  return Object.freeze({
    id,
    workspaceId,
    ownerId,
    portfolioId,
    portfolioWorkspaceKey,
    name,
    status: 'CREATED' as const,
    initialBalance,
    currentBalance: initialBalance,
    createdAt: input.createdAt,
    startedAt: null,
    finishedAt: null,
    updatedAt: input.updatedAt,
  });
}

export function startPaperSession(session: PaperSession, now: string): PaperSession {
  assertIso(now, 'now');
  if (session.status === 'CREATED' || session.status === 'PAUSED') {
    return Object.freeze({
      ...session,
      status: 'RUNNING' as const,
      startedAt: session.startedAt ?? now,
      finishedAt: null,
      updatedAt: now,
    });
  }
  throw new Error(`paper session cannot start from ${session.status}`);
}

export function pausePaperSession(session: PaperSession, now: string): PaperSession {
  assertIso(now, 'now');
  if (session.status !== 'RUNNING') {
    throw new Error(`paper session cannot pause from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'PAUSED' as const,
    updatedAt: now,
  });
}

export function stopPaperSession(session: PaperSession, now: string): PaperSession {
  assertIso(now, 'now');
  if (session.status !== 'RUNNING' && session.status !== 'PAUSED') {
    throw new Error(`paper session cannot stop from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'STOPPED' as const,
    finishedAt: now,
    updatedAt: now,
  });
}

export function completePaperSession(session: PaperSession, now: string): PaperSession {
  assertIso(now, 'now');
  if (session.status !== 'RUNNING' && session.status !== 'PAUSED' && session.status !== 'STOPPED') {
    throw new Error(`paper session cannot complete from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'COMPLETED' as const,
    finishedAt: session.finishedAt ?? now,
    updatedAt: now,
  });
}

export function archivePaperSession(session: PaperSession, now: string): PaperSession {
  assertIso(now, 'now');
  if (session.status === 'ARCHIVED') {
    throw new Error('paper session is already archived');
  }
  if (session.status === 'RUNNING') {
    throw new Error('running paper session cannot be archived; stop it first');
  }
  return Object.freeze({
    ...session,
    status: 'ARCHIVED' as const,
    finishedAt: session.finishedAt ?? now,
    updatedAt: now,
  });
}

export function withSessionBalance(
  session: PaperSession,
  currentBalance: string,
  updatedAt: string,
): PaperSession {
  assertIso(updatedAt, 'updatedAt');
  if (isTerminalPaperSessionStatus(session.status) && session.status !== 'STOPPED') {
    throw new Error(`cannot update balance for session in status ${session.status}`);
  }
  const balance = FinancialDecimal.from(currentBalance)
    .assertNonNegative('currentBalance')
    .toString();
  return Object.freeze({
    ...session,
    currentBalance: balance,
    updatedAt,
  });
}

export function rehydratePaperSession(row: {
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  name: string;
  status: string;
  initialBalance: string;
  currentBalance: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
}): PaperSession {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    portfolioId: row.portfolioId,
    portfolioWorkspaceKey: row.portfolioWorkspaceKey,
    name: required(row.name, 'name'),
    status: assertPaperSessionStatus(row.status),
    initialBalance: FinancialDecimal.from(row.initialBalance)
      .assertNonNegative('initialBalance')
      .toString(),
    currentBalance: FinancialDecimal.from(row.currentBalance)
      .assertNonNegative('currentBalance')
      .toString(),
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    updatedAt: row.updatedAt,
  });
}

export function paperSessionPortfolioWorkspaceKey(sessionId: string): string {
  return `paper-session:${required(sessionId, 'session id')}`;
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
