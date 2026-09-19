ALTER TABLE "public"."libraries"
    ADD COLUMN "category" TEXT NOT NULL DEFAULT 'library';

ALTER TABLE "public"."libraries"
    ADD CONSTRAINT "libraries_category_check"
    CHECK ("category" IN ('library', 'reading_room', 'study_cafe', 'exam_hub'));
