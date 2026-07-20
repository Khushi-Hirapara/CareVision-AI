"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import {
  createScanNote,
  deleteScanNote,
  fetchScanNotes,
  updateScanNote,
} from "@/lib/api";
import { fetchMyScanNotes } from "@/lib/my-scans";
import type { ScanNoteRecord, UserRole } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

interface ScanNotesSectionProps {
  scanId: string;
  userRole: UserRole;
}

export function ScanNotesSection({ scanId, userRole }: ScanNotesSectionProps) {
  const isDoctor = userRole === "doctor";
  const [notes, setNotes] = useState<ScanNoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = isDoctor
        ? await fetchScanNotes(scanId)
        : await fetchMyScanNotes(scanId);
      setNotes(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load doctor notes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [scanId, isDoctor]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function handleSaveNew() {
    const text = newNoteText.trim();
    if (!text) return;

    setIsSaving(true);
    setActionError(null);
    try {
      const created = await createScanNote(scanId, text);
      setNotes((prev) => [created, ...prev]);
      setNewNoteText("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not save note.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveEdit(noteId: number) {
    const text = editText.trim();
    if (!text) return;

    setIsSaving(true);
    setActionError(null);
    try {
      const updated = await updateScanNote(scanId, noteId, text);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updated : n)),
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not update note.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(noteId: number) {
    setActionError(null);
    try {
      await deleteScanNote(scanId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete note.",
      );
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 ring-1 ring-amber-100">
            <ClipboardList className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Doctor Notes
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isDoctor
                ? "Clinical notes visible to the patient. Add or update notes for this scan."
                : "Notes from your care team about this scan."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {isLoading && (
          <LoadingPanel message="Loading notes…" className="py-8" />
        )}

        {!isLoading && error && (
          <ErrorAlert title="Notes unavailable" message={error} />
        )}

        {!isLoading && !error && isDoctor && (
          <div className="space-y-3">
            <label htmlFor="new-doctor-note" className="sr-only">
              New doctor note
            </label>
            <textarea
              id="new-doctor-note"
              rows={4}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Enter clinical observations, follow-up instructions, or context for the patient…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="button"
              onClick={() => void handleSaveNew()}
              disabled={isSaving || !newNoteText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              Save note
            </button>
          </div>
        )}

        {actionError && (
          <p className="text-sm text-rose-600" role="alert">
            {actionError}
          </p>
        )}

        {!isLoading && !error && notes.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
            {isDoctor
              ? "No notes yet. Add the first note above."
              : "No doctor notes have been added for this scan."}
          </p>
        )}

        {!isLoading && !error && notes.length > 0 && (
          <ul className="space-y-3">
            {notes.map((note) => {
              const isEditing = editingId === note.id;

              return (
                <li
                  key={note.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4"
                >
                  {isEditing && isDoctor ? (
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit(note.id)}
                          disabled={isSaving || !editText.trim()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" aria-hidden />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {note.noteText}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">
                          {formatDate(note.updatedAt)}
                          {note.updatedAt !== note.createdAt && " (edited)"}
                        </p>
                        {isDoctor && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(note.id);
                                setEditText(note.noteText);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(note.id)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50",
                              )}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
