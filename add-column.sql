-- Add deleteQuestionsAt column
ALTER TABLE "writing_tests" ADD COLUMN IF NOT EXISTS "deleteQuestionsAt" TIMESTAMP(3);

-- Create index for efficient cleanup
CREATE INDEX IF NOT EXISTS "writing_tests_deleteQuestionsAt_idx" ON "writing_tests"("deleteQuestionsAt"); 