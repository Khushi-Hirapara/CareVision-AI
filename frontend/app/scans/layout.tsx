import { RequireAuth } from "@/components/auth/RequireAuth";

export default function ScansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
