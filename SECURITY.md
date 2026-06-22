# Security Policy

We take the security of Open Air seriously. Thank you for helping keep it and its users safe.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately to **openair.mailer@gmail.com** with:

- A description of the issue and its impact
- Steps to reproduce (proof-of-concept if possible)
- Affected routes/components and any relevant logs

We aim to acknowledge within a few days and to provide a remediation timeline after triage. Please give us reasonable time to fix the issue before public disclosure.

## Scope

In scope: authentication, multi-tenant authorization, the `/sys` admin plane, the public/token-sync APIs, billing, and user-generated content.

## Our posture

- Application auth via Auth.js; an **isolated** platform-admin plane (scrypt + mandatory TOTP 2FA, rate-limited login, revocable sessions).
- Server-derived authorization on every tenant-scoped path; append-only audit logs.
- Hardened HTTP headers; CSP (Report-Only → enforced).
- XSS-safe rendering; `http(s)`-only profile URLs; rate-limited public endpoints.

Details: [docs/security.md](docs/security.md).

## Supported versions

The `main` branch receives security fixes. Please run a recent build.
