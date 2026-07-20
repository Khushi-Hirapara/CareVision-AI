import type { Metadata } from "next";
import { RequireDoctor } from "@/components/auth/RequireDoctor";

export const metadata: Metadata = {
  title: "Analyze X-Ray",
};

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireDoctor>{children}</RequireDoctor>;
}
