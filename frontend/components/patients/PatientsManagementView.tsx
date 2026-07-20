"use client";

import { useCallback, useEffect, useState } from "react";
import { MailPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { InvitePatientModal } from "@/components/dashboard/InvitePatientModal";
import { MyPatientsSection } from "@/components/dashboard/MyPatientsSection";
import { PatientInvitationsSection } from "@/components/dashboard/PatientInvitationsSection";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { Toast } from "@/components/ui/Toast";
import { fetchScans } from "@/lib/api";
import {
  buildPatientScanStatsMap,
  findPatientIdByEmail,
  type PatientScanStats,
} from "@/lib/patient-scan-stats";
import {
  cancelPatientInvitation,
  fetchGroupedInvitations,
  fetchPatients,
  resendPatientInvitation,
  type GroupedInvitations,
  type PatientInvitationRecord,
  type PatientRecord,
} from "@/lib/patients";

function flattenInvitations(grouped: GroupedInvitations): PatientInvitationRecord[] {
  return [
    ...grouped.pending,
    ...grouped.accepted,
    ...grouped.expired,
    ...grouped.cancelled,
  ];
}

export function PatientsManagementView() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [invitations, setInvitations] = useState<PatientInvitationRecord[]>([]);
  const [scanStats, setScanStats] = useState<Map<number, PatientScanStats>>(new Map());
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [invitationActionId, setInvitationActionId] = useState<number | null>(null);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [patientData, groupedInvites, scans] = await Promise.all([
        fetchPatients(),
        fetchGroupedInvitations(),
        fetchScans(200),
      ]);
      setPatients(patientData);
      setInvitations(flattenInvitations(groupedInvites));
      setScanStats(buildPatientScanStatsMap(patientData, scans));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load patient records.",
      );
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleResend(invitationId: number) {
    setInvitationActionId(invitationId);
    try {
      await resendPatientInvitation(invitationId);
      setToast("Invitation resent successfully.");
      await loadData({ silent: true });
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Could not resend invitation.",
      );
    } finally {
      setInvitationActionId(null);
    }
  }

  const resolvePatientIdByEmail = useCallback(
    (email: string) => findPatientIdByEmail(patients, email),
    [patients],
  );

  async function handleCancel(invitationId: number) {
    setInvitationActionId(invitationId);
    try {
      await cancelPatientInvitation(invitationId);
      setToast("Invitation cancelled.");
      await loadData({ silent: true });
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Could not cancel invitation.",
      );
    } finally {
      setInvitationActionId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6">
        <LoadingPanel message="Loading patients…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <ErrorAlert title="Patients unavailable" message={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Patients"
          description="Invite patients, track invitations, and manage accepted portal accounts."
        />
        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="btn-primary inline-flex shrink-0 self-start"
        >
          <MailPlus className="h-4 w-4" aria-hidden />
          Invite Patient
        </button>
      </div>

      <MyPatientsSection
        patients={patients}
        scanStats={scanStats}
        search={patientSearch}
        onSearchChange={setPatientSearch}
        onInvite={() => setInviteModalOpen(true)}
      />

      <PatientInvitationsSection
        invitations={invitations}
        patientIdByEmail={resolvePatientIdByEmail}
        onResend={(id) => void handleResend(id)}
        onCancel={(id) => void handleCancel(id)}
        actionLoadingId={invitationActionId}
        onInvite={() => setInviteModalOpen(true)}
      />

      {patients.length === 0 && invitations.length === 0 ? (
        <DashboardEmptyState
          icon={Users}
          title="No patients yet"
          description="Send an invitation by email. When a patient accepts, they appear under active patients."
          className="min-h-[240px]"
          action={
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="btn-primary"
            >
              <MailPlus className="h-4 w-4" aria-hidden />
              Invite Patient
            </button>
          }
        />
      ) : null}

      {inviteModalOpen ? (
        <InvitePatientModal
          onClose={() => setInviteModalOpen(false)}
          onSuccess={() => {
            setInviteModalOpen(false);
            setToast("Invitation sent successfully");
            void loadData({ silent: true });
          }}
        />
      ) : null}

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}
