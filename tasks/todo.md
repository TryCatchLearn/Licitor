# Licitor Implementation TODO

## Usage
- Update this file continuously during implementation.
- Keep phase status aligned with `tasks/spec.md`.
- Mark items complete only after code + tests + lint/build pass.

## Global Checklist (applies to every phase)
- [x] Implement feature code
- [x] Add/update unit tests
- [x] Add/update integration tests
- [ ] Confirm coverage >= 80% for modified/new modules
- [x] Run `npm run lint`
- [x] Run `npm run build`
- [x] Run `npm run test:unit`
- [x] Run `npm run test:integration`
- [x] Update docs and phase status

## Phase 0 - Foundation and Tooling
Status: Accepted
- [x] Step 1 (prereq for all below): Canonicalize source layout and imports
  - [x] Move route files into `src/app/(auth)` and `src/app/(main)` groups
  - [x] Remove duplicate non-grouped route files for the same endpoints
  - [x] Canonicalize DB module paths to `src/lib/db/*` and `@/lib/db/*`
  - [x] Canonicalize validator module paths to `src/lib/validators/*` and `@/lib/validators/*`
- [x] Step 2 (depends on Step 1): Scaffold/verify required folders
  - [x] `src/app/api/{auth/[...all],cloudinary}`
  - [x] `src/components/{ui,auth,listings,bidding,dashboard,shared}`
  - [x] `src/lib/{db,validators,ai}` + `src/hooks` + `src/server/{actions,queries}` + `src/types`
- [x] Step 3 (depends on Step 1): Implement test architecture under `test/`
  - [x] Add `test/setup.unit.ts`
  - [x] Add `test/setup.integration.ts`
  - [x] Add `test/global-setup.integration.ts`
  - [x] Add `test/helpers/transactions.ts` for per-test rollback harness
  - [x] Add `test/helpers/database.ts` fallback deterministic reset utility
  - [x] Update Vitest configs to wire setup + global setup
- [x] Step 4 (depends on Step 3): Add baseline fixtures and mocks
  - [x] Add fixtures factory module in `test/fixtures/factories.ts`
  - [x] Add MSW handlers in `test/mocks/handlers.ts`
  - [x] Add fixture usage example in integration tests
  - [x] Add MSW usage example in unit tests
- [x] Step 5 (depends on Steps 1-4): Validate quality gates
  - [x] `npm run lint`
  - [x] `npm run build`
  - [x] `npm run test:unit`
  - [x] `npm run test:integration`
- [x] Step 6 (depends on Steps 1-5): Update planning docs
  - [x] Update `tasks/spec.md` Phase 0 requirements and canonical architecture notes
  - [x] Update this `tasks/todo.md` with ordered implementation status

## Phase 1 - Listing Creation and Management
Status: In Progress
### 1A: Schema, Seed Data & Route Transitions
Goal: Deliver the expanded listing schema, image relation, seeded demo inventory, and visible app-wide crossfade route transitions.

Tasks:
- [x] Add `Listing`, `ListingImage`, enum definitions, and temporary `bidCount` field to Drizzle schema design notes.
- [x] Plan migration updates for SQLite to replace or evolve the current minimal `listings` table.
- [x] Plan seed updates for 10 listings across multiple sellers with varied statuses, conditions, and dates.
- [x] Plan app-wide Next 16 experimental `viewTransition` crossfade behavior.

Acceptance Criteria:
- [x] SQLite contains 10 seeded listings and related images.
- [x] Listing statuses and conditions vary across the dataset.
- [x] Route changes visibly crossfade between pages.

### 1B: Navbar & Placeholder Pages
Goal: Expose the new seller/navigation destinations from the navbar and ensure each route resolves cleanly.

Tasks:
- [x] Add a logo icon beside the existing brand text.
- [x] Extend the avatar dropdown while keeping current items.
- [x] Create placeholder pages for `Sell My Item`, `My Listings`, `My Watchlist`, and `My Dashboard`.

Acceptance Criteria:
- [x] Every new dropdown item navigates without runtime error.
- [x] Placeholder pages render successfully.

### 1C: Listings Page
Approval note: Approved on 2026-03-01.
Goal: Deliver the public browse grid for seeded listings using the new listing card presentation.

Tasks:
- Build a reusable listing card shape for public browse.
- Show main image, color-coded status badge, title, current price, bid count, seller, and time remaining.
- Hide `Draft` listings from the public dataset.
- Add an empty state for zero results.

Acceptance Criteria:
- [x] `/listings` shows seeded non-draft listings as cards.
- [x] Draft listings do not appear publicly.
- [x] Empty state appears when the dataset is empty.

### 1D: My Listings Page
Goal: Deliver a current-user listings view with tab-based status filtering.

Tasks:
- Reuse the listing card component from `/listings`.
- Add shadcn tabs for `Drafts`, `Active`, `Scheduled`, `Ended`.
- Filter listings by the logged-in user and active tab.

Acceptance Criteria:
- [ ] Only the current user's listings appear.
- [ ] Tab changes filter listings correctly by status.

### 1E: Create Listing Page - Layout & Image Preview
Goal: Deliver the non-scrolling two-panel create-listing page with drag/drop and local preview states.

Tasks:
- Build the centered two-panel layout beneath the page header.
- Implement State 1 drop zone with dragover highlight and hidden file input.
- Implement State 2 local image preview with `Upload` and `Cancel`.
- Build the right-side static three-step explainer.

Acceptance Criteria:
- [ ] Selecting or dropping an image shows a local preview.
- [ ] Cancel returns the UI to the empty drop zone.
- [ ] No upload occurs yet.
- [ ] The page shows no visible overflow scrollbars.

### 1F: Create Listing Page - Cloudinary Upload
Goal: Deliver signed Cloudinary upload, progress feedback, draft creation from placeholder JSON, and redirect to details.

Tasks:
- Plan server-side signature generation using `cloudinary`.
- Plan XHR upload with percentage progress and post-upload processing state.
- Plan `Continue` to create a draft listing from hardcoded JSON and redirect to `/listings/[id]`.
- Plan `Reset` to delete the Cloudinary asset and restore State 1.

Acceptance Criteria:
- [ ] Upload progress is visible.
- [ ] Uploaded state shows the Cloudinary-hosted image.
- [ ] Continue creates a draft listing and redirects to its details page.
- [ ] Reset removes the uploaded image and returns to the drop zone.

### 1G: Listing Details Page - Display
Goal: Deliver the read-only listing details presentation for both owners and non-owners.

Tasks:
- Build the top title/status/auction-metadata section.
- Build the left `3/5` card with main image, thumbnails, metadata, and description.
- Build the right `2/5` context panel showing seller-controls placeholder for owners and bid-controls placeholder for non-owners.
- Support thumbnail click-to-swap for up to 5 images.

Acceptance Criteria:
- [ ] Seeded listings render complete details.
- [ ] Thumbnail selection changes the main image.
- [ ] Owner and non-owner panel states render appropriately.

### 1H: Listing Details Page - Seller Actions & Edit Modal
Goal: Deliver the owner action flows, edit modal, publish logic, delete confirmation, and draft-locking constraints.

Tasks:
- Implement seller controls per status table.
- Build the shadcn edit dialog with all specified fields and row groupings.
- Enforce edit eligibility: no bids and not ended.
- Set listing status to `Draft` when entering edit mode.
- Keep abandoned edits in `Draft`.
- Plan delete to remove Cloudinary images and hard delete the listing.
- Plan publish to choose immediate `Active` vs future `Scheduled`.

Acceptance Criteria:
- [ ] Owners can refine, save draft, publish, return active listings to draft, and delete where allowed.
- [ ] Non-owners only see the placeholder bid panel.
- [ ] Listings with bids cannot be edited.
- [ ] Draft listings remain hidden from public browse.

## Phase 2 - Browse and Search Listings
Status: Not Started
- [ ] Build listings browse page with pagination
- [ ] Add query-layer filters (category, price, status, timing)
- [ ] Add text search over title/description
- [ ] Add sorting options (ending soon, highest bid, newest)
- [ ] Persist filter/sort state via URL params
- [ ] Optimize DB indexes for expected query patterns
- [ ] Add unit tests for filter-parser/query-builder logic
- [ ] Add integration tests for filter/sort/pagination combinations
- [ ] Acceptance check: browse/search UX and correctness approved

## Phase 3 - Bidding and Real-Time Updates
Status: Not Started
- [ ] Extend schema for bids and listing current bid tracking
- [ ] Add bid placement Zod schema and business rules
- [ ] Implement atomic place-bid server action (transaction)
- [ ] Prevent owner bidding on own listing
- [ ] Implement real-time updates (SSE + fallback polling)
- [ ] Update listing detail UI with live bid state
- [ ] Add unit tests for bid increment and eligibility rules
- [ ] Add integration tests for concurrent bid scenarios
- [ ] Acceptance check: live bidding works under contention

## Phase 4 - Auction Finalization and Notifications
Status: Not Started
- [ ] Add schema fields/tables for finalization + notifications
- [ ] Implement auction close domain service (idempotent)
- [ ] Create scheduled job endpoint/runner for expired listings
- [ ] Implement winner selection with reserve-price handling
- [ ] Implement in-app notification creation and read state
- [ ] Add optional email notification adapter (feature-flagged)
- [ ] Add unit tests for close logic variants
- [ ] Add integration tests for job reruns and duplicate protection
- [ ] Acceptance check: automated close + notifications verified

## Phase 5 - User Dashboard
Status: Not Started
- [ ] Build dashboard route/layout with tabs/sections
- [ ] Add queries for my listings (active/ended)
- [ ] Add queries for my bids and current bid state
- [ ] Add queries for watchlist items
- [ ] Implement watch/unwatch server actions
- [ ] Add pagination and empty-state UX for all sections
- [ ] Add unit tests for dashboard data mappers
- [ ] Add integration tests for user-scoped access and data
- [ ] Acceptance check: dashboard reflects user activity accurately

## Phase 6 - AI Smart Listing Creator
Status: Not Started
- [ ] Add AI server action endpoint for listing draft generation
- [ ] Define strict output schema (title, description, category, price)
- [ ] Build photo upload + prompt UI for AI draft generation
- [ ] Implement Vercel AI SDK model call with structured output
- [ ] Add moderation/safety checks and fallback error messages
- [ ] Add rate limiting for AI generation action
- [ ] Add user review/edit step before persist
- [ ] Add unit tests for parsing/validation/fallbacks
- [ ] Add integration tests for success + model failure paths
- [ ] Acceptance check: AI drafts are reliable and editable

## Phase 7 - AI Natural Language Search
Status: Not Started
- [ ] Add NL query input to browse page
- [ ] Build AI parser action returning typed filter object
- [ ] Merge AI filters safely with manual filters
- [ ] Display interpreted filter chips for user correction
- [ ] Implement fallback to keyword search on parser failure
- [ ] Add telemetry/logging for parse success/failure rates
- [ ] Add unit tests for NL-to-filter mapping
- [ ] Add integration tests for mixed manual + NL filtering
- [ ] Acceptance check: interpreted search is useful and stable

## Phase 8 - AI Description Enhancer
Status: Not Started
- [ ] Add description enhancer UI in listing create/edit flow
- [ ] Define enhancement request schema (tone, audience, length)
- [ ] Implement AI rewrite action returning multiple variants
- [ ] Add side-by-side compare/diff and apply action
- [ ] Ensure explicit user acceptance before updating content
- [ ] Add safety checks to prevent fabricated claims insertion
- [ ] Add unit tests for rewrite schema handling
- [ ] Add integration tests for end-to-end apply workflow
- [ ] Acceptance check: rewrite assist improves UX without risk

## Phase 9 - Polish, CI, Prod DB Switch and Publishing
Status: Not Started
- [ ] Select production DB provider (Postgres) and provision env
- [ ] Update Drizzle config/migrations for prod DB target
- [ ] Validate data migration strategy from SQLite to Postgres
- [ ] Add env validation layer for required production secrets
- [ ] Finalize CI with coverage artifact/reporting
- [ ] Run performance and accessibility pass on major routes
- [ ] Prepare demo seed data and reset scripts
- [ ] Update deployment docs and release runbook
- [ ] Execute production deployment checklist
- [ ] Acceptance check: deployed app is stable and documented

## Tracking Notes
- Use dated notes here during implementation for scope changes and decisions.
- 2026-02-27: Initial phase plan created.
- 2026-02-27: Phase 0 implemented with grouped route migration, canonical `src/lib/db` + `src/lib/validators` paths, transaction-based integration test harness, fixture factories, and MSW baseline mocking.
- 2026-02-27: Phase 0 formally approved; tracking moved to Phase 1 in progress.
