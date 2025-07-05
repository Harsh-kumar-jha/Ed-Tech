-- CreateTable
CREATE TABLE "writing_task1_templates" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "writing_task1_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "writing_task1_templates_type_idx" ON "writing_task1_templates"("type");

-- CreateIndex
CREATE INDEX "writing_task1_templates_createdBy_idx" ON "writing_task1_templates"("createdBy");

-- AddForeignKey
ALTER TABLE "writing_task1_templates" ADD CONSTRAINT "writing_task1_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 