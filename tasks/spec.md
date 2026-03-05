# Licitor Technical Specification

## Document Metadata
- Project: `licitor`
- Last updated: 2026-03-05
- Owner: Product + Engineering
- Status legend: `Not Started`, `In Progress`, `Blocked`, `Accepted`

## Phase Tracker
| Phase | Name | Status | Acceptance Gate |
|---|---|---|---|
| 0 | Foundation and Tooling | Accepted | Build + lint + unit + integration baseline stable |
| 1 | Listing Creation and Management | Accepted | Listing CRUD + image upload + validation complete |
| 2 | Browse and Search Listings | Accepted | Search/filter UX and query performance accepted |
| 3 | Bidding and Real-Time Updates | Not Started | Bid flow + concurrency + live updates accepted |
| 4 | Auction Finalization and Notifications | Not Started | Auction close job + winner selection + notifications accepted |
| 5 | User Dashboard | Not Started | My listings, bids, watching views accepted |
| 6 | AI Smart Listing Creator | Not Started | AI draft generation with guardrails accepted |
| 7 | AI Natural Language Search | Not Started | NL query parsing to structured filters accepted |
| 8 | AI Description Enhancer | Not Started | AI rewrite workflow accepted |
| 9 | Polish, CI, Prod DB switch and publishing | Not Started | CI/CD + prod DB migration + deploy readiness accepted |

## Product Goals
- Build a simplified eBay-style auction app for learning and portfolio-quality engineering.
- Keep architecture clear and testable with strong typing and validation.
- Ship incrementally via phase gates with measurable acceptance criteria.

## Non-Goals (Current Scope)
- Complex shipping/payment/dispute workflows.
- Multi-currency checkout and tax/VAT handling.
- Enterprise moderation and anti-fraud systems.

## Current Stack and Constraints
- Framework: Next.js 16 (App Router) + React 19 + TypeScript.
- Auth: BetterAuth (already implemented for register/login/profile).
- DB: SQLite + Drizzle ORM (dev first), switch to prod DB in Phase 9.
- UI: Tailwind v4 + shadcn components.
- Forms: React Hook Form + Zod.
- AI: Vercel AI SDK.
- Tests: Vitest (unit + integration), minimum 80% coverage per phase.

## System Architecture (Target)
- `src/app/*`: routes, pages, server components.
- Route grouping policy:
- `src/app/(auth)/*` contains auth pages (`/login`, `/register`) and auth-only shells.
- `src/app/(main)/*` contains product pages (`/`, `/listings`, `/dashboard`, `/profile`).
- No duplicate non-grouped route trees for paths owned by route groups.
- `src/server/actions/*`: writes/mutations (create listing, place bid, watch item, etc.).
- `src/server/queries/*`: read models and filtering/search queries.
- `src/lib/db/*`: Drizzle client, schema, seed.
- `src/lib/validators/*`: shared Zod schemas (input/output contracts).
- `src/components/ui/*`: shadcn primitives.
- `src/components/*`: feature components.
- `test/unit/*`: pure logic tests.
- `test/integration/*`: DB + action/query integration tests.

### Canonical Source Tree (Phase 0)
- `src/app/(auth)`
- `src/app/(main)/listings`
- `src/app/(main)/dashboard`
- `src/app/(main)/profile`
- `src/app/api/auth/[...all]`
- `src/app/api/cloudinary`
- `src/components/ui`
- `src/components/auth`
- `src/components/listings`
- `src/components/bidding`
- `src/components/dashboard`
- `src/components/shared`
- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/lib/utils.ts`
- `src/lib/db`
- `src/lib/validators`
- `src/lib/ai`
- `src/hooks`
- `src/server/actions`
- `src/server/queries`
- `src/types`

## Data Model (Target Additions)
- `listings`
- `listing_images`
- `bids`
- `watchlist`
- `auction_events` (optional audit trail)
- `notifications`

### Listing (target fields)
- `id`, `sellerId`, `title`, `description`, `category`, `condition`
- `startingBid`, `reservePrice` (nullable), `currentBid`
- `startAt`, `endAt`, `status` (`draft|live|ended|cancelled`)
- `winnerBidId` (nullable), `createdAt`, `updatedAt`

### Bid (target fields)
- `id`, `listingId`, `bidderId`, `amount`, `createdAt`
- unique/index strategy to support efficient highest-bid queries

### Watchlist
- `id`, `listingId`, `userId`, `createdAt`
- unique `(listingId, userId)`

### Notification
- `id`, `userId`, `type`, `payloadJson`, `readAt` (nullable), `createdAt`

## Cross-Cutting Requirements
- Authorization: only owners can edit/cancel own listings; only authenticated users can bid/watch.
- Validation: all form and server action inputs validated via Zod.
- Error handling: typed result pattern for expected business errors.
- Idempotency/concurrency: bid placement must be transaction-safe.
- Accessibility: keyboard-friendly forms, labels, focus states.
- Observability: structured logs for key domain events.

## Testing and Quality Gates
- Required per phase before acceptance:
- `npm run lint` passes.
- `npm run build` passes.
- Unit + integration tests added for all new behavior.
- Coverage >= 80% for changed/new modules (line + branch target).
- Include edge case tests (authorization, validation, race conditions where relevant).

## Phase Specifications

## Phase 0 - Foundation and Tooling
Approval note: Approved on 2026-02-27.

### Scope
- Canonicalize folder layout, route grouping, and import paths.
- Establish deterministic test infrastructure and reusable test primitives.
- Lock acceptance gates for lint, build, unit, and integration checks.

### Requirements
- Source layout and routing:
- Use grouped routes only for auth/main pages and remove duplicate non-grouped route implementations.
- Scaffold missing directories in `src/` for app/components/lib/hooks/server/types.
- Canonicalize imports so app/server/test code resolves DB from `@/lib/db/*` and validators from `@/lib/validators/*`.
- Testing architecture:
- Use Vitest split config for unit and integration suites.
- Use one integration SQLite DB (`test/test.db`).
- Run migrations once in `test/global-setup.integration.ts`.
- Apply per-test transaction rollback hooks from shared helpers (`withTestTransaction(...)` or equivalent).
- Keep deterministic hard-reset helper as explicit fallback only when transaction rollback is unsuitable.
- Baseline testing assets:
- Add fixtures in `test/fixtures` with at least user and listing factories.
- Add MSW baseline handlers in `test/mocks` plus setup wiring.
- Include one fixture usage example in integration tests.
- Include one MSW usage example in unit tests.
- Quality gates:
- `npm run lint`
- `npm run build`
- `npm run test:unit`
- `npm run test:integration`

### Deliverables
- Updated `tasks/spec.md` with Phase 0 requirements and canonical tree.
- Updated `tasks/todo.md` with ordered implementation checklist and dependencies.
- Implemented route-group canonicalization and module-path migration.
- Implemented integration transaction harness, fixture factories, and MSW baseline mock wiring.
- Verified local quality gates are green.

### Acceptance
- No runtime/test imports remain from deprecated paths `@/db/*` or `@/lib/validation/*`.
- Grouped routes serve `/(auth)` and `/(main)` endpoints with no duplicate top-level route files for same endpoints.
- Integration tests run against one DB and roll back each test transaction.
- Fixture and MSW usage examples execute in tests.
- Local quality gates pass: lint, build, unit, integration.

## Phase 1 - Listing Creation and Management
Approval note: Approved on 2026-03-03.
### Scope
- Phase 1 covers listing schema expansion, seeded data, seller-facing draft/publish/edit/delete flows, public browse cards, personal listing management, create-listing upload UX, and listing details display.

### Models
#### Listing
- Fields: `id`, `title`, `description`, `category`, `condition`, `reservePrice`, `startingBid` (nullable), `currentBid` (nullable), `bidCount`, `startAt`, `endAt`, `status`, `sellerId`, `location`, `createdAt`, `updatedAt`
- Relations: `seller`, `images[]`

#### ListingImage
- Fields: `id`, `listingId`, `url`, `publicId`, `isMain`, `createdAt`
- Relations: `listing`

### Enums
- `Status`: `Draft`, `Active`, `Scheduled`, `Ended`
- `Category`: `Electronics`, `Fashion`, `HomeGarden`, `Sports`, `Toys`, `Vehicles`, `Collectibles`, `Art`, `Books`, `Other`
- `Condition`: `New`, `LikeNew`, `Good`, `Fair`, `Poor`

### Seed Data
- Update the seed dataset to include 10 new listings using the Phase 1 canonical models.
- Seed data must span multiple sellers, statuses, conditions, and date windows.
- Seed data must include related `ListingImage` rows, with each listing having a main image and optional supporting images.
- Seed data must include listings suitable for owner and non-owner detail views.
- Draft listings must exist in the database but remain excluded from the public `/listings` page.

### Application-Wide
- Animate route transitions app-wide using Next 16 experimental `viewTransition` with a crossfade effect.

### Phase 1A Implementation Notes
- Drizzle schema now includes canonical `listings` and `listing_images` models with enum-backed status/category/condition fields plus temporary `bidCount`.
- SQLite migrations now preserve legacy listing rows by backfilling them into the expanded schema and lifting legacy image URLs into `listing_images`.
- Seed data now creates 10 listings, 21 related listing images, 4 demo sellers, and coverage across `Draft`, `Active`, `Scheduled`, and `Ended`.
- Root layout enables Next 16 experimental `viewTransition` and wraps page content in React `ViewTransition` for app-wide crossfades.

### Navbar Updates
- Add an icon to the logo while preserving the existing brand text.
- Keep existing avatar dropdown items and add:
- `Sell My Item`
- `My Listings`
- `My Watchlist`
- `My Dashboard`
- Create placeholder pages for each new destination route introduced by the navbar changes.

### Listings Page (`/listings`)
- Approval note: Phase 1C approved on 2026-03-01.
- Render a card grid showing all public listings.
- Each card contains:
- Main image
- Status badge overlaid on the image and color-coded by status
- Title
- Current price and bid count, both styled in the primary color
- Seller name and time remaining
- Show an empty state when no listings exist.
- Hide `Draft` listings from the public dataset.

### My Listings Page (`/my-listings`)
- Reuse the listings card layout from `/listings`.
- Filter results to the current user's listings only.
- Add shadcn tabs above the grid for `Drafts`, `Active`, `Scheduled`, and `Ended`.
- Tab selection changes the dataset shown in the grid without mixing statuses.

### Create Listing Page (`/listings/new`)
- Access to this route is provided from the `Sell My Item` navbar dropdown item.
- Use a two-panel layout with a `Create Your Listing` header above the panels.
- Panels sit side by side below the header, centered vertically, and occupy the maximum available height beneath the header while keeping visible top and bottom padding from surrounding layout chrome.
- Left panel uses two-thirds width and right panel uses one-third width.
- The page must not overflow and no scrollbars should be visible on this page.

#### Left Panel - Image Upload
- The panel has no internal header.
- The upload flow has exactly 3 exclusive states.

##### State 1: Drop Zone
- Large centered upload icon.
- Supports drag-and-drop and click-to-select via a hidden file input.
- Shows a visual highlight on dragover.
- Accepting a file transitions the UI to State 2.

##### State 2: Local Preview
- Show a local image preview before any remote upload occurs.
- `Upload` starts the Cloudinary upload flow and advances to State 3.
- `Cancel` discards the local preview and returns the UI to State 1.

##### State 3: Uploaded
- During upload, show a progress bar with percentage using XHR progress tracking.
- After upload completes, show a `Processing...` state before the final hosted image view resolves.
- On complete, display the Cloudinary-hosted image.
- `Continue` creates a listing draft using hardcoded placeholder JSON and redirects to the listing details page.
- `Reset` deletes the uploaded asset from Cloudinary and returns the UI to State 1.

#### Right Panel
- Static panel content with three numbered steps.
- Each step uses a numbered circle with the heading aligned horizontally to the step number.
- Add brief descriptive copy under each heading:
- `1. Upload a clear photo`
- `2. AI drafts listing details`
- `3. Review and publish`

### Listing Details Page (`/listings/[id]`)
#### Top Section
- Large title on the left and status badge on the right.
- A row of metadata boxes below showing current bid, minimum bid, and time remaining.

#### Left Panel (`3/5`)
- One card wrapping all left-panel content.
- Main image with a thumbnail strip below.
- Support up to 5 thumbnails and clicking a thumbnail swaps the main image.
- Metadata boxes for seller, location, category, and condition.
- Description box below the metadata.

#### Right Panel (`2/5`)
- Context-dependent rendering based on whether the current user owns the listing.

##### If listing owner -> Seller Controls
| Listing Status | Available Actions |
|---|---|
| Draft | `Refine Listing` (opens form modal), `Publish` (immediate if no start date, scheduled if future date), `Delete` (hard delete, removes Cloudinary images, shadcn confirmation dialog warning this is permanent) |
| Active | `Return to Draft` only (shadcn confirmation dialog warning listing will be locked to bids) |
| Scheduled | `Return to Draft` only (shadcn confirmation dialog warning listing will be locked to bids) |

##### If not owner
- Show a placeholder bid controls panel in Phase 1.
- Bidding behavior is deferred to a later phase.

#### Listing Form (Modal)
- Triggered by `Refine Listing`.
- Implemented as a shadcn dialog.
- Editable fields:
- Title, Description, Location on individual rows
- Category and Condition on the same row
- Starting Bid (optional) and Reserve Price (optional) on the same row
- Start At (optional) and Ends At on the same row
- Include a `Save Draft` button only.
- Saving the modal must not publish the listing. Publishing remains an explicit seller control action.

### Editing Constraints
- Editing is allowed only when no bids have been received and the auction has not ended.
- The first bid locks the listing from further edits.
- Entering edit mode sets listing status to `Draft` to prevent bidding during editing.
- If editing is abandoned, such as by closing the browser, the listing remains in `Draft` until the owner explicitly republishes it.
- `startAt` is optional; if provided it must be in the future.
- Draft listings are hidden from the public `/listings` page.
- Bid rejection for `Draft` listings will be enforced during the bidding phase and should be noted as deferred work here.

### Technical Notes
- Cloudinary uploads must use signed uploads via the `cloudinary` npm package with server-side signature generation.
- Cloudinary credentials must come from environment variables.
- Upload progress must use XHR tracking so the UI can display percentage completion.
- The `Continue` path uses hardcoded placeholder JSON in Phase 1 and will be replaced by the AI Smart Listing Creator in Phase 6.
- The Phase 1 schema includes a temporary `bidCount` integer on `Listing` to support seeded/demo UI; it can be normalized later when a dedicated bidding model is introduced.
- `startingBid` and `currentBid` are nullable on `Listing` in Phase 1; missing values are treated as `0` for listing behavior and display.
- Owners can set the main image while listing status is `Draft`, `Active`, or `Scheduled`; uploading/deleting gallery images remains draft-only.
- Public `/listings` excludes `Draft`; `Scheduled` and `Ended` remain visible unless a later phase revises browse visibility.
- Time-remaining display should map to lifecycle state:
- `Active`: time until `endAt`
- `Scheduled`: countdown until `startAt`
- `Ended`: zero/ended presentation

### Acceptance
- Phase 1 acceptance is measured against the browser-visible and database-visible outcomes defined in sub-phases `1A` through `1H`.
- Database acceptance:
- 10 seeded listings exist.
- Multiple sellers are represented.
- Multiple statuses and conditions are represented.
- Related `ListingImage` rows exist.
- Public browse acceptance:
- Draft listings are hidden.
- The empty state renders when there are no public listings.
- Status badge styling changes by status.
- My listings acceptance:
- Only the current user's listings appear.
- Tabs filter correctly by status.
- Create listing acceptance:
- Dragover highlight appears.
- Local preview appears before upload.
- Cancel resets to the drop zone.
- Upload progress is visible.
- Uploaded state shows the hosted Cloudinary image.
- Continue creates a draft listing and redirects to its details page.
- Reset removes the uploaded asset and returns to the initial state.
- Listing details acceptance:
- Thumbnails swap the main image.
- Owners see seller controls.
- Non-owners see the placeholder bid panel.
- The edit modal renders fields in the required layout.
- Publish chooses `Active` or `Scheduled` based on `startAt`.
- Delete confirms permanence and cleans up Cloudinary images.
- Listings with bids reject editing.

## Phase 2 - Browse and Search Listings
Approval note: Approved on 2026-03-05.
### Scope
- Expand browse UX for `/listings` and `/my-listings` with realistic seeded inventory, status tabs, multi-filter + sort controls, navbar search, and shared offset-based pagination.
- Ensure browse state is URL-driven (search/filter/sort/pagination) for shareable and restorable views.

### Seed Data Requirements
- Seed 20 listings for UI testing.
- Distribute listings across the 3 seeded users as sellers.
- Include varied categories and conditions.
- Include at least 2 listings with future `startAt` values (scheduled).
- Include at least 1 listing with an `endAt` value in the past (ended).
- Every listing must include at least one image URL sourced from an appropriate approximate image at `https://picsum.photos/`.

### Search Requirements
- Navbar includes a centered search input that remains visible across pages.
- Search matches against listing `title` and `description` with simple contains/LIKE behavior.
- Search executes only on `Enter` key or explicit search button click.
- No debounce and no auto-search while typing.
- Behavior by route:
- On `/listings`, apply search as an in-place filter to the current result set and combine with active filters/sort/pagination.
- From any other route, navigate to `/listings` with the search term applied.

### Filters and Sorting Requirements (`/listings`)
- Render one filter/sort row directly below the page heading.
- Left side:
- ShadCN tabs with statuses `Active`, `Scheduled`, `Ended`.
- Right side dropdown controls:
- Category filter
- Condition filter
- Price filter options:
- less than `$10`
- less than `$50`
- less than `$100`
- less than `$500`
- Sort options:
- `Newest`
- `Ending Soonest`
- `Most Bids`
- `Price Low->High`
- `Price High->Low`
- Reset button clears all active filters and sort selections.
- Filters and sort must compose with status tabs and search.
- Selected filters/sort are displayed as removable badges above the filter row.

### Pagination Requirements
- Build one shared, reusable pagination component for `/listings`, `/my-listings`, and future pages.
- Pagination strategy is offset-based.
- Component is sticky to the bottom of the page.
- Layout:
- Left: result count text in the format `"1-5 of 20"`.
- Center: ShadCN pagination controls.
- Right: page size selector with 4 options: `6`, `12`, `24`, `48`.
- Pagination must respect all active search/filter/sort criteria.
- Applying/changing filters resets pagination to page 1.

### URL State Requirements
- Persist search, status tab, dropdown filters, sort option, page number, and page size in URL query params.
- Query params are the single source of truth for list state on `/listings`.
- Search from non-listing routes must redirect to `/listings` with query params pre-populated.

### Acceptance
- Seed/data acceptance:
- Database shows 20 listings with image URLs and required status/date distribution.
- Listings acceptance:
- `/listings` displays seeded items with images loading correctly.
- Status tabs show only matching listing states and visibly indicate active tab.
- Filter/sort acceptance:
- Combining `Electronics` + `Under $100` + `Price Low->High` returns correctly filtered and ordered results.
- Reset clears all filter and sort selections.
- Search acceptance:
- Searching `electronics` from any route lands on `/listings` with matching title/description results.
- Clearing search restores unfiltered results (subject to other active state).
- Pagination acceptance:
- Shared pagination works on both `/listings` and `/my-listings`.
- Page size changes update visible result count and page contents.
- Navigation between pages works correctly.
- Applying a new filter resets to page 1.
- Result count text is accurate for current page and total.
- URL acceptance:
- Reloading a results page preserves search/filter/sort/pagination state from URL params.

## Phase 3 - Bidding and Real-Time Updates
### Scope
- Place bids with real-time current price updates.

### Requirements
- Bid form on listing detail for authenticated non-owner users.
- Min next bid rule (`>= currentBid + increment`).
- Atomic bid placement in transaction.
- Real-time updates for current bid/highest bidder state.
- Approach: SSE channel per listing (fallback polling if connection unavailable).

### Acceptance
- Concurrent bids resolve consistently (highest valid bid wins).
- Client updates without full page refresh.
- Tests simulate concurrent bid attempts and rule enforcement.

## Phase 4 - Auction Finalization and Notifications
### Scope
- Automatically end auctions and notify winning/affected users.

### Requirements
- Scheduled finalization job scans expired live listings.
- Closing logic:
- if reserve met: set winner and mark ended.
- if reserve unmet: mark ended/no winner.
- Create notifications for seller, winning bidder, and optionally outbid watchers.
- Notification channels:
- in-app notifications required.
- email optional (feature flag/config).

### Acceptance
- Finalization is idempotent and safe to rerun.
- Notifications generated correctly by scenario.
- Tests cover reserve met/unmet and duplicate-job execution.

## Phase 5 - User Dashboard
### Scope
- User-centric views for listing/bidding activity.

### Requirements
- Tabs/sections:
- My Listings (active/ended)
- My Bids (with bid status)
- Watching (watchlisted items)
- Quick actions (edit listing, unwatch, jump to bidding).

### Acceptance
- Dashboard data is scoped to current user.
- Efficient queries with pagination.
- Tests for authorization and empty/populated states.

## Phase 6 - AI Smart Listing Creator
### Scope
- AI-assisted listing draft from uploaded photos.

### Requirements
- Upload photos and optional short prompt.
- Vercel AI SDK pipeline returns:
- suggested title
- suggested description
- suggested category
- suggested starting price range
- User reviews/edits before saving; AI output is never auto-published.
- Include confidence and fallback behavior.

### Guardrails
- Prompt template with strict JSON schema output.
- Content moderation/filtering for unsafe outputs.
- Rate limiting per user.

### Acceptance
- Structured AI output passes schema validation.
- Failed model output falls back gracefully.
- Tests for parser/validator and failure handling.

## Phase 7 - AI Natural Language Search
### Scope
- Parse natural language queries into structured search filters.

### Requirements
- Input like: `vintage watches under 100`.
- AI parser outputs typed filter object:
- keywords, category, price ceiling/floor, condition, sort intent.
- Merge AI-derived filters with explicit UI filters safely.
- Show interpreted query chips so user can adjust.

### Acceptance
- Parser handles ambiguous input with safe defaults.
- No unsafe direct SQL/query string generation.
- Tests for parser mappings and fallback to keyword-only search.

## Phase 8 - AI Description Enhancer
### Scope
- AI rewrite tool to improve seller descriptions.

### Requirements
- User enters draft description and tone intent.
- AI returns rewritten variants (e.g. concise, persuasive, premium).
- Diff/compare UI before apply.
- Preserve factual details and avoid fabricated claims.

### Acceptance
- User must explicitly accept rewrite.
- Schema-validated output and error states are covered.
- Tests for transform action and UI integration flow.

## Phase 9 - Polish, CI, Prod DB Switch and Publishing
### Scope
- Harden app for deployment and handoff.

### Requirements
- Production DB migration plan (SQLite -> managed Postgres, Drizzle-compatible).
- Env var documentation and validation.
- CI quality gates with coverage reporting.
- Performance/accessibility pass on key pages.
- Seed/demo data for showcase.
- Deployment target (e.g. Vercel) and release checklist.

### Acceptance
- Staging/prod builds healthy.
- DB migration executed and verified.
- Documentation updated for setup, run, and deploy.

## Definition of Done (Per Phase)
- Feature scope implemented and reviewed.
- Tests written and passing with >=80% coverage for phase changes.
- Lint/build pass.
- Phase status in this document updated to `Accepted`.
- `tasks/todo.md` checkboxes updated to reflect completed work.
