import { NextResponse } from "next/server";
import { buildPermitExport } from "@/lib/excel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const permits = await prisma.permit.findMany({
    orderBy: [{ sourceRow: "asc" }, { workEndDate: "asc" }]
  });
  const buffer = await buildPermitExport(permits);

  return new NextResponse(Buffer.from(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="permit-export-${new Date().toISOString().slice(0, 10)}.xlsx"`
    }
  });
}
