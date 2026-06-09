CREATE TABLE "Permit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceSheet" TEXT NOT NULL DEFAULT 'SHATEE PERMIT',
  "sourceRow" INTEGER,
  "workType" TEXT,
  "statusMuroorTasriya" TEXT,
  "muroorPermitNo" TEXT,
  "muroorStatusRemainingDate" TEXT,
  "muroorStart" DATETIME,
  "muroorEnd" DATETIME,
  "statusRemainLength" TEXT,
  "workStartDate" DATETIME,
  "workEndDate" DATETIME,
  "permitNumberUsed" TEXT,
  "contractorName" TEXT,
  "lengthMeters" REAL,
  "demolitionVolume" TEXT,
  "lineNumber" TEXT,
  "notes" TEXT,
  "extensionNumber" TEXT,
  "streetName" TEXT,
  "permitNumber" TEXT,
  "requestNumber" TEXT,
  "sector" TEXT,
  "lineName" TEXT,
  "districtName" TEXT,
  "serialNumber" INTEGER,
  "contractNumber" TEXT,
  "rawData" JSONB,
  "formulas" JSONB,
  "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ImportBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fileName" TEXT NOT NULL,
  "sheetName" TEXT NOT NULL,
  "importedRows" INTEGER NOT NULL,
  "formulaSummary" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Permit_statusMuroorTasriya_idx" ON "Permit"("statusMuroorTasriya");
CREATE INDEX "Permit_contractorName_idx" ON "Permit"("contractorName");
CREATE INDEX "Permit_sector_idx" ON "Permit"("sector");
CREATE INDEX "Permit_workEndDate_idx" ON "Permit"("workEndDate");
CREATE INDEX "Permit_permitNumber_idx" ON "Permit"("permitNumber");
