# Challenge 3

## What you see

**Symptom A — Form save fails with confusing error**

When you try to save your draft listing with both a start date and end date filled in (e.g., starts in 2 weeks, ends in 4 weeks), you get:

> End time must be after the start time.

But your end date IS clearly after your start date. If you clear the Start At field and only keep End At, the save succeeds.

**Symptom B — Published listing goes to wrong status**

After working around Symptom A (saving without a start date), you publish the listing. It shows up under the **Scheduled** tab in My Listings — but with no scheduled start date displayed. Other users cannot find it in the public marketplace.

## How to reproduce

1. Create a new listing
2. Open **Refine listing** and fill in all fields including:
   - Start At: any date 2+ weeks from now
   - End At: any date 4+ weeks from now (clearly after start)
3. Click Save — observe the date error despite valid inputs
4. Workaround: clear Start At, keep only End At, save succeeds
5. Click **Publish now** — listing moves to Scheduled with no start date
6. Check public listings — listing visible but not active