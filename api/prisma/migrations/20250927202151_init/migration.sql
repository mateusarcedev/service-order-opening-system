-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceOrder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChecklistItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceOrderChecklist" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceOrderChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChecklistAnswer" (
    "id" TEXT NOT NULL,
    "soChecklistId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "boolValue" BOOLEAN,
    "textValue" TEXT,
    "note" TEXT,

    CONSTRAINT "ChecklistAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceOrderPhoto" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceOrderPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "ServiceOrder_status_createdAt_idx" ON "public"."ServiceOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ChecklistItem_templateId_idx" ON "public"."ChecklistItem"("templateId");

-- CreateIndex
CREATE INDEX "ServiceOrderChecklist_serviceOrderId_idx" ON "public"."ServiceOrderChecklist"("serviceOrderId");

-- CreateIndex
CREATE INDEX "ServiceOrderChecklist_templateId_idx" ON "public"."ServiceOrderChecklist"("templateId");

-- CreateIndex
CREATE INDEX "ChecklistAnswer_soChecklistId_idx" ON "public"."ChecklistAnswer"("soChecklistId");

-- CreateIndex
CREATE INDEX "ChecklistAnswer_itemId_idx" ON "public"."ChecklistAnswer"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistAnswer_soChecklistId_itemId_key" ON "public"."ChecklistAnswer"("soChecklistId", "itemId");

-- CreateIndex
CREATE INDEX "ServiceOrderPhoto_serviceOrderId_idx" ON "public"."ServiceOrderPhoto"("serviceOrderId");

-- AddForeignKey
ALTER TABLE "public"."ServiceOrder" ADD CONSTRAINT "ServiceOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChecklistItem" ADD CONSTRAINT "ChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceOrderChecklist" ADD CONSTRAINT "ServiceOrderChecklist_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceOrderChecklist" ADD CONSTRAINT "ServiceOrderChecklist_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChecklistAnswer" ADD CONSTRAINT "ChecklistAnswer_soChecklistId_fkey" FOREIGN KEY ("soChecklistId") REFERENCES "public"."ServiceOrderChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChecklistAnswer" ADD CONSTRAINT "ChecklistAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceOrderPhoto" ADD CONSTRAINT "ServiceOrderPhoto_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
