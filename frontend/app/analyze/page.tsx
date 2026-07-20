"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2, MailPlus, Sparkles } from "lucide-react";
import { AnalysisLoadingState } from "@/components/analyze/AnalysisLoadingState";
import { AnalysisResultCard } from "@/components/analyze/AnalysisResultCard";
import { XRayUploadPanel } from "@/components/analyze/XRayUploadPanel";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { Card } from "@/components/ui/Card";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { PredictApiError, predictXrayForPatient } from "@/lib/api";
import { fetchPatients, type PatientRecord } from "@/lib/patients";
import { PATIENTS_PATH } from "@/lib/nav-links";
import type { AnalysisResult } from "@/lib/types";

function AnalyzePageContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("patientId");

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setPatientsLoading(true);
      try {
        const list = await fetchPatients();
        if (!cancelled) {
          setPatients(list);
          if (preselectedId) {
            const exists = list.some((p) => String(p.id) === preselectedId);
            if (exists) {
              setSelectedPatientId(preselectedId);
            }
          }
        }
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setPatientsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preselectedId]);

  const selectedPatient = patients.find(
    (p) => String(p.id) === selectedPatientId,
  );

  const revokePreview = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleFileSelect = useCallback(
    (selected: File, url: string) => {
      revokePreview(previewUrl);
      setFile(selected);
      setFileName(selected.name);
      setPreviewUrl(url);
      setResult(null);
      setUploadError(null);
      setAnalyzeError(null);
    },
    [previewUrl, revokePreview],
  );

  const handleClear = useCallback(() => {
    revokePreview(previewUrl);
    setFile(null);
    setFileName(null);
    setPreviewUrl(null);
    setResult(null);
    setUploadError(null);
    setAnalyzeError(null);
  }, [previewUrl, revokePreview]);

  const hasPatient = Boolean(selectedPatientId);
  const hasImage = Boolean(file && previewUrl);
  const canAnalyze = hasPatient && hasImage && !isAnalyzing;

  const handleAnalyze = async () => {
    if (!file || !selectedPatientId || !canAnalyze) return;

    const patientId = Number.parseInt(selectedPatientId, 10);
    if (!Number.isFinite(patientId)) {
      setAnalyzeError("Select a valid patient.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setAnalyzeError(null);

    try {
      const analysis = await predictXrayForPatient(patientId, file);
      setResult(analysis);
    } catch (err) {
      const message =
        err instanceof PredictApiError
          ? err.message
          : "Something went wrong during analysis. Please try again.";
      setAnalyzeError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeHint = !hasPatient
    ? "Select an accepted patient to continue"
    : !hasImage
      ? "Upload a valid PNG or JPEG to enable analysis"
      : null;

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title="Analyze X-Ray"
          description="Select an accepted patient, upload a chest radiograph, and run AI screening. Results are saved to their profile and visible on the patient portal."
        />

        <div className="mb-6">
          <MedicalDisclaimer compact />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-teal-600" aria-hidden />
                Patient &amp; study
              </h2>

              {patientsLoading ? (
                <LoadingPanel message="Loading accepted patients…" className="mb-4 py-6" />
              ) : patients.length === 0 ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                  <p className="font-medium">No accepted patients yet</p>
                  <p className="mt-1 text-amber-800/90">
                    Invite a patient and wait until they accept the email invitation.
                    Only accepted patients can be selected for X-ray analysis.
                  </p>
                  <Link
                    href={PATIENTS_PATH}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
                  >
                    <MailPlus className="h-4 w-4" aria-hidden />
                    Manage patients &amp; invitations
                  </Link>
                </div>
              ) : (
                <div className="mb-4">
                  <label
                    htmlFor="patient-select"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Accepted patient <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="patient-select"
                    required
                    value={selectedPatientId}
                    disabled={isAnalyzing}
                    onChange={(e) => {
                      setSelectedPatientId(e.target.value);
                      setAnalyzeError(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
                  >
                    <option value="">Select patient…</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={String(patient.id)}>
                        {patient.name}
                        {patient.email ? ` · ${patient.email}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedPatient ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Results will be saved to{" "}
                      <span className="font-medium text-slate-700">
                        {selectedPatient.name}
                      </span>{" "}
                      and shown on their patient portal.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Only patients who accepted your invitation appear in this list.
                    </p>
                  )}
                </div>
              )}

              <XRayUploadPanel
                previewUrl={previewUrl}
                fileName={fileName}
                error={uploadError}
                disabled={isAnalyzing || patients.length === 0 || !hasPatient}
                onFileSelect={handleFileSelect}
                onClear={handleClear}
                onError={setUploadError}
              />

              <button
                type="button"
                disabled={!canAnalyze}
                onClick={() => void handleAnalyze()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Analyzing…
                  </>
                ) : (
                  "Analyze X-Ray"
                )}
              </button>

              {analyzeHint ? (
                <p className="mt-3 text-center text-xs text-slate-500">
                  {analyzeHint}
                </p>
              ) : null}
            </Card>
          </div>

          <div className="lg:sticky lg:top-20">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Results</h2>

            {isAnalyzing && <AnalysisLoadingState />}

            {!isAnalyzing && analyzeError && (
              <ErrorAlert title="Analysis failed" message={analyzeError} />
            )}

            {!isAnalyzing && !analyzeError && result && previewUrl && (
              <div className="space-y-4">
                <AnalysisResultCard
                  result={result}
                  imageUrl={result.imageUrl || previewUrl}
                />
                {selectedPatient ? (
                  <p className="text-center text-xs text-slate-500">
                    Saved to{" "}
                    <span className="font-medium">{selectedPatient.name}</span>
                    {" — visible on their patient portal."}
                  </p>
                ) : null}
                {result.scanId != null && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/scans/${result.scanId}`}
                      className="btn-secondary flex-1 justify-center"
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      View scan details
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!isAnalyzing && !analyzeError && !result && (
              <EmptyState
                icon={Sparkles}
                title="No results yet"
                description="Select an accepted patient, upload a chest X-ray, then run analysis."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <LoadingPanel message="Loading analyzer…" />
          </div>
        </div>
      }
    >
      <AnalyzePageContent />
    </Suspense>
  );
}
