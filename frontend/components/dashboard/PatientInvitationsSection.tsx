"use client";

import Link from "next/link";
import { MailPlus, RefreshCw, UserCheck, X } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { InvitationStatusBadge } from "@/components/dashboard/InvitationStatusBadge";
import type { PatientInvitationRecord } from "@/lib/patients";
import { formatDate } from "@/lib/utils";

interface PatientInvitationsSectionProps {
  invitations: PatientInvitationRecord[];
  patientIdByEmail: (email: string) => number | null;
  onInvite: () => void;
  onResend: (invitationId: number) => void;
  onCancel: (invitationId: number) => void;
  actionLoadingId: number | null;
}

export function PatientInvitationsSection({
  invitations,
  patientIdByEmail,
  onInvite,
  onResend,
  onCancel,
  actionLoadingId,
}: PatientInvitationsSectionProps) {
  const sorted = [...invitations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <DashboardPanel
      eyebrow="Portal access"
      title="Patient Invitations"
      description="Track pending, accepted, expired, and cancelled invitations separately from active patients."
      icon={MailPlus}
      action={
        <button type="button" onClick={onInvite} className="btn-primary text-xs sm:text-sm">
          <MailPlus className="h-4 w-4" aria-hidden />
          Invite Patient
        </button>
      }
    >
      {sorted.length === 0 ? (
        <DashboardEmptyState
          icon={MailPlus}
          title="No invitations yet"
          description="Invite patients by email so they can create a portal account and view their scan results securely."
          className="min-h-[280px]"
          action={
            <button type="button" onClick={onInvite} className="btn-primary">
              <MailPlus className="h-4 w-4" aria-hidden />
              Send first invitation
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/90 shadow-sm dark:border-slate-700/80 dark:shadow-black/20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-700">
              <thead className="bg-slate-50/90 dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Patient Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 md:table-cell dark:text-slate-300">
                    Sent Date
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 lg:table-cell dark:text-slate-300">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700/80 dark:bg-slate-950/60">
                {sorted.map((inv) => {
                  const status = inv.status.toLowerCase();
                  const isLoading = actionLoadingId === inv.id;
                  const linkedPatientId = patientIdByEmail(inv.email);

                  return (
                    <tr key={inv.id} className="transition hover:bg-cyan-50/30 dark:hover:bg-cyan-950/30">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {inv.patientName || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                        {inv.email}
                      </td>
                      <td className="px-4 py-3">
                        <InvitationStatusBadge status={inv.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell dark:text-slate-400">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 lg:table-cell dark:text-slate-400">
                        {formatDate(inv.expiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {status === "pending" ? (
                            <>
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => onResend(inv.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 ring-1 ring-cyan-100 transition hover:bg-cyan-100 disabled:opacity-50 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-400/30 dark:hover:bg-cyan-500/25"
                              >
                                <RefreshCw
                                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                                  aria-hidden
                                />
                                Resend
                              </button>
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => onCancel(inv.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-800"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden />
                                Cancel
                              </button>
                            </>
                          ) : null}
                          {status === "expired" ? (
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => onResend(inv.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 ring-1 ring-cyan-100 transition hover:bg-cyan-100 disabled:opacity-50 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-400/30 dark:hover:bg-cyan-500/25"
                            >
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                                aria-hidden
                              />
                              Resend
                            </button>
                          ) : null}
                          {status === "accepted" && linkedPatientId != null ? (
                            <Link
                              href={`/analyze?patientId=${linkedPatientId}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30 dark:hover:bg-emerald-500/25"
                            >
                              <UserCheck className="h-3.5 w-3.5" aria-hidden />
                              View Patient
                            </Link>
                          ) : null}
                          {status === "cancelled" ? (
                            <span className="px-2 py-1.5 text-xs text-slate-400">—</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
            {sorted.length} invitation{sorted.length === 1 ? "" : "s"} total
          </p>
        </div>
      )}
    </DashboardPanel>
  );
}
