# DesignArena

A production-ready design competition platform: email authentication, submissions, organizer moderation, a public gallery, secure voting, and published results.

Contest names, dates, and guidelines are stored in PostgreSQL. They are not hardcoded in the UI.

## Features

- Public landing page, contest pages, gallery, voting, and results
- Email OTP / magic-link sign-in (Supabase Auth; Google is not required)
- Design submissions with server-side file validation and unique entry IDs (`C1-001`)
- Organizer dashboard gated by `ADMIN_EMAILS` on the server
- One authenticated vote per contest, enforced with a unique constraint and a database function
- Unpublished vote totals stay hidden from voters
- Optional Resend emails; the app still works with in-app confirmations only
- Row Level Security, private storage, and authorized file routes

## Local setup

1. Install Node.js 20+ and npm.
2. Create a [Supabase](https://supabase.com) project.
3. Copy environment variables:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

4. Install packages and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run typecheck
npm run lint
npm test
```

## Environment variables

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Anon or `sb_publishable_…` key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | `service_role` or `sb_secret_…`. Never `NEXT_PUBLIC_` |
| `ADMIN_EMAILS` | Server only | Comma-separated organizer emails |
| `RESEND_API_KEY` | Server, optional | Leave empty to skip outbound app email |
| `EMAIL_FROM` | Server, optional | Verified Resend from-address |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects | `http://localhost:3000` locally |

The service-role key is used after the Next.js server has already checked the signed-in user and `ADMIN_EMAILS`. It is never sent to the browser. Participants cannot self-promote.

## Supabase setup and migrations

1. In the Supabase dashboard, go to **SQL Editor**.
2. Run `supabase/migrations/0001_init.sql`.
3. Run `supabase/migrations/0002_hardening.sql` (safe if `0001` already includes the same changes).
4. Confirm Storage contains a **private** bucket named `design-files`.
5. Authentication → Providers → Email: enable magic link and/or OTP. Disable unused social providers if you want email-only login.
6. Authentication → URL configuration:
   - Site URL: `http://localhost:3000` (or your Vercel URL in production)
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://YOUR_DOMAIN/auth/callback`

If you use the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The first migration seeds three contests (`contest-1`, `contest-2`, `contest-3`) if they do not already exist. Organizers can rename them in `/admin/contests`.

### Privileged server operations

These bypass RLS via the service-role client **after** server-side authorization:

- File uploads to the private `design-files` bucket
- Serving primary/supporting files through `/api/files/...` after an access check
- Approving/rejecting submissions and writing audit logs
- Creating/updating contests and publishing results
- CSV export
- Looking up participant emails for organizers

Direct public object URLs are denied by storage policies.

## Configure the organizer email

Set `ADMIN_EMAILS` in `.env.local` and in Vercel:

```
ADMIN_EMAILS=you@college.edu
```

Sign in at `/login` with that same address. `/admin` layout and every admin server action call `requireAdmin()`, which checks the authenticated email against this list. Hiding the Admin link is not a security boundary.

## Demo seed (development only)

Sample gallery entries are **not** created in production automatically.

```bash
npm run seed:dev
```

This creates a demo participant and one approved `[SAMPLE]` entry per contest so you can test the gallery before real work arrives. Delete those rows before a live season.

## Test a full submission, approval, and voting workflow

1. Apply migrations and fill `.env.local`.
2. In `/admin/contests`, set a contest to **Submissions open** with a current submission window (the seed already does this).
3. Sign in as a non-admin participant at `/login`.
4. Submit a PNG/JPG/WEBP on `/submit`. Note the entry ID (`C1-001`). Pending work must not appear on `/gallery`.
5. Sign in as the organizer. On `/admin/submissions`, approve the entry. It should appear on `/gallery`.
6. Set the contest status to **Voting open** with a current voting window.
7. Sign in as a **different** verified account (you cannot vote for your own entry).
8. Open `/gallery` or `/vote`, select a favorite, confirm the ballot. You may vote in one, two, or all three contests.
9. Confirm `/results` still hides totals until you publish.
10. On `/admin/voting`, publish verified results. `/results` then shows winners, vote totals, and ties.

Also confirm:

- A second vote in the same contest is rejected
- After submission close, new uploads and edits are blocked
- Live vote counts are not shown on public pages while voting is open

## Testing

```bash
npm test
```

Vitest covers:

- Unauthenticated submit/vote denial
- Unapproved work excluded from the public gallery
- One vote per contest, votes across three contests, no self-votes
- Closed voting windows and cross-contest ballots
- Duplicate/concurrent tally integrity
- Hidden unpublished results and explicit ties
- Rejected uploads and malicious prototype URLs
- Non-admin emails cannot moderate

Database unique constraints and `cast_vote()` remain the source of truth in production.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel (Next.js defaults).
3. Set all environment variables from `.env.example`. Use your production Site URL for `NEXT_PUBLIC_SITE_URL`.
4. In Supabase, add `https://YOUR_DOMAIN/auth/callback` to redirect URLs and set the Site URL to the Vercel domain.
5. Deploy. Run the SQL migrations against the same Supabase project if you have not already.
6. Sign in with an `ADMIN_EMAILS` address and publish contests.

Optional: add `RESEND_API_KEY` and a verified `EMAIL_FROM` for submission and voting emails. If those are missing, the UI still confirms actions in the app and does not claim an email was sent.

## Architecture

- `src/app` — App Router pages and file/export route handlers
- `src/actions` — Server Actions (auth, submissions, votes, admin)
- `src/lib/data` — database reads
- `src/lib/validations` — Zod schemas
- `src/lib/supabase` — browser, cookie, and service-role clients
- `supabase/migrations` — schema, RLS, storage, seed contests

Voting writes go through `public.cast_ballot` / `public.cast_vote`. Those functions use `auth.uid()`, never a client-supplied voter id, and keep `(contest_id, voter_id)` unique.
