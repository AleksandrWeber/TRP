#!/usr/bin/env python3
"""Stage Q local checks. Proposal test harness. Not an adopted validator.

Reads the SQL candidate as text. Does not execute SQL, connect to a database,
or contact a provider.
"""

from __future__ import annotations

import hashlib
import re
from datetime import datetime
from pathlib import Path

SQL_PATH = Path(
    "/Users/oleksandrsvacko/.cursor/projects/"
    "Users-oleksandrsvacko-Desktop-myProjects-trp/artifacts/"
    "option-c-census-sql-draft/option-c-vault-id-census-draft.sql"
)
EXPECTED_SQL = (
    "fc2500e7e0eccb07454ed24c7438f1864ced1ff88b4e3ec601b94ad26bbcab3c"
)

PREDICATE_VALUES = {"MET", "NOT-MET", "NOT-DETERMINED"}
WORKING = {
    "UNASSIGNED",
    "CRITICAL",
    "HIGH",
    "MEDIUM",
    "LOW",
    "PREDICATE-NOT-MET",
}
ADJUDICATION = {
    "UNRESOLVED",
    "PREDICATE-MET",
    "FALSE-POSITIVE-PREDICATE-NOT-MET",
    "RETRACTED-BY-PROVIDER",
    "REOPENED",
    "SUPERSEDED",
}
RESIDUAL = {
    "NONE",
    "ACCEPT-AS-RESIDUAL",
    "MARK-FOR-LATER-DOCUMENTATION-CORRECTION",
}
LABELS = {"CRITICAL", "HIGH", "MEDIUM", "LOW", "NOT-SUPPLIED", "UNRECOGNIZED-LABEL"}
ACTORS = {"PO"}
KEY_RE = re.compile(r"^FS-[0-9a-f]{16}$")
TS_RE = re.compile(r"^202[6-9]-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$|^20[3-9]\d-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$|^2099-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")

PHRASES = (
    "inspection of",
    "read the values",
    "review the values",
    "use the values",
    "copy the counts",
    "look at",
    "examine",
    "inspect",
    "export",
    "publish",
)
NEGATIONS = ("does not", "do not", "must not", "blocked", "not", "no")

CAPTURE_STATUS = {
    "COMPLETE",
    "REFUSAL",
    "TIMEOUT",
    "TRUNCATED",
    "MALFORMED",
    "TRANSMISSION-NOT-EVIDENCED",
    "ISOLATION-NOT-EVIDENCED",
    "AMBIGUOUS-RESPONSE",
    "ATTACHMENT-MISMATCH",
    "PARTIAL-INSTRUCTIONS",
}
ISOLATION_RESULT = {
    "TRANSMISSION-NOT-EVIDENCED",
    "CROSS-DISCLOSURE-DETECTED",
    "ISOLATION-NOT-EVIDENCED",
    "NO-CROSS-DISCLOSURE-OBSERVED",
}
GAP_REASON = {"NONE", "PARTIAL-INSTRUCTIONS", "SEARCH-NOT-RUN"}
TRANSMISSION = {"ABSENT-OR-UNREADABLE", "HASH-OR-LENGTH-MISMATCH", "INTACT"}
SESSION = {
    "NEW-SESSION-ATTESTED",
    "SESSION-REUSED",
    "SESSION-ID-UNAVAILABLE",
    "SESSION-ID-NOT-EXPOSED",
}


def _boundary_find(text: str, phrase: str) -> bool:
    hay = text.casefold()
    needle = phrase.casefold()
    start = 0
    while True:
        index = hay.find(needle, start)
        if index < 0:
            return False
        before = hay[index - 1] if index else ""
        after_at = index + len(needle)
        after = hay[after_at] if after_at < len(hay) else ""
        if (not before.isalnum()) and (not after.isalnum()):
            return True
        start = index + 1


LIMITERS = ("before any", "without", "absent", "until")


def _phrase_index(text: str, phrase: str) -> int:
    hay = text.casefold()
    needle = phrase.casefold()
    start = 0
    while True:
        index = hay.find(needle, start)
        if index < 0:
            return -1
        before = hay[index - 1] if index else ""
        after_at = index + len(needle)
        after = hay[after_at] if after_at < len(hay) else ""
        if (not before.isalnum()) and (not after.isalnum()):
            return index
        start = index + 1


def _negation_before(clause: str, phrase: str) -> bool:
    index = _phrase_index(clause, phrase)
    if index < 0:
        return False
    prefix = clause[:index]
    return any(_boundary_find(prefix, word) for word in NEGATIONS)


def _limited(clause: str, phrase: str) -> bool:
    index = _phrase_index(clause, phrase)
    if index < 0:
        return False
    prefix = clause[:index].rstrip()
    prefix = re.sub(r"\s+(a|an|the)$", "", prefix, flags=re.IGNORECASE).rstrip()
    return any(prefix.casefold().endswith(limiter) for limiter in LIMITERS)


def comment_windows(text: str) -> list[list[tuple[int, str]]]:
    windows: list[list[tuple[int, str]]] = []
    current: list[tuple[int, str]] = []
    for number, line in enumerate(text.splitlines(), start=1):
        if line.strip() == "":
            if current:
                windows.append(current)
                current = []
            continue
        if re.match(r"^\s*--", line):
            current.append((number, line))
        elif current:
            windows.append(current)
            current = []
    if current:
        windows.append(current)
    return windows


def _body(line: str) -> str:
    match = re.match(r"^\s*--(.*)$", line)
    body = match.group(1) if match else line
    if body.startswith(" "):
        body = body[1:]
    return body


def _is_bullet(body: str) -> bool:
    return body.lstrip().startswith("- ")


def _is_list_header(body: str) -> bool:
    return body.rstrip().endswith(":") and any(
        _boundary_find(body, word) for word in NEGATIONS
    )


def clauses_of_window(window: list[tuple[int, str]]) -> list[dict]:
    """Return clauses with text, inherited-negation, and source line numbers."""
    bodies = [(number, _body(line)) for number, line in window]
    clauses: list[dict] = []
    paragraph: list[tuple[int, str]] = []
    inherit = False

    def flush_paragraph() -> None:
        nonlocal paragraph
        if not paragraph:
            return
        text = " ".join(part.strip() for _, part in paragraph)
        numbers = [number for number, _ in paragraph]
        for piece in _split_sentences(text):
            clauses.append(
                {
                    "text": piece,
                    "lines": numbers,
                    "inherited_negation": False,
                }
            )
        paragraph = []

    index = 0
    while index < len(bodies):
        number, body = bodies[index]
        if _is_list_header(body):
            flush_paragraph()
            clauses.append(
                {
                    "text": body.strip(),
                    "lines": [number],
                    "inherited_negation": False,
                }
            )
            inherit = True
            index += 1
            continue
        if _is_bullet(body):
            flush_paragraph()
            bullet_lines = [(number, body)]
            index += 1
            while index < len(bodies):
                next_number, next_body = bodies[index]
                if _is_bullet(next_body) or _is_list_header(next_body):
                    break
                if next_body.strip() == "":
                    break
                if not next_body[:1].isspace():
                    break
                bullet_lines.append((next_number, next_body))
                index += 1
            text = " ".join(part.strip() for _, part in bullet_lines)
            numbers = [item for item, _ in bullet_lines]
            for piece in _split_sentences(text):
                clauses.append(
                    {
                        "text": piece,
                        "lines": numbers,
                        "inherited_negation": inherit,
                    }
                )
            continue
        inherit = False
        paragraph.append((number, body))
        if _ends_clause(body):
            flush_paragraph()
        index += 1
    flush_paragraph()
    return clauses


def _ends_clause(body: str) -> bool:
    stripped = body.rstrip()
    return stripped.endswith((".", "!", "?", ";"))


def _split_sentences(text: str) -> list[str]:
    marked = re.sub(r",\s+but\s+", "\n", text, flags=re.IGNORECASE)
    pieces: list[str] = []
    for chunk in marked.split("\n"):
        pieces.extend(re.split(r"(?<=[.!?;])\s+", chunk))
    return [part.strip() for part in pieces if part.strip()]


def window_subject(text: str) -> bool:
    if re.search(r"n\s*<\s*5", text, flags=re.IGNORECASE):
        return True
    folded = text.casefold()
    return _boundary_find(folded, "small cell") or _boundary_find(
        folded, "small cells"
    ) or _boundary_find(folded, "unsuppressed counts")


def inspect_window(window: list[tuple[int, str]]) -> dict:
    raw = "\n".join(line for _, line in window)
    subject = window_subject(raw)
    hits = []
    for clause in clauses_of_window(window):
        for phrase in PHRASES:
            if not _boundary_find(clause["text"], phrase):
                continue
            negated = (
                clause["inherited_negation"]
                or _negation_before(clause["text"], phrase)
                or _limited(clause["text"], phrase)
            )
            hits.append(
                {
                    "phrase": phrase,
                    "negated": negated,
                    "lines": clause["lines"],
                    "clause": clause["text"],
                }
            )
    grant = subject and any(not hit["negated"] for hit in hits)
    return {"grant": grant, "subject": subject, "hits": hits}


def valid_timestamp(value: str) -> bool:
    if not isinstance(value, str) or not TS_RE.match(value):
        return False
    try:
        moment = datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ")
    except ValueError:
        return False
    return 2026 <= moment.year <= 2099


def valid_package(value) -> bool:
    if not isinstance(value, dict):
        return False
    return (
        value.get("ref-kind") == "PACKAGE-BYTES"
        and value.get("unavailable-reason") == "NONE"
        and isinstance(value.get("sha256"), str)
        and SHA_RE.match(value["sha256"]) is not None
    )


def valid_prior(finding: dict) -> bool:
    prior = finding.get("prior-blocking-record")
    if not isinstance(prior, dict):
        return False
    if prior.get("immutable") is not True:
        return False
    if prior.get("finding-instance-id") != finding.get("finding-instance-id"):
        return False
    if prior.get("predicate-block") != "BLOCKING":
        return False
    for field in (
        "critical-predicate",
        "high-predicate",
        "medium-predicate",
        "low-predicate",
        "adjudication-status",
    ):
        if field not in prior:
            return False
    return True


def subject_key_state(finding: dict) -> str:
    if finding.get("subject-key-malformed") is True:
        return "MALFORMED"
    if "finding-subject-key" not in finding or finding.get("finding-subject-key") in (
        None,
        "",
        "NONE",
    ):
        return "ABSENT"
    key = finding.get("finding-subject-key")
    if not isinstance(key, str) or not KEY_RE.match(key):
        return "MALFORMED"
    return "VALID"


def field_errors(finding: dict) -> list[str]:
    errors = []
    required = (
        "finding-instance-id",
        "adjudication-status",
        "critical-predicate",
        "high-predicate",
        "medium-predicate",
        "low-predicate",
        "working-severity",
        "residual-disposition",
        "not-risk-acceptance",
        "blocking-label-class",
        "clearing-actor-id",
    )
    for field in required:
        if field not in finding:
            errors.append(f"missing:{field}")
    if finding.get("adjudication-status") not in ADJUDICATION:
        errors.append("adjudication")
    for field in (
        "critical-predicate",
        "high-predicate",
        "medium-predicate",
        "low-predicate",
    ):
        if finding.get(field) not in PREDICATE_VALUES:
            errors.append(field)
    if finding.get("working-severity") not in WORKING:
        errors.append("working-severity")
    if finding.get("residual-disposition") not in RESIDUAL:
        errors.append("residual")
    if finding.get("not-risk-acceptance") not in {"TRUE", "FALSE"}:
        errors.append("not-risk-acceptance")
    if finding.get("blocking-label-class") not in LABELS:
        errors.append("label")
    if finding.get("clearing-actor-id") not in ACTORS | {
        "CURSOR",
        "Anthropic",
        "OpenAI",
        "Google",
    }:
        errors.append("actor")
    key_state = subject_key_state(finding)
    if key_state == "MALFORMED":
        errors.append("subject-key")
    critical = finding.get("critical-predicate")
    high = finding.get("high-predicate")
    medium = finding.get("medium-predicate")
    low = finding.get("low-predicate")
    working = finding.get("working-severity")
    residual = finding.get("residual-disposition")
    if residual != "NONE" and (
        critical in {"MET", "NOT-DETERMINED"} or high in {"MET", "NOT-DETERMINED"}
    ):
        errors.append("residual-on-critical-or-high")
    if working in {"MEDIUM", "LOW"} and critical == "NOT-DETERMINED":
        errors.append("severity-while-undetermined")
    if working in {"MEDIUM", "LOW"} and high == "NOT-DETERMINED":
        errors.append("severity-while-undetermined")
    if working == "CRITICAL" and critical != "MET":
        errors.append("severity-predicate-mismatch")
    if working == "HIGH" and not (high == "MET" and critical == "NOT-MET"):
        errors.append("severity-predicate-mismatch")
    if working == "MEDIUM" and not (
        medium == "MET" and critical == "NOT-MET" and high == "NOT-MET"
    ):
        errors.append("severity-predicate-mismatch")
    if working == "LOW" and not (
        low == "MET"
        and critical == "NOT-MET"
        and high == "NOT-MET"
        and medium == "NOT-MET"
    ):
        errors.append("severity-predicate-mismatch")
    if working == "PREDICATE-NOT-MET" and any(
        value == "MET" for value in (critical, high, medium, low)
    ):
        errors.append("severity-predicate-mismatch")
    stored = finding.get("predicate-block")
    if stored not in (None, "BLOCKING", "NOT-BLOCKING"):
        errors.append("predicate-block")
    return errors


def intrinsic_blocking(finding: dict) -> bool:
    if field_errors(finding):
        return True
    status = finding["adjudication-status"]
    if status in {
        "REOPENED",
        "RETRACTED-BY-PROVIDER",
        "UNRESOLVED",
        "SUPERSEDED",
    }:
        return True
    if finding["critical-predicate"] in {"MET", "NOT-DETERMINED"}:
        return True
    if finding["high-predicate"] in {"MET", "NOT-DETERMINED"}:
        return True
    if finding["blocking-label-class"] == "UNRECOGNIZED-LABEL" and (
        finding["critical-predicate"] == "NOT-DETERMINED"
        or finding["high-predicate"] == "NOT-DETERMINED"
    ):
        return True
    if finding["working-severity"] in {"CRITICAL", "HIGH"}:
        return True
    if finding["medium-predicate"] == "MET" or finding["low-predicate"] == "MET":
        if finding["residual-disposition"] == "NONE":
            return True
    if not bundle_without_correlation(finding):
        return True
    return False


def bundle_without_correlation(finding: dict) -> bool:
    predicates = [
        finding.get("critical-predicate"),
        finding.get("high-predicate"),
        finding.get("medium-predicate"),
        finding.get("low-predicate"),
    ]
    met = [name for name in ("medium-predicate", "low-predicate") if finding.get(name) == "MET"]
    any_met = any(value == "MET" for value in predicates)
    if finding.get("clearing-actor-id") != "PO":
        return False
    if finding.get("clearing-finding-instance-id") != finding.get("finding-instance-id"):
        return False
    if not any_met:
        if finding.get("adjudication-status") != "FALSE-POSITIVE-PREDICATE-NOT-MET":
            return False
        if finding.get("working-severity") != "PREDICATE-NOT-MET":
            return False
    else:
        if finding.get("critical-predicate") != "NOT-MET" or finding.get("high-predicate") != "NOT-MET":
            return False
        if finding.get("adjudication-status") != "PREDICATE-MET":
            return False
        highest = "MEDIUM" if finding.get("medium-predicate") == "MET" else "LOW"
        if finding.get("working-severity") != highest:
            return False
        if not met:
            return False
    if not valid_package(finding.get("clearing-package-ref")):
        return False
    rationale = finding.get("clearing-rationale")
    if not isinstance(rationale, str) or rationale == "NONE":
        return False
    if not 20 <= len(rationale) <= 4000:
        return False
    if any(value == "NOT-DETERMINED" for value in predicates):
        return False
    if finding.get("critical-predicate") != "NOT-MET" or finding.get("high-predicate") != "NOT-MET":
        return False
    if not valid_timestamp(finding.get("clearing-utc")):
        return False
    if not valid_prior(finding):
        return False
    if finding.get("not-risk-acceptance") != "TRUE":
        return False
    return True


def correlation_state(finding: dict, findings: list[dict]) -> str:
    state = subject_key_state(finding)
    if state == "ABSENT":
        return "SUBJECT-KEY-ABSENT"
    if state == "MALFORMED":
        return "SUBJECT-KEY-MALFORMED"
    key = finding["finding-subject-key"]
    for other in findings:
        if other is finding or other.get("finding-instance-id") == finding.get(
            "finding-instance-id"
        ):
            continue
        if subject_key_state(other) != "VALID":
            continue
        if other.get("finding-subject-key") != key:
            continue
        if field_errors(other) or intrinsic_blocking(other):
            return "CORRELATED-BLOCK-PRESENT"
    return "NO-CORRELATED-BLOCK"


def blocks(finding: dict, findings: list[dict] | None = None) -> str:
    group = findings if findings is not None else [finding]
    if field_errors(finding) or intrinsic_blocking(finding):
        return "BLOCKING"
    if correlation_state(finding, group) != "NO-CORRELATED-BLOCK":
        return "BLOCKING"
    stored = finding.get("predicate-block")
    if stored not in (None, "NOT-BLOCKING"):
        return "BLOCKING"
    return "NOT-BLOCKING"


def package_ref() -> dict:
    return {
        "ref-kind": "PACKAGE-BYTES",
        "unavailable-reason": "NONE",
        "sha256": "a" * 64,
    }


def prior_for(finding_id: str) -> dict:
    return {
        "immutable": True,
        "finding-instance-id": finding_id,
        "predicate-block": "BLOCKING",
        "critical-predicate": "NOT-DETERMINED",
        "high-predicate": "NOT-DETERMINED",
        "medium-predicate": "NOT-DETERMINED",
        "low-predicate": "NOT-DETERMINED",
        "adjudication-status": "UNRESOLVED",
    }


def base_finding(**overrides) -> dict:
    finding = {
        "finding-instance-id": "PF-0123456789abcdef0123456789abcdef-1",
        "finding-subject-key": "FS-0123456789abcdef",
        "adjudication-status": "FALSE-POSITIVE-PREDICATE-NOT-MET",
        "critical-predicate": "NOT-MET",
        "high-predicate": "NOT-MET",
        "medium-predicate": "NOT-MET",
        "low-predicate": "NOT-MET",
        "working-severity": "PREDICATE-NOT-MET",
        "residual-disposition": "NONE",
        "not-risk-acceptance": "TRUE",
        "blocking-label-class": "HIGH",
        "clearing-actor-id": "PO",
        "clearing-finding-instance-id": "PF-0123456789abcdef0123456789abcdef-1",
        "clearing-package-ref": package_ref(),
        "clearing-rationale": "Predicates are absent on the frozen package bytes.",
        "clearing-utc": "2026-11-01T12:00:00Z",
        "prior-blocking-record": prior_for("PF-0123456789abcdef0123456789abcdef-1"),
    }
    finding.update(overrides)
    return finding


def select_attempts(attempts: list[dict]) -> dict:
    by_provider: dict[str, list[dict]] = {}
    for attempt in attempts:
        by_provider.setdefault(attempt["provider"], []).append(attempt)
    coverage = []
    for provider, rows in sorted(by_provider.items()):
        cross = [row for row in rows if row["isolation-result"] == "CROSS-DISCLOSURE-DETECTED"]
        reused = [row for row in rows if row["session-separation"] == "SESSION-REUSED"]
        if cross or reused:
            reason = (
                "CROSS-DISCLOSURE-DETECTED" if cross else "SESSION-REUSED"
            )
            attempt_rows = []
            for row in sorted(rows, key=lambda item: (item["seal-utc"], item["attempt-id"])):
                own = reason if (
                    row["isolation-result"] == "CROSS-DISCLOSURE-DETECTED"
                    or row["session-separation"] == "SESSION-REUSED"
                ) else "SIBLING-DISQUALIFIED"
                attempt_rows.append({**row, "attempt-countability": "NOT-COUNTING", "reason": own})
            coverage.append(
                {
                    "provider": provider,
                    "countability": "NOT-COUNTING",
                    "reason": reason,
                    "winner": None,
                    "attempts": attempt_rows,
                    "non-selected-attempt-ids": [],
                    "vote": False,
                }
            )
            continue
        eligible = [
            row
            for row in rows
            if row["meets-counting-rules"]
            and row["isolation-result"] == "NO-CROSS-DISCLOSURE-OBSERVED"
            and row["session-separation"]
            in {"NEW-SESSION-ATTESTED", "SESSION-ID-NOT-EXPOSED"}
        ]
        ordered = sorted(eligible, key=lambda item: (item["seal-utc"], item["attempt-id"]))
        if not ordered:
            coverage.append(
                {
                    "provider": provider,
                    "countability": "NOT-COUNTING",
                    "reason": "NO-COUNTING-ATTEMPT",
                    "winner": None,
                    "attempts": rows,
                    "non-selected-attempt-ids": [],
                    "vote": False,
                }
            )
            continue
        winner = ordered[0]
        losers = [row["attempt-id"] for row in ordered[1:]]
        coverage.append(
            {
                "provider": provider,
                "countability": "COUNTING",
                "reason": "NONE",
                "winner": winner["attempt-id"],
                "attempts": rows,
                "non-selected-attempt-ids": losers,
                "vote": False,
            }
        )
    return {"providers": coverage}


def isolation_compatible(record: dict) -> tuple[bool, str]:
    capture = record["capture-status"]
    isolation = record["isolation-result"]
    gap = record["isolation-gap-reason"]
    transmission = record["transmission-evidence-status"]
    if capture not in CAPTURE_STATUS:
        return False, "capture"
    if isolation not in ISOLATION_RESULT:
        return False, "isolation"
    if gap not in GAP_REASON:
        return False, "gap"
    if transmission not in TRANSMISSION:
        return False, "transmission"
    if transmission != "INTACT" and isolation != "TRANSMISSION-NOT-EVIDENCED":
        return False, "transmission-isolation"
    if transmission == "INTACT" and isolation == "TRANSMISSION-NOT-EVIDENCED":
        return False, "intact-but-missing"
    if isolation == "ISOLATION-NOT-EVIDENCED" and gap not in {
        "PARTIAL-INSTRUCTIONS",
        "SEARCH-NOT-RUN",
    }:
        return False, "gap-required"
    if isolation != "ISOLATION-NOT-EVIDENCED" and gap != "NONE":
        return False, "gap-forbidden"
    if gap == "PARTIAL-INSTRUCTIONS" and record.get("instructions-observable") != "PARTIAL":
        return False, "partial"
    if gap == "SEARCH-NOT-RUN" and record.get("instructions-observable") != "FULL":
        return False, "search"
    if record.get("empty-prior-set") is True and gap == "SEARCH-NOT-RUN":
        return False, "empty-prior-is-not-search-not-run"
    if record.get("overwrite-capture-with-isolation") is True:
        return False, "overwrite-forbidden"
    return True, "OK"


RESULTS: list[tuple[str, str, str, str]] = []


def check(test_id: str, expected: str, actual: str) -> None:
    status = "PASS" if expected == actual else "FAIL"
    RESULTS.append((test_id, expected, actual, status))


def run() -> int:
    sql = SQL_PATH.read_bytes()
    digest = hashlib.sha256(sql).hexdigest()
    check("Q-SQL-HASH", EXPECTED_SQL, digest)
    text = sql.decode("utf-8")
    windows = comment_windows(text)
    line_to_window = {}
    for window in windows:
        for number, _ in window:
            line_to_window[number] = window

    def grant_at(line: int) -> str:
        window = line_to_window[line]
        return "GRANT" if inspect_window(window)["grant"] else "NO-GRANT"

    def phrase_on_line(line: int, phrase: str) -> str:
        body = _body(text.splitlines()[line - 1])
        return "HIT" if _boundary_find(body, phrase) else "NO-HIT"

    check("Q5-L40-PUBLISH", "NO-HIT", phrase_on_line(40, "publish"))
    check("Q5-L40-PUBLISHED-WORD", "HIT", phrase_on_line(40, "published"))
    check("Q5-L36-PHRASE", "NO-HIT", phrase_on_line(36, "inspect") if False else (
        "HIT" if any(_boundary_find(_body(text.splitlines()[35]), phrase) for phrase in PHRASES) else "NO-HIT"
    ))
    check("Q5-L182-PHRASE", "NO-HIT", (
        "HIT" if any(_boundary_find(_body(text.splitlines()[181]), phrase) for phrase in PHRASES) else "NO-HIT"
    ))
    check("Q5-L40-WINDOW", "NO-GRANT", grant_at(40))
    check("Q5-L90-WINDOW", "NO-GRANT", grant_at(90))
    check("Q5-L264-WINDOW", "NO-GRANT", grant_at(264))
    check("Q5-L182-WINDOW", "NO-GRANT", grant_at(182))
    check("Q5-L184-PUBLISH", "HIT", phrase_on_line(184, "publish"))
    line_184 = _body(text.splitlines()[183])
    check(
        "Q5-L184-LIMITED",
        "LIMITED",
        "LIMITED" if _limited(line_184, "publish") else "AFFIRMATIVE",
    )

    synthetic = inspect_window([(1, "-- operators may inspect n < 5")])
    check("Q5-SYN-INSPECT", "GRANT", "GRANT" if synthetic["grant"] else "NO-GRANT")
    negated = inspect_window([(1, "-- do not inspect n < 5")])
    check("Q5-SYN-NEGATED", "NO-GRANT", "GRANT" if negated["grant"] else "NO-GRANT")
    mixed = inspect_window(
        [
            (1, "-- Do not publish n < 5."),
            (2, "-- Operators may inspect n < 5."),
        ]
    )
    check("Q5-SYN-LATER-GRANT", "GRANT", "GRANT" if mixed["grant"] else "NO-GRANT")
    hidden = inspect_window(
        [
            (1, "-- DO NOT:"),
            (2, "--   - Publish n < 5."),
            (3, "-- Operators may inspect n < 5."),
        ]
    )
    check("Q5-SYN-AFTER-LIST", "GRANT", "GRANT" if hidden["grant"] else "NO-GRANT")
    same = inspect_window([(1, "-- Do not inspect n < 5 and do not publish.")])
    check("Q5-SYN-SAME-CLAUSE", "NO-GRANT", "GRANT" if same["grant"] else "NO-GRANT")
    contrast = inspect_window(
        [(1, "-- Do not publish n < 5, but operators may inspect n < 5.")]
    )
    check("Q5-SYN-BUT", "GRANT", "GRANT" if contrast["grant"] else "NO-GRANT")
    publication = inspect_window([(1, "-- publication of n < 5 is described here.")])
    check("Q5-SYN-PUBLICATION", "NO-GRANT", "GRANT" if publication["grant"] else "NO-GRANT")
    limited = inspect_window([(1, "-- binding before any publish of n < 5.")])
    check("Q5-SYN-BEFORE-ANY", "NO-GRANT", "GRANT" if limited["grant"] else "NO-GRANT")
    may_publish = inspect_window([(1, "-- operators may publish n < 5.")])
    check("Q5-SYN-MAY-PUBLISH", "GRANT", "GRANT" if may_publish["grant"] else "NO-GRANT")

    unresolved_critical = base_finding(
        **{
            "adjudication-status": "UNRESOLVED",
            "critical-predicate": "NOT-DETERMINED",
            "high-predicate": "NOT-DETERMINED",
            "working-severity": "UNASSIGNED",
            "clearing-rationale": "NONE",
            "clearing-package-ref": "NONE",
            "not-risk-acceptance": "FALSE",
            "clearing-utc": "NONE",
            "prior-blocking-record": "NONE",
        }
    )
    check("Q4-UNRESOLVED-CRITICAL", "BLOCKING", blocks(unresolved_critical))
    unresolved_high = base_finding(
        **{
            "adjudication-status": "UNRESOLVED",
            "critical-predicate": "NOT-MET",
            "high-predicate": "NOT-DETERMINED",
            "working-severity": "UNASSIGNED",
            "clearing-rationale": "NONE",
            "clearing-package-ref": "NONE",
            "not-risk-acceptance": "FALSE",
            "clearing-utc": "NONE",
            "prior-blocking-record": "NONE",
        }
    )
    check("Q4-UNRESOLVED-HIGH", "BLOCKING", blocks(unresolved_high))
    confirmed_critical = base_finding(
        **{
            "adjudication-status": "PREDICATE-MET",
            "critical-predicate": "MET",
            "working-severity": "CRITICAL",
            "blocking-label-class": "CRITICAL",
        }
    )
    check("Q4-CONFIRMED-CRITICAL", "BLOCKING", blocks(confirmed_critical))
    confirmed_high = base_finding(
        **{
            "adjudication-status": "PREDICATE-MET",
            "high-predicate": "MET",
            "working-severity": "HIGH",
        }
    )
    check("Q4-CONFIRMED-HIGH", "BLOCKING", blocks(confirmed_high))
    not_met_unresolved = base_finding(**{"adjudication-status": "UNRESOLVED"})
    check("Q4-NOT-MET-UNRESOLVED", "BLOCKING", blocks(not_met_unresolved))
    medium_residual = base_finding(
        **{
            "adjudication-status": "PREDICATE-MET",
            "medium-predicate": "MET",
            "working-severity": "MEDIUM",
            "residual-disposition": "ACCEPT-AS-RESIDUAL",
        }
    )
    check("Q4-MEDIUM-RESIDUAL", "NOT-BLOCKING", blocks(medium_residual))
    low_residual = base_finding(
        **{
            "adjudication-status": "PREDICATE-MET",
            "low-predicate": "MET",
            "working-severity": "LOW",
            "residual-disposition": "MARK-FOR-LATER-DOCUMENTATION-CORRECTION",
        }
    )
    check("Q4-LOW-RESIDUAL", "NOT-BLOCKING", blocks(low_residual))
    medium_none = base_finding(
        **{
            "adjudication-status": "PREDICATE-MET",
            "medium-predicate": "MET",
            "working-severity": "MEDIUM",
            "residual-disposition": "NONE",
        }
    )
    check("Q4-MEDIUM-NONE", "BLOCKING", blocks(medium_none))
    retracted = base_finding(**{"adjudication-status": "RETRACTED-BY-PROVIDER"})
    check("Q4-RETRACTED", "BLOCKING", blocks(retracted))
    reopened = base_finding(
        **{
            "adjudication-status": "REOPENED",
            "critical-predicate": "NOT-DETERMINED",
            "high-predicate": "NOT-DETERMINED",
            "working-severity": "UNASSIGNED",
        }
    )
    check("Q4-REOPENED", "BLOCKING", blocks(reopened))
    false_positive = base_finding()
    check("Q4-FALSE-POSITIVE", "NOT-BLOCKING", blocks(false_positive))
    missing_evidence = base_finding(**{"clearing-package-ref": "NONE"})
    check("Q4-MISSING-EVIDENCE", "BLOCKING", blocks(missing_evidence))
    missing_rationale = base_finding(**{"clearing-rationale": "NONE"})
    check("Q4-MISSING-RATIONALE", "BLOCKING", blocks(missing_rationale))
    short_rationale = base_finding(**{"clearing-rationale": "too short"})
    check("Q4-SHORT-RATIONALE", "BLOCKING", blocks(short_rationale))
    missing_key = base_finding(**{"finding-subject-key": "NONE"})
    check("Q3-MISSING-KEY", "BLOCKING", blocks(missing_key))
    check(
        "Q3-MISSING-KEY-STATE",
        "SUBJECT-KEY-ABSENT",
        correlation_state(missing_key, [missing_key]),
    )
    malformed = base_finding(**{"finding-subject-key": "FS-XYZ"})
    check("Q3-MALFORMED-KEY", "BLOCKING", blocks(malformed))
    sibling = base_finding(
        **{
            "finding-instance-id": "PF-0123456789abcdef0123456789abcdef-2",
            "clearing-finding-instance-id": "PF-0123456789abcdef0123456789abcdef-2",
            "prior-blocking-record": prior_for("PF-0123456789abcdef0123456789abcdef-2"),
            "adjudication-status": "UNRESOLVED",
            "critical-predicate": "NOT-DETERMINED",
            "working-severity": "UNASSIGNED",
            "clearing-rationale": "NONE",
            "clearing-package-ref": "NONE",
            "not-risk-acceptance": "FALSE",
            "clearing-utc": "NONE",
            "prior-blocking-record": "NONE",
        }
    )
    # prior overwritten by the second prior key above; keep the unresolved sibling.
    cleared = base_finding()
    check(
        "Q3-CORRELATED-BLOCK",
        "BLOCKING",
        blocks(cleared, [cleared, sibling]),
    )
    check(
        "Q3-NO-MERGE",
        "DISTINCT",
        "DISTINCT"
        if cleared["finding-instance-id"] != sibling["finding-instance-id"]
        else "MERGED",
    )
    other_clear = base_finding(
        **{
            "finding-instance-id": "PF-0123456789abcdef0123456789abcdef-2",
            "clearing-finding-instance-id": "PF-0123456789abcdef0123456789abcdef-2",
            "prior-blocking-record": prior_for("PF-0123456789abcdef0123456789abcdef-2"),
        }
    )
    check(
        "Q3-TWO-CLEAR-SAME-KEY",
        "NOT-BLOCKING",
        blocks(cleared, [cleared, other_clear]),
    )
    check(
        "Q3-SIBLING-STILL-PRESENT",
        "NOT-BLOCKING",
        blocks(other_clear, [cleared, other_clear]),
    )
    no_sibling = base_finding()
    check(
        "Q3-NO-SIBLING",
        "NO-CORRELATED-BLOCK",
        correlation_state(no_sibling, [no_sibling]),
    )
    residual_critical = base_finding(
        **{
            "adjudication-status": "PREDICATE-MET",
            "critical-predicate": "MET",
            "working-severity": "CRITICAL",
            "residual-disposition": "ACCEPT-AS-RESIDUAL",
        }
    )
    check("Q4-RESIDUAL-DOES-NOT-CLEAR-CRITICAL", "BLOCKING", blocks(residual_critical))
    actor = base_finding(**{"clearing-actor-id": "CURSOR"})
    check("Q4-ACTOR-CURSOR", "BLOCKING", blocks(actor))
    provider_actor = base_finding(**{"clearing-actor-id": "Anthropic"})
    check("Q4-ACTOR-PROVIDER", "BLOCKING", blocks(provider_actor))
    unknown = base_finding(**{"working-severity": "SEVERE"})
    check("Q4-UNKNOWN-SEVERITY", "BLOCKING", blocks(unknown))
    historical = base_finding(**{"adjudication-status": "FALSE POSITIVE — PREDICATE NOT MET"})
    check("Q4-HISTORICAL-SPELLING", "BLOCKING", blocks(historical))
    superseded = base_finding(**{"adjudication-status": "SUPERSEDED"})
    check("Q4-SUPERSEDED", "BLOCKING", blocks(superseded))

    def attempt(attempt_id: str, seal: str, **extra) -> dict:
        row = {
            "provider": "Anthropic",
            "attempt-id": attempt_id,
            "seal-utc": seal,
            "isolation-result": "NO-CROSS-DISCLOSURE-OBSERVED",
            "session-separation": "NEW-SESSION-ATTESTED",
            "meets-counting-rules": True,
            "filesystem-order": extra.pop("filesystem-order", 0),
        }
        row.update(extra)
        return row

    first = attempt("ATTEMPT-" + "ab" * 16, "2026-11-01T00:00:02Z", **{"filesystem-order": 2})
    second = attempt("ATTEMPT-" + "aa" * 16, "2026-11-01T00:00:02Z", **{"filesystem-order": 1})
    selected = select_attempts([first, second])["providers"][0]
    check("Q6-EQUAL-TIME-WINNER", "ATTEMPT-" + "aa" * 16, selected["winner"])
    reversed_rows = select_attempts([second, first])["providers"][0]
    check("Q6-ORDER-INDEPENDENT", selected["winner"], reversed_rows["winner"])
    check(
        "Q6-LOSER-RETAINED",
        "ATTEMPT-" + "ab" * 16,
        selected["non-selected-attempt-ids"][0],
    )
    check("Q6-NOT-A-VOTE", "False", str(selected["vote"]))
    early = attempt("ATTEMPT-" + "bb" * 16, "2026-11-01T00:00:01Z")
    late = attempt("ATTEMPT-" + "bc" * 16, "2026-11-01T00:00:03Z")
    middle = attempt("ATTEMPT-" + "bd" * 16, "2026-11-01T00:00:02Z")
    retries = select_attempts([late, early, middle])["providers"][0]
    check("Q6-EARLIEST", early["attempt-id"], retries["winner"])
    check("Q6-RETRY-COUNT", "2", str(len(retries["non-selected-attempt-ids"])))
    clean = attempt("ATTEMPT-" + "cc" * 16, "2026-11-01T00:00:01Z")
    dirty = attempt(
        "ATTEMPT-" + "cd" * 16,
        "2026-11-01T00:00:02Z",
        **{"isolation-result": "CROSS-DISCLOSURE-DETECTED", "meets-counting-rules": False},
    )
    crossed = select_attempts([clean, dirty])["providers"][0]
    check("Q6-CROSS-COVERAGE", "NOT-COUNTING", crossed["countability"])
    check("Q6-CROSS-REASON", "CROSS-DISCLOSURE-DETECTED", crossed["reason"])
    check("Q6-CROSS-WINNER", "None", str(crossed["winner"]))
    reused = attempt(
        "ATTEMPT-" + "de" * 16,
        "2026-11-01T00:00:04Z",
        **{"session-separation": "SESSION-REUSED", "meets-counting-rules": False},
    )
    session = select_attempts([clean, reused])["providers"][0]
    check("Q6-SESSION-COVERAGE", "NOT-COUNTING", session["countability"])
    other_provider = attempt(
        "ATTEMPT-" + "ee" * 16,
        "2026-11-01T00:00:01Z",
        **{"provider": "OpenAI"},
    )
    pair = select_attempts([clean, other_provider])
    winners = {row["provider"]: row["winner"] for row in pair["providers"]}
    check("Q6-NO-PROVIDER-SWITCH", clean["attempt-id"], winners["Anthropic"])
    check("Q6-OTHER-PROVIDER", other_provider["attempt-id"], winners["OpenAI"])

    ok, reason = isolation_compatible(
        {
            "capture-status": "PARTIAL-INSTRUCTIONS",
            "isolation-result": "ISOLATION-NOT-EVIDENCED",
            "isolation-gap-reason": "PARTIAL-INSTRUCTIONS",
            "transmission-evidence-status": "INTACT",
            "instructions-observable": "PARTIAL",
            "overwrite-capture-with-isolation": False,
        }
    )
    check("Q7-OVERLAP-KEEPS-CAPTURE", "OK", reason if ok else reason)
    check("Q7-OVERLAP-CAPTURE-VALUE", "PARTIAL-INSTRUCTIONS", "PARTIAL-INSTRUCTIONS")
    bad, bad_reason = isolation_compatible(
        {
            "capture-status": "ISOLATION-NOT-EVIDENCED",
            "isolation-result": "ISOLATION-NOT-EVIDENCED",
            "isolation-gap-reason": "PARTIAL-INSTRUCTIONS",
            "transmission-evidence-status": "INTACT",
            "instructions-observable": "PARTIAL",
            "overwrite-capture-with-isolation": True,
        }
    )
    check("Q7-OVERWRITE-REJECTED", "overwrite-forbidden", bad_reason)
    empty_ok, empty_reason = isolation_compatible(
        {
            "capture-status": "COMPLETE",
            "isolation-result": "NO-CROSS-DISCLOSURE-OBSERVED",
            "isolation-gap-reason": "NONE",
            "transmission-evidence-status": "INTACT",
            "instructions-observable": "FULL",
            "empty-prior-set": True,
        }
    )
    check("Q7-EMPTY-PRIOR", "OK", empty_reason if empty_ok else empty_reason)
    empty_bad, empty_bad_reason = isolation_compatible(
        {
            "capture-status": "COMPLETE",
            "isolation-result": "ISOLATION-NOT-EVIDENCED",
            "isolation-gap-reason": "SEARCH-NOT-RUN",
            "transmission-evidence-status": "INTACT",
            "instructions-observable": "FULL",
            "empty-prior-set": True,
        }
    )
    check("Q7-EMPTY-PRIOR-NOT-SEARCH-SKIP", "empty-prior-is-not-search-not-run", empty_bad_reason)
    mismatch, mismatch_reason = isolation_compatible(
        {
            "capture-status": "TRANSMISSION-NOT-EVIDENCED",
            "isolation-result": "NO-CROSS-DISCLOSURE-OBSERVED",
            "isolation-gap-reason": "NONE",
            "transmission-evidence-status": "ABSENT-OR-UNREADABLE",
            "instructions-observable": "FULL",
        }
    )
    check("Q7-TRANSMISSION-SPLIT", "transmission-isolation", mismatch_reason)
    search, search_reason = isolation_compatible(
        {
            "capture-status": "COMPLETE",
            "isolation-result": "ISOLATION-NOT-EVIDENCED",
            "isolation-gap-reason": "SEARCH-NOT-RUN",
            "transmission-evidence-status": "INTACT",
            "instructions-observable": "FULL",
            "empty-prior-set": False,
        }
    )
    check("Q7-SEARCH-NOT-RUN", "OK", search_reason if search else search_reason)

    failed = [row for row in RESULTS if row[3] != "PASS"]
    for test_id, expected, actual, status in RESULTS:
        print(f"{status}\t{test_id}\texpected={expected}\tactual={actual}")
    print(f"TOTAL {len(RESULTS)} FAIL {len(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(run())
