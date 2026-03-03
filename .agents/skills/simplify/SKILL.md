---
name: simplify
description: Remove over-engineering and unnecessary abstractions. Use after implementing features or when code feels bloated.
---

# Simplify Code Skill

## Trigger
Use after implementing a feature, or when code feels bloated or hard to follow.

## Philosophy
Beginner-friendly code wins over clever code. Every abstraction has a cost.
The agent writes for impressiveness — we write for understanding.

## This App's Stack
Next.js 16 App Router, TypeScript, DrizzleORM, React 19 (React Compiler enabled),
Tailwind, ShadCN, BetterAuth, Vercel AI SDK.

---

## Step 1: React Compiler First

React Compiler handles memoisation automatically. Remove manual optimisations:

**Remove useMemo unless measuring a proven bottleneck:**
```typescript
// Before
const formattedPrice = useMemo(() => formatPrice(listing.price), [listing.price]);

// After
const formattedPrice = formatPrice(listing.price);
```

**Remove useCallback for event handlers passed to native elements:**
```typescript
// Before
const handleSubmit = useCallback(() => { ... }, [deps]);

// After
const handleSubmit = () => { ... };
```

**Keep:** useCallback/useMemo only when passing to third-party components
that haven't adopted React Compiler yet.

---

## Step 2: Kill Prop Drilling

If a prop passes through more than one component without being used, it 
shouldn't be a prop. Fix with:

**Server Components (preferred — no boilerplate):**
```typescript
// Before: drilling listingId through 3 components to fetch at the bottom
// After: BidPanel is a server component, fetches its own data
// BidPanel.tsx
const bids = await getBidsForListing(listingId);
```

**React Context (for genuine shared client state):**
```typescript
// Good use: current user available app-wide
// Bad use: threading a single prop through 2-3 components
```

Signal words that mean prop drilling is happening:
- A component accepts a prop it never renders, only passes down
- The same prop appears in 3+ component signatures in a chain

---

## Step 3: Use DTOs — Don't Expose Raw Drizzle Models

Never pass a raw Drizzle result to the client. Always shape the data 
to what the component actually needs.
```typescript
// Before: exposing full Drizzle object including sensitive/related fields
return listing; // includes seller password hash, internal IDs, etc.

// After: DTO — return only what's needed
return {
  id: listing.id,
  title: listing.title,
  price: listing.price,
  sellerName: listing.seller.name,  // flattened — no nested object
};
```

**Rules:**
- One DTO type per use case (ListingCard, ListingDetail, ListingForm are different)
- Flat over nested — components shouldn't dig into `listing.seller.profile.name`
- Define DTO types in `types/` not inline in server actions
- If a field isn't rendered, it shouldn't be in the DTO

---

## Step 4: Server Actions — Keep Them Thin

Server actions should: validate → call a data function → return a result.
Business logic belongs in a separate function, not inside the action.
```typescript
// Before: 80-line server action doing everything
export async function createListing(formData: FormData) {
  // auth check, validation, image processing, DB write, revalidation all inline
}

// After: action orchestrates, functions do work
export async function createListing(formData: FormData) {
  const session = await requireAuth();
  const data = validateListingForm(formData);
  const listing = await insertListing(session.userId, data);
  revalidatePath('/listings');
  return { success: true, id: listing.id };
}
```

---

## Step 5: Next.js App Router Patterns

**Prefer Server Components. Only use 'use client' when you need:**
- useState / useEffect
- Browser APIs
- Event listeners
- Third-party client-only libraries
```typescript
// Before: entire page is client component to handle one button click
'use client';
export default function ListingPage({ listing }) { ... }

// After: page is server component, extract only the interactive part
// ListingPage.tsx — server component

  // ← only this is 'use client'
```

**Co-locate loading.tsx and error.tsx with the route they serve.**
Don't create a single global one and call it done.

---

## Step 6: Standard Simplifications

**Early returns over nested ifs:**
```typescript
// Before
if (session) {
  if (listing) {
    // actual logic buried here
  }
}

// After
if (!session) return { error: 'Unauthorised' };
if (!listing) return { error: 'Not found' };
// actual logic here
```

**Remove these patterns outright:**
- Single-use helper functions (inline them)
- Interfaces with one implementation (use the type directly)
- Comments that describe what the code obviously does
- Unused imports, variables, dead branches
- `console.log` left from debugging

---

## Step 7: Beginner Readability Check

Ask: "Could a junior developer understand this in 60 seconds?"

Red flags:
- Clever one-liners that need a comment to explain them
- Generic variable names: `data`, `result`, `item`, `obj`
- Chained array methods 3+ deep with no intermediate variable
- TypeScript generics that aren't necessary for correctness

If no → simplify, rename, or break into named steps.

---

## Output

Report after simplification:
- Lines before / after / reduction %
- Prop drilling removed: yes/no — how fixed
- useMemo/useCallback removed: count
- DTOs introduced: yes/no
- 'use client' components reduced: yes/no
- Biggest single simplification made