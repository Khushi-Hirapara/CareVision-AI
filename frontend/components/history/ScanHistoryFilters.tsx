"use client";

import { Filter, Grid2X2, List, Search, X } from "lucide-react";
import type { PredictionLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PredictionFilter = "all" | PredictionLabel;
export type ScanViewMode = "grid" | "list";

interface ScanHistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  predictionFilter: PredictionFilter;
  onPredictionFilterChange: (value: PredictionFilter) => void;
  resultCount: number;
  totalCount: number;
  viewMode: ScanViewMode;
  onViewModeChange: (value: ScanViewMode) => void;
  className?: string;
}

const FILTER_OPTIONS: { value: PredictionFilter; label: string }[] = [
  { value: "all", label: "All results" },
  { value: "Normal", label: "Normal" },
  { value: "Pneumonia", label: "Pneumonia" },
];

export function ScanHistoryFilters({
  searchQuery,
  onSearchChange,
  predictionFilter,
  onPredictionFilterChange,
  resultCount,
  totalCount,
  viewMode,
  onViewModeChange,
  className,
}: ScanHistoryFiltersProps) {
  const hasActiveFilters =
    searchQuery.trim().length > 0 || predictionFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onPredictionFilterChange("all");
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by patient name…"
            aria-label="Search by patient name"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-1"
            aria-label="Scan display"
          >
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                viewMode === "grid"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Grid2X2 className="h-3.5 w-3.5" aria-hidden />
              Grid
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              aria-label="Horizontal detailed view"
              aria-pressed={viewMode === "list"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                viewMode === "list"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <List className="h-3.5 w-3.5" aria-hidden />
              Details
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" aria-hidden />
            <label htmlFor="prediction-filter" className="sr-only">
              Filter by prediction
            </label>
            <select
              id="prediction-filter"
              value={predictionFilter}
              onChange={(e) =>
                onPredictionFilterChange(e.target.value as PredictionFilter)
              }
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{resultCount}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalCount}</span> scans
      </p>
    </div>
  );
}
