import { NextRequest, NextResponse } from "next/server";
import { parsePermitWorkbook } from "@/lib/excel";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const mode = String(formData.get("mode") ?? "replace");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an Excel file using the `file` field." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const parsed = await parsePermitWorkbook(buffer, file.name);

  if (mode === "replace") {
    await prisma.permit.deleteMany();
  }

  if (parsed.permits.length) {
    await prisma.permit.createMany({
      data: parsed.permits
    });
  }

  const batch = await prisma.importBatch.create({
    data: {
      fileName: file.name,
      sheetName: parsed.sheetName,
      importedRows: parsed.permits.length,
      formulaSummary: JSON.stringify(parsed.formulaSummary)
    }
  });

  return NextResponse.json({
    batch,
    importedRows: parsed.permits.length,
    formulaSummary: JSON.stringify(parsed.formulaSummary)
  });
}
