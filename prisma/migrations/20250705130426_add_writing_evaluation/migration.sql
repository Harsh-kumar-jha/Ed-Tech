-- CreateTable
CREATE TABLE "writing_tests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testSessionId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "task1Prompt" TEXT NOT NULL,
    "task2Prompt" TEXT NOT NULL,
    "task1Response" TEXT,
    "task2Response" TEXT,
    "task1Band" DOUBLE PRECISION,
    "task2Band" DOUBLE PRECISION,
    "combinedBand" DOUBLE PRECISION,
    "task1Feedback" JSONB,
    "task2Feedback" JSONB,
    "overallFeedback" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "task1CompletedAt" TIMESTAMP(3),
    "task2CompletedAt" TIMESTAMP(3),
    "evaluatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "writing_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testCount" INTEGER NOT NULL DEFAULT 0,
    "averageBand" DOUBLE PRECISION,
    "bestBand" DOUBLE PRECISION,
    "progressAnalysis" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "writing_tests_testSessionId_key" ON "writing_tests"("testSessionId");

-- CreateIndex
CREATE INDEX "writing_tests_userId_idx" ON "writing_tests"("userId");

-- CreateIndex
CREATE INDEX "writing_tests_testSessionId_idx" ON "writing_tests"("testSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "writing_progress_userId_key" ON "writing_progress"("userId");

-- AddForeignKey
ALTER TABLE "writing_tests" ADD CONSTRAINT "writing_tests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_progress" ADD CONSTRAINT "writing_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
