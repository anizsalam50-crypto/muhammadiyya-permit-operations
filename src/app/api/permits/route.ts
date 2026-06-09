import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPermitAlerts, calculatePermit, summarizePermits } from "@/lib/calculations";
import { FORMULA_CATALOG } from "@/lib/formula-catalog";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();
  const contractor = searchParams.get("contractor")?.trim();
  const sector = searchParams.get("sector")?.trim();
  const alert = searchParams.get("alert")?.trim();
  const lifecycle = searchParams.get("lifecycle")?.trim();
  const sortBy = searchParams.get("sortBy")?.trim() || "expiryDate";
  const sortDir = searchParams.get("sortDir")?.trim() === "desc" ? "desc" : "asc";

  const permits = await prisma.permit.findMany({
    where: {
      AND: [
        status && status !== "all" ? { statusNormalized: status } : {},
        contractor && contractor !== "all" ? { contractorName: contractor } : {},
        sector && sector !== "all" ? { sector } : {},
        q
          ? {
              OR: [
                { permitNumber: { contains: q } },
                { permitNumberUsed: { contains: q } },
                { requestNumber: { contains: q } },
                { contractorName: { contains: q } },
                { streetName: { contains: q } },
                { lineNumber: { contains: q } },
                { districtName: { contains: q } },
                { notes: { contains: q } }
              ]
            }
          : {}
      ]
    },
    orderBy: [{ workEndDate: sortBy === "expiryDate" ? sortDir : "asc" }, { sourceRow: "asc" }]
  });

  let calculated = permits.map((permit) => calculatePermit(permit));
  if (alert && alert !== "all") {
    calculated = calculated.filter((permit) => permit.calculations.alertLevel === alert);
  }
  if (lifecycle && lifecycle !== "all") {
    calculated = calculated.filter((permit) => {
      if (lifecycle === "active") return permit.calculations.expiryBucket === "active";
      if (lifecycle === "expired") return permit.calculations.expiryBucket === "expired";
      if (lifecycle === "soon") return ["within7", "within15", "within30"].includes(permit.calculations.expiryBucket);
      return true;
    });
  }
  if (sortBy === "remainingDays") {
    calculated = calculated.sort((a, b) => {
      const left = a.calculations.remainingDays ?? Number.MAX_SAFE_INTEGER;
      const right = b.calculations.remainingDays ?? Number.MAX_SAFE_INTEGER;
      return sortDir === "asc" ? left - right : right - left;
    });
  }

  const allPermits = (await prisma.permit.findMany()).map((permit) => calculatePermit(permit));
  const filters = {
    statuses: [...new Set(allPermits.map((permit) => permit.statusNormalized).filter(Boolean))].sort(),
    contractors: [...new Set(allPermits.map((permit) => permit.contractorName).filter(Boolean))].sort(),
    sectors: [...new Set(allPermits.map((permit) => permit.sector).filter(Boolean))].sort()
  };

  return NextResponse.json({
    permits: calculated,
    dashboard: summarizePermits(allPermits),
    alerts: buildPermitAlerts(allPermits),
    filters,
    formulas: FORMULA_CATALOG
  });
}
