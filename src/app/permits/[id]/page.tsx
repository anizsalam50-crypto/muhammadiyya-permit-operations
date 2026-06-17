import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, FileText, History, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePermit } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber } from "@/lib/utils";

function statusClass(level: string) {
  if (level === "expired") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
  if (level === "critical") return "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200";
  if (level === "soon" || level === "warning") {
    return "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
}

function Field({
  label,
  value
}: {
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">
        {value || "-"}
      </p>
    </div>
  );
}

export default async function PermitDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const permit = await prisma.permit.findUnique({ where: { id } });
  if (!permit) notFound();

  const calculated = calculatePermit(permit);

  console.log(
  "permit.muroorStatusRemainingDate =",
  permit.muroorStatusRemainingDate
);

console.log("typeof =", typeof permit.muroorStatusRemainingDate);
console.dir(permit.muroorStatusRemainingDate, { depth: null });

  const rawData = permit.rawData && typeof permit.rawData === "object" && !Array.isArray(permit.rawData) ? permit.rawData : {};
  const formulas = permit.formulas && typeof permit.formulas === "object" && !Array.isArray(permit.formulas) ? permit.formulas : {};

  return (
    <main className="min-h-screen">
      <section className="border-b bg-card">
        <div className="container flex flex-col gap-4 py-6">
          <Button variant="ghost" className="w-fit" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">MUHAMMADIYYA Permit Operations</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                {permit.permitNumber || permit.permitNumberUsed || "Permit details"}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={statusClass(calculated.calculations.alertLevel)}>{calculated.calculations.alertText}</Badge>
              {permit.permitLink ? (
                <Button asChild>
                  <a href={permit.permitLink} target="_blank" rel="noreferrer">
                    <FileText className="h-4 w-4" />
                    View Document
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-5 py-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Permit Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Permit Number" value={permit.permitNumber} />
              <Field label="Used Permit Number" value={permit.permitNumberUsed} />
              <Field label="Request Number" value={permit.requestNumber} />
              <Field
  label="Location"
  value={
    permit.statusMuroorTasriya ? (
      <a
        href={permit.statusMuroorTasriya}
        target="_blank"
        rel="noreferrer"
        className="text-cyan-400 hover:underline"
      >
        📍 View Location
      </a>
    ) : (
      "-"
    )
  }
/>
              <Field label="Sector" value={permit.sector} />
              <Field label="District" value={permit.districtName} />
              <Field label="Street Name" value={permit.streetName} />
              <Field label="Line Number" value={permit.lineNumber} />
              <Field label="Line Name" value={permit.lineName} />
              <Field label="Length" value={`${formatNumber(permit.lengthMeters, 1)} m`} />
              <Field label="Contract Number" value={permit.contractNumber} />
              <Field label="Source Row" value={permit.sourceRow} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Expiry Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Start Date" value={formatDate(permit.workStartDate)} />
              <Field label="Expiry Date" value={formatDate(permit.workEndDate)} />
              <Field label="Permit Days" value={formatNumber(calculated.calculations.permitDays)} />
              <Field label="Remaining Days" value={formatNumber(calculated.calculations.remainingDays)} />
              <Field label="Elapsed Days" value={formatNumber(calculated.calculations.expiredDays)} />
              <Field label="Muroor Start" value={formatDate(permit.muroorStart)} />
              <Field label="Muroor End" value={formatDate(permit.muroorEnd)} />
              <Field label="Muroor Remaining Days" value={permit.muroorStatusRemainingDate} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Contractor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Field label="Contractor" value={permit.contractorName} />
              <Field label="Work Type" value={permit.workType} />
              <Field label="Notes" value={permit.notes} />
              <Field label="Extension Number" value={permit.extensionNumber} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Imported Fields</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(rawData).map(([key, value]) => (
                <Field key={key} label={key} value={String(value ?? "")} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Linked Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permit.permitLink ? (
                <a
                  href={permit.permitLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm hover:bg-muted"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate">{permit.permitNumber || "Permit document"}</span>
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No linked document</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Permit History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Imported</span>
                <span>{formatDate(permit.importedAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(permit.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(permit.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preserved Formulas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(formulas).length ? (
                Object.entries(formulas).map(([column, formula]) => (
                  <div key={column} className="rounded-md border bg-background p-3">
                    <p className="text-xs font-medium text-muted-foreground">{column}</p>
                    <code className="mt-1 block whitespace-pre-wrap text-xs">{String(formula)}</code>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No row formulas captured</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
