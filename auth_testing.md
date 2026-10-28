# Auth Testing Playbook
1. Login: POST /api/auth/login {"email":"admin@nervenpfad.de","password":"Nerven2026!"} → user + token, cookies access_token/refresh_token.
2. GET /api/auth/me with cookies or Bearer token → admin user.
3. Admin-only: POST/PUT/DELETE /api/entries, POST/DELETE /api/entries/{code}/studies, /api/dropin/*.
4. bcrypt hash in db.users starts with $2b$.
