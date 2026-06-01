"use client";

import { useCallback, useState } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { AnalysisLoadingState } from "@/components/analyze/AnalysisLoadingState";
import { AnalysisResultCard } from "@/components/analyze/AnalysisResultCard";
import { XRayUploadPanel } from "@/components/analyze/XRayUploadPanel";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { getDummyAnalysisResult } from "@/lib/dummy-data";
import type { AnalysisResult } from "@/lib/types";

const ANALYZE_DELAY_MS = 2000;

export default function AnalyzePage() {
  const [patientName, setPatientName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
  }, [previewUrl, revokePreview]);

  const canAnalyze = Boolean(file && previewUrl) && !isAnalyzing;

  const handleAnalyze = () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setResult(null);

    window.setTimeout(() => {
      setResult(getDummyAnalysisResult());
      setIsAnalyzing(false);
    }, ANALYZE_DELAY_MS);
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title="Analyze X-Ray"
          description="Upload a chest radiograph for AI-assisted pneumonia screening. Preview your image, run analysis, and review results below."
        />

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Demo mode: analysis uses sample data. Images stay in your browser and
            are not uploaded to a server.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Upload column */}
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
                onClick={handleAnalyze}
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
                  Upload an image to enable analysis
                </p>
              )}
            </Card>
          </div>

          {/* Results column */}
          <div className="lg:sticky lg:top-20">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Results
            </h2>

            {isAnalyzing && <AnalysisLoadingState />}

            {!isAnalyzing && result && previewUrl && (
              <AnalysisResultCard result={result} imagePreviewUrl={previewUrl} />
            )}

            {!isAnalyzing && !result && (
              <Card className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[360px]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Sparkles className="h-7 w-7" aria-hidden />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No results yet
                </p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500 sm:text-sm">
                  Upload a chest X-ray and select{" "}
                  <span className="font-medium text-slate-600">Analyze X-Ray</span>{" "}
                  to view prediction, confidence, and heatmap.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
