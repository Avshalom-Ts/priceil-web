# User Messages Plan

## Goal

Allow signed-in users to send messages to platform admins from `/contact`, store each submission in a `messages` table, and provide an admin inbox under `/admin/messages` with unread-first workflow and status filters.

## Product Requirements (Approved)

1. Only authenticated users can send contact messages.
1. In `/contact`, user details are auto-filled from the authenticated user profile.
1. User can edit only:
1. `subject`
1. `content`
1. Submitting creates a new DB row in `messages`.
1. `/admin/messages` lists unread messages by default.
1. Opening a message uses `/admin/messages/:id`.
1. Inbox includes a dropdown filter with:
1. `unread`
1. `read`
1. `all`

## Data Model (Supabase)

Create `public.messages` with:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `sender_name text not null`
- `sender_email text not null`
- `subject text not null`
- `content text not null`
- `status text not null default 'unread' check (status in ('unread', 'read'))`
- `read_at timestamptz null`
- `read_by uuid null references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended indexes:

- `idx_messages_status_created_at` on `(status, created_at desc)`
- `idx_messages_user_id_created_at` on `(user_id, created_at desc)`

Recommended trigger:

- `set_messages_updated_at` before update to keep `updated_at` current.

## Security & Access Rules

1. Enable RLS on `messages`.
1. User policy: authenticated user can `insert` only when `user_id = auth.uid()`.
1. User policy: authenticated user can `select` only their own rows (optional now, useful for future “my messages” page).
1. Admin access to all rows is done from server routes using service-role Supabase client plus existing `requireAdminApi()` checks.
1. Never trust client-provided identity fields; server derives `user_id`, `sender_name`, and `sender_email` from session user.

## API Surface

### User endpoint

1. `POST /api/contact/messages`
1. Auth required (`401` if not signed in).
1. Body: `{ subject: string; content: string }`.
1. Server resolves sender identity from `supabase.auth.getUser()` and inserts row with `status='unread'`.
1. Returns `201` with `{ messageId }`.

### Admin endpoints

1. `GET /api/admin/messages?status=unread|read|all&page=1&limit=20`
1. Returns paginated message list sorted by `created_at desc`.
1. Default status is `unread`.
1. `GET /api/admin/messages/:id`
1. Returns full message details.
1. `PATCH /api/admin/messages/:id/status`
1. Body: `{ status: 'unread' | 'read' }`.
1. When changing to `read`, set `read_at` and `read_by`.
1. When changing back to `unread`, clear `read_at` and `read_by`.

## UI/UX Scope

### Contact page (`/contact`)

1. If not signed in:
1. Disable message form and show CTA to sign in.
1. Optional: keep subject/content visible but blocked.
1. If signed in:
1. Auto-populate read-only name/email fields.
1. Editable fields: subject and content only.
1. Submit to `POST /api/contact/messages`.
1. Show success/error inline feedback.

### Admin inbox (`/admin/messages`)

1. Table columns:
1. sender
1. email
1. subject
1. created at
1. status badge
1. Dropdown filter: unread/read/all (default unread).
1. Row click navigates to `/admin/messages/:id`.
1. Empty state for each filter.

### Admin message details (`/admin/messages/:id`)

1. Show full sender info, subject, content, timestamps.
1. Open detail should mark unread message as read (server-side patch) or provide explicit “mark as read” action.
1. Include status toggle action (read <-> unread).
1. Include back link preserving current filter when possible.

## Implementation Steps (Execution Runbook)

1. Add a new migration in `supabase/migrations` to create `public.messages`, indexes, and `updated_at` trigger.
1. Enable RLS and add insert/select policies for authenticated users scoped to `auth.uid()`.
1. Add `POST /api/contact/messages` route under `src/app/api/contact/messages/route.ts`.
1. Implement auth check with `createSupabaseServerClient()` and derive sender identity from session user metadata and email.
1. Validate subject/content server-side (required, trim, length limits).
1. Insert row with default `unread` status and return `201`.
1. Refactor `src/app/(site)/contact/page.tsx`:
1. Load current user.
1. Auto-fill name/email.
1. Lock name/email as read-only.
1. Keep only subject/content editable.
1. Submit to new API route.
1. Add admin API routes:
1. `src/app/api/admin/messages/route.ts` for list with status filter.
1. `src/app/api/admin/messages/[id]/route.ts` for message details.
1. `src/app/api/admin/messages/[id]/status/route.ts` for status updates.
1. Guard all admin routes using `requireAdminApi()`.
1. Implement `/admin/messages` page table UI with status dropdown and pagination.
1. Implement `/admin/messages/[id]/page.tsx` details view and read/unread toggle.
1. Ensure details view updates unread->read flow consistently.
1. Add optional unread counter badge in admin nav (future enhancement if needed).
1. Add tests for auth gating, contact insert, status filter logic, and mark-read behavior.
1. Validate in staging: signed-out block, signed-in send success, unread list visibility, detail open behavior, status transitions.

## Verification Checklist

1. Signed-out user cannot submit contact messages (`401` from API).
1. Signed-in user sees auto-filled name/email and can edit only subject/content.
1. Successful submit creates one `messages` row with `status='unread'`.
1. `/admin/messages` default view shows unread messages.
1. Filter dropdown switches correctly between unread/read/all.
1. `/admin/messages/:id` displays full message details.
1. Opening or toggling status updates `status`, `read_at`, and `read_by` correctly.
1. Non-admin users cannot access `/api/admin/messages*`.
1. Admin inbox handles empty and error states gracefully.

## Open Decisions

1. Define max length limits for `subject` and `content`.
1. Decide whether opening details auto-marks as read or requires explicit action.
1. Decide whether to support admin reply workflow in this phase (currently out of scope).
