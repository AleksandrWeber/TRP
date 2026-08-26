# W2-S03 Security Verification Worksheet

**Package:** W2-S03 Market Data Foundation  
**Verdict:** PASS — every row is PASS or NOT APPLICABLE; zero REQUIRES ACTION  
**Scope:** Market Data Foundation only. Wave 1, W2-S01, and W2-S02 are consumed, not re-certified.  
**Evidence date:** 2026-08-26  
**Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) §4–§19

---

## 1. Injection (§4)

| Rows                   | Verdict        | Evidence or owner                                                             |
| ---------------------- | -------------- | ----------------------------------------------------------------------------- |
| 1.1 SQL injection      | PASS           | Prisma workspace predicates on connection lookup; no string-built SQL         |
| 1.2 NoSQL injection    | NOT APPLICABLE | No document/key-value query surface                                           |
| 1.3 Command injection  | PASS           | Market Data spawns no process or shell                                        |
| 1.4 LDAP injection     | NOT APPLICABLE | No directory query surface                                                    |
| 1.5 Template injection | NOT APPLICABLE | No evaluated server/email/report template                                     |
| 1.6 Header injection   | PASS           | Adapter HTTP headers are adapter-owned; no client-controlled outbound headers |
| 1.7 CRLF injection     | PASS           | No connection-controlled redirect or header construction                      |
| 1.8 XXE                | NOT APPLICABLE | No XML parser                                                                 |
| 1.9 CSV injection      | NOT APPLICABLE | No export surface                                                             |
| 1.10 Prompt injection  | NOT APPLICABLE | AI execution is outside W2-S03                                                |

## 2. Cross-site attacks (§5)

| Rows                | Verdict        | Evidence or owner                                                             |
| ------------------- | -------------- | ----------------------------------------------------------------------------- |
| 2.1 XSS             | PASS           | React renders market-data metadata as text                                    |
| 2.2 Stored XSS      | PASS           | Symbol/ticker/candle/book fields are not rendered as HTML                     |
| 2.3 Reflected XSS   | PASS           | No unsafe request-value reflection                                            |
| 2.4 DOM XSS         | PASS           | Market Data UI has no untrusted HTML/JS sink                                  |
| 2.5 CSRF            | PASS           | Mutations use authenticated API security model; CSRF on state-changing routes |
| 2.6 Clickjacking    | NOT APPLICABLE | Security Platform owns framing policy                                         |
| 2.7 Open redirect   | NOT APPLICABLE | No redirect endpoint                                                          |
| 2.8 CORS validation | NOT APPLICABLE | Security Platform owns CORS                                                   |

## 3. Authentication (§6)

| Rows                                 | Verdict        | Evidence or owner                         |
| ------------------------------------ | -------------- | ----------------------------------------- |
| 3.1 Password policy                  | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.2 Password reuse                   | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.3 Minimum length                   | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.4 Maximum length                   | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.5 Extremely long password handling | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.6 Weak password handling           | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.7 Credential stuffing resistance   | NOT APPLICABLE | Authentication/Security Platform (Wave 1) |
| 3.8 Brute-force resistance           | NOT APPLICABLE | Authentication/Security Platform (Wave 1) |
| 3.9 Account lockout                  | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.10 Session fixation                | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.11 Session hijacking               | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.12 Refresh replay                  | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.13 Logout correctness              | NOT APPLICABLE | Authentication (Wave 1)                   |
| 3.14 Session timeout                 | NOT APPLICABLE | Authentication (Wave 1)                   |

## 4. Authorization (§7)

| Rows                                | Verdict | Evidence or owner                                                                                  |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| 4.1 Horizontal privilege escalation | PASS    | Workspace-scoped connection lookup; foreign-workspace deny in Market Data service specs + live API |
| 4.2 Vertical privilege escalation   | PASS    | Market Data = Projection (C3); `surface-coverage.spec.ts`                                          |
| 4.3 IDOR                            | PASS    | Identifier resolved with workspace ownership                                                       |
| 4.4 Forced browsing                 | PASS    | Anonymous Market Data denied (live 401); no hidden trading routes                                  |
| 4.5 Mass assignment                 | PASS    | Client cannot set ticker, candles, order book, or freshness                                        |
| 4.6 Default deny                    | PASS    | Existing permission framework denies absent permission                                             |
| 4.7 Unknown permission              | PASS    | Existing authorization owner                                                                       |
| 4.8 Unknown role                    | PASS    | Existing authorization owner                                                                       |
| 4.9 Unknown action                  | PASS    | Explicit controller methods only                                                                   |

## 5. API security (§8)

| Rows                                | Verdict        | Evidence or owner                                                          |
| ----------------------------------- | -------------- | -------------------------------------------------------------------------- |
| 5.1 Input validation                | PASS           | Symbol, interval, depth constrained; unsupported values rejected honestly  |
| 5.2 Output encoding                 | PASS           | Views never include secret material                                        |
| 5.3 JSON validation                 | PASS           | Nest request validation path                                               |
| 5.4 Unexpected fields               | PASS           | No writable projection state fields in DTOs                                |
| 5.5 Parameter pollution             | PASS           | Path id and workspace header independently checked                         |
| 5.6 HTTP verb confusion             | PASS           | Explicit GET/POST methods and Projection guards                            |
| 5.7 Rate limiting                   | NOT APPLICABLE | Security Platform (V3-S04) owns quota/abuse product; Market Data adds none |
| 5.8 Pagination abuse                | PASS           | Workspace-local discovery/cache; no unbounded cross-tenant listing         |
| 5.9 Error leakage                   | PASS           | Operator-safe failure reasons; secret-free                                 |
| 5.10 Version leakage                | NOT APPLICABLE | No version banner added                                                    |
| 5.11 Stack trace leakage            | PASS           | No stack trace response path added                                         |
| 5.12 Framework leakage              | PASS           | No framework response added                                                |
| 5.13 Server header leakage          | NOT APPLICABLE | Security Platform owns headers                                             |
| 5.14 Technology fingerprint leakage | NOT APPLICABLE | Security Platform owns generic error/edge policy                           |

## 6. URL security (§9)

| Rows                           | Verdict | Evidence or owner                                       |
| ------------------------------ | ------- | ------------------------------------------------------- |
| 6.1 Predictable identifiers    | PASS    | IDs re-authorized with workspace context                |
| 6.2 Sequential IDs             | PASS    | No sequential identifier grants access                  |
| 6.3 Guessable resources        | PASS    | No secret or trading URL                                |
| 6.4 Hidden endpoints           | PASS    | Controllers are Projection-guarded                      |
| 6.5 Enumeration                | PASS    | Foreign record lookup fails through workspace predicate |
| 6.6 Sensitive query parameters | PASS    | No credentials in queries                               |
| 6.7 Secrets in URL             | PASS    | No secret/Vault value is placed in a product URL        |

## 7. Transport (§10)

| Rows                                | Verdict        | Evidence or owner                                 |
| ----------------------------------- | -------------- | ------------------------------------------------- |
| 7.1 HTTPS only                      | NOT APPLICABLE | Host/Security Platform transport                  |
| 7.2 Secure cookies                  | NOT APPLICABLE | Authentication owner                              |
| 7.3 HttpOnly                        | NOT APPLICABLE | Authentication owner                              |
| 7.4 SameSite                        | NOT APPLICABLE | Authentication owner                              |
| 7.5 HSTS                            | NOT APPLICABLE | Host/Security Platform                            |
| 7.6 TLS configuration               | NOT APPLICABLE | Host infrastructure                               |
| 7.7 No secrets in GET               | PASS           | Market Data retrieve mutations use POST bodies    |
| 7.8 Sensitive actions not cacheable | PASS           | No cache-control relaxation or GET mutation added |

## 8. Secrets (§11)

| Rows                             | Verdict        | Evidence or owner                                              |
| -------------------------------- | -------------- | -------------------------------------------------------------- |
| 8.1 Never returned by API        | PASS           | Market Data views expose normalized market fields only         |
| 8.2 Never logged                 | PASS           | Audit payloads contain provider/outcome flags only             |
| 8.3 Never serialized             | PASS           | No local Market Data secret store                              |
| 8.4 Never exported               | PASS           | No export capability                                           |
| 8.5 Never displayed              | PASS           | UI has no credential reveal                                    |
| 8.6 Memory cleared when possible | NOT APPLICABLE | Vault owns plaintext handling when connectivity paths retrieve |
| 8.7 Encryption verified          | NOT APPLICABLE | Vault owns encryption/wrapping                                 |
| 8.8 Integrity verified           | NOT APPLICABLE | Vault owns ciphertext integrity                                |

## 9. File upload (§12)

| Rows                        | Verdict        | Evidence or owner |
| --------------------------- | -------------- | ----------------- |
| 9.1 Content type validation | NOT APPLICABLE | No upload surface |
| 9.2 Extension validation    | NOT APPLICABLE | No upload surface |
| 9.3 MIME validation         | NOT APPLICABLE | No upload surface |
| 9.4 Zip bombs               | NOT APPLICABLE | No upload surface |
| 9.5 Oversized uploads       | NOT APPLICABLE | No upload surface |
| 9.6 Path traversal          | NOT APPLICABLE | No upload surface |
| 9.7 Malicious filenames     | NOT APPLICABLE | No upload surface |

## 10. Availability (§13)

| Rows                      | Verdict        | Evidence or owner                                                             |
| ------------------------- | -------------- | ----------------------------------------------------------------------------- |
| 10.1 Rate limiting        | NOT APPLICABLE | Security Platform (V3-S04) owns abuse controls                                |
| 10.2 Resource exhaustion  | PASS           | On-demand retrieve; no Market Data scheduler, queue, or streaming worker      |
| 10.3 Queue flooding       | NOT APPLICABLE | No queue producer                                                             |
| 10.4 Replay               | PASS           | Client cannot post prior snapshot as current; caches are server-owned         |
| 10.5 DoS resilience       | PASS           | Provider unavailable / failure map to honest outcomes; no hammer loop product |
| 10.6 Graceful degradation | PASS           | Provider NOT_IMPLEMENTED / FAILED does not invent ticker, candles, or book    |

## 11. Financial integrity (§14)

| Rows                                  | Verdict        | Evidence or owner            |
| ------------------------------------- | -------------- | ---------------------------- |
| 11.1 Cannot bypass Gate               | PASS           | No Gate path is added        |
| 11.2 Cannot bypass Risk               | PASS           | No Risk path is added        |
| 11.3 Cannot create fake fills         | PASS           | No execution/fill capability |
| 11.4 Cannot modify portfolio directly | PASS           | No portfolio mutation        |
| 11.5 Cannot bypass ledger             | PASS           | No ledger mutation           |
| 11.6 Cannot replay orders             | NOT APPLICABLE | No order surface             |
| 11.7 Cannot forge notifications       | NOT APPLICABLE | Delivery is Wave 5           |
| 11.8 Cannot forge reports             | NOT APPLICABLE | Reporting is outside W2-S03  |

## 12. AI (§15)

| Rows                                  | Verdict        | Evidence or owner                      |
| ------------------------------------- | -------------- | -------------------------------------- |
| 12.1 Prompt injection                 | NOT APPLICABLE | AI execution is outside W2-S03         |
| 12.2 Model jailbreak resistance       | NOT APPLICABLE | AI execution is outside W2-S03         |
| 12.3 Secrets hidden from prompts      | NOT APPLICABLE | No model invocation                    |
| 12.4 No hidden system prompt exposure | NOT APPLICABLE | No AI surface                          |
| 12.5 No customer isolation break      | NOT APPLICABLE | No AI context                          |
| 12.6 AI never controls capital        | PASS           | No AI or capital control is introduced |

## 13. Privacy (§16)

| Rows                      | Verdict | Evidence or owner                                                                    |
| ------------------------- | ------- | ------------------------------------------------------------------------------------ |
| 13.1 PII exposure         | PASS    | Metadata-only market projections and secret-free errors                              |
| 13.2 Workspace isolation  | PASS    | Workspace-scoped service predicate; caches keyed by workspace                        |
| 13.3 Cross-tenant leakage | PASS    | Foreign-workspace access denial coverage + live API                                  |
| 13.4 Sensitive logs       | PASS    | No secret payload in audit/log path                                                  |
| 13.5 Audit integrity      | PASS    | Security Audit receives attributable secret-free discovery/ticker/candle/book events |

## 14. Secure headers (§17)

| Rows                                   | Verdict        | Evidence or owner       |
| -------------------------------------- | -------------- | ----------------------- |
| 14.1 CSP                               | NOT APPLICABLE | Security Platform owner |
| 14.2 X-Frame-Options / frame-ancestors | NOT APPLICABLE | Security Platform owner |
| 14.3 Referrer-Policy                   | NOT APPLICABLE | Security Platform owner |
| 14.4 Permissions-Policy                | NOT APPLICABLE | Security Platform owner |
| 14.5 X-Content-Type-Options            | NOT APPLICABLE | Security Platform owner |

---

## OWASP Top 10 (§18.1)

| Class                                      | Verdict        | Market Data mapping                                                                |
| ------------------------------------------ | -------------- | ---------------------------------------------------------------------------------- |
| Broken access control                      | PASS           | Projection + workspace-scoped resource resolution                                  |
| Cryptographic failures                     | PASS           | No plaintext secret projection; Vault remains secret owner                         |
| Injection                                  | PASS           | Prisma access; constrained symbols/intervals/depths; offered providers only        |
| Insecure design                            | PASS           | Validate-gated projections; Connected prerequisite; no Trading enabled             |
| Security misconfiguration                  | PASS           | No security-platform setting is weakened                                           |
| Vulnerable and outdated components         | NOT APPLICABLE | Dependency governance is platform/release ownership                                |
| Identification and authentication failures | NOT APPLICABLE | Authentication is Wave 1 ownership                                                 |
| Software and data integrity failures       | PASS           | Normalize/validate before project; Unknown preferred over guessing                 |
| Security logging and monitoring failures   | PASS           | Discovery/ticker/candle/order-book audit emits; dashboards remain Wave 3           |
| Server-side request forgery                | PASS           | Adapter HTTP uses fixed offered-provider origins only; no operator URL Market Data |

## OWASP API Top 10 (§18.2)

| Class                                           | Verdict        | Market Data mapping                                                                   |
| ----------------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| Broken object level authorization               | PASS           | Workspace predicate prevents cross-workspace object access                            |
| Broken authentication                           | NOT APPLICABLE | Authentication is Wave 1 ownership                                                    |
| Broken object property level authorization      | PASS           | No client-writable ticker/candle/book/freshness state                                 |
| Unrestricted resource consumption               | NOT APPLICABLE | Inherits Security Platform (V3-S04) quotas; Market Data adds no quota product         |
| Broken function level authorization             | PASS           | Projection on Market Data controller methods                                          |
| Unrestricted access to sensitive business flows | PASS           | Connected-gated retrieve; no trading inventory flows                                  |
| Server side request forgery                     | PASS           | Fixed offered-provider origins; planned providers not implemented                     |
| Security misconfiguration                       | PASS           | No platform configuration is changed                                                  |
| Improper inventory management                   | PASS           | Versioned Market Data controller and offered catalog only                             |
| Unsafe consumption of APIs                      | PASS           | Server projects only after normalize/validate; venue body not echoed as product state |

---

## Security Regression Suite (§19)

| Class                      | Verdict        | Ordinary regression evidence                                               |
| -------------------------- | -------------- | -------------------------------------------------------------------------- |
| SQL Injection              | NOT APPLICABLE | No W2-S03-owned fix of this class                                          |
| IDOR                       | PASS           | Market Data service isolation specs; live foreign-workspace deny           |
| XSS                        | NOT APPLICABLE | No W2-S03-owned fix of this class                                          |
| CSRF                       | NOT APPLICABLE | No W2-S03-owned fix of this class                                          |
| Prompt Injection           | NOT APPLICABLE | No AI surface or fix                                                       |
| Session Fixation           | NOT APPLICABLE | Authentication owner                                                       |
| Refresh Replay             | NOT APPLICABLE | Authentication owner                                                       |
| Mass Assignment            | PASS           | Client cannot set projections; validate rejects malformed payloads         |
| Header Injection           | NOT APPLICABLE | No W2-S03-owned fix of this class                                          |
| Other — secret disclosure  | PASS           | Response-shape assertions; UI no-secret assertions                         |
| Other — projection honesty | PASS           | Connected prerequisite; NOT_IMPLEMENTED / FAILED / freshness Unknown tests |
| Other — no trading I/O     | PASS           | Isolation/UI specs forbid trading/streaming claims on Market Data          |

No W2-S03-owned regression is disabled or red.

---

## STRIDE / Timing / Abuse (Close evidence)

| Category               | Verdict | Evidence                                                                   |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| Spoofing               | PASS    | Authentication binding on Market Data                                      |
| Tampering              | PASS    | Server-assigned projections; client cannot set ticker/candles/book         |
| Repudiation            | PASS    | Discovery/ticker/candle/order-book audit emits                             |
| Information Disclosure | PASS    | Isolation; no secret echo; no trading inventory                            |
| Denial of Service      | PASS    | On-demand retrieve; platform abuse controls inherited; no streaming hammer |
| Elevation of Privilege | PASS    | Projection + isolation; no Trading enabled                                 |
| Timing                 | PASS    | Freshness from observed timestamps; Unknown when absent                    |
| Abuse                  | PASS    | Rate-limit/unavailable is not current data; no automatic polling worker    |

---

**STOP.** Zero REQUIRES ACTION. This worksheet supports Product Owner Close Review. It does not declare W2-S03 Closed.
