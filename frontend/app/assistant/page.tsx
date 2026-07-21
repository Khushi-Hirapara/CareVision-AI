"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { HealthAssistantChat } from "@/components/health-assistant/HealthAssistantChat";
import { fetchScans } from "@/lib/api";
import { fetchMyScans } from "@/lib/my-scans";
import {
  fetchKnowledgeTopics,
  type KnowledgeTopic,
} from "@/lib/health-assistant";
import type { ScanRecord } from "@/lib/types";
import { PATIENT_REPORTS_PATH } from "@/lib/nav-links";

export default function HealthAssistantPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [list, knowledge] = await Promise.all([
          user.role === "patient" ? fetchMyScans(50) : fetchScans(50),
          fetchKnowledgeTopics().catch(() => [] as KnowledgeTopic[]),
        ]);
        if (cancelled) return;
        setScans(list);
        setTopics(knowledge);
        if (list.length > 0) {
          setSelectedScanId(Number(list[0].id));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your scans.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const backHref =
    user?.role === "patient" ? "/patient/dashboard" : "/doctor/dashboard";

  return (
    <div className="page-shell">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          {user?.role === "patient" ? (
            <Link
              href={PATIENT_REPORTS_PATH}
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              <FileText className="h-4 w-4" />
              My Reports
            </Link>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:p-5">
          <label
            htmlFor="assistant-scan-select"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Report to discuss
          </label>
          {loading ? (
            <div className="mt-2 h-10 animate-pulse rounded-xl bg-slate-100" />
          ) : error ? (
            <p className="mt-2 text-sm text-rose-600">{error}</p>
          ) : scans.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No scans available yet. Upload or wait for a screening report, then
              return here.
            </p>
          ) : (
            <select
              id="assistant-scan-select"
              value={selectedScanId ?? ""}
              onChange={(e) => setSelectedScanId(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            >
              {scans.map((scan) => (
                <option key={scan.id} value={scan.id}>
                  {scan.patientName} · {scan.prediction} ·{" "}
                  {new Date(scan.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>

        {topics.length > 0 ? (
          <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-teal-50/30 to-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-700" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-900">
                Health Knowledge
              </h2>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              The assistant uses these educational topics together with your
              selected report. Ask about any of them in chat.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 shadow-sm"
                >
                  <p className="text-xs font-semibold text-teal-800">
                    {topic.topic}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {topic.summary}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {selectedScanId ? (
          <HealthAssistantChat
            key={selectedScanId}
            scanId={selectedScanId}
            variant="page"
          />
        ) : !loading && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center text-sm text-slate-500">
            Select a report above to start chatting with the Health Assistant.
          </div>
        ) : null}
      </div>
    </div>
  );
}
