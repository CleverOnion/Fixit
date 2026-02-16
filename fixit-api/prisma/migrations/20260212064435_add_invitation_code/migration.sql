/*
  Warnings:

  - You are about to drop the column `mode` on the `practice_sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "practice_sessions" DROP COLUMN "mode",
ADD COLUMN     "dailyLimit" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "practiceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTimeSpent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "review_logs" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "PracticeMode";

-- CreateTable
CREATE TABLE "practice_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionIds" TEXT[],
    "count" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdBy" TEXT,
    "usedBy" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "practice_records_userId_date_key" ON "practice_records"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_codes_code_key" ON "invitation_codes"("code");

-- CreateIndex
CREATE INDEX "invitation_codes_code_idx" ON "invitation_codes"("code");

-- CreateIndex
CREATE INDEX "questions_userId_practiceCount_idx" ON "questions"("userId", "practiceCount");

-- AddForeignKey
ALTER TABLE "practice_records" ADD CONSTRAINT "practice_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
