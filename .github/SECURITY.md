# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅                 |
| < 1.0   | ❌                 |

## Reporting a Vulnerability

**DO NOT CREATE A PUBLIC ISSUE FOR SECURITY VULNERABILITIES**

Please report security vulnerabilities by emailing **security@yourdomain.com**.

You should receive a response within 48 hours. If you don't, please follow up via email.

Please include the requested information listed below to help us better understand the nature and scope of the possible issue:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Disclosure Policy

When we receive a security bug report, we will assign it to a primary handler. This person will coordinate the fix and release process:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any potential similar problems.
3. Prepare fixes for all releases still under maintenance. These fixes will be released as fast as possible.

## Security Best Practices

- Always use the latest version of dependencies
- Regularly update your Docker images
- Use environment variables for sensitive data
- Enable 2FA on your GitHub account
- Regularly audit access logs
- Follow the principle of least privilege