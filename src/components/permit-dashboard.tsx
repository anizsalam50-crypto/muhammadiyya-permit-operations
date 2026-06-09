"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Languages
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
  calculations: {
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
  };
  filters: {
    statuses: string[];
    contractors: string[];
    sectors: string[];
  };
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
  alerts: { expired: [], within7: [], within15: [], within30: [], active: [] },
  filters: { statuses: [], contractors: [], sectors: [] }
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

function AlertList({ title, items, bucket }: { title: string; items: PermitRow[]; bucket: ExpiryBucket }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Badge className={badgeClass(bucket)}>{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.slice(0, 5).map((permit) => (
          <Link
            key={permit.id}
            href={`/permits/${permit.id}`}
            className="block rounded-md border bg-background p-3 text-sm transition-colors hover:bg-muted/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{permit.permitNumber || permit.permitNumberUsed || "No permit no."}</p>
                <p className="truncate text-xs text-muted-foreground">{permit.contractorName || "Unspecified contractor"}</p>
                <p className="truncate text-xs text-muted-foreground">{permit.streetName || "No street name"}</p>
              </div>
              <div className="text-right text-xs">
                <p>{formatDate(permit.workEndDate)}</p>
                <p className="font-semibold">{formatNumber(permit.calculations.remainingDays)} days</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
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
    setData(payload);
    setLoading(false);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadData().catch((error) => {
        setMessage(error instanceof Error ? error.message : "Unable to load permits");
        setLoading(false);
      });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [params]);

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

  const statCards = [
    { label: "Total Permits", value: data.dashboard.total },
    { label: "Active Permits", value: data.dashboard.active },
    { label: "Expired Permits", value: data.dashboard.expired },
    { label: "Expiring in 7 Days", value: data.dashboard.expiringIn7Days },
    { label: "Expiring in 15 Days", value: data.dashboard.expiringIn15Days },
    { label: "Expiring in 30 Days", value: data.dashboard.expiringIn30Days },
    { label: "Total Length", value: `${formatNumber(data.dashboard.totalLengthMeters, 1)} m` }
  ];

  return (
    <main className="min-h-screen">
      <section className="border-b bg-card">
        <div className="container flex flex-col gap-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">MUHAMMADIYYA Permit Operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">MUHAMMADIYYA Permit Operations</h1>
            <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">Created by : ANIZ SALAM</p>
          </div>
          <div className="flex flex-wrap gap-2">

            <Button variant="outline">
              <Languages className="h-4 w-4" />
              العربية
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
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4" />
              {importing ? "Importing" : "Import"}
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/export">
                <Download className="h-4 w-4" />
                Export
              </a>
            </Button>
            <Button variant="secondary" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <section className="container space-y-5 py-5">
        {message ? <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search permit, contractor, street, line"
                  className="pl-9"
                />
              </div>
              <Select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}>
                <option value="all">All permits</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="soon">Expiring Soon</option>
              </Select>
              <Select value={contractor} onChange={(event) => setContractor(event.target.value)}>
                <option value="all">All contractors</option>
                {data.filters.contractors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select value={sector} onChange={(event) => setSector(event.target.value)}>
                <option value="all">All sectors</option>
                {data.filters.sectors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="expiryDate">Sort by expiry date</option>
                <option value="remainingDays">Sort by remaining days</option>
              </Select>
              <Button variant="outline" onClick={() => setSortDir((value) => (value === "asc" ? "desc" : "asc"))}>
                <ArrowDownAZ className="h-4 w-4" />
                {sortDir === "asc" ? "Ascending" : "Descending"}
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
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
                    <th className="px-4 py-3 text-right">Permit Days</th>
                    <th className="px-4 py-3">Street</th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3">Line</th>
                    <th className="px-4 py-3 text-right">Length</th>
                    <th className="px-4 py-3">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                        Loading permits
                      </td>
                    </tr>
                  ) : data.permits.length ? (
                    data.permits.map((permit) => (
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
                        <td className="px-4 py-3">{permit.statusNormalized || permit.statusMuroorTasriya || "Unspecified"}</td>
                        <td className="px-4 py-3">{formatDate(permit.workEndDate)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatNumber(permit.calculations.remainingDays)}
                        </td>
                        <td className="px-4 py-3 text-right">{formatNumber(permit.calculations.permitDays)}</td>
                        <td className="px-4 py-3">{permit.streetName || "-"}</td>
                        <td className="px-4 py-3">{permit.sector || "-"}</td>
                        <td className="px-4 py-3">{permit.lineNumber || permit.lineName || "-"}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(permit.lengthMeters, 1)}</td>
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
                      <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                        No permits found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Permit Alerts</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[760px] space-y-5 overflow-y-auto permit-scrollbar">
                <AlertList title="Expired permits" items={data.alerts.expired} bucket="expired" />
                <AlertList title="Expiring within 7 days" items={data.alerts.within7} bucket="within7" />
                <AlertList title="Expiring within 15 days" items={data.alerts.within15} bucket="within15" />
                <AlertList title="Expiring within 30 days" items={data.alerts.within30} bucket="within30" />
                <AlertList title="Active permits" items={data.alerts.active.slice(0, 5)} bucket="active" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status counts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.dashboard.byStatus.slice(0, 8).map((item) => (
                  <div key={item.status} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{item.status}</span>
                    <Badge className="bg-muted text-foreground">{item.count}</Badge>
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
