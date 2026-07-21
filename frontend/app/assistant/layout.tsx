import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
