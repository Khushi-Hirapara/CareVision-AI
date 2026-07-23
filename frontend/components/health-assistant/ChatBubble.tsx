"use client";

import { Bot } from "lucide-react";
import { MarkdownMessage } from "@/components/health-assistant/MarkdownMessage";
import { SpecialResponseCards } from "@/components/health-assistant/SpecialResponseCards";
import type { HealthChatCard } from "@/lib/health-assistant";
import { cn } from "@/lib/utils";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: HealthChatCard[];
  isEmergency?: boolean;
}

interface ChatBubbleProps {
  message: AssistantMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-health-fade-in">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-teal-600/20 sm:max-w-[75%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-health-fade-in">
      <div className="health-avatar shrink-0" aria-hidden>
        <Bot className="h-4 w-4" />
      </div>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl rounded-tl-md border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:max-w-[80%] dark:border-slate-600/80 dark:bg-slate-800/90 dark:shadow-black/30",
          message.isEmergency &&
            "border-rose-200 bg-rose-50/40 dark:border-rose-500/40 dark:bg-rose-950/40",
        )}
      >
        <MarkdownMessage content={message.content} />
        {message.cards?.length ? (
          <SpecialResponseCards
            cards={message.cards.filter((c) => c.type !== "disclaimer")}
          />
        ) : null}
        {message.cards?.some((c) => c.type === "disclaimer") ? (
          <SpecialResponseCards
            cards={message.cards.filter((c) => c.type === "disclaimer")}
          />
        ) : null}
      </div>
    </div>
  );
}
