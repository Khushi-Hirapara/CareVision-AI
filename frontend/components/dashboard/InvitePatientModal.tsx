"use client";

import { FormEvent, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { invitePatient } from "@/lib/patients";

interface InvitePatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20";

export function InvitePatientModal({ onClose, onSuccess }: InvitePatientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Patient email is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await invitePatient({
        patient_email: trimmedEmail,
        patient_name: name.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Invite Patient"
      description="Send a secure portal invitation so the patient can access their scan reports."
      onClose={onClose}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error ? <ErrorAlert title="Invitation failed" message={error} /> : null}

        <div className="flex gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-3 text-sm leading-relaxed text-slate-700">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" aria-hidden />
          <p>
            The patient will receive an email to accept the invitation and create their
            own portal password. No account is created until they accept.
          </p>
        </div>

        <div>
          <label htmlFor="invite-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Patient Name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="invite-name"
            type="text"
            autoComplete="name"
            value={name}
            disabled={isSubmitting}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Patient Email <span className="text-rose-500">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={isSubmitting}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="patient@example.com"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary justify-center disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Send Invitation"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
