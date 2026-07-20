import { RequireDoctor } from "@/components/auth/RequireDoctor";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireDoctor>{children}</RequireDoctor>;
}
