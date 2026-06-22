import type { Permit } from "@prisma/client";

export type CalculatedPermit = Permit & {
  calculations: {
    muroorElapsedDays: number | null;
    muroorPermitDays: number | null;
    muroorRemainingDays: number | null;
    expiredDays: number | null;
    permitDays: number | null;
    remainingDays: number | null;
    reportStartDate: Date | null;
    reportEndDate: Date | null;
    reportLengthMeters: number | null;
    reportStreetName: string | null;
    reportLineNumber: string | null;
    alertLevel: "expired" | "critical" | "soon" | "warning" | "normal" | "complete";
    expiryBucket: "expired" | "within7" | "within15" | "within30" | "active" | "complete" | "unknown";
    alertText: string;
  };
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(later?: Date | string | null, earlier?: Date | string | null) {
  if (!later || !earlier) return null;
  const laterDate = later instanceof Date ? later : new Date(later);
  const earlierDate = earlier instanceof Date ? earlier : new Date(earlier);
  if (Number.isNaN(laterDate.getTime()) || Number.isNaN(earlierDate.getTime())) return null;
  return Math.round((startOfDay(laterDate).getTime() - startOfDay(earlierDate).getTime()) / MS_PER_DAY);
}

export function hijriTextToGregorian(value?: string | number | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const text = String(value).trim();
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;

  const serial =
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948440 -
    2415021;

  const excelEpoch = Date.UTC(1899, 11, 30);
  return new Date(excelEpoch + serial * MS_PER_DAY);
}

function statusLooksComplete(status?: string | null) {
  if (!status) return false;

  const normalized = status.trim();
  const text = normalized.toLowerCase();

  return (
    normalized.includes("تم إخلا طرف") ||
    normalized.includes("تم إتمام عمل") ||
    text === "complete" ||
    text === "site work complete"
  );
}

export function normalizeStatus(status?: string | null) {
  const value = status?.trim();
  if (!value) return "Unspecified";

  const upper = value.toUpperCase();
  if (upper === "P" || value.includes("قيد") || upper.includes("PENDING")) return "Pending";
  if (value.includes("تم إخلا طرف") || value.includes("تم إخلاء طرف")) return "Clearance Completed";
  if (value.includes("تم إتمام عمل") || value.includes("تم اتمام عمل")) return "Work Completed";
  if (value.includes("جاري إخلاء طرف") || value.includes("جاري إخلا طرف")) return "Clearance In Progress";
  if (value.includes("جاري إتمام عمل") || value.includes("جاري اتمام عمل")) return "Work In Progress";
  if (value.includes("تم طلب إلغاء") || value.includes("الغاء") || value.includes("إلغاء")) return "Cancellation Requested";
  if (upper.includes("COMPLETE")) return "Complete";
  if (upper.includes("EXPIRED")) return "Expired";

  return value.replace(/\s+/g, " ");
}

export function calculatePermit(permit: Permit, today = new Date()): CalculatedPermit {
  const muroorStart = permit.muroorStart ?? null;
  const muroorEnd = permit.muroorEnd ?? null;
  const muroorEndGregorian = hijriTextToGregorian(muroorEnd);
  const workStartDate = permit.workStartDate ?? null;
  const workEndDate = permit.workEndDate ?? null;

  const muroorElapsedDays = daysBetween(today, muroorStart);

const muroorPermitDays = muroorEndGregorian
  ? daysBetween(muroorEndGregorian, muroorStart)
  : null;

const muroorRemainingDays = muroorEndGregorian
  ? daysBetween(muroorEndGregorian, today)
  : null;

  const expiredDays = daysBetween(today, workStartDate);
  const permitDays = daysBetween(workEndDate, workStartDate);
  const remainingDays = expiredDays === null || permitDays === null ? null : permitDays - expiredDays;

  const complete = statusLooksComplete(permit.statusMuroorTasriya) || statusLooksComplete(permit.statusRemainLength);
  const statusText = String(permit.statusRemainLength ?? "");


const isCancelled =
  statusText.includes("تم طلب") ||
  statusText.includes("الغاء") ||
  statusText.includes("إلغاء");


let alertLevel: CalculatedPermit["calculations"]["alertLevel"] = "normal";
let expiryBucket: CalculatedPermit["calculations"]["expiryBucket"] = "active";
let alertText = "On track";

if (
  remainingDays !== null &&
  remainingDays < 0 &&
  !complete
) {

  alertLevel = "expired";
  expiryBucket = "expired";
  alertText = `${Math.abs(remainingDays)} days overdue`;


} else if (complete || isCancelled) {

  alertLevel = "complete";
  expiryBucket = "complete";

  if (isCancelled) {
    alertText = "Cancellation Requested";
  } else {
    alertText = "Complete";
  }

} else if (remainingDays !== null && remainingDays <= 7) {

  alertLevel = "critical";
  expiryBucket = "within7";
  alertText = `${remainingDays} days remaining`;

} else if (remainingDays !== null && remainingDays <= 15) {

  alertLevel = "soon";
  expiryBucket = "within15";
  alertText = `${remainingDays} days remaining`;

} else if (remainingDays !== null && remainingDays <= 30) {

  alertLevel = "warning";
  expiryBucket = "within30";
  alertText = `${remainingDays} days remaining`;

} else if (remainingDays !== null) {

  alertText = `${remainingDays} days remaining`;

} else {

  expiryBucket = "unknown";
  alertText = "Missing dates";

}
  return {
    ...permit,
    statusNormalized: permit.statusNormalized ?? normalizeStatus(permit.statusMuroorTasriya),
    calculations: {
      muroorElapsedDays,
      muroorPermitDays,
      muroorRemainingDays,
      expiredDays,
      permitDays,
      remainingDays,
      reportStartDate: workStartDate,
      reportEndDate: workEndDate,
      reportLengthMeters: permit.lengthMeters ?? null,
      reportStreetName: permit.streetName ?? null,
      reportLineNumber: permit.lineNumber ?? null,
      alertLevel,
      expiryBucket,
      alertText
    }
  };
}

export function summarizePermits(permits: CalculatedPermit[]) {
  const byStatus = new Map<string, number>();

for (const permit of permits) {
  const status = permit.statusRemainLength?.trim();

  if (!status || !isNaN(Number(status))) {
    continue;
  }

  byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
}
return {
  total: permits.length,

  active: permits.filter(
  (permit) =>
    permit.calculations.expiryBucket !== "expired" &&
    permit.calculations.expiryBucket !== "complete"
).length,

  expiringSoon: permits.filter(
    (permit) => ["critical", "soon", "warning"].includes(permit.calculations.alertLevel)
  ).length,
    expiringIn7Days: permits.filter((permit) => permit.calculations.expiryBucket === "within7").length,
    expiringIn15Days: permits.filter((permit) => ["within7", "within15"].includes(permit.calculations.expiryBucket)).length,
    expiringIn30Days: permits.filter((permit) =>
      ["within7", "within15", "within30"].includes(permit.calculations.expiryBucket)
    ).length,
    
    
    expired: permits.filter((permit) => permit.calculations.alertLevel === "expired").length,
    complete: permits.filter((permit) => permit.calculations.alertLevel === "complete").length,
    totalLengthMeters: permits.reduce((sum, permit) => sum + (permit.lengthMeters ?? 0), 0),
    byStatus: Array.from(byStatus.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
  };
}

export function buildPermitAlerts(permits: CalculatedPermit[]) {
  const alertable = permits
    .filter((permit) => permit.calculations.expiryBucket !== "complete")
    .sort((a, b) => (a.calculations.remainingDays ?? 999999) - (b.calculations.remainingDays ?? 999999));

  const muroorPermits = permits.filter((permit) => {
    const days = Number(permit.muroorStatusRemainingDate);
    return !Number.isNaN(days);
  });
console.log(
  "EXPIRED LIST",
  permits
    .filter((permit) => permit.calculations.alertLevel === "expired")
    .map((permit) => ({
      permit: permit.permitNumber,
      muroor: permit.muroorStatusRemainingDate,
      remaining: permit.calculations.remainingDays,
      status: permit.statusRemainLength,
    }))
);
  return {
    expired: alertable.filter((permit) => permit.calculations.expiryBucket === "expired"),
    within7: alertable.filter((permit) => permit.calculations.expiryBucket === "within7"),
    within15: alertable.filter((permit) => permit.calculations.expiryBucket === "within15"),
    within30: alertable.filter((permit) => permit.calculations.expiryBucket === "within30"),
    active: alertable.filter(
  (permit) =>
    permit.calculations.expiryBucket !== "expired" &&
    permit.calculations.expiryBucket !== "complete"
),

    muroorExpired: muroorPermits.filter(
      (permit) => Number(permit.muroorStatusRemainingDate) < 0
    ),

    muroorWithin7: muroorPermits.filter(
      (permit) => {
        const days = Number(permit.muroorStatusRemainingDate);
        return days >= 0 && days <= 7;
      }
    ),

    muroorWithin15: muroorPermits.filter(
      (permit) => {
        const days = Number(permit.muroorStatusRemainingDate);
        return days > 7 && days <= 15;
      }
    ),

    muroorWithin30: muroorPermits.filter(
      (permit) => {
        const days = Number(permit.muroorStatusRemainingDate);
        return days > 15 && days <= 30;
      }
    )
  };
}
