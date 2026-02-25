# AGENTS.md

## Purpose
This file defines working conventions for AI agents and engineers contributing to `licitor`.

## Project Snapshot
- Framework: Next.js (App Router) + React + TypeScript
- Styling: Tailwind CSS v4 + shadcn styles (`src/app/globals.css`)
- Linting/Formatting: Biome
- Package manager: npm (`package-lock.json` is present)

## Runbook
- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Start production build: `npm run start`
- Lint/check: `npm run lint`
- Format: `npm run format`

## Repo Structure
- App entry: `src/app/layout.tsx`, `src/app/page.tsx`
- Global styles and theme tokens: `src/app/globals.css`
- Shared utility: `src/lib/utils.ts` (`cn` helper)
- Static assets: `public/`

## Contribution Guidelines
- Prefer TypeScript and functional React components.
- Keep app routes and layout logic under `src/app`.
- Reuse `cn(...)` from `src/lib/utils.ts` for class merging.
- Keep styling in Tailwind utility classes; use global CSS only for shared tokens/base layers.
- Run `npm run lint` before finishing changes.
- If code formatting changes are needed, run `npm run format`.

## Current Constraints
- There is no dedicated test suite configured yet.
- If adding tests, include a script in `package.json` and document usage here.

## Done Criteria for Changes
- Code builds successfully with `npm run build`.
- Lint passes with `npm run lint`.
- UI changes are verified at `http://localhost:3000` in `npm run dev`.
