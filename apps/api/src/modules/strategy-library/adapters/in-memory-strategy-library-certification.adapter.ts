/**
 * PC-02 — process-local Strategy Library Certification adapter.
 *
 * Implements StrategyLibraryCertificationPort over the existing Library SoT buffer.
 * Delegates admit rules to createStrategyCertification / eligibility domain.
 * Does not own strategies. Does not redesign Library, Runtime, or Deployment.
 */

import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { mapCertificationDomainError } from '../certification-reason';
import { createStrategy, type Strategy } from '../domain/strategy';
import { createStrategyCertification } from '../domain/strategy-certification';
import { createStrategyEligibility } from '../domain/strategy-eligibility';
import { createStrategyVersion } from '../domain/strategy-version';
import type {
  CertificationAttemptMetadata,
  CertificationAttemptRecord,
  CertificationHistoryQuery,
  CertificationHistoryPage,
  CertificationOutcome,
  CertifyResult,
  CertifyStrategyVersionCommand,
  StrategyLibraryCertificationPort,
} from '../ports/strategy-library-certification.port';
import { InMemoryStrategyLibraryReadAdapter } from './in-memory-strategy-library-read.adapter';

@Injectable()
export class InMemoryStrategyLibraryCertificationAdapter implements StrategyLibraryCertificationPort {
  private readonly attempts: CertificationAttemptRecord[] = [];

  constructor(private readonly library: InMemoryStrategyLibraryReadAdapter) {}

  /** Test helper. */
  clear(): void {
    this.attempts.length = 0;
  }

  certify(cmd: CertifyStrategyVersionCommand): CertifyResult {
    const createdAt = new Date().toISOString();
    const attemptId = `attempt-${randomUUID()}`;
    const workspaceId = cmd.workspaceId?.trim() ?? '';
    const certifiedBy = cmd.certifiedBy?.trim() ?? '';
    const notes =
      cmd.notes === undefined || cmd.notes === null || cmd.notes.trim() === ''
        ? null
        : cmd.notes.trim();
    const metadata = metadataFromCommand(cmd);

    if (!workspaceId) {
      return this.storeAttempt(
        freezeAttempt({
          attemptId,
          workspaceId: '',
          outcome: 'rejected',
          progress: 'complete',
          reasons: Object.freeze(['invalid_candidate']),
          libraryEntryId: null,
          certificationId: null,
          certifiedBy,
          certifiedAt: null,
          createdAt,
          notes,
          metadata,
        }),
      );
    }

    if (!certifiedBy) {
      return this.storeAttempt(
        freezeAttempt({
          attemptId,
          workspaceId,
          outcome: 'rejected',
          progress: 'complete',
          reasons: Object.freeze(['certified_by_required']),
          libraryEntryId: null,
          certificationId: null,
          certifiedBy,
          certifiedAt: null,
          createdAt,
          notes,
          metadata,
        }),
      );
    }

    const familyId = resolveFamilyId(cmd);
    const versionLabel = cmd.version.version?.trim() ?? '';
    const existing = versionLabel ? this.library.getByFamilyVersion(familyId, versionLabel) : null;
    if (existing && existing.strategy.workspaceId === workspaceId) {
      return this.storeAttempt(
        freezeAttempt({
          attemptId,
          workspaceId,
          outcome: 'conflict',
          progress: 'complete',
          reasons: Object.freeze(['version_already_certified']),
          libraryEntryId: existing.version.libraryEntryId,
          certificationId: existing.certification?.certificationId ?? null,
          certifiedBy,
          certifiedAt: null,
          createdAt,
          notes,
          metadata: {
            ...metadata,
            strategyFamilyId: existing.strategy.strategyFamilyId,
            name: existing.strategy.name,
            version: existing.version.version,
            contentHash: existing.version.contentHash,
          },
        }),
      );
    }

    try {
      const family = resolveFamily(this.library, cmd, familyId, workspaceId, createdAt);
      const version = createStrategyVersion({
        libraryEntryId: `lib-${randomUUID()}`,
        strategyFamilyId: family.strategyFamilyId,
        version: cmd.version.version,
        contentHash: cmd.version.contentHash,
        market: cmd.version.market,
        supportedExchangeScopeIds: cmd.version.supportedExchangeScopeIds,
        supportedTimeframes: cmd.version.supportedTimeframes,
        supportedSymbols: cmd.version.supportedSymbols,
        universeRef: cmd.version.universeRef,
        workspaceId,
        createdAt,
      });
      const certification = createStrategyCertification({
        certificationId: `cert-${randomUUID()}`,
        strategyVersion: version,
        certifiedBy,
        certifiedAt: createdAt,
        notes,
        evidence: cmd.evidence,
        tacticalEnvelope: cmd.tacticalEnvelope,
        workspaceId,
      });
      const eligibility = createStrategyEligibility({
        eligibilityId: `elig-${version.libraryEntryId}`,
        certification,
        rulesVersion: 'rules-v1',
        evaluatedAt: createdAt,
        workspaceId,
      });
      this.library.admitCertifiedVersion({
        strategy: family,
        version,
        certification,
        eligibility,
      });

      return this.storeAttempt(
        freezeAttempt({
          attemptId,
          workspaceId,
          outcome: 'certified',
          progress: 'complete',
          reasons: Object.freeze([]),
          libraryEntryId: version.libraryEntryId,
          certificationId: certification.certificationId,
          certifiedBy,
          certifiedAt: createdAt,
          createdAt,
          notes,
          metadata: {
            strategyFamilyId: family.strategyFamilyId,
            name: family.name,
            version: version.version,
            contentHash: version.contentHash,
            registryRef: family.registryRef,
            evidenceTypes: Object.freeze(certification.evidence.map((item) => item.type)),
            envelopeVersion: certification.tacticalEnvelope.envelopeVersion,
          },
        }),
      );
    } catch (error) {
      const reason = mapCertificationDomainError(error);
      const outcome: CertificationOutcome =
        reason === 'version_already_certified' || reason === 'duplicate_library_entry'
          ? 'conflict'
          : 'rejected';
      return this.storeAttempt(
        freezeAttempt({
          attemptId,
          workspaceId,
          outcome,
          progress: 'complete',
          reasons: Object.freeze([reason]),
          libraryEntryId: null,
          certificationId: null,
          certifiedBy,
          certifiedAt: null,
          createdAt,
          notes,
          metadata: { ...metadata, strategyFamilyId: familyId },
        }),
      );
    }
  }

  getAttempt(attemptId: string, workspaceId: string): CertificationAttemptRecord | null {
    const id = attemptId?.trim() ?? '';
    const workspace = workspaceId?.trim() ?? '';
    if (!id || !workspace) return null;
    const record = this.attempts.find((item) => item.attemptId === id);
    if (!record || record.workspaceId !== workspace) return null;
    return record;
  }

  listHistory(query: CertificationHistoryQuery): CertificationHistoryPage {
    const workspaceId = query.workspaceId?.trim() ?? '';
    if (!workspaceId) {
      return Object.freeze({ items: Object.freeze([]) });
    }
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const items = this.attempts
      .filter((record) => record.workspaceId === workspaceId)
      .slice()
      .reverse();
    return Object.freeze({
      items: Object.freeze(items.slice(0, limit)),
    });
  }

  private storeAttempt(record: CertificationAttemptRecord): CertificationAttemptRecord {
    this.attempts.push(record);
    return record;
  }
}

function freezeAttempt(record: CertificationAttemptRecord): CertificationAttemptRecord {
  return Object.freeze({
    ...record,
    reasons: Object.freeze([...record.reasons]),
    metadata: Object.freeze({
      ...record.metadata,
      evidenceTypes: Object.freeze([...record.metadata.evidenceTypes]),
    }),
  });
}

function metadataFromCommand(cmd: CertifyStrategyVersionCommand): CertificationAttemptMetadata {
  return Object.freeze({
    strategyFamilyId: cmd.family.strategyFamilyId?.trim() || null,
    name: cmd.family.name?.trim() || null,
    version: cmd.version.version?.trim() || null,
    contentHash: cmd.version.contentHash?.trim() || null,
    registryRef: cmd.family.registryRef?.trim() || null,
    evidenceTypes: Object.freeze(
      (cmd.evidence ?? []).map((item) => String(item.type ?? '')).filter((type) => type.length > 0),
    ),
    envelopeVersion: cmd.tacticalEnvelope?.envelopeVersion?.trim() || null,
  });
}

function resolveFamilyId(cmd: CertifyStrategyVersionCommand): string {
  const explicit = cmd.family.strategyFamilyId?.trim();
  if (explicit) return explicit;
  const registryRef = cmd.family.registryRef?.trim();
  if (registryRef) return `fam-${registryRef}`;
  return `fam-${randomUUID()}`;
}

function resolveFamily(
  library: InMemoryStrategyLibraryReadAdapter,
  cmd: CertifyStrategyVersionCommand,
  familyId: string,
  workspaceId: string,
  createdAt: string,
): Strategy {
  const listed = library.list({
    workspaceId,
    includeArchived: true,
    statuses: ['certified', 'deprecated', 'archived', 'uncertified'],
    limit: 200,
  });
  const registryRef = cmd.family.registryRef?.trim() || null;
  const existing =
    listed.items.find((record) => record.strategy.strategyFamilyId === familyId) ??
    (registryRef
      ? listed.items.find((record) => record.strategy.registryRef === registryRef)
      : undefined);
  if (existing) {
    return existing.strategy;
  }
  return createStrategy({
    strategyFamilyId: familyId,
    name: cmd.family.name,
    description: cmd.family.description,
    registryRef: cmd.family.registryRef,
    workspaceId,
    createdAt,
  });
}
