"use client";

import {
  Download,
  History,
  Moon,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import type { ChatConversationSummary } from "@/lib/health-assistant";

interface ChatSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  conversations: ChatConversationSummary[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onDeleteConversation: (id: number) => void;
  canExport: boolean;
  canClear: boolean;
}

export function ChatSettingsPanel({
  open,
  onClose,
  darkMode,
  onToggleDarkMode,
  conversations,
  activeConversationId,
  onSelectConversation,
  onClearChat,
  onExportChat,
  onDeleteConversation,
  canExport,
  canClear,
}: ChatSettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl animate-health-slide-in">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Assistant settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Appearance
            </p>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {darkMode ? "Dark mode" : "Light mode"}
              </span>
              <span className="text-xs text-slate-400">Toggle</span>
            </button>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Chat actions
            </p>
            <div className="space-y-2">
              <button
                type="button"
                disabled={!canClear}
                onClick={onClearChat}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4 text-slate-400" />
                Clear current chat
              </button>
              <button
                type="button"
                disabled={!canExport}
                onClick={onExportChat}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <Download className="h-4 w-4 text-slate-400" />
                Export chat
              </button>
            </div>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <History className="h-3.5 w-3.5" />
              Conversation history
            </p>
            {conversations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                No saved conversations yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <div
                      className={`flex items-start gap-2 rounded-xl border px-3 py-2 transition ${
                        activeConversationId === conv.id
                          ? "border-teal-200 bg-teal-50/80"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => onSelectConversation(conv.id)}
                      >
                        <p className="truncate text-sm font-medium text-slate-800">
                          {conv.preview || `Conversation #${conv.id}`}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {conv.messageCount} messages ·{" "}
                          {new Date(conv.createdAt).toLocaleString()}
                        </p>
                      </button>
                      <button
                        type="button"
                        aria-label="Delete conversation"
                        onClick={() => onDeleteConversation(conv.id)}
                        className="shrink-0 rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
