-- Add Cloudinary fields to writing_task1_templates table
ALTER TABLE "writing_task1_templates" 
  ADD COLUMN "image_public_id" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "difficulty" TEXT,
  ADD COLUMN "test_type" TEXT,
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create indexes for new fields
CREATE INDEX "writing_task1_templates_difficulty_idx" ON "writing_task1_templates"("difficulty");
CREATE INDEX "writing_task1_templates_test_type_idx" ON "writing_task1_templates"("test_type");
CREATE INDEX "writing_task1_templates_is_active_idx" ON "writing_task1_templates"("isActive");
