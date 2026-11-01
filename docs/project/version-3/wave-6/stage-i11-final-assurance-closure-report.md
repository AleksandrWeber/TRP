# Stage I.11 — Final Assurance Closure Report

**Document status:** technical proposal only.  
**Normative label for every rule in §§4–7 and §12:** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`  
**This file is not a Product Owner decision, not an adopted control, and not authorization to act.**

How to read this report:

- **Verified repository fact** means a hash, byte size, file presence, or wording read from a named source during this task.
- **Prior proposal** means Stage I.8, Stage I.9, or Stage I.10 text. Stages I.8, I.9, and I.10 are conversation texts. No repository file for those stages is assumed.
- **I.11 proposal** means normative text introduced here, including the Stage I.12 two-anchor correction and the Stage I.13 package-payload identity correction in this file. It is not adopted.
- **Untested** means the control is specified and was not executed. Specification is not evidence that the control ran.
- **Open PO decision** means a governance choice this report does not make.

No package, manifest, freeze record, capture record, or anchor was created. No specified test was executed. SQL content was not inspected.

---

## 1. Executive conclusion

Stage I.10 left four specification gaps: path grammar that still allowed cross-platform collisions and did not define filesystem object types; manifest and freeze-record fields whose tokens, ranges, and empty-package behavior were incomplete; request/response capture that did not define a trustworthy byte boundary, retry handling, or tamper limits; and an anchor whose independence was not tied to a real separation of duties.

This report resolves those four areas with one ASCII path grammar, one regular-file collection rule, one closed manifest and freeze grammar with operational size caps, one fail-closed capture and single-attempt pairing rule, and two anchor records that are valid only when the person who prepares the bound bytes cannot write the record. The Stage I.12 correction splits the earlier single anchor into two records with two times:

- The **Package Anchor** is a pre-disclosure record. It binds the frozen package before any provider receives package bytes. It contains no seal hash and no attempt id.
- The **Post-capture Evidence Anchor** is a later record, one per completed attempt. It binds that attempt's seal to the already accepted Package Anchor after capture. It is not commencement authority.

**Readiness verdict: `READY FOR D4 PRODUCT OWNER REVIEW`.**

That verdict is specification readiness. It is not operational readiness. Neither anchor store is deployed. Separation of duties is not established for either record. No capture path was tested. Decision 4 is not approved.

Residual limitations, all fail-closed and all untested:

- The Decision Register records a sole Project Owner, and this repository shows no second custodian. A Package Anchor written by the package preparer is not independent. An Evidence Anchor written by the capture operator is not independent.
- `TRANSPORT-PAIR` and `ID-LINK` bind captured bytes. They do not prove that a model processed those bytes.
- Provider-internal instructions remain outside operator capture.
- A person who can rewrite both the package directory and the Package Anchor store can still replace the package. A person who can rewrite both the seal directory and the Evidence Anchor store can still replace the seal.
- Local agreement among payload, manifest, and freeze record still does not detect a joint rewrite of those three objects.

---

## 2. Source identity verification

Verification date context: 2026-11-01. Method: SHA-256 of the file bytes at the paths below. No source was substituted. SQL content was not read. Only size and hash were checked for the SQL candidate.

| Source                           | Path                                                                                                                                  | Bytes   | SHA-256                                                            | Result |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ | ------ |
| Stage H proposal                 | `docs/project/version-3/wave-6/stage-h-po-decision-cc02-ai-only-amendment-proposal.md`                                                | 33,719  | `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099` | Match  |
| Decision Register (working tree) | `docs/project/version-3/wave-6/wave-6-po-decision-register.md`                                                                        | 364,459 | `06d3f15e7e7b1e99e5c34a81dd74d626aae2581a71051cf318ca78c729680845` | Match  |
| Operator Runbook                 | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-option-c-census-operator-runbook.md`                                              | 18,106  | `b9dfd9cce20d44bc26234496f90342468cc610f4a74dbb603a83eea104dfa99e` | Match  |
| Evidence Protocol                | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-option-c-census-evidence-handling-protocol.md`                                    | 9,898   | `1993893bf3b02bf7d5e3c43136b7e7d31440d926b7c5e0a6782b9fc950b8b100` | Match  |
| Binding Manifest                 | `artifacts/option-c-census-sql-draft/option-c-vault-id-census-draft.binding-manifest.md` under the Cursor project artifacts directory | 21,719  | `de2913f522ea55deefd7d4c93140f405974696363315793e32202bcde05dec38` | Match  |
| Authorization Package            | `canvases/census-execution-authorization-package.canvas.tsx` under the Cursor project canvases directory                              | 44,478  | `ed94cc031029233e2aed91c847e9977c4c88150c8f8a53f42febef8200879d50` | Match  |
| Current Design Canvas            | `canvases/option-c-vault-id-census-plan.canvas.tsx` under the Cursor project canvases directory                                       | 22,917  | `c70f45dcfbc74f55765bd682caa6ebff551673cf06120e76d9222251a0680c2e` | Match  |
| Bound SQL candidate              | `artifacts/option-c-census-sql-draft/option-c-vault-id-census-draft.sql` under the Cursor project artifacts directory                 | 22,116  | `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c` | Match  |

The Binding Manifest, Authorization Package, Current Design Canvas, and SQL candidate paths used for hashing sit outside the git working tree, in the Cursor project artifacts and canvases directories. Their hashes matched. They were not edited.

**Verified repository fact, register mutability.** The working-tree Decision Register matches the identity named for this task. The same path at git HEAD `a59c533977923a45413a176ad143325a948feeb8` has content SHA-256 `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b`. Those are different bytes. `git status` shows the register modified and uncommitted. This task does not reconcile that difference, does not stage the register, and does not use the HEAD bytes as a substitute. Section 3 cites the matched working-tree file.

Stage I.10 is the conversation report supplied to this task. It is not a repository file.

Design Content Baseline digest `7714f95b8202771dfa1835d279983fafef9505af5a678f12344bdc79f1ca0ac7` is a prior citation only. Those bytes were not opened and were not re-hashed in this task. Stale canvas identity `4e7bf3c96f40276578302f7e632f4955146585fc3d1a10fdca30ba3c7d22ea0f` was not opened and was not re-hashed.

---

## 3. Immutable governance state

Read from the matched working-tree Decision Register. This report does not change that file.

| Item                               | State                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| D1 `D-CONN04-CENSUS-CC02-AMD-D1`   | **APPROVED — AMENDMENT CANDIDATE ONLY**                                                                              |
| D2 `D-CONN04-CENSUS-CC02-AMD-D2`   | **APPROVED — ALTERNATIVE CONTROL CONCEPT ONLY**                                                                      |
| D3 `D-CONN04-CENSUS-CC02-AMD-D3`   | **APPROVED — CONDITIONAL ROSTER IDENTITY ONLY**                                                                      |
| Google privacy                     | **DEFERRED**                                                                                                         |
| Google package-receipt eligibility | Unresolved                                                                                                           |
| D4–D7                              | **NOT DECIDED / NOT APPROVED**. Register IDs **NOT ASSIGNED**                                                        |
| Stage H                            | `DRAFT — PROPOSAL ONLY — NOT ADOPTED`. Bound hash `0680abb316b8ba81bd24eb660d3bd3ac650b386b9fc6501f3d126a7857a1d099` |
| Operative CC-02                    | Unchanged                                                                                                            |
| CC-02 evidence                     | **INSUFFICIENT EVIDENCE**                                                                                            |
| CC-06                              | Not performed                                                                                                        |
| OQ-CENSUS-01                       | OPEN                                                                                                                 |
| SQL EXEC / Census EXEC             | **NOT AUTHORIZED**                                                                                                   |

**Verified D3 roster, unchanged:**

1. Anthropic, model `claude-opus-5-5`, first-party Claude API only.
2. OpenAI, model `gpt-6.1-sol`, first-party OpenAI API only.
3. Google, model `gemini-4-argon`, paid Gemini Developer API only, provisional third candidate. Package-receipt eligibility is unresolved. Google privacy is deferred, including 55-day abuse-monitoring retention, possible human review of flagged content, and transient storage or caching in any country where Google or its agents operate.

No provider, model, API, endpoint, or hosting substitution is permitted. Any replacement requires a separate PO decision.

**Verified repository fact used in §7.** The D3 record states **Authority: Product Owner (sole Project Owner)**. This report does not treat that sole-owner wording as proof of a second custodian.

Earlier summary rows for D1 and D2 still contain historical sentences that predate the D3 record. The D3 section is the Decision 3 record. This report does not edit those rows.

---

## 4. Clarification A — Cross-platform path safety and file types

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

This section replaces Stage I.10 §4 path rules, ordering, and package-payload record layout (the prior A1–A3). Member roles, exclusion of the stale canvas citation, and the rule that baseline bytes stay out of the package until a later hash-matched snapshot, remain as previously proposed. Those members are not assembled here.

### 4.1 Trade-off and recommended grammar

Stage I.10 allowed Unicode 15.1.0 Normalization Form C paths and rejected case-fold and normalization collisions. That approach can represent non-ASCII names. It also makes acceptance depend on Unicode 15.1.0 case-fold tables. A library built on a different Unicode version can classify a pair differently. Host normalization (macOS NFD, Windows case folding, trailing-dot stripping) remains easy to confuse with the protocol if non-ASCII bytes are legal.

The review package is a fixed operator-authored set, not a mirror of arbitrary user filenames. The member names already proposed use ASCII. The repository does not require a non-ASCII member name for this package.

**Recommendation, locked for this proposal:** path grammar `I.11-ASCII-1`. Unicode 15.1.0 tables are not consulted. A non-ASCII byte is rejected before normalization, case fold, or filesystem lookup. A later package that needs a non-ASCII path requires a new specification version. This is a deliberate narrowing of Stage I.10, stated here, and it is not a silent substitution.

### 4.2 Path grammar `I.11-ASCII-1`

A logical path is a protocol string. It is not a host path returned by directory enumeration.

```
path        = component *( "/" component )
component   = 1*64 path-char
path-char   = ALPHA / DIGIT / "-" / "_" / "."
ALPHA       = %x41-5A / %x61-7A
DIGIT       = %x30-39
```

A path is valid only when all of the following hold. Failure rejects the path. The parser does not rewrite it.

1. The path bytes are ASCII as defined above. There is no BOM. Any byte outside `path-char` and `/` is rejected, including bytes `0x00`–`0x1F`, `0x7F`, space (`0x20`), `\`, `<`, `>`, `:`, `"`, `|`, `?`, `*`, and every byte `>= 0x80`.
2. Total length is 1 through 255 bytes.
3. The path contains 1 through 8 components.
4. Each component is 1 through 64 bytes.
5. The separator is `/` only. There is no leading `/`, no trailing `/`, and no empty component (`//` is rejected).
6. No component is `.` or `..`.
7. No component ends with `.` (`0x2E`).
8. Windows reserved device names are rejected, including names with extensions. Let the stem be the whole component when the component contains no `.`, and otherwise the bytes before the first `.`. Reject the component when the stem equals any of the following under ASCII case fold (`A`–`Z` mapped to `a`–`z` only): `con`, `prn`, `aux`, `nul`, `com1`, `com2`, `com3`, `com4`, `com5`, `com6`, `com7`, `com8`, `com9`, `lpt1`, `lpt2`, `lpt3`, `lpt4`, `lpt5`, `lpt6`, `lpt7`, `lpt8`, `lpt9`. This rejects `CON`, `con.txt`, `aux.foo.bar`, and `COM1`.
9. Drive prefixes, UNC paths, and device namespaces cannot satisfy this grammar: `C:`, `\\server\share`, `//server/share`, `\\.\`, and `\??\` each contain a rejected byte or an empty component.
10. Alternate-data-stream syntax cannot satisfy this grammar because `:` is rejected.

Duplicate detection runs after every path has passed the grammar and before any content hash:

- Two paths with identical bytes are duplicates. Reject the package.
- Two paths that become identical after ASCII case fold (`A`–`Z` to `a`–`z` only) are a case collision. Reject the package.
- Unicode case folding, Unicode normalization, and host locale tables are not used. Non-ASCII bytes never reach those algorithms because rule 1 already rejected them.

**Ordering.** After duplicate and case-fold checks pass, sort paths as raw unsigned bytes, byte by byte. The smaller sequence comes first. Comparison is case-sensitive because case variants have already been rejected. Identical byte strings cannot remain. Locale order, filesystem order, and code-point order beyond the bytes are not used. For this alphabet, byte order and code-point order are the same.

**Filesystem behavior is not an input.** macOS, Linux, and Windows name canonicalization does not decide acceptance or order. The collector opens the logical path defined here. If the platform reports a stored name and that name is not byte-identical to the requested component, reject the package as `PATH-IDENTITY-MISMATCH`. If the platform cannot report the stored name, stop with `PATH-IDENTITY-NOT-EVIDENCED` and offer no hash.

The repository does not publish a path-length policy. The limits above are the conservative proposal: they cover the proposed member names (the longest proposed filename component is 50 bytes) and they stay inside the historic 255-byte component ceiling used by common filesystems. They are operational caps, not the maximum of a 32-bit integer.

### 4.3 File-object policy

Only regular-file content bytes participate in the payload hash.

| Object                                    | Policy                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regular file                              | Allowed as a member. The hashed bytes are the logical file bytes, including zero-filled holes of a sparse file.                                                                                                                                                                                       |
| Directory                                 | Container only. Contributes no payload bytes. Allowed only when it is a strict prefix of a listed member path. Any other directory is an extra object and fails verification.                                                                                                                         |
| Symbolic link                             | Rejected. Never followed, including a symlink whose target is inside the staging root. A symlink ancestor fails the collection.                                                                                                                                                                       |
| Hard link                                 | Rejected when the link count is greater than 1. The same bytes must not be reachable under a second name. If the platform cannot report link count, stop with `LINK-COUNT-NOT-EVIDENCED` and offer no hash.                                                                                           |
| Socket, FIFO, device file                 | Rejected.                                                                                                                                                                                                                                                                                             |
| Mount point                               | Rejected when any directory or member inside the staging root has a different device identity from the staging root. If the implementation cannot compare device identity, stop with `MOUNT-CHECK-UNAVAILABLE` and offer no hash.                                                                     |
| Sparse file                               | Allowed only as logical regular-file bytes. Allocation maps are not hashed.                                                                                                                                                                                                                           |
| Alternate data stream                     | Rejected when any stream other than the default data stream is present. If streams cannot be enumerated, stop with `ADS-CHECK-UNAVAILABLE` and offer no hash. A legal logical path cannot name a stream, because `:` is illegal. That grammar fact is not a claim that the filesystem has no streams. |
| Extended attributes, ACLs, resource forks | Excluded from the hash. If any are present, reject the collection. If they cannot be enumerated, stop with `XATTR-CHECK-UNAVAILABLE` and offer no hash.                                                                                                                                               |
| Mode, owner, group, timestamps            | Excluded from the hash. They are not a substitute for byte identity.                                                                                                                                                                                                                                  |

A logical member must be opened inside the staging root. Resolution that escapes the root fails verification. The collector must not use a routine that follows symlinks (`realpath` and equivalents that resolve links are forbidden). The open must use a no-follow operation per component (`openat` with `O_NOFOLLOW` on platforms that provide it, or the platform's equivalent reparse-point rejection). After the file is open, the implementation must show that every ancestor from the file back to the staging root is a real directory on the same device and that the walk ends at the staging root. If that containment check cannot be performed, stop with `PATH-CONTAINMENT-NOT-EVIDENCED` and offer no hash.

`O_NOFOLLOW`, `st_dev`, `st_ino`, and Windows file-id APIs are implementation techniques. They are not protocol guarantees. The protocol requirement is the check named above. An unperformed check fails closed. This proposal does not claim that a generic directory listing provides any of these checks.

### 4.4 Collection algorithm

Protocol requirements:

1. The staging root is a directory created for this freeze, empty at the start, and distinct from the git work tree. The preparer copies member bytes into it under the logical paths. Copying is not performed by this report.
2. During collection there is a single writer. The collection covers the interval from the first open through the second full read. An advisory lock is a permitted technique. It does not stop another process that shares the preparer's credentials. Same-credential mutation is a residual threat. It is not solved by the lock.
3. Each logical path is checked against §4.2 before it is joined to the staging root. Components are appended one at a time. No host string from `readdir` is trusted as the path.
4. Symlinks are not followed.
5. The opened object must be a regular file. The check uses the file descriptor that was opened, not a second path lookup.
6. The byte stream is read from that descriptor to EOF.
7. Where the platform provides a stable file identifier, record device identity, file identifier, and size before the first read. After the first read, require the same identifier and size, then read the descriptor again. The two reads must be byte-identical. Where no stable file identifier exists, stop with `FILE-IDENTITY-NOT-EVIDENCED` and offer no hash.
8. A change of identifier, size, or bytes between the two reads rejects the collection as mutation. A replaced file between open and read is the same rejection.
9. Walk the staging root without following symlinks. Every regular file must be a listed member. Every listed member must be present. Extra directories that are not strict prefixes of listed paths fail. Special files fail. Missing members fail.
10. Build the payload in §4.5, hash it, and require agreement with the manifest and the freeze record as specified in §5. `PACKAGE-MANIFEST.txt` and `FREEZE-RECORD.txt` are not members. If either name appears inside the staging root, it is an extra object and verification fails.

POSIX permissions on the staging directory are not a separation of duties. The same user can chmod the directory back. Separation is §7.

### 4.5 Package payload records

The package payload is one binary string. File bytes are length-prefixed. A newline or NUL inside a file cannot end a record.

```
magic:            8 bytes  4F 43 50 4B 47 31 00 0A   ("OCPKG1" NUL LF)
member_count:     uint32 big-endian                 (1..32)
repeated member_count times, in §4.2 byte order:
  path_length:    uint32 big-endian                 (1..255)
  path_bytes:     exactly path_length bytes
  content_length: uint64 big-endian                 (0..1048576)
  content_bytes:  exactly content_length bytes
```

An empty file has `content_length = 0` and contributes no content bytes. The next record begins on the next byte. Integers are big-endian. There is no decimal text and no line terminator inside the payload. The payload ends at the last content byte. Trailing bytes are rejected.

Before reading `content_bytes`, the parser checks that `content_length` is within the single-file cap and that the running total of magic, counts, path framing, and content does not exceed 8,388,608 bytes. The check uses arithmetic that rejects overflow. The parser does not allocate from a declared length that fails the check.

`package-payload-sha256` is SHA-256 of this entire byte string, magic included. The payload contains no manifest, no freeze record, and no digest of itself.

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The accepted Package Anchor identifies one exact frozen payload: these bytes and this hash. The package payload bytes disclosed to a provider must be those bytes. A different payload hash is an integrity failure. Capturing or describing the different bytes does not make that attempt eligible to count, and the attempt cannot be relabelled, rebound, or later associated with the accepted Package Anchor. The Package Anchor does not bind every byte of the transport envelope defined in §6.1. It continues to identify the original payload when a later request carries different payload bytes. It does not authorize that later request to count.

### 4.6 Adversarial cases for paths and objects

These cases are specified. They were not executed.

| Case                                                                                      | Result under this proposal           |
| ----------------------------------------------------------------------------------------- | ------------------------------------ |
| Same logical paths and same regular-file bytes on macOS and Linux, both using this parser | Same payload hash                    |
| Empty regular file, member count at least 1                                               | Valid. `content_length = 0`          |
| File bytes contain NUL and LF                                                             | Valid. The length prefix bounds them |
| `A.sql` and `a.sql`                                                                       | Reject. ASCII case-fold collision    |
| Non-ASCII, NFC, or NFD path                                                               | Reject before normalization          |
| `CON.txt`, `aux`, `com1.log`                                                              | Reject. Reserved stem                |
| `file.txt:Zone.Identifier`                                                                | Reject. Colon                        |
| `C:/sql/a.sql`, `\\server\share\a.sql`, `/abs/a.sql`, `a/../../b`                         | Reject                               |
| Component of 65 bytes, or path of 256 bytes, or 9 components                              | Reject                               |
| Trailing dot or embedded space                                                            | Reject                               |
| Symlink member or symlink ancestor                                                        | Reject. Not followed                 |
| Hard link with link count greater than 1                                                  | Reject                               |
| FIFO, socket, or device node                                                              | Reject                               |
| Mounted directory inside the staging root                                                 | Reject when device identity differs  |
| Alternate data stream, xattr, ACL, or resource fork present                               | Reject when enumeration finds it     |
| Those checks unavailable on the host                                                      | No hash is offered                   |
| Extra regular file, extra directory, or missing member                                    | Reject                               |
| Manifest or freeze record stored inside the staging root                                  | Reject as an extra object            |
| File replaced between the two reads                                                       | Reject as mutation                   |
| One member's bytes changed                                                                | Package hash mismatch                |

---

## 5. Clarification B — Manifest and freeze-record grammar

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

This section replaces Stage I.10 manifest grammar, freeze-record grammar, and the local verification sequence that depends on them. Creation order stays non-circular: hash member bytes and build the payload; write the manifest including the package hash; hash the manifest; write the freeze record; do not write the manifest hash back into the manifest.

No manifest and no freeze record is created by this task.

### 5.1 Operational numeric limits

The repository does not define a package-size policy. The bound SQL candidate is 22,116 bytes. That size is a reference point only. Its content was not inspected. The current canvas is 22,917 bytes and the binding manifest is 21,719 bytes. Those three files are reference points for scale. They are not a built package.

The caps below are the conservative proposal for PO review of the protocol text. They are operational limits. A theoretical maximum of `uint32` or `uint64` is not an operational limit. A package that exceeds a cap is a new specification decision, not an implicit extension.

| Limit                | Value                                   | Rationale                                                                                                                                                               |
| -------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Member count         | 1 through 32                            | Zero cannot represent the review materials. 32 is above the four-member shape previously proposed and far below a 32-bit maximum.                                       |
| Path length          | 1 through 255 bytes                     | §4.2.                                                                                                                                                                   |
| Component length     | 1 through 64 bytes                      | Longest proposed component is 50 bytes.                                                                                                                                 |
| Component count      | 1 through 8                             | Proposed paths use two components.                                                                                                                                      |
| Single-file length   | 0 through 1,048,576 bytes               | About 47 times the 22,116-byte SQL reference. Zero is an empty regular file, not an empty package.                                                                      |
| Aggregate payload    | 1 through 8,388,608 bytes               | Includes magic and framing. The three known reference files total under 70,000 bytes. The cap binds before `32 × 1 MiB`.                                                |
| Manifest length      | grammar-valid size through 16,384 bytes | Worst case under these caps is under 12,000 bytes. 16,384 accepts every grammar-valid manifest and rejects padding.                                                     |
| Freeze-record length | grammar-valid size through 1,024 bytes  | A valid record is a short fixed form. 1,024 rejects trailing data.                                                                                                      |
| Decimal integers     | canonical form only                     | Pattern `0` or `[1-9][0-9]*`. No leading zeros, no `+`, no `-`, no spaces, no underscores. Digit length must not exceed the digit length of the maximum for that field. |
| Overflow             | reject                                  | Checked arithmetic. A wrapped integer is not a value. Declared lengths above the cap are rejected before the bytes are read.                                            |

### 5.2 Empty package

A zero-member payload is forbidden, including a payload whose encoding could represent `member_count = 0`.

Governance reason, separate from the encoding: a review package has to be able to carry the bound SQL candidate, the current design canvas, the binding manifest, and a review-scope file. An empty package can still be hashed and could be mistaken for a frozen review object. Fail closed.

Non-emptiness is not sufficiency. This grammar does not assemble members. A later Package Anchor is eligible for the current candidate only when the package also satisfies §7.5. That eligibility rule is not exercised here. `scope/review-scope.txt` does not exist.

### 5.3 Shared line rules

`PACKAGE-MANIFEST.txt` and `FREEZE-RECORD.txt` are UTF-8, with no BOM. The only line ending is LF (`0x0A`). CR (`0x0D`) is rejected. The file ends with exactly one LF. A second trailing LF is a blank line and is rejected. No line has a leading or trailing space.

A field line is `key`, then `:`, then exactly one SPACE (`0x20`), then `value`, then LF. There is no space before the colon. The value has no leading or trailing space. A line `key:` or `key: ` is an empty value and is rejected.

Keys are lowercase ASCII, `[a-z0-9-]+`, case-sensitive. Unknown keys are rejected. Duplicate keys are rejected. Missing keys are rejected. Keys must appear in the order listed for that file. A member line is not a colon field; its shape is defined below.

The parser rejects bytes that remain after the final required LF.

### 5.4 Manifest grammar

Specification token: `I.11-1`. Hash algorithm token: `sha256` (SHA-256, 32 bytes, written as 64 lowercase hexadecimal digits `0-9a-f`). Uppercase hex is rejected.

Lines, in this order:

1. `manifest-spec-version: I.11-1`  
   Value is exactly those six characters.
2. `hash-algorithm: sha256`  
   Value is exactly `sha256`.
3. `path-grammar: I.11-ASCII-1`  
   Value is exactly `I.11-ASCII-1`.
4. `unicode-version: NOT-APPLICABLE`  
   Value is exactly `NOT-APPLICABLE`. Unicode tables are not an input, for the reason in §4.1.
5. `freeze-utc: ` plus one timestamp.  
   Grammar: `YYYY-MM-DDTHH:MM:SSZ`, four-digit year, two-digit month, two-digit day, `T`, two-digit hour, two-digit minute, two-digit second, `Z`. No fractional seconds. No numeric offset. Hour `00`–`23`, minute `00`–`59`, second `00`–`59`. Second `60` is rejected. Month and day must be a real Gregorian date, including leap days. Year must be `2026` through `2099`. The timestamp records the freeze clock. It does not prove civil time.
6. `clock-source: ` plus one closed token, exactly one of: `OPERATOR-DECLARED-UTC`, `OS-CLOCK-UTC`, `NTP-SYNCED-OS-CLOCK`.  
   The token names the source the operator declares. The grammar does not verify NTP, the operating-system clock, or the operator's statement.
7. `package-payload-sha256: ` plus 64 lowercase hex digits.
8. `member-count: ` plus a canonical decimal integer from 1 through 32.
9. Exactly `member-count` member lines, already in §4.2 order. The parser does not sort. It rejects an unsorted file.  
   Shape, with TAB as `0x09` and no spaces around the tabs:

   ```
   member:<order><TAB><path><TAB><byte-length><TAB><64-lowercase-hex>
   ```

   `order` is a canonical decimal from 1 through `member-count`, contiguous, starting at 1. `path` is a §4.2 path. `byte-length` is a canonical decimal from 0 through 1,048,576. The hex is SHA-256 of that member's regular-file bytes only. Tabs cannot appear in a valid path, so the line has exactly three TAB bytes.

10. `baseline-bytes: NOT IN PACKAGE - CITED IDENTITY ONLY`  
    The hyphen is ASCII `-` (`0x2D`). This replaces the prior punctuation so the manifest stays ASCII. The line does not embed the baseline digest. That digest was not re-verified.
11. `stale-canvas-4e7bf3c9: EXCLUDED`  
    Key and value are exact. This records exclusion of the previously cited stale canvas identity. That file was not re-hashed.
12. `unlisted-files: PROHIBITED`
13. `package-version: ` plus a token of 1 through 32 characters matching `[a-z0-9][a-z0-9.-]*`.  
    Lowercase only. No spaces. The token is assigned when a package is frozen. This task does not assign one.

For one valid member set and one freeze timestamp, clock source, and package version, the manifest has one byte representation. The manifest contains no file content. Its own digest is not a line inside it.

`manifest-payload-sha256` is SHA-256 of these exact file bytes.

### 5.5 Freeze-record grammar

`FREEZE-RECORD.txt` uses §5.3. Maximum length 1,024 bytes. Lines, in this order:

1. `freeze-spec-version: I.11-1`
2. `manifest-spec-version: I.11-1`
3. `path-grammar: I.11-ASCII-1`
4. `package-version: ` the same token as the manifest
5. `member-count: ` the same canonical decimal as the manifest
6. `freeze-utc: ` the same timestamp as the manifest
7. `package-payload-sha256: ` the same 64 lowercase hex digits as the manifest
8. `manifest-payload-sha256: ` 64 lowercase hex digits, the digest of the manifest file
9. `manifest-byte-length: ` the canonical decimal length of `PACKAGE-MANIFEST.txt`, from 1 through 16,384

Exact agreement is required for freeze timestamp, member count, package version, package payload hash, manifest specification version, and path grammar. The freeze record is not an input to either hash.

### 5.6 Validation algorithm

The parser is deterministic. On any failure it rejects the object and offers no hash for disclosure.

1. Read `FREEZE-RECORD.txt`. Reject a length above 1,024, a BOM, a CR, a missing final LF, an extra final LF, an unknown field, a duplicate field, a missing field, or an out-of-order field.
2. Read `PACKAGE-MANIFEST.txt`. Reject a length above 16,384 or a length that differs from `manifest-byte-length`. Compute SHA-256. Reject disagreement with `manifest-payload-sha256`.
3. Parse the manifest with §5.3 and §5.4. Reject malformed UTF-8, uppercase hex, empty values, bad timestamps, leading zeros, values outside the caps, a package version outside the token grammar, a member count other than 1 through 32, an order sequence other than `1..member-count`, a path that fails §4.2, a case-fold collision, a duplicate path, or member lines that are not in §4.2 order.
4. Require manifest `package-payload-sha256`, `member-count`, `freeze-utc`, `package-version`, `manifest-spec-version`, and `path-grammar` to equal the freeze record.
5. Walk the staging root under §4.4. Reject extra objects and missing members.
6. Read each member twice from a no-follow regular-file descriptor. Reject mutation, non-regular files, links, and failed identity checks.
7. Build the §4.5 payload with checked arithmetic. Reject overflow, a declared length above the cap, or trailing payload bytes. Require the payload SHA-256 to equal both records.
8. Require each member length and SHA-256 to equal the staged bytes.

| Case                                                        | Result                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| Zero members                                                | Reject                                                                   |
| `member-count: 01` or `+1` or `-1`                          | Reject                                                                   |
| Uppercase hash                                              | Reject                                                                   |
| Fractional timestamp, offset other than `Z`, or 31 February | Reject                                                                   |
| Unknown clock source                                        | Reject                                                                   |
| Duplicate or unknown field, or wrong order                  | Reject                                                                   |
| CRLF, BOM, or extra trailing LF                             | Reject                                                                   |
| Manifest length disagrees with the freeze record            | Reject                                                                   |
| Member bytes disagree with the listed hash                  | Reject                                                                   |
| Payload, manifest, and freeze record rewritten together     | Local verification can succeed. This scheme does not detect that rewrite |

What local verification detects: accidental corruption, a substituted member, a substituted manifest, a substituted freeze record, extra or missing objects, illegal paths, and illegal file types.

What it does not detect: a party who can rewrite the members, the manifest, and the freeze record together. That case needs the pre-disclosure Package Anchor in §7.3, and only when that anchor is outside the rewriter's control. Seal hashes are not part of that record. They belong to the later Evidence Anchor in §7.4.

---

## 6. Clarification C — Trustworthy request/response capture

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

This section replaces the Stage I.10 evidence-class, correlation, and seal-field rules. It preserves Stage I.9 severity separation, the ban on a provider issuing the review-level outcome, no N−1 quorum, and no automatic replacement. No interface was tested. No provider was contacted. No API capability is asserted for Anthropic, OpenAI, Google, or any other provider.

### 6.1 Capture trust model

Three layers stay distinct.

| Layer                                           | What it is                                                                                                | Class it can support                                          | What it does not prove                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| Operator-prepared content                       | Bytes the operator assembled before the client stack                                                      | `PREPARED`                                                    | That those bytes were sent                                      |
| Client/transport-boundary evidence              | The exact serialized bytes the client handed to the send path, after the client's own final serialization | `SUBMITTED` when the capture is that byte string              | That the provider received them, or that a model processed them |
| Provider acknowledgement or processing evidence | An interface field the provider actually returned                                                         | `ACKNOWLEDGED` or `PROCESSED` only when that field is present | Hidden provider inputs, or review correctness                   |

A local file hash of a prepared prompt is `PREPARED` only. Re-serializing a parsed JSON object produces a different byte string and must not be substituted for the sent bytes. The hashed request is the byte string at the boundary, not a later canonicalization.

**Package payload and transport representation.** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Two byte strings stay distinct.

The **package payload** is the canonical binary string in §4.5. Its identity is `package-payload-sha256` on the accepted Package Anchor. Disclosure to a provider must carry those exact bytes.

The **transport representation** is the external request envelope around that payload: API serialization, framing, headers, authentication metadata, and other protocol fields. It may differ from a locally prepared request because the client adds that envelope. That difference does not by itself invalidate the Package Anchor.

A transport difference can still count only when all of the following hold:

1. The exact package payload bytes inside the transmitted request are identifiable as one byte range.
2. SHA-256 of that range equals the accepted Package Anchor's `package-payload-sha256`.
3. The capture shows which range of `transmitted-request.bin` is that payload.
4. The transport step does not alter, truncate, normalize, reorder, substitute, or otherwise change those payload bytes.
5. The existing correlation, completeness, seal, and Evidence Anchor rules also pass.

The seal verifier, who is not the capture operator, computes that range hash by reading the retained `transmitted-request.bin`. The recorded `transmitted-request-sha256`, the offset, and the length do not prove the payload bytes. If that file is not available to the verifier, `package-payload-identity` is `UNVERIFIABLE`.

An arbitrary transport transformation is not treated as safe. If the payload bytes inside the transmitted request cannot be identified, `package-payload-identity` is `UNVERIFIABLE` and the attempt does not count. If the identified bytes hash to a different value, `package-payload-identity` is `MISMATCH` and the attempt does not count. Full capture of the different bytes does not cure the mismatch. The response is not relabelled onto the accepted Package Anchor or onto a later package.

| Condition                                                                  | Package Anchor                                                                   | Assessment attempt                                                                             | Matrix                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| Transport envelope differs, and the exact embedded package payload matches | Remains valid for the original payload                                           | May count only when `package-payload-identity` is `MATCH` and every other counting rule passes | Eligible for that attempt           |
| Exact package payload differs from the accepted Package Anchor             | Remains valid only for the original package. It is not corrupted by the mismatch | Non-counting. Not relabelled or rebound                                                        | Excluded                            |
| Package payload cannot be extracted from the transmitted request           | Remains valid for the original package                                           | Non-counting. Identity is `UNVERIFIABLE`                                                       | Excluded                            |
| A new package is prepared after a payload mismatch                         | The old anchor does not bind the new package                                     | The new attempt needs a new accepted Package Anchor and a separate disclosure authorization    | Not eligible until those gates pass |
| A provider response from the old package is offered against a new package  | The old anchor remains a historical record of the old payload                    | Cannot be rebound or reused                                                                    | Excluded                            |

The Evidence Anchor records this check. It does not prove that the provider processed the payload or that hidden provider inputs are known. `TRANSPORT-PAIR` and `ID-LINK` keep the limits already stated in this section.

### 6.2 Evidence-source comparison

Availability of each source is unknown. None was tested.

| Source                                       | Bytes observable                                                                        | Easy to omit or transform                                                    | Attachments                              | Request id                             | Pairing                                                    | Limit                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Official API SDK                             | Objects the application passed into the SDK                                             | SDK-added headers, SDK retries, SDK multipart framing, SDK-injected defaults | Only if the SDK exposes the framed body  | Only if the SDK returns one            | Only inside the object the SDK returns for that call       | SDK arguments alone are `PREPARED`, not `SUBMITTED`                                                 |
| Direct HTTPS client                          | The buffer the application passes to the TLS write, if logged after final serialization | Headers the HTTP library adds after the snapshot                             | Visible when they are inside that buffer | Only if the response bytes contain one | One call can store both directions                         | A snapshot taken before the library mutates the request is `PREPARED`                               |
| HTTP middleware / interceptor                | The request the stack holds at that interceptor                                         | A later interceptor can still change bytes                                   | Visible if still in the body             | From the response if present           | The interceptor must bind the pair into one attempt record | Last-interceptor evidence is required; an earlier hop is not the send boundary                      |
| Provider API envelope                        | The documented JSON or multipart body                                                   | HTTP framing unless captured with it; provider-side transforms               | Only the part included in the envelope   | Only if that API returns one           | Application-level, not cryptographic                       | Not proof of the model input                                                                        |
| Local forward proxy operated by the operator | Bytes the proxy forwards                                                                | Whatever the client sent on a path the proxy did not see                     | Visible when forwarded                   | Visible when present in the stream     | One proxied exchange can be one attempt                    | The proxy is another writer. Its log is `SUBMITTED` only if it is the path the client actually used |

**TLS interception is not the default and is not adopted.** Interception installs a private trust anchor, ends the provider certificate check at the interceptor, and gives the interceptor a chance to modify bytes after the client built them. A client hash of pre-intercept bytes would then disagree with what the provider could receive, or could be made to agree by rewriting both. This proposal uses the client's final send buffer, or a proxy the client is explicitly configured to use, as the submit boundary. It does not use a forged certificate.

If none of these sources can produce the final sent bytes, the attempt is `TRANSMISSION-NOT-EVIDENCED`. It does not count.

### 6.3 Evidence classes

| Class          | Minimum evidence held                                                                                                     | Does not prove                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `PREPARED`     | Local bytes assembled by the operator                                                                                     | That they were sent                                                  |
| `SUBMITTED`    | Exact serialized bytes captured at the send boundary, including attachment framing and attachment bytes, for this attempt | That the provider received or processed them                         |
| `ACKNOWLEDGED` | `SUBMITTED`, plus an interface acknowledgement that names a request id also present on this attempt                       | That a model processed those bytes                                   |
| `PROCESSED`    | `ACKNOWLEDGED`, plus interface evidence that the processing event consumed that request id and those bytes                | That hidden provider inputs are known, or that the review is correct |

`ACKNOWLEDGED` and `PROCESSED` are recorded only when the interface returns the required evidence. Otherwise the related id fields are `UNAVAILABLE`. This specification assigns no such feature to any API.

The recorded `evidence-class` is the strongest class whose evidence is actually held. `PROCESSED` requires `ACKNOWLEDGED`. `ACKNOWLEDGED` requires `SUBMITTED`. `SUBMITTED` requires `PREPARED`. A counting seal needs at least `SUBMITTED`. `ACKNOWLEDGED` is not required for `TRANSPORT-PAIR`.

### 6.4 Correlation classes

Each transmission attempt has one `attempt-id`, defined in §6.7. A retry is a new attempt. A request from one attempt is never paired with a response from another attempt, even when the bytes match and even when the timestamps are close.

| Class            | Minimum evidence                                                                                                                                                                              | Quorum                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `ID-LINK`        | This attempt's send-time request id appears in this attempt's response envelope or acknowledgement, the id matches the seal token grammar, and this attempt's submitted bytes are in the seal | Eligible to count if the other seal rules pass                            |
| `TRANSPORT-PAIR` | One attempt record, written by the capture point that saw both directions, contains `transmitted-request.bin` and `response.bin` as the request and the response of that single exchange      | Eligible to count. This is pairing, not cryptographic proof of processing |
| `TEMPORAL-ONLY`  | Timestamps alone, with request and response in separate records and no shared id                                                                                                              | Does not count                                                            |
| `NONE`           | No pairing                                                                                                                                                                                    | Does not count                                                            |

`TEMPORAL-ONLY` is recorded when it is all the operator has. It is not proof.

Concurrent requests use distinct attempt records. A record that cannot show it is one exchange is `NONE`.

| Situation                                                    | Rule                                                                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| One request, one complete response, one attempt record       | Eligible for `TRANSPORT-PAIR` or `ID-LINK` when the class evidence is present                                                      |
| Client retry, including a retry of identical bytes           | New `attempt-id`. The new attempt does not inherit the old response                                                                |
| Retry whose bytes differ                                     | Separate attempt. The earlier response does not count for the new bytes                                                            |
| Streaming response                                           | Counts only when `stream-status` is `COMPLETE`: the client accepted a finished stream and the seal holds the full reassembled body |
| Partial body, truncation, timeout, or interrupted connection | Non-counting. `stream-status` is `PARTIAL`, `INTERRUPTED`, or `TIMEOUT`, and `capture-status` is the matching failure token        |
| Two different response bodies for one attempt                | `AMBIGUOUS-RESPONSE`. Non-counting. The parser does not choose one                                                                 |
| Missing request id                                           | `ID-LINK` is unavailable. `TRANSPORT-PAIR` may still count                                                                         |
| Request id present but outside the seal token grammar        | Store `UNAVAILABLE`. Do not copy the raw id into the seal line. `ID-LINK` is unavailable                                           |

### 6.5 Instruction observability

**Operator-controlled content** is content the operator chose or set: prompt text; system, developer, or user instructions the operator supplied; request parameters; attachments; package member bytes; and client settings the operator set that change the request, including model, tools, and extra headers.

**Provider-internal content** is content the operator did not supply and the interface does not expose: hidden system prompts, provider policies, internal routing, hidden orchestration, and undisclosed provider-side transformations.

The operator is not required to capture provider-internal content. The seal does not claim those bytes were hashed. The field is always:

`provider-internal-instructions: OUTSIDE-OPERATOR-CAPTURE`

That value does not fail the seal and does not prove what the provider added.

Observability:

- `instructions-observable: FULL` means every operator-controlled byte that was part of the send is inside `transmitted-request.bin` or an indexed attachment with result `MATCH`, and the operator can account for each class in the definition above.
- `instructions-observable: PARTIAL` means some operator-controlled instruction, parameter, attachment, package byte, or operator-set client setting was applied and is absent from that capture, or the operator cannot account for what the client added.
- Provider-internal content does not make the value `PARTIAL`.
- If the accounting cannot be completed, the value is `PARTIAL`.

`PARTIAL`, missing `SUBMITTED` bytes, an attachment `MISMATCH`, `TEMPORAL-ONLY`, and `NONE` are non-counting. The attempt may be sealed as failure evidence. It does not count. Replacement requires a separate PO decision. Two counting seals are not a quorum. The existing three-completion rule remains. There is no N−1 and no automatic replacement. Incomplete quorum is `INCONCLUSIVE / NOT COMPLETED`.

### 6.6 Capture integrity

Proposal for the capture record. Nothing in this subsection is created by this task.

For each attempt, the capture point writes the sent bytes and the response bytes, computes SHA-256 immediately, and records `capture-utc` before later application code can edit those files. The attempt directory holds `transmitted-request.bin`, `response.bin`, the attachment bytes, and `seal-record.txt`. `transmitted-request.bin` is the retained request representation for the payload-identity check. The independent seal verifier must be able to read it. If it is absent or unreadable by that verifier, `package-payload-identity` is `UNVERIFIABLE`. Attachment bytes are hashed on their own and compared with the package member or the prepared attachment. `MATCH` in that attachment comparison means equal length and equal SHA-256. Any other attachment result is `MISMATCH`.

`seal-record.txt` does not contain its own digest. `seal-record-sha256` is SHA-256 of that file, stored in a one-line sibling `SEAL-DIGEST.txt` of the form `seal-record-sha256: ` plus 64 lowercase hex digits and one LF. The digest is not written back into the seal.

An optional `prev-seal-record-sha256` chain may link attempt digests in time order. The first record uses `NONE`. A hash chain detects a middle edit when the later links are preserved. It does not protect against an administrator who rewrites the whole chain and recomputes every digest. The chain is not described as that protection.

Append-only storage and write-once storage are deployment choices. This repository does not contain such a store, and this proposal does not invent one.

The pre-disclosure Package Anchor (§7.3) is written before any provider response exists. It binds package identity only. It does not contain `seal-record-sha256`, an attempt id, or any other seal field. A future seal hash cannot be inserted into that record.

A seal supports a review-level outcome only after a separate Post-capture Evidence Anchor (§7.4) for that same `attempt-id` is accepted. That later record stores the seal digest, the attempt id, and the package hashes already bound by the Package Anchor. Creating the Evidence Anchor is not performed here. Same-person rewrite of the seal directory and the Evidence Anchor store remains undetected, as in §7.4. Same-person rewrite of the package directory and the Package Anchor store remains undetected, as in §7.3.

### 6.7 Seal grammar

`seal-record.txt` uses the §5.3 line rules. Specification token `I.11-1`. Maximum file length 16,384 bytes, plus attachment lines within that cap. Attachment count is 0 through 32.

Id tokens, when not `UNAVAILABLE`, match `[A-Za-z0-9._:/-]{1,128}`. Values outside that alphabet are recorded as `UNAVAILABLE` and are not copied into the file.

Lines, in order:

1. `seal-spec-version: I.11-1`
2. `attempt-id: ATTEMPT-` plus 32 lowercase hex digits. This id is generated by the operator's capture point for this attempt. It is not a provider id.
3. `evidence-class: ` one of `PREPARED`, `SUBMITTED`, `ACKNOWLEDGED`, `PROCESSED`
4. `correlation-class: ` one of `ID-LINK`, `TRANSPORT-PAIR`, `TEMPORAL-ONLY`, `NONE`
5. `request-id: ` a token or `UNAVAILABLE`
6. `response-id: ` a token or `UNAVAILABLE`
7. `session-id: ` a token or `UNAVAILABLE`
8. `endpoint: ` a string of 12 through 256 characters that starts with `https://` and otherwise uses only `[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]`. The grammar accepts a shape. It is not an allow-list. The eight verified sources do not publish an endpoint allow-list. D3 still requires the approved first-party API for that provider. This report does not name a live URL and does not authorize a connection.
9. `provider: ` exactly `Anthropic`, `OpenAI`, or `Google`
10. `model: ` exactly the D3 model for that provider: `claude-opus-5-5`, `gpt-6.1-sol`, or `gemini-4-argon`
11. `api: ` exactly `first-party-claude`, `first-party-openai`, or `paid-gemini-developer`, matching the provider
12. `package-payload-sha256: ` 64 lowercase hex digits from the accepted Package Anchor
13. `manifest-payload-sha256: ` 64 lowercase hex digits from the accepted Package Anchor
14. `prepared-request-sha256: ` 64 lowercase hex digits
15. `prepared-request-byte-length: ` canonical decimal, 0 through 8,388,608
16. `transmitted-request-sha256: ` 64 lowercase hex digits, or exactly `TRANSMISSION-NOT-EVIDENCED`
17. `transmitted-request-byte-length: ` canonical decimal 0 through 8,388,608, or exactly `TRANSMISSION-NOT-EVIDENCED`. The two transmitted fields must both be evidenced or both be `TRANSMISSION-NOT-EVIDENCED`
18. `response-sha256: ` 64 lowercase hex digits, or exactly `RESPONSE-NOT-EVIDENCED`
19. `response-byte-length: ` canonical decimal, or exactly `RESPONSE-NOT-EVIDENCED`, in agreement with the previous field
20. `instructions-observable: ` `FULL` or `PARTIAL`
21. `provider-internal-instructions: OUTSIDE-OPERATOR-CAPTURE`
22. `stream-status: ` exactly one of `COMPLETE`, `PARTIAL`, `INTERRUPTED`, `TIMEOUT`, `NOT-APPLICABLE`
23. `retry-of: ` `NONE` or another `attempt-id`. Informational. It does not move a response onto the parent attempt
24. `submit-utc: ` §5.4 timestamp
25. `capture-utc: ` §5.4 timestamp
26. `seal-utc: ` §5.4 timestamp
27. `clock-source: ` the §5.4 closed token
28. `operator-id: ` 1 through 64 characters matching `[A-Za-z0-9._@-]+`
29. `capture-status: ` exactly one of `COMPLETE`, `REFUSAL`, `TIMEOUT`, `TRUNCATED`, `MALFORMED`, `TRANSMISSION-NOT-EVIDENCED`, `ISOLATION-NOT-EVIDENCED`, `AMBIGUOUS-RESPONSE`, `ATTACHMENT-MISMATCH`, `PARTIAL-INSTRUCTIONS`
30. `attachment-count: ` canonical decimal 0 through 32
31. If the count is 0, no attachment lines. If the count is N, exactly N lines, order `1..N`:

```
attachment:<order><TAB><path><TAB><byte-length><TAB><64-lowercase-hex><TAB><MATCH or MISMATCH>
```

`path` uses §4.2. For a counting seal, `submit-utc`, `capture-utc`, and `seal-utc` are in non-decreasing order.

A seal counts toward quorum only when all of the following hold:

- `evidence-class` is `SUBMITTED`, `ACKNOWLEDGED`, or `PROCESSED`
- `correlation-class` is `ID-LINK` or `TRANSPORT-PAIR`
- `request-id` is a token when the class is `ID-LINK`, and may be `UNAVAILABLE` when the class is `TRANSPORT-PAIR`
- `instructions-observable` is `FULL`
- `stream-status` is `COMPLETE`
- `capture-status` is `COMPLETE`
- every attachment line is `MATCH`
- transmitted request and response are evidenced, not the `NOT-EVIDENCED` tokens
- the accepted Evidence Anchor for this attempt has `package-payload-identity: MATCH`, and the seal verifier recomputed that result from the retained `transmitted-request.bin` byte range, not from the request hash alone
- `MISMATCH` and `UNVERIFIABLE` do not count, including when the differing payload bytes were fully captured
- the Stage I.9 mandatory assessment content is present in the sealed assessment
- provider, model, and API are the approved D3 triple, with no substitution
- the package hashes equal the accepted Package Anchor (§7.3)
- an accepted Post-capture Evidence Anchor (§7.4) exists for this `attempt-id`, its package hashes and package version equal that Package Anchor, and its `seal-record-sha256` equals `SEAL-DIGEST.txt`

`UNAVAILABLE` on request id is not allowed for `ID-LINK`. Provider outcome tokens, if present in the response, are retained and are not the review-level outcome. No provider issues `INCONCLUSIVE / NOT COMPLETED`, `BLOCKED — UNRESOLVED CRITICAL/HIGH`, or `PASS WITH OBSERVATIONS`.

Google remains ineligible to receive package bytes while privacy is deferred and package-receipt eligibility is unresolved. A seal grammar that can name Google does not authorize a Google submission.

---

## 7. Clarification D — Package Anchor and Post-capture Evidence Anchor

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

This section replaces the Stage I.10 anchor recommendation and corrects the Stage I.11 single-anchor wording. The Package Anchor and the Post-capture Evidence Anchor are two records, created at two times. This section does not create either record, appoint a person, or accept a hash.

### 7.1 Roles and permitted combinations

| Role                         | Function                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package preparer             | Assembles the staging root, payload, manifest, and freeze record                                                                                                 |
| Package verifier             | Recomputes hashes from the staged regular files and the manifest, using §5.6, and is a different person from the preparer                                        |
| Product Owner                | Accepts or rejects the verified hashes. This report does not act as the Product Owner                                                                            |
| Package Anchor custodian     | Writes the Package Anchor in the PO-controlled store. Cannot be the preparer                                                                                     |
| Provider submission operator | May transmit only after a later Decision 7, an accepted Package Anchor match, and every eligibility gate. This role is not authorized to transmit by this report |

Permitted and prohibited combinations:

| Combination                                                           | Result                                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Product Owner and Package Anchor custodian                            | Permitted. The PO may hold the Package Anchor store                                                                                          |
| Verifier and Package Anchor custodian, verifier is not the preparer   | Permitted                                                                                                                                    |
| Verifier and preparer are the same person                             | The recomputation is a self-check only. It does not satisfy independence. Package Anchor acceptance stays unavailable                        |
| Preparer and Package Anchor custodian                                 | Prohibited. A Package Anchor this pair writes is not acceptance                                                                              |
| Preparer and Product Owner are the same person for the acceptance act | Prohibited for acceptance. If no other arrangement exists, separation is not established and no Package Anchor is valid                      |
| Submission operator and preparer                                      | The send is still prohibited until a valid Package Anchor matches the bytes immediately before send. This report does not authorize the send |

**Verified gap.** The Decision Register D3 authority field says Product Owner (sole Project Owner). No `CODEOWNERS` file exists at `CODEOWNERS` or `.github/CODEOWNERS`. A GitHub API read of branch protection for `AleksandrWeber/TRP` branch `main` returned Forbidden, so required reviews and push restrictions were not verified. The register is a Markdown file in this repository. The working tree can modify it; it is already modified and uncommitted relative to HEAD. Git history was not shown to be immutable.

**Unresolved operational prerequisite:** this repository does not establish a person, distinct from the package preparer, who alone can write a Package Anchor the preparer cannot edit. Separation of duties is specified and is not in place. This report does not pretend that it exists, and it does not treat the sole Project Owner as a second custodian. Until that prerequisite is met by a later PO arrangement, no Package Anchor acceptance is valid, and provider disclosure stays unavailable. The same gap applies to the Evidence Anchor in §7.4.

### 7.2 Decision Register suitability

The Decision Register is the place where PO decisions are written when the PO records them. It is not a suitable package-hash anchor, for these verified reasons:

- It is an ordinary file in the same repository the operator can edit.
- Its working-tree bytes already differ from HEAD, which shows that local edits exist before any commit.
- No access-control file in the repository limits who may change it.
- Branch protection could not be verified.
- A git commit records history. It does not, by itself, stop a later edit to the same file, and protection against history rewrite was not verified.

**Recommendation:** the Package Anchor is a PO-controlled record stored outside the package directory and outside sole preparer write access. The package directory is the directory that contains the staging root, `PACKAGE-MANIFEST.txt`, and `FREEZE-RECORD.txt`. The Package Anchor is not stored there and is not a second copy of the files. The Evidence Anchor is a second record in a store outside the seal directory and outside sole capture-operator write access. The Decision Register is neither store.

A new signature system is not proposed. A signature scheme would need a named signer, key custody, a published verification key, a signature format, revocation and rotation rules, and a timestamp log. Those prerequisites are not in the repository. They remain open and are not required for this clarification.

No concrete external store is named here, because none was verified. Naming a product would invent infrastructure. The schemas below are the requirement. Deploying either store is a later PO act, and it is not Decision 4.

### 7.3 Pre-disclosure Package Anchor schema

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

The Package Anchor file uses §5.3 line rules. Maximum length 2,048 bytes. Its specification token is `I.12-1`. Its purpose is acceptance of one frozen package before disclosure. It is created only after §5.6 succeeds and before any provider receives package bytes.

The record binds package identity and acceptance only. It has no attempt id, no seal hash, no request hash, and no response hash. Keys from §6.7 and §7.4 are unknown keys on this record and are rejected.

Lines, in order:

1. `anchor-spec-version: I.12-1`
2. `anchor-record-type: PACKAGE-ANCHOR`
3. `manifest-spec-version: I.11-1`
4. `path-grammar: I.11-ASCII-1`
5. `package-version: ` the manifest token
6. `member-count: ` the same canonical decimal, 1 through 32
7. `freeze-utc: ` the same timestamp as the freeze record
8. `package-payload-sha256: ` 64 lowercase hex digits
9. `manifest-payload-sha256: ` 64 lowercase hex digits
10. `review-scope-path: ` a §4.2 path that is a member of the package. For the current candidate the required path is `scope/review-scope.txt`
11. `review-scope-sha256: ` 64 lowercase hex digits, equal to that member's content hash
12. `anchor-utc: ` a §5.4 timestamp, greater than or equal to `freeze-utc` when both are compared as UTC timestamps
13. `po-decision-ref: ` `PO-ANCHOR-` plus `YYYYMMDD` plus `-` plus 8 lowercase hex digits. Assigned only when the PO writes the Package Anchor. This report does not assign one
14. `preparer-id: ` 1 through 64 characters matching `[A-Za-z0-9._@-]+`
15. `verifier-id: ` the same token grammar, and not equal to `preparer-id`
16. `custodian-id: ` the same token grammar, and not equal to `preparer-id`. It may equal the Product Owner's id
17. `verification-outcome: ACCEPTED`
18. `package-directory-ref: ` 1 through 64 characters matching `[A-Za-z0-9._-]+`. A label only. Slashes, backslashes, and path separators are rejected so the field cannot point at a second copy

Any value other than `ACCEPTED` is not an acceptance record. A rejection note may use a separate file with `verification-outcome: REJECTED` and the same identity fields; a `REJECTED` file authorizes nothing and is not a Package Anchor.

Unknown fields, duplicate fields, missing fields, wrong order, empty values, and id collisions between preparer and verifier or preparer and custodian reject the file. Two `ACCEPTED` records for the same `package-payload-sha256`, `manifest-payload-sha256`, and `package-version` must be byte-identical or both are rejected as a conflict. A different hash is a different package and needs its own Package Anchor. The preparer must be unable to edit the Package Anchor store. If that separation is not established, no valid Package Anchor exists and no disclosure is permitted.

### 7.4 Post-capture Evidence Anchor

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Record type: `POST-CAPTURE-EVIDENCE-ANCHOR`. One record per attempt. A second attempt, including a retry, gets its own record and its own `evidence-anchor-id`. Records are not merged across providers and are not updated in place.

This record is created only after that attempt has been fully captured, validated, and sealed under §6. It binds that attempt to the Package Anchor already accepted in §7.3. It does not authorize commencement, disclosure, CC-02, or CC-06. It stores identifiers, hashes, lengths, and controlled metadata only. It does not contain raw request bodies, raw response bodies, provider secrets, credentials, or package content. A field that would hold those bytes is an unknown field and is rejected.

The file uses §5.3 line rules. Maximum length 16,384 bytes. Specification token `I.13-1`. The Stage I.13 correction adds the payload-identity fields. No Evidence Anchor is created by this correction.

Lines, in order:

1. `evidence-anchor-spec-version: I.13-1`
2. `evidence-anchor-record-type: POST-CAPTURE-EVIDENCE-ANCHOR`
3. `evidence-anchor-id: EA-` plus 32 lowercase hex digits. Assigned only when the record is written. This report does not assign one
4. `package-anchor-ref: ` the `po-decision-ref` token of one `ACCEPTED` Package Anchor
5. `package-payload-sha256: ` 64 lowercase hex digits, equal to that Package Anchor
6. `manifest-payload-sha256: ` 64 lowercase hex digits, equal to that Package Anchor
7. `package-version: ` the same package-version token as that Package Anchor
8. `provider: ` exactly `Anthropic`, `OpenAI`, or `Google`
9. `model: ` the D3 model for that provider, exactly `claude-opus-5-5`, `gpt-6.1-sol`, or `gemini-4-argon`
10. `api: ` exactly `first-party-claude`, `first-party-openai`, or `paid-gemini-developer`, matching the provider
11. `attempt-id: ` `ATTEMPT-` plus 32 lowercase hex digits, equal to the seal
12. `evidence-class: ` one of `PREPARED`, `SUBMITTED`, `ACKNOWLEDGED`, `PROCESSED`
13. `correlation-class: ` one of `ID-LINK`, `TRANSPORT-PAIR`, `TEMPORAL-ONLY`, `NONE`
14. `capture-status: ` one of the §6.7 capture-status tokens
15. `stream-status: ` one of the §6.7 stream-status tokens
16. `instructions-observable: ` `FULL` or `PARTIAL`
17. `transmitted-request-sha256: ` 64 lowercase hex digits, or exactly `TRANSMISSION-NOT-EVIDENCED`
18. `transmitted-request-byte-length: ` a canonical decimal from 0 through 8,388,608, or exactly `TRANSMISSION-NOT-EVIDENCED`, in agreement with the previous field
19. `package-payload-identity: ` exactly `MATCH`, `MISMATCH`, or `UNVERIFIABLE`
20. `payload-link-method: ` exactly `BYTE-RANGE-IN-TRANSMITTED-REQUEST` or `NOT-ESTABLISHED`
21. `payload-byte-offset: ` a canonical decimal, or exactly `UNVERIFIABLE`
22. `payload-byte-length: ` a canonical decimal from 1 through 8,388,608, or exactly `UNVERIFIABLE`
23. `response-sha256: ` 64 lowercase hex digits, or exactly `RESPONSE-NOT-EVIDENCED`
24. `response-byte-length: ` a canonical decimal from 0 through 8,388,608, or exactly `RESPONSE-NOT-EVIDENCED`, in agreement with the previous field
25. `seal-record-sha256: ` 64 lowercase hex digits, equal to `SEAL-DIGEST.txt` for this attempt
26. `seal-record-byte-length: ` a canonical decimal from 1 through 16,384, equal to the length of `seal-record.txt`
27. `attachment-count: ` a canonical decimal from 0 through 32
28. If the count is N and N is greater than 0, exactly N attachment lines, order `1..N`. If the count is 0, there are no attachment lines. The next field then follows.

```
attachment:<order><TAB><path><TAB><byte-length><TAB><64-lowercase-hex>
```

`path` uses §4.2. `byte-length` is a canonical decimal from 0 through 1,048,576. The hex is the attachment content hash. These lines are digest references. They must equal the seal's attachment path, length, and hash. The seal's attachment result `MATCH` or `MISMATCH` is not copied. An acceptance requires every seal attachment result to be `MATCH`. That attachment result is a different field from `package-payload-identity`.

29. `capture-utc: ` a §5.4 timestamp
30. `seal-utc: ` a §5.4 timestamp, greater than or equal to `capture-utc`
31. `evidence-anchor-utc: ` a §5.4 timestamp, greater than or equal to `seal-utc`
32. `capture-operator-id: ` 1 through 64 characters matching `[A-Za-z0-9._@-]+`
33. `recorder-id: ` the same token grammar, and not equal to `capture-operator-id`
34. `verifier-id: ` the same token grammar, and not equal to `capture-operator-id`
35. `custodian-id: ` the same token grammar, and not equal to `capture-operator-id`. It may equal `recorder-id`. It may equal `verifier-id` when that person is not the capture operator
36. `verification-outcome: ` exactly one of `ACCEPTED`, `RECORDED-NON-COUNTING`, `REJECTED`

`MATCH` is valid only after the seal verifier, who is not the capture operator, reads the retained `transmitted-request.bin` for this attempt. The verifier checks that the file length equals `transmitted-request-byte-length` and that SHA-256 of the entire file equals `transmitted-request-sha256`. The verifier then hashes the half-open range `[payload-byte-offset, payload-byte-offset + payload-byte-length)`. That addition must not overflow, and the range must lie inside the file. The range digest must equal the accepted Package Anchor's `package-payload-sha256`. `payload-link-method` must be `BYTE-RANGE-IN-TRANSMITTED-REQUEST`, and both offset and length must be canonical decimals. The capture operator's assertion of `MATCH` is not this check. A recorded request hash, offset, and length are not a substitute for the file. If the file is absent, unreadable by the verifier, or the whole-file length or hash disagrees, the identity is `UNVERIFIABLE`. A normalized, truncated, reordered, or substituted range is not `MATCH`.

`MISMATCH` requires the same kind of identified range, with a SHA-256 that differs from `package-payload-sha256`. `UNVERIFIABLE` requires `payload-link-method: NOT-ESTABLISHED` and `UNVERIFIABLE` on both offset and length. Any other combination is a grammar failure. These fields do not contain payload bytes, request bodies, response bodies, secrets, or credentials.

`ACCEPTED` is the only outcome that can count toward quorum. It requires `package-payload-identity: MATCH`, the §6.7 counting rules, equality with the named Package Anchor, and the separation rules below. `MISMATCH` and `UNVERIFIABLE` are not `ACCEPTED`. They may be `RECORDED-NON-COUNTING`. `REJECTED` authorizes nothing. Unknown outcomes are rejected. An Evidence Anchor does not prove provider-side receipt or model processing.

A Google `provider` value is grammatically legal because D3 names Google. While Google privacy is deferred and package-receipt eligibility is unresolved, submission to Google is forbidden, and `verification-outcome` for a Google attempt cannot be `ACCEPTED`.

Unknown fields, duplicate fields, missing fields, wrong order, empty values, uppercase hex, leading zeros, and a package reference that does not match an `ACCEPTED` Package Anchor reject the file. Two `ACCEPTED` records for the same `attempt-id` must be byte-identical. If they differ, both are in conflict, neither counts, and the conflict is investigated. The same rule applies to two `ACCEPTED` records with the same `evidence-anchor-id`.

**Evidence roles.** `PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

| Role                                 | Function                                                                                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capture operator                     | Runs the send and writes the local capture and seal. May also be the package preparer                                                                                                                                        |
| Seal verifier                        | Reads the retained `transmitted-request.bin`, recomputes its whole-file hash and the payload byte-range hash, and checks the seal digest, correlation, attachments, and Package Anchor identity. Is not the capture operator |
| Product Owner                        | Accepts or rejects the Evidence Anchor. This report does not act as the Product Owner                                                                                                                                        |
| Evidence Anchor recorder / custodian | Writes the record in the evidence store. Is not the capture operator                                                                                                                                                         |

| Combination                                                                             | Result                                                                                     |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Product Owner and Evidence Anchor custodian                                             | Permitted                                                                                  |
| Seal verifier and custodian, verifier is not the capture operator                       | Permitted                                                                                  |
| Recorder and custodian are the same person, and that person is not the capture operator | Permitted                                                                                  |
| Capture operator and seal verifier                                                      | Prohibited. The check is a self-check and is not independent anchoring                     |
| Capture operator and Evidence Anchor custodian or recorder                              | Prohibited. The resulting record is not acceptance                                         |
| Separation unavailable                                                                  | The local seal may remain. It is not independently anchored and cannot count toward quorum |

The evidence store is outside the seal directory and outside sole capture-operator control. This repository does not establish that custodian. The sole Project Owner is not assumed to be a second person. This is the same unresolved operational prerequisite as §7.1. The rule is not weakened to make anchoring look executable.

### 7.5 Current-candidate eligibility

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

This rule is not a freeze. It states when a Package Anchor for the current candidate would be allowed to exist. None of these steps is performed now.

A Package Anchor for the current candidate is eligible only when the package contains at least these regular-file members:

| Logical path                                                 | Eligibility condition                                                                                                                                                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sql/option-c-vault-id-census-draft.sql`                     | Length 22,116 and SHA-256 `fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c`, unless a later PO decision binds a different snapshot                                                                        |
| `canvas/option-c-vault-id-census-plan.canvas.tsx`            | SHA-256 `c70f45dcfbc74f55765bd682caa6ebff551673cf06120e76d9222251a0680c2e` at the time of this report, unless a later hash-matched snapshot replaces it by a new PO-bound identity                                         |
| `binding/option-c-vault-id-census-draft.binding-manifest.md` | SHA-256 `de2913f522ea55deefd7d4c93140f405974696363315793e32202bcde05dec38` at the time of this report, with the prior non-reliance note that historical "PERFORMED — PASS WITH OBSERVATIONS" labels are not CC-02 evidence |
| `scope/review-scope.txt`                                     | Does not exist. Until it exists, is hashed, and is a member, no Package Anchor is eligible                                                                                                                                 |

The stale canvas citation and the Design Content Baseline remain outside the package. Runbook, Evidence Protocol, Authorization Package, Decision Register, and Stage H remain outside the package, as previously proposed, because they carry operative and historical governance material.

### 7.6 Verification, invalidation, and sequence

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

**Package Anchor sequence.** The package verifier, who is not the preparer, recomputes the payload hash, the manifest hash, and the review-scope hash with §5.6. The Package Anchor custodian records `ACCEPTED` only when those values equal the freeze record and §7.5 is met. The evidence of package acceptance is the Package Anchor file. If the preparer can edit that file, the acceptance is void.

1. Prepare the staging directory.
2. Run §5.6. On failure, stop. No hash is offered for disclosure.
3. Write the detached freeze record.
4. The verifier independently recomputes the hashes.
5. The PO records acceptance in the Package Anchor. That act is not Decision 4 and it is not Decision 7. This report does not perform it.
6. Re-read the local files and require them to still match the Package Anchor.
7. Only then may a separate Decision 7 be considered. D7 is the sole commencement authorization. The Package Anchor is a prerequisite to that consideration. It is not a substitute for D7.
8. Provider disclosure occurs only after Decision 7 and after every other applicable gate, including the unresolved Google eligibility rule. A Package Anchor is not permission to disclose.

**Evidence Anchor sequence.** This sequence starts only after steps 1 through 8. Each attempt is independent.

1. Verify that the Package Anchor is still `ACCEPTED` and that the current package bytes still match it. On mismatch, stop. Do not submit.
2. Only after that check, and only after separate D7 authorization and all eligibility gates, submit one provider attempt.
3. Capture the actual request and the complete response under §6.
4. Create `seal-record.txt` and the detached `SEAL-DIGEST.txt`.
5. The seal verifier, who is not the capture operator, reads the retained `transmitted-request.bin` and recomputes the payload-range hash required for `MATCH`. A request hash without those bytes is not that check. The verifier also checks the seal, the request/response correlation, the attachments, and equality with the Package Anchor.
6. Create one Post-capture Evidence Anchor for that attempt.
7. Independently verify that record and, when the counting rules pass, accept it. This report does not perform that act.
8. Only an `ACCEPTED` Evidence Anchor may place that seal in the discrepancy matrix.
9. Repeat steps 1 through 8 independently for each provider attempt.
10. Cross-provider comparison does not begin until all three required assessments are complete and each has its own `ACCEPTED` Evidence Anchor.

Evidence anchoring is post-capture integrity. It does not authorize commencement. It does not satisfy CC-02 or CC-06. It does not close OQ-CENSUS-01. There is no N−1 and no automatic replacement. A failed attempt, an unanchored seal, or a `RECORDED-NON-COUNTING` record does not count. The review-level state remains `INCONCLUSIVE / NOT COMPLETED` until three counting Evidence Anchors exist. A replacement attempt requires a separate PO decision. It is not implied here.

Decision 4 approves protocol text only. It does not freeze a package, write either anchor, appoint a custodian, accept hashes, authorize provider contact, disclose material, or commence a review. D7 would still not authorize SQL EXEC or Census EXEC.

**Invalidation.**

- A change to a package member, the manifest, the freeze record, the scope bytes, or the package version invalidates the prior Package Anchor for the changed package. The old record is not edited to match the new bytes. Disclosure of the new bytes requires a new Package Anchor.
- A change to a seal, transmitted request, response, attachment, or attempt identity invalidates the Evidence Anchor that bound the previous bytes. The correction is a new record. Accepted records are not overwritten.
- An Evidence Anchor cannot refer to a superseded or otherwise invalid Package Anchor. `package-anchor-ref`, both package hashes, and `package-version` must still identify an `ACCEPTED` Package Anchor at acceptance time.
- Conflicting accepted records for the same attempt, as defined in §7.4, reject both for quorum use.
- A package change after a provider submission does not relabel that attempt onto the new package. The old response does not count against the new package bytes. There is no recovery path that pairs an old provider response with new package bytes.
- A disclosed payload whose hash differs from the accepted Package Anchor does not corrupt that anchor. The anchor still identifies the original payload. The mismatched attempt does not count and cannot be rebound to the original anchor or to a later package. A later package needs its own accepted Package Anchor and its own disclosure authorization.

Mismatch handling: stop. Offer nothing further to a provider. Do not repair a Package Anchor by editing it to follow changed files, and do not repair an Evidence Anchor by editing it to follow a changed seal.

### 7.7 Threat model

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

| Threat                                                      | Local files                 | Package Anchor                                             | Evidence Anchor                                                                   |
| ----------------------------------------------------------- | --------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Accidental corruption of one package object                 | Detected                    | Detected on compare                                        | Not its job                                                                       |
| Joint rewrite of package, manifest, and freeze record       | Not detected                | Detected when the preparer cannot write the Package Anchor | Does not repair a bad package binding                                             |
| Seal rewritten after capture, Evidence Anchor left in place | Seal digest mismatch        | Unchanged                                                  | Detected on compare                                                               |
| Seal, digest, and Evidence Anchor rewritten together        | Not detected                | Unchanged                                                  | Not detected when the rewriter can write the evidence store                       |
| Capture operator is the Evidence Anchor custodian           | Seal may exist              | Unchanged                                                  | Not independent. The seal cannot count                                            |
| Package Anchor superseded after an attempt                  | Old bytes no longer current | Old acceptance does not cover the new package              | The attempt stays bound to the old package and does not count against the new one |
| Sole Project Owner is the only person available             | Not detected                | Not established. Current prerequisite                      | Not established. Current prerequisite                                             |
| Compromise of the workstation and of both stores            | Not detected                | Not detected                                               | Not detected                                                                      |

### 7.8 Two-anchor cases

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

Paper analysis only. No package was built, no provider was contacted, and no anchor was written.

| Case                                                             | Counts                                                                                                                                                                                                                                                                               | Anchor                                                                                                                             | Matrix                                                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Package Anchor accepted, then a member changes before submission | No submission, so no attempt counts                                                                                                                                                                                                                                                  | The prior Package Anchor does not cover the changed package                                                                        | Does not begin                                                                                                                    |
| Transport envelope differs from the prepared request             | May count only when the embedded package payload is identified, `package-payload-identity` is `MATCH` against the accepted Package Anchor, and every other counting rule passes. `MISMATCH` and `UNVERIFIABLE` do not count. Capturing a different payload does not make it eligible | The Package Anchor stays valid for the original payload. It is not corrupted, and it does not bind the different payload           | Eligible for this attempt only on `MATCH`, and only as one of three `ACCEPTED` Evidence Anchors. A payload mismatch is excluded   |
| Response truncated                                               | Does not count                                                                                                                                                                                                                                                                       | Package Anchor stays valid. The Evidence Anchor, if written, is `RECORDED-NON-COUNTING` or is absent                               | Does not begin                                                                                                                    |
| Two responses for one attempt                                    | Does not count. The parser does not choose a body                                                                                                                                                                                                                                    | An `ACCEPTED` Evidence Anchor for that attempt is forbidden                                                                        | Does not begin                                                                                                                    |
| Seal exists and no Evidence Anchor is accepted                   | Does not count                                                                                                                                                                                                                                                                       | Package Anchor stays valid. The seal is not independently anchored                                                                 | Does not begin                                                                                                                    |
| Evidence Anchor bytes change after acceptance                    | The altered bytes are not the accepted record                                                                                                                                                                                                                                        | Silent overwrite is void. The attempt does not count until a new record is independently accepted. Conflicting copies do not count | Does not use the altered record                                                                                                   |
| Package Anchor superseded after a provider attempt               | The old response does not count against the new package                                                                                                                                                                                                                              | The Evidence Anchor keeps the old package identity and is not relabelled                                                           | Does not begin for the new package with that attempt                                                                              |
| Capture operator is also the Evidence Anchor custodian           | Does not count                                                                                                                                                                                                                                                                       | The Evidence Anchor is not independent                                                                                             | Does not begin                                                                                                                    |
| Three complete seals, two Evidence Anchors accepted              | Two seals count. That is not a quorum. No N−1 and no automatic replacement                                                                                                                                                                                                           | The third seal is unanchored for quorum purposes                                                                                   | Does not begin. State remains `INCONCLUSIVE / NOT COMPLETED`                                                                      |
| Three Evidence Anchors, one names the wrong package version      | The mismatched record does not count. Two records are not a quorum                                                                                                                                                                                                                   | The wrong reference is invalid                                                                                                     | Does not begin                                                                                                                    |
| Retry after timeout                                              | The timeout attempt does not count. The retry is a new `attempt-id` and needs its own seal and Evidence Anchor. The two are not combined                                                                                                                                             | Each record stands on its own attempt                                                                                              | Does not begin until three counting Evidence Anchors exist                                                                        |
| Google privacy remains deferred                                  | A Google attempt does not count and Google receives no package bytes                                                                                                                                                                                                                 | A Google Evidence Anchor cannot be `ACCEPTED`                                                                                      | Does not include Google. The roster still needs three counting assessments, and this report does not create a two-provider quorum |

---

## 8. Integrated consistency matrix

| Rule                                                              | After I.11                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1–D3 and the D3 roster                                           | Unchanged. No substitution                                                                                                                                                                     |
| Google privacy deferred; Google not eligible to receive a package | Unchanged. Seal grammar does not create eligibility                                                                                                                                            |
| D4 scope                                                          | Protocol text only, if later approved. Excludes Stage H §4.1. Does not freeze, anchor, disclose, or commence                                                                                   |
| Payload encoding                                                  | Length-prefixed binary, magic `OCPKG1`, non-circular. Manifest and freeze record are outside the payload                                                                                       |
| Path validation                                                   | `I.11-ASCII-1`. Host locale and filesystem canonicalization are not inputs                                                                                                                     |
| Hashed objects                                                    | Regular-file content bytes only. Links, devices, streams, xattrs, ACLs, resource forks, mode, owner, and timestamps are outside the hash                                                       |
| Manifest and freeze grammar                                       | Closed fields, closed tokens, canonical decimals, operational caps. Empty package rejected                                                                                                     |
| Numeric limits                                                    | Operational caps in §5.1. Not integer-type maxima                                                                                                                                              |
| Operator-controlled request bytes                                 | Required for `SUBMITTED` and for `FULL`                                                                                                                                                        |
| Package payload versus transport envelope                         | The Package Anchor binds the canonical payload hash. A transport difference counts only with `package-payload-identity: MATCH`. `MISMATCH` and `UNVERIFIABLE` do not count and are not rebound |
| Provider-internal instructions                                    | Not required. `OUTSIDE-OPERATOR-CAPTURE` does not fail the seal                                                                                                                                |
| Response pairing                                                  | `ID-LINK` or `TRANSPORT-PAIR` inside one attempt. Retries are not combined. Partial and truncated responses do not count                                                                       |
| Local request hash                                                | `PREPARED` only. Not transmission proof                                                                                                                                                        |
| Capture                                                           | Not proof of model processing. Not tested                                                                                                                                                      |
| Package Anchor independence                                       | Requires preparer ≠ Package Anchor custodian and preparer ≠ package verifier. Not established in this repository                                                                               |
| Evidence Anchor independence                                      | Requires capture operator ≠ seal verifier and capture operator ≠ Evidence Anchor custodian. Not established in this repository                                                                 |
| Anchor locations                                                  | Package Anchor is outside the package directory. Evidence Anchor is outside the seal directory. Neither is in sole operator control                                                            |
| Package change                                                    | Invalidates the prior Package Anchor for the new bytes. Old responses are not relabelled onto the new package                                                                                  |
| Seal or attempt change                                            | Invalidates that attempt's Evidence Anchor. Accepted records are not overwritten                                                                                                               |
| Package Anchor versus D4 and D7                                   | Pre-disclosure record. A later PO act and a prerequisite to considering D7. Neither D4 nor D7. Not a seal record                                                                               |
| Evidence Anchor versus commencement                               | Post-capture record. It does not authorize D7, disclosure, CC-02, or CC-06                                                                                                                     |
| Provider review-level outcome                                     | Providers do not issue the three review-level tokens                                                                                                                                           |
| No N−1 and no automatic replacement                               | Unchanged. Non-counting attempts stay `INCONCLUSIVE / NOT COMPLETED`                                                                                                                           |
| Operative CC-02, CC-06, OQ-CENSUS-01, SQL EXEC, Census EXEC       | Unchanged                                                                                                                                                                                      |
| D5 and D6                                                         | Not started                                                                                                                                                                                    |
| Signature infrastructure                                          | Not proposed and not assumed                                                                                                                                                                   |

No contradiction with the preserved Stage I.9 severity split or the Stage I.10 three-object hash split was introduced. Stage I.10 Unicode path permission is narrowed, in §4.1, to ASCII. The Stage I.12 correction separates the pre-disclosure Package Anchor from the post-capture Evidence Anchor. That separation is explicit.

---

## 9. Threat model and residual assurance limitations

The threat model is §7.7 plus the capture limits in §6. Local hashes are a consistency check. The Package Anchor is the specified control for joint replacement of the package directory before disclosure. The Evidence Anchor is the specified control for joint replacement of one attempt's seal after capture. Neither anchor was deployed. Neither control was executed.

Residual limitations:

- Unicode 15.1.0 is intentionally unused. A non-ASCII member name cannot be represented under `I.11-ASCII-1`.
- Platform checks that the host cannot perform (`ADS-CHECK-UNAVAILABLE`, `XATTR-CHECK-UNAVAILABLE`, `MOUNT-CHECK-UNAVAILABLE`, `LINK-COUNT-NOT-EVIDENCED`, `FILE-IDENTITY-NOT-EVIDENCED`, `PATH-CONTAINMENT-NOT-EVIDENCED`) block the offer of a hash. They do not become a pass.
- Advisory locks do not stop a same-credential writer.
- `TRANSPORT-PAIR` binds a response to submitted bytes on one captured exchange. It does not prove the model processed those bytes. A transmitted-request hash is not, by itself, a package-payload match. Only an identified byte range whose SHA-256 equals the accepted Package Anchor can be `MATCH`. If that range cannot be identified, the attempt is `UNVERIFIABLE` and does not count. The Evidence Anchor does not prove provider-side processing.
- `ID-LINK` is only as strong as the interface that returned the id. No API is asserted to return one.
- Hidden provider instructions stay outside operator capture.
- The clock-source token does not prove the clock.
- If the Package Anchor store is controlled by the preparer, joint replacement of the package is still possible. If the Evidence Anchor store is controlled by the capture operator, joint replacement of the seal is still possible. The register's sole-Project-Owner wording and the absence of a verified second custodian leave both prerequisites open. Neither anchor is deployed.
- While Google privacy is deferred, Google cannot receive package bytes, a Google Evidence Anchor cannot be `ACCEPTED`, and this specification does not reduce the quorum to two.
- Baseline bytes `7714f95b8202771dfa1835d279983fafef9505af5a678f12344bdc79f1ca0ac7` remain unverified and outside the package.
- `scope/review-scope.txt` does not exist, so no current-candidate Package Anchor can be eligible.
- No seal, package, manifest, freeze record, capture record, Package Anchor, or Evidence Anchor was created. No test in the matrices was run. The §7.8 cases are paper analysis.

---

## 10. Remaining PO decisions and dependencies

These remain open. This report does not ask the PO to re-decide the technical choices already fixed in §§4–7 (ASCII grammar, numeric caps, empty-package rejection, single-attempt pairing, and the two anchor field lists). Those are part of the proposal text.

1. Adopt, edit, or reject the I.11 text, including the I.12 two-anchor correction and the I.13 package-payload identity correction, together with the unaffected I.8, I.9, and I.10 text. **OPEN.** That choice is Decision 4. It is not made here.
2. Establish a Package Anchor custodian who is not the package preparer, and a package verifier who is not the preparer. **OPEN.** Not established by the current sole-Project-Owner record.
3. Establish an Evidence Anchor custodian who is not the capture operator, and a seal verifier who is not the capture operator. **OPEN.** The same sole-Project-Owner record does not establish this second separation.
4. Deploy the Package Anchor store and the Evidence Anchor store outside sole operator control. **OPEN.** Decision 4 does not do this.
5. Record a Package Anchor for a specific package after those package roles exist. **OPEN.** The scope file does not exist. This act does not record seal hashes.
6. Decide Google privacy and package-receipt eligibility. **OPEN.** Unchanged.
7. Designate the human adjudicator under D5. **OPEN.**
8. Synchronize documents and re-adopt criteria under D6. **OPEN.**
9. Authorize commencement under D7, only after the Package Anchor matches the local files and every other gate is met. **OPEN.** D7 would still not authorize SQL EXEC or Census EXEC. Evidence Anchors are created only after that commencement and after capture.

---

## 11. Final readiness verdict

**`READY FOR D4 PRODUCT OWNER REVIEW`**

The four specification gaps now have one implementable grammar each: ASCII paths and regular-file collection; a closed manifest and freeze record with operational caps; a single-attempt capture rule that fail-closes weak pairing; and two anchor schemas that are void without separation of duties. The Package Anchor precedes disclosure and contains no seal fields. The Evidence Anchor follows capture and binds one attempt to that Package Anchor.

Specification readiness is not operational readiness. Neither anchor exists. Separation of duties is not established for either record. Capture was not tested. Decision 4 is not approved. Disclosure is not authorized. SQL EXEC and Census EXEC are not authorized.

---

## 12. Consolidated D4 approval sentence

`PROPOSED — NOT ADOPTED — FOR PO DECISION ONLY`

> The Stage I.9 approval sentence also includes the Stage I.10 canonical payload, manifest, freeze record, request/response correlation rule, and external-anchor prerequisite, together with the Stage I.11 path grammar `I.11-ASCII-1`, regular-file collection rules, manifest and freeze-record grammar `I.11-1`, operational numeric limits, empty-package prohibition, single-attempt capture and correlation rules, the pre-disclosure Package Anchor schema `I.12-1` including its separation-of-duties prerequisite, and the post-capture Evidence Anchor schema `I.13-1`, including its package-payload identity rule that only `MATCH` can count and its separate separation-of-duties prerequisite, and it still excludes Stage H §4.1, and it still does not freeze a package, write either anchor, appoint a custodian, accept hashes, disclose material, commence a review, designate an adjudicator, amend operative CC-02, synchronize controlled documents, re-adopt CC-01 through CC-06, satisfy CC-02, perform CC-06, close OQ-CENSUS-01, decide Google privacy, decide D5 or D6 or D7, authorize provider contact, or authorize SQL EXEC or Census EXEC, and it does not establish that separation of duties currently exists for either anchor.

---

Stage I.11 is a review and proposal only. Decision 4 remains **NOT DECIDED / NOT APPROVED**. D1–D3 remain unchanged. Stage H remains **NOT ADOPTED**. CC-02 remains **INSUFFICIENT EVIDENCE**. CC-06 remains **NOT PERFORMED**. OQ-CENSUS-01 remains **OPEN**. SQL EXEC and Census EXEC remain **NOT AUTHORIZED**.

No provider was contacted. No project material was disclosed. No package was frozen. No Package Anchor was created. No Evidence Anchor was created. No external AI assessment was run. No SQL was executed.

The next step is Product Owner review of this Stage I.11 report. It is not implementation and it is not progression to D5, D6, or D7.
