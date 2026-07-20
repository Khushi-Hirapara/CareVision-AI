import type { DicomMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DicomMetadataPanelProps {
  metadata: DicomMetadata | null | undefined;
  originalUrl?: string;
  className?: string;
}

function formatStudyDate(raw: string | null | undefined): string | null {
  if (!raw || raw.length < 8) return raw ?? null;
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  if (!/^\d{8}/.test(raw)) return raw;
  return `${y}-${m}-${d}`;
}

function rowsFromMetadata(metadata: DicomMetadata): { label: string; value: string }[] {
  const matrix =
    metadata.rows && metadata.columns
      ? `${metadata.rows} × ${metadata.columns}`
      : null;

  const entries: [string, string | number | null | undefined][] = [
    ["Modality", metadata.modality],
    ["Study date", formatStudyDate(metadata.study_date)],
    ["Body part", metadata.body_part_examined],
    ["Study", metadata.study_description],
    ["Series", metadata.series_description],
    ["DICOM patient ID", metadata.patient_id],
    ["DICOM patient name", metadata.patient_name],
    ["Sex / age", [metadata.patient_sex, metadata.patient_age].filter(Boolean).join(" · ") || null],
    ["Institution", metadata.institution_name],
    ["Manufacturer", metadata.manufacturer],
    ["Matrix", matrix],
  ];

  return entries
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([label, value]) => ({ label, value: String(value) }));
}

export function DicomMetadataPanel({
  metadata,
  originalUrl,
  className,
}: DicomMetadataPanelProps) {
  if (!metadata || metadata.source_format !== "DICOM") {
    // Still show if we have any useful tags without source_format.
    if (!metadata || rowsFromMetadata(metadata).length === 0) {
      return null;
    }
  }

  const rows = rowsFromMetadata(metadata);
  if (rows.length === 0 && !originalUrl) return null;

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
        className,
      )}
      aria-label="DICOM study metadata"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            DICOM study metadata
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            Preserved medical imaging tags
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Original DICOM was retained for hospital compatibility; analysis used a
            high-quality PNG conversion.
          </p>
        </div>
        {originalUrl ? (
          <a
            href={originalUrl}
            download
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            Download DICOM
          </a>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {row.label}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-900">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
