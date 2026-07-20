"use client";

import { FormEvent, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { postScanAiChat } from "@/lib/api";
import { postMyScanAiChat } from "@/lib/my-scans";
import type { UserRole } from "@/lib/types";
import { AI_CHAT_DISCLAIMER } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

const SUGGESTED_PROMPTS = [
  "Explain this result in simple words",
  "Explain confidence",
  "Explain Grad-CAM",
  "Explain severity",
  "Explain recommendation",
  "What should I discuss with my doctor?",
] as const;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ScanAiChatSectionProps {
  scanId: string;
  userRole: UserRole;
}

export function ScanAiChatSection({ scanId, userRole }: ScanAiChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setIsSending(true);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const answer =
        userRole === "patient"
          ? await postMyScanAiChat(scanId, trimmed)
          : await postScanAiChat(scanId, trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not get a response. Try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <MessageCircle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              AI Scan Assistant
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Ask questions about this saved scan result only.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
        <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
          {AI_CHAT_DISCLAIMER}
        </p>

        {error ? <ErrorAlert title="Chat unavailable" message={error} /> : null}

        <div
          className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              No messages yet. Try a suggested question or type your own.
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={
                  msg.role === "user"
                    ? "ml-8 rounded-xl rounded-tr-sm bg-teal-600 px-3 py-2 text-sm text-white"
                    : "mr-4 rounded-xl rounded-tl-sm border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap"
                }
              >
                {msg.content}
              </div>
            ))
          )}
          {isSending ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Preparing explanation…
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isSending}
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="scan-ai-chat-input" className="sr-only">
            Your question about this scan
          </label>
          <input
            id="scan-ai-chat-input"
            type="text"
            value={input}
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this scan result…"
            maxLength={2000}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Send
          </button>
        </form>
      </div>
    </Card>
  );
}
