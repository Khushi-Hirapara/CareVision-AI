"use client";

import { HealthAssistantChat } from "@/components/health-assistant/HealthAssistantChat";
import type { UserRole } from "@/lib/types";

interface ScanAiChatSectionProps {
  scanId: string;
  userRole: UserRole;
}

/**
 * Scan-detail Health Assistant embed.
 * Role is enforced by the backend JWT + scan access checks.
 */
export function ScanAiChatSection({ scanId }: ScanAiChatSectionProps) {
  const numericId = Number(scanId);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return null;
  }

  return (
    <HealthAssistantChat
      scanId={numericId}
      variant="embedded"
      className="mt-2"
    />
  );
}
