# Admin Database Management — Web Plan

Status: implemented in priceil-web. Deployment to the hosting server and live Proxmox/Supabase browser verification remain pending. No live databases were modified.
Companion and authoritative backend contract: `../priceil-api/NEXT_PLAN.md`.

## Goal and scope

Add `/admin/database` to the existing admin area so admins can browse, search, edit/update, and delete existing catalog records. Creating rows, bulk actions, schema editing, and arbitrary SQL are outside the initial scope.

The initial dropdown will contain `chains`, `stores`, `products`, `product_groups`, and `prices`, provided by the API allowlist. This list reflects the current API entities; verify the deployed schema before implementing. Identity, admin roles, API keys, usage, audit/system tables remain in their dedicated workflows. Additional tables require an explicit backend field policy.

The editor changes **row content only**. The table selector chooses existing tables; column metadata describes how to display existing fields and edit permitted values. Admins cannot change table definitions, column names/types, constraints, or indexes through this page.

## Existing project integration

- New page: `src/app/(site)/admin/database/page.tsx`, under the existing protected admin layout.
- Reuse `requireAdminPage()` and `requireAdminApi()` from `src/lib/admin-auth.ts`. Existing Supabase auth/admin membership supersedes the older AGENTS.md description of a phase without auth; do not build a second auth system.
- Add a database-management link/card in the existing admin navigation/dashboard.
- Keep browser API helpers and strict shared response types in `src/lib/api.ts`; use plain fetch and existing UI primitives. Add table/dialog primitives only as needed; avoid a new data-fetching or form framework.
- Current catalog fetches use `/backend-api`, forwarded through a public Next catch-all that attaches a shared app API key. Add dedicated authenticated admin forwarding routes instead of reusing that public proxy.

## Page layout and behavior

Top toolbar, in RTL order:

1. Table dropdown containing allowed tables, defaulting to `products` if available, otherwise the first allowed table.
2. Search input scoped to the selected table, with an accessible label and hint listing searchable fields. Debounce about 300 ms; Enter searches immediately.
3. Page-size dropdown with exactly **25, 50, 75, 100**, default **25**.

Below the toolbar:

- Table with every persisted scalar column returned in API metadata, including read-only IDs, relationship keys, source timestamps, and derived values. Relation collections are not database columns and are not expanded into nested tables.
- Horizontal scrolling for wide schemas, readable long text, sticky headers where practical, total results, page indicator, and Previous/Next controls.
- Format null distinctly from empty string, show false/zero correctly, preserve decimal strings, and keep barcodes/IDs readable in RTL with local LTR styling where needed.
- Clicking a row fetches its fresh detail and revision and opens the edit modal. Provide a keyboard-accessible Edit action and meaningful table headers.
- Loading, empty table, no search matches, request failure with Retry, 401/403, and rate-limit feedback. Clear or mark old results while a different table loads; never show old rows under new headers.
- Changing table resets query and page to 1; changing query or page size resets page to 1. Preserve page size across table changes. Cancel obsolete requests or ignore stale responses so earlier searches cannot replace newer results.
- Optionally mirror table/query/page/limit in URL search parameters for refresh/back navigation; validate restored values. Keep this simple and do not add a global state library.

## Edit modal

- Header: selected table and primary-key value.
- Render editable fields according to metadata: text/textarea, integer/decimal inputs, boolean controls, and explicit null toggles for nullable fields. Do not turn every blank into null.
- Render non-editable fields as clearly labeled reference information with the reason: primary key, relationship key, derived identity, source timestamp, or server-managed value.
- Use the backend field policy, not a duplicated frontend guess. The initial policy allows descriptive/business fields while locking IDs, foreign keys, normalized identities, and source/server timestamps.
- For products, editing `itemName` also updates derived normalized name and group association on the server; show refreshed values after Save. For product groups, `name` changes the display label only; explain that membership stays tied to normalized identity.
- Footer: **Save** and **Cancel**, plus a distinct destructive **Delete** action when permitted.
- Save sends only changed editable keys plus the detail revision. Disable Save when unchanged, invalid, or pending. Show field-specific validation and preserve edits on failure.
- Cancel closes without a request. Closing via Escape/backdrop uses the same unsaved-change handling; restore focus to the row/action.
- During mutations, prevent duplicate submissions and keep pending status accessible. Successful Save closes the modal, announces success, and refetches the active result page so search membership and total counts stay correct.
- A stale revision (409) preserves the draft and offers to reload the current record for review; never automatically overwrite it. A deleted row (404) offers to close and refresh.
- Focus trap, keyboard operation, accessible labels/error messages, scrollable content for large rows, and responsive layout in light/dark modes. Keep root Hebrew/RTL attributes.

## Delete interaction

- Delete opens a separate confirmation identifying the table and record ID; Cancel makes no request.
- Confirm sends the current revision; success closes dialogs and refreshes results, returning to the preceding valid page if the last row on a page was removed.
- Show backend dependency conflicts without losing modal context. No cascading deletes or automatic unlinking.
- Show concise guidance that future imports may overwrite manual edits or recreate deleted imported records. Permanent overrides are outside scope.

## API integration and authentication

Dedicated Next routes:

| Method | Web route | NestJS destination |
| --- | --- | --- |
| GET | `/api/admin/database/tables` | `/admin/database/tables` |
| GET | `/api/admin/database/[table]` | `/admin/database/:table` |
| GET | `/api/admin/database/[table]/[id]` | `/admin/database/:table/:id` |
| PATCH | `/api/admin/database/[table]/[id]` | `/admin/database/:table/:id` |
| DELETE | `/api/admin/database/[table]/[id]` | `/admin/database/:table/:id` |

- Every Next handler verifies the existing session and current admin membership; mutations enforce same-origin/CSRF protection. Both current admin roles have catalog permissions in the proposed policy.
- Forward the session access token server-side as Bearer authorization. NestJS must independently validate identity and current admin membership. Never authorize using the shared public app API key or client role fields.
- Use a server-only API target configuration that points to NestJS directly, avoiding rewrite loops. Forward only supported query/body parameters and approved headers; use no-store and bounded upstream timeouts, preserve safe backend status/error details, and handle unreachable API errors.
- Keep secrets/service-role keys out of public environment variables and browser bundles. Do not add PATCH/DELETE to the generic public proxy merely to support this screen.
- Helpers in `src/lib/api.ts`: load table metadata, list rows, get row detail, update row, delete row. Use explicit admin URLs without changing existing public helper behavior.
- Model dynamic cells with constrained scalar unions and `unknown` validation, never `any`. Decode the standard backend envelope and structured validation/conflict errors.
- List contract: `q`, `page`, `limit`; response `{ items, total, page, limit, totalPages }` inside `data`. Metadata includes column types, database names, editability/reasons, constraints, and search fields. Detail returns `{ item, revision, references }`; PATCH sends `{ changes, revision }`; DELETE sends `{ revision }`.
- Decimal values remain strings for exact editing. Respect metadata nullability and distinguish null, empty text, false, and zero.

## Implementation sequence

1. Finalize the API metadata/field policy and confirm the deployed table inventory together with the backend plan.
2. Implement/test NestJS admin authorization and endpoints before connecting live mutations.
3. Add protected Next forwarding routes and typed helpers in `src/lib/api.ts`.
4. Add `/admin/database`, toolbar, metadata-driven full-column table, pagination, and state/error handling.
5. Add fresh-detail edit modal, typed/null-aware fields, reference information, Save/Cancel, and revision-conflict handling.
6. Add Delete confirmation and dependency/conflict feedback; add navigation entry and importer guidance.
7. Verify the full workflow against a seeded non-production database; run `pnpm test:admin`, TypeScript checks, `pnpm lint`, and `pnpm build`.

## Acceptance checks

- Signed-out/non-admin users cannot open the page or call forwarding routes; direct NestJS calls enforce the same protection. Existing admin pages keep working.
- Every allowed table appears; selecting one displays all its persisted scalar columns. Sensitive/system tables do not leak into the selector.
- Search works within the selected table; 25/50/75/100 selection, pagination, totals, empty states, Retry, and stale-request cancellation work.
- Each row opens a modal with fresh values, editable controls, read-only reference information, Save, Cancel, and Delete where allowed.
- Cancel and discarded drafts make no mutation; valid Save persists and refreshes results. Null/empty/decimal/boolean/string-ID values round-trip correctly.
- Invalid/read-only writes fail server-side even if UI controls are bypassed. Concurrent changes preserve drafts and require review.
- Delete confirmation removes exactly one eligible row; dependent rows are blocked with useful guidance; pagination remains valid.
- Keyboard navigation, focus restoration, narrow screens, wide tables, Hebrew RTL, and both themes are usable.
- Successful mutations produce backend audit entries; the UI does not substitute a best-effort audit request for transactional backend logging.

## Planning assumptions

Phase one covers catalog records only and permits both existing admin roles to edit/delete. Record creation, foreign-key reassignment, bulk actions, persistent importer overrides, and generic management of security/account tables are deferred. The implementation follows these boundaries.

## Implementation and verification

- Added `/admin/database` under the existing protected layout and an admin-menu entry. The toolbar, all-column table, pagination, modal, read-only references, null-aware inputs, Save/Cancel, delete/discard confirmations, conflict review, refresh, and focus handling are implemented.
- Added dedicated authenticated forwarding routes and typed/decoded fetch helpers. Requests use the verified user's session token, reject cross-origin mutations, never attach the paid app key, enforce path/query/payload boundaries, and use no-store and an upstream timeout.
- Connection target is the API on the local-network Proxmox server, via server-only `ADMIN_API_TARGET` or existing API target settings. There is no localhost admin fallback. See `docs/ADMIN_DATABASE.md` for reverse-proxy origin settings and deployment checks.
- `pnpm test:admin`: 14 tests passed, covering scalar fidelity, drafts/rebase, authorization failures, verified token forwarding, CSRF, body limits, path/query validation, conflicts, and safe upstream failures.
- TypeScript and focused ESLint checks passed. Full repository lint reports an existing cookie-banner error and admin-users warning outside this feature.
- An offline Webpack production build passed using a temporary Google-font response fixture; the normal network-enabled build was declined, and no font configuration was changed in the repository.
- Live browser/UI and Proxmox integration checks were not run: this checkout has no configured web session or running frontend. Tests did not contact Supabase or mutate any real database.
