/**
 * RC-28 Epic 6 — Version 2 certification checklist.
 *
 * Records readiness of the assembled platform. Does not add ports,
 * modules, runtime, or ownership. Does not perform Validation or tagging.
 */

import { V2_PLATFORM_MODULE_IDS, type V2PlatformModuleId } from './v2-platform-modules';

export const V2_CERTIFICATION_SURFACES: readonly V2PlatformModuleId[] = V2_PLATFORM_MODULE_IDS;

export const V2_CERTIFICATION_DIMENSION_IDS = Object.freeze([
  'architecture',
  'ownership',
  'integration',
  'contracts',
  'dependency-graph',
  'compatibility',
  'documentation',
  'testing',
] as const);

export type V2CertificationDimensionId = (typeof V2_CERTIFICATION_DIMENSION_IDS)[number];

export type V2CertificationDimension = Readonly<{
  dimensionId: V2CertificationDimensionId;
  result: 'PASS';
  evidence: string;
}>;

export const V2_CERTIFICATION_CHECKLIST: readonly V2CertificationDimension[] = Object.freeze([
  Object.freeze({
    dimensionId: 'architecture',
    result: 'PASS',
    evidence:
      'Spec v2.0 twelve surfaces; V2_PLATFORM_BOUNDARY introduces no new domain / SoT / port / runtime',
  }),
  Object.freeze({
    dimensionId: 'ownership',
    result: 'PASS',
    evidence: 'V2_SOLE_OWNERS + V2_SOT_MAP unique; trading/finance SoT remains Freeze owners',
  }),
  Object.freeze({
    dimensionId: 'integration',
    result: 'PASS',
    evidence: 'Epic 2 workflow hops + Epic 4 E2E scenarios on existing ports',
  }),
  Object.freeze({
    dimensionId: 'contracts',
    result: 'PASS',
    evidence: 'RC-28 API Contract frozen inventory; V2_APPROVED_PORT_FILES on disk',
  }),
  Object.freeze({
    dimensionId: 'dependency-graph',
    result: 'PASS',
    evidence: 'Allowed consume ⊆ catalog; forbidden reverse absent; no directed cycles',
  }),
  Object.freeze({
    dimensionId: 'compatibility',
    result: 'PASS',
    evidence: 'RC-19…RC-27 matrix; Spec / Authority Matrix / Alias Dictionary unmodified',
  }),
  Object.freeze({
    dimensionId: 'documentation',
    result: 'PASS',
    evidence: 'Constitution + RC-28 Epics 1–5 reports + frozen planning package',
  }),
  Object.freeze({
    dimensionId: 'testing',
    result: 'PASS',
    evidence: 'platform-conformance suite covers boundaries, workflows, authority, E2E, resilience',
  }),
]);

export const V2_ARCHITECTURE_INVARIANTS = Object.freeze({
  newSourceOfTruth: false,
  ownershipOverlap: false,
  dependencyCycles: false,
  hiddenCommandPaths: false,
  architecturalDrift: false,
} as const);

export const V2_CERTIFICATION_VERDICT = 'READY' as const;

export const V2_READINESS = Object.freeze({
  verdict: V2_CERTIFICATION_VERDICT,
  paperFirst: true,
  liveCapitalAuthorized: false,
  validationPerformed: false,
  gitTagCreated: false,
  newFunctionality: false,
  newApis: false,
  newModules: false,
  newRuntime: false,
  newOwnership: false,
  justification:
    'Paper-first Version 2 is assembled and verified across RC-28 Epics 1–5: twelve Spec §5 surfaces, unique ownership, acyclic consume graph, frozen RC-19…RC-27 contracts, fail-closed Gate, and representative E2E paper path. Residuals (IDE shell, REST products, durable stores, live capital, US295/ADL-008, extra venue adapters) are deferred and do not block certification. Validation & Release and git tagging remain a separate task.',
});
