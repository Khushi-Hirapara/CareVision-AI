import { RequirePatient } from "@/components/auth/RequirePatient";

export default function PatientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequirePatient>{children}</RequirePatient>;
}
