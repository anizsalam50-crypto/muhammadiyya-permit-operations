ALTER TABLE "Permit" ADD COLUMN "statusNormalized" TEXT;
ALTER TABLE "Permit" ADD COLUMN "permitLink" TEXT;

CREATE INDEX "Permit_statusNormalized_idx" ON "Permit"("statusNormalized");
