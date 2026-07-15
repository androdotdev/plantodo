# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue**. Instead, send a private report to the repository maintainer.

**How to report:**
- Open a **draft security advisory** on GitHub: go to the repo's "Security" tab → "Advisories" → "New draft advisory"
- Or email the maintainer directly (available through commit history)

You should receive a response within 48 hours. If you don't, follow up via the same channel.

## Scope

The following are in scope:
- Authentication bypass (Google OAuth, API keys)
- Unauthorized access to plans
- Server-side code execution
- Data exposure via API endpoints
- XSS in plan HTML rendering

The following are **out of scope**:
- Missing rate limiting (tracked as a regular issue)
- Missing CSP headers (tracked as a regular issue)
- Dependency vulnerabilities (covered by Dependabot)

## Supported Versions

There are no formal releases yet. The `main` branch receives security fixes as they are identified. If you need a backport, mention it in your report.

## Disclosure

We follow coordinated disclosure: we'll work with you to fix the issue before public disclosure. We'll credit you in the fix commit if you'd like.
