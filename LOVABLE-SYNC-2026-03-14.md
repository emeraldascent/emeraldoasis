# Lovable Sync Prompt — March 14, 2026

Pull and sync from GitHub (`main` branch). 17 commits since last sync. Copy everything below into Lovable:

---

Pull latest from GitHub main branch. Here is what changed and what needs to happen:

## 1. Database Migration (REQUIRED)

Run the migration file `supabase/migrations/20260314143800_member_bookings.sql`. It does three things:

1. Creates a new `member_bookings` table that tracks all bookings made through the app. Columns: id, member_id (FK to members), simplybook_booking_id, service_id, service_name, booking_date, booking_time, guest_names, is_member_pass (boolean), status, created_at. Has RLS policies so users can only read and insert their own bookings.

2. Adds three columns to the existing `members` table: `simplybook_client_id` (text, nullable), `subscription_tier` (text, values silver or gold, nullable), `subscription_active` (boolean, default false).

3. Creates an index on member_bookings for efficient pass usage counting.

## 2. Edge Function Redeployment (REQUIRED)

Redeploy the `simplybook-bookings` edge function from `supabase/functions/simplybook-bookings/index.ts`. The `check_membership` action was rewritten — the old version called SimplyBook API methods that require admin auth and caused runtime crashes. The new version returns a safe default.

## 3. Supabase Types Regeneration

The file `src/integrations/supabase/types.ts` was manually updated to include the `member_bookings` table and the new `members` columns (subscription_tier, subscription_active, simplybook_client_id). Please regenerate types from the database schema to ensure full consistency. Do not remove the member_bookings table or the new members columns from the types.

## 4. Summary of All Changes

New pages:
- `src/pages/Map.tsx` — Property and trail map page at /map with two map views (trails and base camp), fullscreen zoom, legend, and Google Maps directions link
- `public/property-map-trails.png` and `public/property-map-base.png` — map images

Routing changes in `src/App.tsx`:
- Added /map route (public, with BottomNav)
- All BottomNav instances now receive userEmail prop

Navigation changes in `src/components/layout/BottomNav.tsx`:
- Admin users (connor@emeraldascent.com, emeraldoasiscamp@gmail.com) see a 5-tab nav: Home, Book, Admin, Guide, Profile
- Regular members see 4 tabs without Admin
- Uses Shield icon for admin tab

Login flow fix in `src/components/auth/LoginModal.tsx`:
- Before showing the claim/set-password screen, probes whether a Supabase auth account already exists
- If account exists, goes straight to password login instead of trying to create a new account

Property Guide rewrite in `src/pages/Guide.tsx`:
- Completely rebuilt with organized sections: Getting Here, Hours and Conduct, Land Stewardship, Water and Wellness, Emergency, Nearby
- Bullet point format, PMA reminder at top, link to property map page

Dashboard changes in `src/pages/Dashboard.tsx`:
- Added Oasis Pass upgrade card (gold star icon) that shows when member does not have an active subscription. Routes to /book. Hidden when subscription_active is true.
- Removed emoji duplicates from membership includes section, clean Lucide icons only

Booking page changes in `src/pages/Book.tsx`:
- Silver and Gold member passes are gated behind subscription check using member.subscription_active and member.subscription_tier from the members table
- Non-subscribers see Silver ($25/mo, 5 passes) and Gold ($50/mo, 10 passes) cards that open a SimplyBook membership iframe modal inside the app
- Active subscribers see bookable pass cards with a usage counter showing remaining passes this month
- When all passes are used, booking is blocked with a message

Booking calendar changes in `src/components/booking/BookingCalendar.tsx`:
- Campsite bookings (service IDs 8, 9, 10, 11, 12, 13, 14) skip the time picker step entirely
- Shows check-in 12:00 to 6:00 PM and check-out 11:00 AM instead of raw time slots
- Info bar on calendar date step with check-in/check-out times and carry gear note
- All bookings are logged to the member_bookings table after successful SimplyBook booking

Dashboard calendar replacement in `src/components/dashboard/UpcomingCalendar.tsx`:
- Replaced Google Calendar iframe with native booking list from member_bookings table
- Shows only the logged-in member's own upcoming confirmed bookings
- Service icons, date, time, and pass badge

Admin calendar replacement in `src/components/admin/AdminCalendar.tsx`:
- Replaced Google Calendar iframe with native month calendar
- Shows booking counts per day on the calendar grid
- Click any day to see all bookings with member names, emails, guest lists, service types
- Navigable month by month

Booking grid changes in `src/components/dashboard/BookingGrid.tsx`:
- Sauna and Events buttons disabled with Coming Soon label
- Day Pass and Camping remain active

Quick links changes in `src/components/dashboard/QuickLinks.tsx`:
- Added Property Map link, now 4-column grid

Types changes in `src/lib/types.ts`:
- Added MemberBooking interface
- Added simplybook_client_id, subscription_tier, subscription_active to Member interface

iCal sync script update in `scripts/ical-sync-gas.js`:
- Creates timed 7AM-9PM events instead of all-day events for SimplyBook compatibility
- Added cleanupOldSyncEvents function

Do not modify the admin email list, campsite service IDs, check-in/check-out times, or RLS policies. They are correct as committed.

---
