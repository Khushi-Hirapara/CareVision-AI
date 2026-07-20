import type { ScanRecord } from "@/lib/types";
import { StudyImage } from "@/components/ui/StudyImage";
import { formatDate } from "@/lib/utils";
import { ConfidenceBar } from "./ConfidenceBar";
import { PredictionBadge, SeverityBadge } from "./ui/Badge";
import { Card } from "./ui/Card";

interface ScanResultCardProps {
  scan: ScanRecord;
}

export function ScanResultCard({ scan }: ScanResultCardProps) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Patient
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {scan.patientName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PredictionBadge label={scan.prediction} />
          <SeverityBadge severity={scan.severity} />
        </div>
      </div>

      <ConfidenceBar value={scan.confidence} />

      <p className="text-sm leading-relaxed text-slate-600">
        {scan.recommendation}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <p className="border-b border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
            X-Ray
          </p>
          <div className="relative aspect-square">
            <StudyImage
              src={scan.imagePath}
              alt="Chest X-ray"
              fill
              objectFit="contain"
              className="p-2"
            />
          </div>
        </div>
        {scan.heatmapPath && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <p className="border-b border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
              Grad-CAM
            </p>
            <div className="relative aspect-square">
              <StudyImage
                src={scan.heatmapPath}
                alt="Grad-CAM heatmap"
                fill
                objectFit="contain"
                className="p-2"
              />
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Analyzed {formatDate(scan.createdAt)}
      </p>
    </Card>
  );
}
