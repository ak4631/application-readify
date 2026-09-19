-- 1:1 with public.profiles / auth.users. Stores the customer's last-known
-- location for discovery sorting and a "Home" location chip, independent of
-- any one booking. updated_at is set explicitly by the client on every
-- write (see lib/location.ts) rather than relying on a DB trigger, since
-- writes come from supabase-js/PostgREST, not Prisma Client, so Prisma's
-- @updatedAt (a client-side behavior) never fires here.
CREATE TABLE "public"."user_locations" (
  "user_id"           UUID NOT NULL,
  "latitude"          DECIMAL(9,6) NOT NULL,
  "longitude"         DECIMAL(9,6) NOT NULL,
  "address"           TEXT,
  "source"            TEXT NOT NULL DEFAULT 'gps',
  "permission_status" TEXT NOT NULL DEFAULT 'granted',
  "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "user_locations_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "user_locations_source_check"
    CHECK ("source" IN ('gps', 'manual')),
  CONSTRAINT "user_locations_permission_status_check"
    CHECK ("permission_status" IN ('granted', 'denied', 'undetermined'))
);

ALTER TABLE "public"."user_locations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_locations_select_own" ON "public"."user_locations"
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_locations_upsert_own" ON "public"."user_locations"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_locations_update_own" ON "public"."user_locations"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON "public"."user_locations" TO authenticated;
