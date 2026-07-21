"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "health-md prose prose-sm max-w-none text-slate-700",
        "prose-headings:font-semibold prose-headings:text-slate-900",
        "prose-a:text-teal-700 prose-strong:text-slate-900",
        "prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5",
        "prose-pre:rounded-xl prose-pre:bg-slate-900 prose-pre:text-slate-100",
        "prose-table:text-sm",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
