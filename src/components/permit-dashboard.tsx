"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import loaderAnimation from "../loader.json";
import {
  AlertTriangle,
  ArrowDownAZ,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  Upload,
  Languages,
  ShieldAlert,
  BellRing
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatNumber } from "@/lib/utils";

type AlertLevel = "expired" | "critical" | "soon" | "warning" | "normal" | "complete";
type ExpiryBucket = "expired" | "within7" | "within15" | "within30" | "active" | "complete" | "unknown";

type PermitRow = {
  id: string;
  sourceRow: number | null;
  statusMuroorTasriya: string | null;
  statusNormalized: string | null;
  contractorName: string | null;
  permitNumber: string | null;
  permitLink: string | null;
  permitNumberUsed: string | null;
  requestNumber: string | null;
  sector: string | null;
  streetName: string | null;
  lineName: string | null;
  lineNumber: string | null;
  districtName: string | null;
  workStartDate: string | null;
  workEndDate: string | null;
  lengthMeters: number | null;
  notes: string | null;
  muroorStatusRemainingDate: string | null;
  calculations: {
  muroorElapsedDays: number | null;
  muroorPermitDays: number | null;
  muroorRemainingDays: number | null;

  expiredDays: number | null;
  permitDays: number | null;
  remainingDays: number | null;

  alertLevel: AlertLevel;
  expiryBucket: ExpiryBucket;
  alertText: string;
};
};

type DashboardData = {
  total: number;
  active: number;
  expiringIn7Days: number;
  expiringIn15Days: number;
  expiringIn30Days: number;
  expired: number;
  complete: number;
  totalLengthMeters: number;
  byStatus: { status: string; count: number }[];
};

type ApiResponse = {
  permits: PermitRow[];
  dashboard: DashboardData;
  alerts: {
  expired: PermitRow[];
  within7: PermitRow[];
  within15: PermitRow[];
  within30: PermitRow[];
  active: PermitRow[];

  muroorExpired: PermitRow[];
  muroorWithin7: PermitRow[];
  muroorWithin15: PermitRow[];
  muroorWithin30: PermitRow[];
};
  filters: {
    statuses: string[];
    contractors: string[];
    sectors: string[];
  };
  lastUpdated: string | null;
};

const emptyData: ApiResponse = {
  permits: [],
  dashboard: {
    total: 0,
    active: 0,
    expiringIn7Days: 0,
    expiringIn15Days: 0,
    expiringIn30Days: 0,
    expired: 0,
    complete: 0,
    totalLengthMeters: 0,
    byStatus: []
  },
  alerts: {
    expired: [],
    within7: [],
    within15: [],
    within30: [],
    active: [],
    muroorExpired: [],
    muroorWithin7: [],
    muroorWithin15: [],
    muroorWithin30: []
  },
  filters: {
    statuses: [],
    contractors: [],
    sectors: []
  },
  lastUpdated: null
};

function badgeClass(level: AlertLevel | ExpiryBucket) {
  if (level === "expired") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
  if (level === "critical" || level === "within7") {
    return "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200";
  }
  if (level === "soon" || level === "warning" || level === "within15" || level === "within30") {
    return "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200";
  }
  if (level === "active" || level === "normal") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";
}

function rowClass(bucket: ExpiryBucket) {
  if (bucket === "expired") return "bg-red-50/75 dark:bg-red-950/30";
  if (bucket === "within7") return "bg-orange-50/80 dark:bg-orange-950/30";
  if (bucket === "within15" || bucket === "within30") return "bg-yellow-50/70 dark:bg-yellow-950/20";
  return "bg-card";
}

function PermitDocumentLink({ permit }: { permit: PermitRow }) {
  const number = permit.permitNumber || permit.permitNumberUsed || "-";
  if (!permit.permitLink) return <span>{number}</span>;
  return (
    <a
      href={permit.permitLink}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      <FileText className="h-3.5 w-3.5" />
      {number}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function AlertList({
  title,
  items,
  bucket,
  isMuroor = false
}: {
  title: string;
  items: PermitRow[];
  bucket: ExpiryBucket;
  isMuroor?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <p
  className={`text-sm font-semibold ${
    bucket === "within7"
      ? "text-red-400 animate-pulse drop-shadow-[0_0_12px_rgba(255,0,0,1)]"
      : ""
  }`}
>
  {open ? "▼ " : "▶ "} {title}
</p>

        <Badge
  className={
    bucket === "within7"
  ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50 ring-2 ring-red-400"
      : bucket === "expired"
      ? "bg-red-500 text-white"
      : bucket === "within15"
      ? "bg-orange-500 text-white"
      : bucket === "within30"
      ? "bg-yellow-500 text-black"
      : "bg-green-600 text-white"
  }
>
          {items.length}
        </Badge>
      </div>

      {open && (
        <div className="space-y-2">
          {items.map((permit) => (
            <Link
              key={permit.id}
              href={`/permits/${permit.id}`}
              className="block rounded-md border bg-background p-3 text-sm transition-colors hover:bg-muted/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {permit.permitNumber ||
                      permit.permitNumberUsed ||
                      "No permit no."}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {permit.contractorName ||
                      "Unspecified contractor"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {permit.streetName || "No street name"}
                  </p>
                </div>

                <div className="text-right text-xs">
  {isMuroor ? (
    <p className="font-semibold">
      {permit.muroorStatusRemainingDate}
    </p>
  ) : (
    <>
      <p>{formatDate(permit.workEndDate)}</p>

      <p className="font-semibold">
        {formatNumber(
          permit.calculations.remainingDays
        )} days
      </p>
    </>
  )}
</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PermitDashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ApiResponse>(emptyData);
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState("all");
  const [contractor, setContractor] = useState("all");
  const [sector, setSector] = useState("all");
  const [sortBy, setSortBy] = useState("expiryDate");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [language, setLanguage] = useState<"en" | "ar">("en");
const itemsPerPage = 10;
const AUTO_REFRESH_SECONDS = 120;
const [refreshCountdown, setRefreshCountdown] = useState(AUTO_REFRESH_SECONDS);
const translations = {
  en: {
    search: "Search permit, contractor, street, line",
    totalPermits: "Total Permits",
    activePermits: "Active Permits",
    expiredPermits: "Expired Permits",
    expiring7: "Expiring in 7 Days",
    expiring15: "Expiring in 15 Days",
    expiring30: "Expiring in 30 Days",
    totalLength: "Total Length",
    expiredAlert: "Expired permits",
within7Alert: "Expiring within 7 days",
within15Alert: "Expiring within 15 days",
within30Alert: "Expiring within 30 days",
activeAlert: "Active permits",
muroorAlerts: "Muroor Alerts",
expiredMuroor: "Expired Muroor",
muroor7: "Muroor within 7 days",
muroor15: "Muroor within 15 days",
muroor30: "Muroor within 30 days",
allPermits: "All permits",
active: "Active",
expired: "Expired",
expiringSoon: "Expiring Soon",

allContractors: "All contractors",
allSectors: "All sectors",

sortByExpiry: "Sort by expiry date",
sortByRemaining: "Sort by remaining days",

ascending: "Ascending",
descending: "Descending",
location: "Location",
viewLocation: "View Location",
workStatus: "Work Status",
  },

  ar: {
    search: "البحث عن تصريح أو مقاول أو شارع",
    totalPermits: "إجمالي التصاريح",
    activePermits: "التصاريح النشطة",
    expiredPermits: "التصاريح المنتهية",
    expiring7: "تنتهي خلال 7 أيام",
    expiring15: "تنتهي خلال 15 يوماً",
    expiring30: "تنتهي خلال 30 يوماً",
    totalLength: "إجمالي الطول",
    expiredAlert: "التصاريح المنتهية",
within7Alert: "تنتهي خلال 7 أيام",
within15Alert: "تنتهي خلال 15 يوماً",
within30Alert: "تنتهي خلال 30 يوماً",
activeAlert: "التصاريح النشطة",
muroorAlerts: "تنبيهات المرور",
expiredMuroor: "تصاريح المرور المنتهية",
muroor7: "المرور خلال 7 أيام",
muroor15: "المرور خلال 15 يوماً",
muroor30: "المرور خلال 30 يوماً",
allPermits: "جميع التصاريح",
active: "نشط",
expired: "منتهي",
expiringSoon: "تنتهي قريباً",

allContractors: "جميع المقاولين",
allSectors: "جميع القطاعات",

sortByExpiry: "ترتيب حسب تاريخ الانتهاء",
sortByRemaining: "ترتيب حسب الأيام المتبقية",

ascending: "تصاعدي",
descending: "تنازلي",
location: "الموقع",
viewLocation: "عرض الموقع",
workStatus: "حالة العمل",
  }
};

const t =
  language === "en"
    ? translations.en
    : translations.ar;

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (lifecycle !== "all") search.set("lifecycle", lifecycle);
    if (contractor !== "all") search.set("contractor", contractor);
    if (sector !== "all") search.set("sector", sector);
    search.set("sortBy", sortBy);
    search.set("sortDir", sortDir);
    return search.toString();
  }, [contractor, lifecycle, query, sector, sortBy, sortDir]);

  async function loadData() {
    setLoading(true);
    const response = await fetch(`/api/permits?${params}`);
    const payload = (await response.json()) as ApiResponse;
    console.log("DASHBOARD =", payload.dashboard);
console.log("ACTIVE =", payload.dashboard.active);
console.log("ACTIVE ALERTS =", payload.alerts.active.length);

console.log("EXPIRED DASHBOARD =", payload.dashboard.expired);
console.log("EXPIRED ALERTS =", payload.alerts.expired.length);

console.log("FIRST PERMIT =", payload.permits[0]);
    
    setData(payload);

setLastUpdated(
  payload.lastUpdated
    ? new Date(payload.lastUpdated).toLocaleString()
    : "Never"
);

setLoading(false);
  }

  useEffect(() => {
  setIsAdmin(localStorage.getItem("isAdmin") === "true");

  const handle = window.setTimeout(() => {
    loadData().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Unable to load permits");
      setLoading(false);
    });
  }, 200);

  return () => window.clearTimeout(handle);
}, [params]);
useEffect(() => {
  const interval = setInterval(() => {
    loadData();
    setRefreshCountdown(AUTO_REFRESH_SECONDS);
  }, AUTO_REFRESH_SECONDS * 1000);

  return () => clearInterval(interval);
}, [params]);
useEffect(() => {
  const countdown = setInterval(() => {
    setRefreshCountdown((prev) => {
      if (prev <= 1) {
        return AUTO_REFRESH_SECONDS;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(countdown);
}, []);

  async function importFile(file: File) {
    setImporting(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("mode", "replace");

    const response = await fetch("/api/import", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Import failed");
    } else {
      setMessage(`Imported ${payload.importedRows} permit rows from ${file.name}`);
      await loadData();
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const totalPages = Math.ceil(data.permits.length / itemsPerPage);

const paginatedPermits = data.permits.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
  const statCards = [
  { label: t.totalPermits, value: data.dashboard.total },
  { label: t.activePermits, value: data.dashboard.active },
  { label: t.expiredPermits, value: data.dashboard.expired },
  {
  label: `🚨 ${t.expiring7}`,
  value: data.dashboard.expiringIn7Days,
  urgent: true
},
  { label: t.expiring15, value: data.dashboard.expiringIn15Days },
  { label: t.expiring30, value: data.dashboard.expiringIn30Days },
  { label: t.totalLength, value: `${formatNumber(data.dashboard.totalLengthMeters, 1)} m` }
];

  return (
    <main className="min-h-screen">
      <section className="border-b bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950">
        <div className="container flex flex-col gap-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
  <span>🏢</span>

  <p className="text-sm font-medium text-cyan-400">
    MUHAMMADIYYA
  </p>
</div>

<h1 className="mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
  Permit Operations Center
</h1>

<div className="mt-4 flex flex-wrap gap-2">
  <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
    Live Monitoring
  </Badge>

  <Badge className="border-orange-500/20 bg-orange-500/10 text-orange-400">
    Muroor Tracking
  </Badge>

  <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
    Compliance Dashboard
  </Badge>
</div>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-cyan-500">
  Created by ANIZ SALAM
</p>
          </div>
          <div className="flex flex-wrap gap-2">

            <Button
  variant="outline"
  onClick={() =>
    setLanguage(language === "en" ? "ar" : "en")
  }
>
  <Languages className="h-4 w-4" />
  {language === "en" ? "العربية" : "English"}
</Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file);
              }}
            />
            {isAdmin && (
  <Button
    variant="outline"
    onClick={() => fileInputRef.current?.click()}
    disabled={importing}
  >
    <Upload className="h-4 w-4" />
    {importing ? "Importing" : "Import"}
  </Button>
)}
            <Button variant="outline" asChild>
              <a href="/api/export">
                <Download className="h-4 w-4" />
                Export
              </a>
            </Button>

<Button variant="outline" asChild>
  <Link href="/admin">
    🔐 Admin
  </Link>
</Button>

            <Button variant="secondary" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </section>
      <section className="container space-y-5 py-5">
        <div className="mx-4 mt-3 overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 shadow-[0_0_25px_rgba(34,211,238,0.15)]">

  {/* Header */}
  <div className="flex items-center justify-between border-b border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
    <div className="flex items-center gap-3">
      <span className="animate-pulse">🔔</span>

      <span className="font-bold tracking-wider text-cyan-300">
        LIVE PERMIT ALERTS
      </span>

      <span className="text-xs text-cyan-400">
        📅 Last Updated: {lastUpdated}
      </span>
    </div>

    <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
    🔄 Refresh in {refreshCountdown}s
  </div>
</div>

  {/* Marquee */}
  <div className="animate-marquee py-3 text-sm font-semibold text-cyan-300">
    🚨 {data.dashboard.expiringIn15Days} Permits Expiring Within 15 Days
    &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
    ⚠️ {data.dashboard.expiringIn7Days} Critical Permits Expiring Within 7 Days
    &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
    ❌ {data.dashboard.expired} Expired Permits Need Immediate Action
    &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;
    📡 Permit Monitoring System Active
  </div>

</div>
        {message ? <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {statCards.map((card) => (
            <Card
  key={card.label}
  className={
    card.urgent
      ? "border-red-500 shadow-lg shadow-red-500/30 animate-pulse"
      : ""
  }
>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
  className={`text-2xl font-semibold ${
    card.urgent
      ? "text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]"
      : ""
  }`}
>
  {card.value}
</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]">
              <div className="relative">
                <Search
  className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]" 
/>
                <Input
                  value={query}
  onChange={(event) => setQuery(event.target.value)}
  placeholder={t.search}
  className="pl-9 bg-white/5 backdrop-blur-sm border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300"
/>
              </div>
              <Select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}>
                <option value="all">{t.allPermits}</option>
                <option value="active">{t.active}</option>
                <option value="expired">{t.expired}</option>
                <option value="soon">{t.expiringSoon}</option>
              </Select>
              <Select value={contractor} onChange={(event) => setContractor(event.target.value)}>
                <option value="all">{t.allContractors}</option>
                {data.filters.contractors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select value={sector} onChange={(event) => setSector(event.target.value)}>
                <option value="all">{t.allSectors}</option>
                {data.filters.sectors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="expiryDate">{t.sortByExpiry}</option>
<option value="remainingDays">{t.sortByRemaining}</option>
              </Select>
              <Button variant="outline" onClick={() => setSortDir((value) => (value === "asc" ? "desc" : "asc"))}>
                <ArrowDownAZ className="h-4 w-4" />
                {sortDir === "asc" ? t.ascending : t.descending}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <Card className="overflow-hidden">
            <div className="permit-scrollbar overflow-x-auto">
              <table className="w-full min-w-[1220px] text-sm">
                <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Alert</th>
                    <th className="px-4 py-3">Permit Number</th>
                    <th className="px-4 py-3">Contractor</th>
                    <th className="px-4 py-3">{t.location}</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
                    <th className="px-4 py-3 text-center">Muroor Remaining Days</th>
                    <th className="px-4 py-3 text-right">Permit Days</th>
                    <th className="px-4 py-3">Street</th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="w-40 px-4 py-3">Line</th>
                    <th className="px-4 py-3 text-right">Length</th>
                    <th className="px-4 py-3">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-12">
  <div className="flex flex-col items-center justify-center">
    <div className="w-24">
      <Lottie animationData={loaderAnimation} loop />
    </div>

    <p className="mt-2 text-sm text-muted-foreground">
      Loading permits...
    </p>
  </div>
</td>
                    </tr>
                  ) : data.permits.length ? (
                    paginatedPermits.map((permit) => (
                      <tr
                        key={permit.id}
                        className={`${rowClass(permit.calculations.expiryBucket)} cursor-pointer transition-colors hover:bg-muted`}
                        onClick={() => {
                          window.location.href = `/permits/${permit.id}`;
                        }}
                      >
                        <td className="px-4 py-3">
                          <Badge className={badgeClass(permit.calculations.alertLevel)}>
                            {permit.calculations.alertLevel === "complete" || permit.calculations.alertLevel === "normal" ? (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            ) : (
                              <AlertTriangle className="mr-1 h-3 w-3" />
                            )}
                            {permit.calculations.alertText}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <PermitDocumentLink permit={permit} />
                        </td>
                        <td className="px-4 py-3">{permit.contractorName || "-"}</td>
                        <td className="px-4 py-3">
  {permit.statusMuroorTasriya ? (
    <a
      href={permit.statusMuroorTasriya}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
    >
      📍 {t.viewLocation}
    </a>
  ) : (
    "-"
  )}
</td>
                        <td className="px-4 py-3">{formatDate(permit.workEndDate)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
  {formatNumber(permit.calculations.remainingDays)}
</td>

<td className="px-4 py-3 text-center">
  <Badge
    className={
      Number(permit.muroorStatusRemainingDate) <= 0
        ? "bg-red-600 text-white"
        : Number(permit.muroorStatusRemainingDate) <= 7
        ? "bg-orange-500 text-white"
        : Number(permit.muroorStatusRemainingDate) <= 15
        ? "bg-yellow-500 text-black"
        : "bg-green-600 text-white"
    }
  >
    {permit.muroorStatusRemainingDate ?? "-"}
  </Badge>
</td>

<td className="px-4 py-3 text-right">
  {formatNumber(permit.calculations.permitDays)}
</td>
                        <td className="px-4 py-3 max-w-[180px]">
  <div className="truncate">
    {permit.streetName || "-"}
  </div>
</td>
                        <td className="px-4 py-3">{permit.sector || "-"}</td>
                        <td className="w-40 px-4 py-3 max-w-[180px]">
  <div className="truncate">
    {permit.lineNumber || permit.lineName || "-"}
  </div>
</td>

<td className="px-4 py-3 text-right">
  {formatNumber(permit.lengthMeters, 1)}
</td>
<td className="px-4 py-3">
  {permit.permitLink ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={permit.permitLink} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                                <FileText className="h-4 w-4" />
                                View
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-4 py-12 text-center text-muted-foreground">
                        No permits found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-center gap-2 py-4">
  <Button
    variant="outline"
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
  >
    Previous
  </Button>

  <span className="px-3 text-sm">
    Page {currentPage} of {totalPages}
  </span>

  <Button
    variant="outline"
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage(currentPage + 1)}
  >
    Next
  </Button>
</div>
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
    <div className="flex items-center gap-2">
      <BellRing className="h-4 w-4 text-emerald-500" />
      <p className="text-sm font-bold tracking-wide text-emerald-400">
        Permit Alerts
      </p>
    </div>
  </div>
</CardHeader>
              <CardContent className="max-h-[760px] space-y-5 overflow-y-auto permit-scrollbar">
                <AlertList title={t.expiredAlert} items={data.alerts.expired} bucket="expired" />
                <AlertList title={`🚨 ${t.within7Alert}`} items={data.alerts.within7} bucket="within7" />
                <AlertList title={t.within15Alert} items={data.alerts.within15} bucket="within15" />
                <AlertList title={t.within30Alert} items={data.alerts.within30} bucket="within30" />
                <AlertList title={t.activeAlert} items={data.alerts.active} bucket="active" />
                <div className="mt-6 border-t border-border/60 pt-6">
  <div className="mb-5 flex items-center gap-2 rounded-md border border-orange-500/20 bg-orange-500/5 px-3 py-2">
    <ShieldAlert className="h-4 w-4 text-orange-500" />
    <p className="text-sm font-bold tracking-wide text-orange-400">
  {t.muroorAlerts}
</p>
  </div>

  <div className="space-y-4">
    <AlertList
      title={t.expiredMuroor}
      items={data.alerts.muroorExpired}
      bucket="expired"
      isMuroor
    />

    <AlertList
      title={`🚨 ${t.muroor7}`}
      items={data.alerts.muroorWithin7}
      bucket="within7"
      isMuroor
    />

    <AlertList
      title={t.muroor15}
      items={data.alerts.muroorWithin15}
      bucket="within15"
      isMuroor
    />

    <AlertList
      title={t.muroor30}
      items={data.alerts.muroorWithin30}
      bucket="within30"
      isMuroor
    />
  </div>
</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.workStatus}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.dashboard.byStatus
  .filter(
  (item) =>
    !item.status?.startsWith("http") &&
    item.status !== "Unspecified" &&
    !item.status?.toLowerCase().includes("make amana") &&
    !item.status?.toLowerCase().includes("muroor make")
)
  .slice(0, 8)
  .map((item) => (
                  <div key={item.status} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{item.status}</span>
                    <Badge
  className={
    item.status.toLowerCase().includes("site work complete")
      ? "rounded-full bg-green-600 px-3 py-1 text-white shadow-lg shadow-green-500/30"
      : item.status.includes("تم إخلا")
      ? "rounded-full bg-emerald-600 px-3 py-1 text-white shadow-lg shadow-emerald-500/30"
      : item.status.toLowerCase().includes("not completed")
      ? "rounded-full bg-red-600 px-3 py-1 text-white shadow-lg shadow-red-500/40"
      : item.status.toLowerCase().includes("some line not work")
      ? "rounded-full bg-orange-500 px-3 py-1 text-white"
      : item.status.includes("إلغاء")
      ? "rounded-full bg-slate-600 px-3 py-1 text-white"
      : "rounded-full bg-muted px-3 py-1 text-foreground"
  }
>
  {item.count}
</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
