# Wave 1 Certification Resolution Checklist

**Status:** **Product Owner Approved — Finalized.**
**Status key:** OPEN = action not started; READY = existing evidence can be assembled; RESOLVED = accepted evidence and validation complete.

| Finding                              | Required minimum action                                                                                                              | Status                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-02                                 | Align Identity-global role attribution with Security Audit contract; add persistence regressions.                                    | OPEN                                                                                                                                                            |
| F-10                                 | Make required privileged mutation and audit append atomic; add rollback/failure regressions.                                         | OPEN                                                                                                                                                            |
| F-11                                 | Implement conditional single-winner reset-token consumption; add concurrency regression.                                             | OPEN                                                                                                                                                            |
| F-12                                 | Implement atomic refresh-token rotation/reuse handling; add concurrency regression.                                                  | OPEN                                                                                                                                                            |
| F-06                                 | Produce completed S04 Verification Standard worksheet using existing Close evidence.                                                 | RESOLVED — [`v3-s04-security-verification-worksheet.md`](./v3-s04-security-verification-worksheet.md)                                                           |
| F-07                                 | Produce completed S05 Verification Standard worksheet; identify any row lacking evidence honestly.                                   | RESOLVED — [`v3-s05-security-verification-worksheet.md`](./v3-s05-security-verification-worksheet.md)                                                           |
| F-08                                 | Produce completed S06 Verification Standard worksheet; align it with actual S06 evidence.                                            | RESOLVED — [`v3-s06-security-verification-worksheet.md`](./v3-s06-security-verification-worksheet.md)                                                           |
| F-14                                 | Produce Production Composition Proof for applicable S06 isolation rows; record matrix-mapped certification evidence.                 | RESOLVED — [`wave-1-production-composition-proof.md`](./wave-1-production-composition-proof.md); Independent Certification Validation still required.           |
| F-05                                 | Create Product Owner decision record (Option D) resolving S05 foundation Close against unrevised search/filter planning.             | RESOLVED — [`wave-1-f05-product-owner-decision-record.md`](./wave-1-f05-product-owner-decision-record.md); Independent Certification Validation still required. |
| Independent Certification Validation | Verify that all confirmed blockers have been resolved; review resolved implementation, evidence, governance record, and regressions. | OPEN                                                                                                                                                            |
| Certification verdict                | Product Owner decision only after Independent Certification Validation.                                                              | OPEN                                                                                                                                                            |
| Wave 1 COMPLETE declaration          | Forbidden until certification and Product Owner declaration.                                                                         | OPEN                                                                                                                                                            |

## Guardrails

- No Wave 2 work.
- No Master Plan revision.
- No ownership or bounded-context changes.
- No second full independent audit is implied; remaining gate is Independent Certification Validation.
- F-14 remains technology-neutral Production Composition Proof, not an HTTP-only or Prisma-only requirement.
- No production implementation is authorized by this checklist until Product Owner authorizes Certification Remediation.
- Do not commit or push from this finalization task.
