# Security Compound

> This file is the project's security memory. Update it after every analysis run.
>
> When the agent flags something that turns out to be safe, document it here.
> When a risk is knowingly accepted, document it here.
> The meta-security skill reads this file before every analysis and uses it to avoid
> repeating the same false positives and to focus on what actually matters for this project.

---

## 1. Project Architecture Context

Architectural facts that affect security reasoning. Without this context, the agent may flag
safe patterns or miss relevant threats.

### Example — Internal-only service

```
This service is only reachable from the internal network via the service mesh.
It does not receive unauthenticated external traffic. Auth and rate limiting are
enforced upstream by the API Gateway before requests reach this service.
```

### Example — Deliberate use of a "dangerous" function

```
The eval() calls in src/rules-engine/evaluator.py operate on expressions that are
pre-validated by a JSON Schema and authored only by internal operators via the
admin panel (which requires MFA). There is no path for external user input to reach
the evaluator.
```

### Example — Known third-party integration behavior

```
The webhook receiver at POST /webhooks/payments accepts unsigned payloads from
our payment processor. Signature validation is intentionally omitted because the
processor does not support it for this event type. Requests are validated by source
IP allowlist instead (see infra/firewall-rules.tf).
```

_(Add your own architecture notes below)_

---

## 2. Confirmed False Positives

Patterns flagged in previous analysis runs that are safe in this codebase.
Documenting them here prevents the same noise in future runs.

Format:

```
### [Short description of the pattern]
- **Flagged as**: [What the agent reported]
- **Why it is safe here**: [Specific reason in this codebase]
- **Evidence**: [File path, line, or commit if helpful]
- **Confirmed by**: [Name / role]
- **Date**: [YYYY-MM-DD]
```

### Example — MD5 usage in cache layer

```
- Flagged as: Weak cryptographic algorithm (CWE-327)
- Why it is safe here: md5() in src/cache/key_builder.py is used exclusively for
  generating cache key fingerprints from content hashes. It is never used for
  password hashing, token generation, or any security-sensitive purpose.
- Evidence: src/cache/key_builder.py — all call sites confirmed
- Confirmed by: security-team
- Date: 2026-03-10
```

### Example — Hardcoded credentials in test fixtures

```
- Flagged as: Hardcoded credentials (CWE-798)
- Why it is safe here: The strings "admin123" and "test-secret" appear only in
  tests/fixtures/ and are used exclusively in isolated test environments that
  have no access to production systems.
- Evidence: grep -r "admin123" tests/ — only in fixtures/
- Confirmed by: security-team
- Date: 2026-03-10
```

_(Add confirmed false positives below as they are discovered)_

---

## 3. Accepted Risks

Known vulnerabilities or gaps that the team has decided not to fix, with documented rationale.
Every accepted risk must have an owner and a review date.

Format:

```
### [Risk ID] — [Short title]
- **Description**: [What the risk is]
- **Reason for acceptance**: [Why it is not being fixed]
- **Compensating controls**: [What reduces the risk in practice]
- **Owner**: [Name / team]
- **Review date**: [YYYY-MM-DD — when to reconsider this decision]
```

### Example

```
### AR-001 — No CSRF protection on /api/legacy/*
- Description: Legacy endpoints under /api/legacy/ lack CSRF tokens.
- Reason for acceptance: These endpoints are being decommissioned in Q3 2026.
  The cost of backporting CSRF protection outweighs the short remaining lifetime.
- Compensating controls: SameSite=Strict cookies are enforced globally, which
  mitigates the most common CSRF attack vectors in modern browsers.
- Owner: backend-team
- Review date: 2026-09-01
```

_(Add accepted risks below)_

---

## Changelog

| Date      | Change                                       | Author |
| --------- | -------------------------------------------- | ------ |
| (initial) | File created from meta-security template |        |
