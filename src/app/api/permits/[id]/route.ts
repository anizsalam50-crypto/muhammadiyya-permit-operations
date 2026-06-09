import { NextResponse } from "next/server";
import { calculatePermit } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const permit = await prisma.permit.findUnique({ where: { id } });

  if (!permit) {
    return NextResponse.json({ error: "Permit not found" }, { status: 404 });
  }

  return NextResponse.json({
    permit: calculatePermit(permit),
    linkedDocuments: permit.permitLink
      ? [
          {
            label: permit.permitNumber || permit.permitNumberUsed || "Permit document",
            url: permit.permitLink,
            type: permit.permitLink.toLowerCase().includes(".pdf") ? "PDF" : "Document"
          }
        ]
      : [],
    history: [
      { label: "Imported", value: permit.importedAt },
      { label: "Created", value: permit.createdAt },
      { label: "Last updated", value: permit.updatedAt }
    ]
  });
}
