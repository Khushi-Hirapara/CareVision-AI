"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { createPatient, type CreatePatientPayload } from "@/lib/patients";

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20";

export function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Not specified");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const ageNum = Number.parseInt(age, 10);
    if (!name.trim()) {
      setError("Patient name is required.");
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 150) {
      setError("Enter a valid age (0–150).");
      return;
    }

    const payload: CreatePatientPayload = {
      name: name.trim(),
      age: ageNum,
      gender,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await createPatient(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Patient"
      description="Create a patient profile to manage scans and results."
      onClose={onClose}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error ? <ErrorAlert title="Could not create patient" message={error} /> : null}

        <div>
          <label htmlFor="patient-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Patient Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="patient-name"
            required
            value={name}
            disabled={isSubmitting}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="patient-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="patient-email"
            type="email"
            value={email}
            disabled={isSubmitting}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="patient-age" className="mb-1.5 block text-sm font-medium text-slate-700">
              Age <span className="text-rose-500">*</span>
            </label>
            <input
              id="patient-age"
              type="number"
              min={0}
              max={150}
              required
              value={age}
              disabled={isSubmitting}
              onChange={(e) => setAge(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="patient-gender" className="mb-1.5 block text-sm font-medium text-slate-700">
              Gender <span className="text-rose-500">*</span>
            </label>
            <select
              id="patient-gender"
              value={gender}
              disabled={isSubmitting}
              onChange={(e) => setGender(e.target.value)}
              className={inputClass}
            >
              <option value="Not specified">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="patient-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="patient-phone"
            type="tel"
            value={phone}
            disabled={isSubmitting}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
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
                Creating…
              </>
            ) : (
              "Create Patient"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
