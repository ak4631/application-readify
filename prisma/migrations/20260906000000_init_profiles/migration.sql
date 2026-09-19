-- Profiles: 1:1 extension of auth.users
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey"
    FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Row Level Security: each user can only see/edit their own profile row
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON "public"."profiles" FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON "public"."profiles" FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON "public"."profiles" FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

CREATE TRIGGER "on_auth_user_created"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
