import { RequireDoctor } from "@/components/auth/RequireDoctor";

export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireDoctor>{children}</RequireDoctor>;
}
