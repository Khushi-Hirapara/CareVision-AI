import { RequireDoctor } from "@/components/auth/RequireDoctor";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireDoctor>{children}</RequireDoctor>;
}
