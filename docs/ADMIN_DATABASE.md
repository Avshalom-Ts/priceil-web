# Admin database page

`/admin/database` manages existing catalog rows in chains, stores, products,
product groups, and prices. The entry appears in the signed-in admin menu. The
existing admin layout protects the page; each server endpoint separately checks
the current Supabase user and admin membership.

## Connection to the Proxmox API

The NestJS API runs on the Proxmox server on your local network. Set a direct,
server-reachable API origin in the **web server's** environment, for example:

```dotenv
ADMIN_API_TARGET=http://<proxmox-api-host>:3000
```

Use the actual host/IP and exposed API port. The web server must be able to reach
that address. This is a server-only variable; do not give it a `NEXT_PUBLIC_`
prefix. It must point directly to NestJS, not to the web app, a page URL, or the
`/backend-api` proxy. The configured value is an origin without a path, username,
password, query, or fragment.

If `ADMIN_API_TARGET` is omitted, the server uses `API_PROXY_TARGET`, then
`NEXT_PUBLIC_API_URL`. There is no localhost fallback for admin requests.
Rebuild/restart the web container on its hosting server after deploying the code
and environment changes. No local workstation API or database needs to be started.

For deployments where a reverse proxy changes Next's internal request origin,
also configure the public website origin explicitly:

```dotenv
ADMIN_WEB_ORIGIN=https://<your-web-host>
```

Mutation requests require an Origin header matching this value, or Next's request
origin when unset. The implementation does not trust arbitrary forwarded host
headers to authorize mutations. Existing Supabase public credentials and the
server-only service-role credential are still required by the existing admin auth
helpers. Web and API must use the same Supabase identity project and admin roles.

## Request boundary

Browser calls go to dedicated Next routes:

| Web route | Methods | NestJS destination |
| --- | --- | --- |
| `/api/admin/database/tables` | GET | `/admin/database/tables` |
| `/api/admin/database/[table]` | GET | `/admin/database/:table` |
| `/api/admin/database/[table]/[id]` | GET, PATCH, DELETE | `/admin/database/:table/:id` |

Every request verifies the user with the existing `requireAdminApi()` helper.
After that verification, the server obtains the matching session's access token
and forwards it as Bearer authorization. NestJS independently validates that token
and current membership. Browser-supplied authorization/role headers, cookies,
service credentials, and the shared paid API key are not forwarded upstream.
Public route discovery and the public proxy have no new admin capabilities.

The proxy limits tables, path segments, list query keys, and mutation payload
shapes. PATCH and DELETE require same-origin JSON, with an explicit current
revision. The body is limited to 1 MiB and upstream calls time out after 15 seconds.
Responses are uncached. Safe field errors, conflict status codes, and Retry-After
are preserved. Browser helpers decode the backend envelope and dynamic metadata
before displaying it.

## Editor behavior

- Table selector, 300 ms debounced search (Enter searches immediately), and page
  sizes of 25, 50, 75, and 100. Table/query/page-size changes reset pagination.
- Results show every scalar column from API metadata. Wide tables scroll; no
  relationship arrays are expanded. Row clicks and keyboard-accessible Edit
  buttons fetch fresh details before opening the modal.
- Editable controls follow the backend policy. Other fields appear as reference
  information with read-only reasons. Null, empty text, false, zero, string IDs,
  and exact decimal strings remain distinct.
- Save sends only changed editable values. Cancel, Escape and backdrop closing
  ask before discarding a changed draft. Pending mutations cannot be submitted
  twice or dismissed. The browser also warns before unloading a dirty editor.
- Failed saves preserve the draft. Loading fresh data after a conflict preserves
  edited fields, refreshes untouched fields, shows current saved values for
  comparison, and requires review confirmation before saving the rebased draft.
- Delete has a separate permanent-deletion confirmation showing table and ID.
  Backend dependency conflicts stay in the editor; there are no cascading deletes.
- Success refreshes the active query, updates totals and clamps pagination when
  the last page disappears. Focus returns to the row action or table selector.
- Hebrew RTL, dark/light themes, focus trapping, labels and status/error messages
  use existing UI conventions and Radix dialogs.

Imports can overwrite manual edits or recreate deleted rows, as the page explains.
Audit persistence and delivery are owned by the API; the web does not issue a
separate audit write. Table creation, schema changes, identity/role management,
bulk changes, and record creation are outside this editor.

## Validation

```sh
pnpm test:admin
pnpm exec tsc --noEmit --incremental false
pnpm lint
pnpm build
```

The admin tests use Node's built-in runner with the installed TypeScript compiler
to load the actual API/client/validation modules. They mock identity/network
boundaries, not the catalog mutation contract. No new test framework is required,
and these tests never connect to Proxmox or Supabase or mutate real records.

After deploying web and API, validate with a test admin against non-production
data: choose each table, search, switch page sizes, cancel edits, save an exact
decimal/null/boolean value, trigger a revision conflict, block a dependent delete,
delete an eligible record, and confirm audit delivery. Verify keyboard operation,
focus restoration, narrow-screen scrolling, and both themes in the browser.
