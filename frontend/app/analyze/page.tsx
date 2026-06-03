"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { AnalysisLoadingState } from "@/components/analyze/AnalysisLoadingState";
import { AnalysisResultCard } from "@/components/analyze/AnalysisResultCard";
import { XRayUploadPanel } from "@/components/analyze/XRayUploadPanel";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { Card } from "@/components/ui/Card";
import { PredictApiError, predictXray } from "@/lib/api";
import type { AnalysisResult } from "@/lib/types";

export default function AnalyzePage() {
  const [patientName, setPatientName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

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

  const canAnalyze = Boolean(file && previewUrl) && !isAnalyzing;

  const handleAnalyze = async () => {
    if (!file || !canAnalyze) return;

    setIsAnalyzing(true);
    setResult(null);
    setAnalyzeError(null);

    try {
      const analysis = await predictXray(file, patientName);
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

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title="Analyze X-Ray"
          description="Upload a chest radiograph for AI-assisted pneumonia screening. Results are saved to your local scan history."
        />

        <div className="mb-6">
          <MedicalDisclaimer compact />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-teal-600" aria-hidden />
                Upload study
              </h2>

              <div className="mb-4">
                <label
                  htmlFor="patient-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Patient name{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="patient-name"
                  type="text"
                  value={patientName}
                  disabled={isAnalyzing}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
                />
              </div>

              <XRayUploadPanel
                previewUrl={previewUrl}
                fileName={fileName}
                error={uploadError}
                disabled={isAnalyzing}
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

              {!file && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Upload a valid PNG or JPEG to enable analysis
                </p>
              )}
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
                description="Upload a chest X-ray and select Analyze X-Ray to view prediction, confidence, and heatmap."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
