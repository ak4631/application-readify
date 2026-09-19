CREATE TABLE "public"."bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "library_id" UUID NOT NULL,
    "booking_code" TEXT NOT NULL,
    "booking_date" TEXT NOT NULL,
    "date_label" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "time_label" TEXT NOT NULL,
    "seat_type" TEXT NOT NULL,
    "seat_label" TEXT NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bookings_status_check" CHECK ("status" IN ('upcoming', 'completed', 'cancelled'))
);

CREATE UNIQUE INDEX "bookings_booking_code_key" ON "public"."bookings"("booking_code");
CREATE INDEX "bookings_user_id_idx" ON "public"."bookings"("user_id");

ALTER TABLE "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."bookings"
    ADD CONSTRAINT "bookings_library_id_fkey"
    FOREIGN KEY ("library_id") REFERENCES "public"."libraries"("id") ON DELETE CASCADE;

ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
    ON "public"."bookings" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
    ON "public"."bookings" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
    ON "public"."bookings" FOR UPDATE
    USING (auth.uid() = user_id);


CREATE TABLE "public"."memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "memberships_plan_check" CHECK ("plan" IN ('daily', 'monthly')),
    CONSTRAINT "memberships_status_check" CHECK ("status" IN ('active', 'expired', 'cancelled'))
);

CREATE UNIQUE INDEX "memberships_user_id_key" ON "public"."memberships"("user_id");

ALTER TABLE "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership"
    ON "public"."memberships" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own membership"
    ON "public"."memberships" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
    ON "public"."memberships" FOR UPDATE
    USING (auth.uid() = user_id);
