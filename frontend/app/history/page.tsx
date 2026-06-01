import Link from "next/link";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { PredictionBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { dummyScans } from "@/lib/dummy-data";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Scan History",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Scan History"
        description="Review past chest X-ray analyses. Data shown is sample content for UI development."
      />

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <th className="px-5 py-3 font-semibold text-slate-700">Patient</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Prediction</th>
              <th className="px-5 py-3 font-semibold text-slate-700">
                Confidence
              </th>
              <th className="px-5 py-3 font-semibold text-slate-700">Date</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Report</th>
            </tr>
          </thead>
          <tbody>
            {dummyScans.map((scan) => (
              <tr
                key={scan.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
              >
                <td className="px-5 py-4 font-medium text-slate-900">
                  {scan.patientName}
                </td>
                <td className="px-5 py-4">
                  <PredictionBadge label={scan.prediction} />
                </td>
                <td className="px-5 py-4">
                  <div className="w-32">
                    <ConfidenceBar value={scan.confidence} />
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {formatDate(scan.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/reports?id=${scan.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {dummyScans.map((scan) => (
          <Card key={scan.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{scan.patientName}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(scan.createdAt)}
                </p>
              </div>
              <PredictionBadge label={scan.prediction} />
            </div>
            <ConfidenceBar value={scan.confidence} />
            <Link
              href={`/reports?id=${scan.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700"
            >
              <Eye className="h-4 w-4" aria-hidden />
              View report
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
