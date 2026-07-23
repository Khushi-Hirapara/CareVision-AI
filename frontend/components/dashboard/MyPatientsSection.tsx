"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Search,
  Stethoscope,
  Upload,
  Users,
} from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { patientReportsPath, type PatientRecord } from "@/lib/patients";
import type { PatientScanStats } from "@/lib/patient-scan-stats";
import { formatDate } from "@/lib/utils";

interface MyPatientsSectionProps {
  patients: PatientRecord[];
  scanStats: Map<number, PatientScanStats>;
  search: string;
  onSearchChange: (value: string) => void;
  onInvite: () => void;
}

export function MyPatientsSection({
  patients,
  scanStats,
  search,
  onSearchChange,
  onInvite,
}: MyPatientsSectionProps) {
  const router = useRouter();
  const q = search.trim().toLowerCase();
  const filtered = q
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.email?.toLowerCase().includes(q) ?? false),
      )
    : patients;

  return (
    <DashboardPanel
      eyebrow="Active care"
      title="My Patients"
      description="Patients who accepted your invitation and have portal access. Pending invites are not listed here."
      icon={Stethoscope}
    >
      {patients.length > 0 ? (
        <div className="relative mb-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search active patients by name or email…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-inner shadow-slate-900/[0.02] outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:bg-slate-900"
          />
        </div>
      ) : null}

      {patients.length === 0 ? (
        <DashboardEmptyState
          icon={Users}
          title="No active patients yet"
          description="When patients accept your invitation, they appear here with scan history and quick actions for screening and reports."
          className="min-h-[300px]"
          action={
            <button type="button" onClick={onInvite} className="btn-primary">
              <Stethoscope className="h-4 w-4" aria-hidden />
              Invite your first patient
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <DashboardEmptyState
          icon={ClipboardList}
          title="No matching patients"
          description="Try a different search term or clear the filter."
          className="min-h-[240px]"
          action={
            <button type="button" onClick={() => onSearchChange("")} className="btn-secondary">
              Clear search
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-teal-100/80 shadow-sm dark:border-teal-800/50 dark:shadow-teal-950/20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-700">
              <thead className="bg-teal-50/50 dark:bg-teal-950/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Patient Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 sm:table-cell dark:text-slate-300">
                    Age
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 md:table-cell dark:text-slate-300">
                    Last Scan
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 lg:table-cell dark:text-slate-300">
                    Total Scans
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700/80 dark:bg-slate-950/60">
                {filtered.map((patient) => {
                  const stats = scanStats.get(patient.id);
                  const totalScans = stats?.totalScans ?? 0;
                  const lastScan = stats?.lastScanAt;

                  return (
                    <tr key={patient.id} className="transition hover:bg-teal-50/40 dark:hover:bg-teal-950/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{patient.name}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                        {patient.email || "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell dark:text-slate-400">
                        {patient.age ?? "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell dark:text-slate-400">
                        {lastScan ? formatDate(lastScan) : "—"}
                      </td>
                      <td className="hidden px-4 py-3 font-medium tabular-nums text-slate-700 lg:table-cell dark:text-slate-300">
                        {totalScans}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Link
                            href={`/analyze?patientId=${patient.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-100 transition hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-400/30 dark:hover:bg-teal-500/25"
                            title="Analyze X-ray for this patient"
                          >
                            <Upload className="h-3.5 w-3.5" aria-hidden />
                            Analyze
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(patientReportsPath(patient.id))
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 ring-1 ring-cyan-100 transition hover:bg-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-400/30 dark:hover:bg-cyan-500/25"
                            title={`View reports for ${patient.name}`}
                          >
                            <FileText className="h-3.5 w-3.5" aria-hidden />
                            Reports
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
            {filtered.length} active patient{filtered.length === 1 ? "" : "s"}
            {q ? ` (filtered from ${patients.length})` : ""}
          </p>
        </div>
      )}
    </DashboardPanel>
  );
}
