# MiniLMS Frontend (React + Vite)

The web client for the MiniLMS capstone. Talks to the Express/Postgres backend
over JWT-authenticated REST calls.

## Local setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and point `VITE_API_URL` at your backend (local or deployed):
```
VITE_API_URL=http://localhost:5000/api
```

Run it:
```bash
npm run dev
```

## Pages / routes

| Path | Who | Purpose |
|---|---|---|
| `/login`, `/register` | everyone | Auth |
| `/dashboard` | student/teacher | Teacher: their courses. Student: enrolled courses. Admins are redirected to `/admin/users` |
| `/courses` | student | Browse + enroll in all available courses |
| `/student/courses/:id` | student (enrolled) | View a course's lessons |
| `/teacher/courses/new` | teacher | Create a course |
| `/teacher/courses/:id` | teacher (owner) | View lessons + enrolled students |
| `/teacher/courses/:id/lessons/new` | teacher (owner) | Upload a lesson |
| `/admin/users` | admin | List users, change roles, delete users |

Route access is enforced both by React (`ProtectedRoute`/`RoleRoute` redirect
if you're the wrong role) **and** by the backend (every API call is checked
server-side too) — the frontend guard is for UX, the backend check is the
actual security boundary, since a determined user could bypass frontend
routing but can't bypass the API's own role checks.

## Auth flow

- `AuthContext` (`src/context/AuthContext.jsx`) holds the current `user` and `token`, persisted to `localStorage`.
- `src/api/client.js` is a shared axios instance: every outgoing request automatically gets `Authorization: Bearer <token>` attached, and a `401` response automatically clears the stored session.

## Design system

Defined as CSS variables in `src/index.css` — warm paper background, a serif
display face (Fraunces) for headings, Inter for body/forms, hairline dividers
instead of cards/shadows everywhere. The course list ("the ledger") is the
one deliberately distinctive element; everything else stays quiet on purpose.

## Deploying (Vercel example)

1. Push this folder to its own GitHub repo.
2. On [vercel.com](https://vercel.com): **Add New -> Project** -> import the repo.
   Vercel auto-detects Vite; defaults are correct (`npm run build`, output dir `dist`).
3. Add an environment variable: `VITE_API_URL` = your live backend URL + `/api`
   (e.g. `https://lms-backend-production-f49e.up.railway.app/api`).
4. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.
5. **Important:** go back to your backend's environment variables (Railway/Render)
   and update `CORS_ORIGIN` to this exact Vercel URL — otherwise the browser
   will block requests with a CORS error even though the API itself works fine.

From here, every `git push` to `main` auto-redeploys on Vercel, and
`.github/workflows/ci.yml` lints + build-checks every push - that's CI/CD
covered for the frontend.
