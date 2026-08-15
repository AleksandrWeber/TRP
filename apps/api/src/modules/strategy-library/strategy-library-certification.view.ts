import type { CertificationAttemptRecord } from './ports/strategy-library-certification.port';

export type CertificationAttemptView = {
  attemptId: string;
  workspaceId: string;
  outcome: CertificationAttemptRecord['outcome'];
  progress: CertificationAttemptRecord['progress'];
  reasons: readonly string[];
  libraryEntryId: string | null;
  certificationId: string | null;
  certifiedBy: string;
  certifiedAt: string | null;
  createdAt: string;
  notes: string | null;
  metadata: {
    strategyFamilyId: string | null;
    name: string | null;
    version: string | null;
    contentHash: string | null;
    registryRef: string | null;
    evidenceTypes: readonly string[];
    envelopeVersion: string | null;
  };
};

export type CertificationHistoryView = {
  items: CertificationAttemptView[];
};

export function toCertificationAttemptView(
  record: CertificationAttemptRecord,
): CertificationAttemptView {
  return {
    attemptId: record.attemptId,
    workspaceId: record.workspaceId,
    outcome: record.outcome,
    progress: record.progress,
    reasons: [...record.reasons],
    libraryEntryId: record.libraryEntryId,
    certificationId: record.certificationId,
    certifiedBy: record.certifiedBy,
    certifiedAt: record.certifiedAt,
    createdAt: record.createdAt,
    notes: record.notes,
    metadata: {
      strategyFamilyId: record.metadata.strategyFamilyId,
      name: record.metadata.name,
      version: record.metadata.version,
      contentHash: record.metadata.contentHash,
      registryRef: record.metadata.registryRef,
      evidenceTypes: [...record.metadata.evidenceTypes],
      envelopeVersion: record.metadata.envelopeVersion,
    },
  };
}

export function toCertificationHistoryView(
  items: readonly CertificationAttemptRecord[],
): CertificationHistoryView {
  return {
    items: items.map(toCertificationAttemptView),
  };
}
