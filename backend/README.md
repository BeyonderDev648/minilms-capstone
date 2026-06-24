# MiniLMS Backend (Express + Postgres + JWT)

This is the API layer of the MiniLMS capstone. It's a direct port of the original
Flask prototype's data model and feature logic — same 4 tables, same auth rules,
same role permissions — re-implemented as a stateless JSON API so it can serve
both the React web frontend and the Flutter mobile app from one source of truth.

## What changed vs. the Flask prototype, and why

| Prototype (Flask)              | This API (Express)                  | Why |
|---------------------------------|--------------------------------------|-----|
| SQLite file                     | Postgres (Neon/Supabase/Render)      | Rubric requires Postgres; also need a real network DB both web and mobile clients can hit |
| Server-side sessions (cookie)    | JWT in `Authorization: Bearer` header| Mobile apps can't share browser cookies with a web session - JWT works identically for both clients |
| Server-rendered HTML templates  | JSON responses                       | React and Flutter both need data, not HTML |
| `werkzeug` password hashing      | `bcryptjs` password hashing          | Same algorithm (bcrypt), pure-JS so it installs cleanly on any deploy target without native build tools |

The actual business rules (who can do what, which routes need which role) are unchanged.

## Local setup

```bash
npm install
cp .env.example .env       # then fill in DATABASE_URL and JWT_SECRET
```

Apply the schema to your Postgres database once:

```bash
psql "$DATABASE_URL" -f src/db/schema.sql
```

Seed the initial admin account (same credentials as the prototype):

```bash
npm run seed
# email:    admin@lms.local
# password: admin123
```

Run the API:

```bash
npm run dev      # with auto-reload (nodemon)
# or
npm start
```

Server starts on `http://localhost:5000` (or whatever `PORT` you set).
Check it's alive: `curl http://localhost:5000/health`

## Getting a free hosted Postgres database (recommended for your timeline)

1. [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both have a free tier,
   give you a `DATABASE_URL` connection string instantly, and have a built-in SQL
   editor where you can paste `src/db/schema.sql` directly instead of needing `psql` locally.
2. Copy the connection string into `.env` as `DATABASE_URL`.
3. Run `npm run seed` once, locally, pointed at that remote DB — it only needs to run once ever.

## API reference

All routes except `/health`, `/api/auth/register`, and `/api/auth/login` require:
```
Authorization: Bearer <token>
```

### Auth
| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | none | `{ name, email, password, role? }` — role defaults to `student`, only `student`/`teacher` are self-registerable |
| POST | `/api/auth/login` | none | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | any | Returns the logged-in user (use this to validate a stored token on app start) |

### Courses
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/courses/dashboard` | teacher/student | Teacher: their own courses. Student: courses they're enrolled in |
| GET | `/api/courses/browse` | student | All courses + which ones the student is already enrolled in |
| POST | `/api/courses` | teacher | `{ title, description? }` — create a course |
| GET | `/api/courses/teacher/:id` | teacher (owner only) | Course + its lessons + enrolled students |
| GET | `/api/courses/student/:id` | student (enrolled only) | Course + its lessons |
| POST | `/api/courses/:id/enroll` | student | Enroll in a course |
| POST | `/api/courses/:id/lessons` | teacher (owner only) | `{ title, content? }` — add a lesson |

### Admin
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/admin/users` | admin | List all users |
| PATCH | `/api/admin/users/:id/role` | admin | `{ role }` — change a user's role |
| DELETE | `/api/admin/users/:id` | admin | Delete a user (can't delete yourself) |

## Security measures implemented (for the rubric's "Authentication & Security" requirement)

- Passwords hashed with bcrypt (12 salt rounds), never stored or logged in plaintext
- JWT-based auth with expiry (`JWT_EXPIRES_IN`), verified on every protected route
- Role-based access control middleware (`requireAuth`, `requireRole`) on every sensitive route
- `helmet` for standard HTTP security headers
- CORS locked to an explicit allow-list (`CORS_ORIGIN`), not wide open
- Rate limiting on `/api/auth/login` and `/api/auth/register` to slow brute-force attempts
- All SQL uses parameterized queries (`$1, $2...`) — no string concatenation, so no SQL injection surface
- Input validation (`express-validator`) on every write endpoint
- Secrets (`DATABASE_URL`, `JWT_SECRET`) live only in `.env`, which is git-ignored — never hardcoded, never committed

## Deploying (Render example)

1. Push this folder to its own GitHub repo (or a `backend/` subfolder of your monorepo).
2. On [Render](https://render.com): New → Web Service → connect the repo.
   - Build command: `npm install`
   - Start command: `npm start`
3. Add environment variables in Render's dashboard: `DATABASE_URL`, `JWT_SECRET`,
   `JWT_EXPIRES_IN`, `CORS_ORIGIN` (set this to your deployed React app's URL once you have it).
4. Render auto-redeploys on every push to `main` — combined with `.github/workflows/ci.yml`,
   that's your CI/CD pipeline: GitHub Actions verifies the code is sound, Render's
   GitHub integration handles the actual deploy.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`:
- installs dependencies
- syntax-checks every source file
- boots the server and hits `/health` as a smoke test

This intentionally doesn't try to re-implement deployment inside the workflow — Render/Railway's
GitHub integration already does that better than a hand-rolled `gh-actions` deploy step would on a 2-day timeline.
