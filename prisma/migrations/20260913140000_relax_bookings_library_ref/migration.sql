-- Listings now come from either the legacy public.libraries table (old uuid ids)
-- or admin.vendors via the public.published_listings view (cuid text ids), so
-- library_id can no longer be a uuid FK into a single table. Denormalize the
-- listing name onto the booking row at creation time instead of joining live --
-- this also means a booking keeps showing the name as it was when booked, even
-- if the listing is later renamed or removed.

ALTER TABLE "public"."bookings" ADD COLUMN "library_name" TEXT;

UPDATE "public"."bookings" b
SET "library_name" = l."name"
FROM "public"."libraries" l
WHERE l."id" = b."library_id";

UPDATE "public"."bookings"
SET "library_name" = 'Library'
WHERE "library_name" IS NULL;

ALTER TABLE "public"."bookings" ALTER COLUMN "library_name" SET NOT NULL;

ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_library_id_fkey";

ALTER TABLE "public"."bookings" ALTER COLUMN "library_id" TYPE TEXT;
