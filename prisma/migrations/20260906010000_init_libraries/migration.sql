CREATE TABLE "public"."libraries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "locality" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "website_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "libraries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "libraries_slug_key" ON "public"."libraries"("slug");

-- Row Level Security: the library directory is public read-only data
ALTER TABLE "public"."libraries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active libraries are publicly viewable"
    ON "public"."libraries" FOR SELECT
    USING (is_active = true);
