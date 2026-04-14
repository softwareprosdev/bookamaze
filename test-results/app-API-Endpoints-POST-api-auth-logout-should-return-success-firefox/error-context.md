# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> API Endpoints >> POST /api/auth/logout should return success
- Location: e2e\app.spec.ts:178:3

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:3000
Call log:
  - → POST http://localhost:3000/api/auth/logout
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0.2) Gecko/20100101 Firefox/148.0.2
    - accept: */*
    - accept-encoding: gzip,deflate,br

```