"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type PatientSex = "M" | "F" | "Other" | "";

type PatientDetailApiResponse = {
  patient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    dob: string | null;
    sex: string | null;
    height: string | null;
    weight: string | null;
    email: string | null;
    phone: string | null;
    medicareId: string | null;
    providerFacility: string | null;
    status: string;
    enrolledAt: string | null;
    dischargedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  dob: "",
  sex: "" as PatientSex,
  height: "",
  weight: "",
  email: "",
  phone: "",
  medicareId: "",
  providerFacility: "",
  notes: "",
  status: "active",
};

export default function PatientForm() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;
  const isEdit = Boolean(id);
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;

    let isMounted = true;

    async function loadPatient() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await fetch(`/api/patients/${id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: PatientDetailApiResponse | { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(("error" in data && data.error) || "Failed to load patient");
        }

        if (!isMounted) return;

        const patient = (data as PatientDetailApiResponse).patient;

        setForm({
          firstName: patient.firstName ?? "",
          lastName: patient.lastName ?? "",
          dob: patient.dob ?? "",
          sex:
            patient.sex === "M" || patient.sex === "F" || patient.sex === "Other"
              ? patient.sex
              : "",
          height: patient.height ?? "",
          weight: patient.weight ?? "",
          email: patient.email ?? "",
          phone: patient.phone ?? "",
          medicareId: patient.medicareId ?? "",
          providerFacility: patient.providerFacility ?? "",
          notes: patient.notes ?? "",
          status: patient.status ?? "active",
        });
      } catch (error) {
        console.error("Failed to load patient:", error);
        if (isMounted) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load patient."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPatient();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  const set = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))} yrs`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({
        title: "Missing required fields",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob || undefined,
        sex: form.sex || undefined,
        height: form.height || undefined,
        weight: form.weight || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        medicareId: form.medicareId || undefined,
        providerFacility: form.providerFacility || undefined,
        notes: form.notes || undefined,
        status: form.status || undefined,
      };

      const res = await fetch(isEdit ? `/api/patients/${id}` : "/api/patients", {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to ${isEdit ? "update" : "create"} patient`
        );
      }

      const updatedId = isEdit ? id : data?.id || data?.patient?.id || null;

      toast({
        title: isEdit ? "Patient updated" : "Patient created",
        description: `${form.firstName} ${form.lastName} has been ${
          isEdit ? "updated" : "created"
        } successfully.`,
      });

      router.push(updatedId ? `/patients/${updatedId}` : "/patients");
      router.refresh();
    } catch (error) {
      console.error("Failed to save patient:", error);
      toast({
        title: isEdit ? "Update failed" : "Creation failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  const labelClasses =
    "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
  const selectClasses =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none";

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
          <h2 className="text-base font-semibold text-foreground">Error</h2>
          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Patients
      </Link>

      <form onSubmit={handleSubmit} className="w-full space-y-8">
        <div className="w-full space-y-5 rounded-xl border border-border bg-card p-6 shadow-kinetica">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Personal Information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClasses}>First Name *</label>
              <input
                className={inputClasses}
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="First name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Last Name *</label>
              <input
                className={inputClasses}
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Last name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Date of Birth</label>
              <input
                type="date"
                className={inputClasses}
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Age</label>
              <div className="flex h-10 items-center rounded-lg border border-border bg-muted px-3 font-data text-sm text-muted-foreground">
                {calculateAge(form.dob) || "—"}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Sex</label>
              <select
                className={selectClasses}
                value={form.sex}
                onChange={(e) => set("sex", e.target.value)}
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Height</label>
              <input
                className={inputClasses}
                value={form.height}
                onChange={(e) => set("height", e.target.value)}
                placeholder="e.g. 178 cm"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Weight</label>
              <input
                className={inputClasses}
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
                placeholder="e.g. 75 kg"
              />
            </div>
          </div>
        </div>

        <div className="w-full space-y-5 rounded-xl border border-border bg-card p-6 shadow-kinetica">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Contact Information
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClasses}>Email Address</label>
              <input
                type="email"
                className={inputClasses}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="patient@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Phone Number</label>
              <input
                className={inputClasses}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(555) 000-0000"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Medicare ID</label>
              <input
                className={inputClasses}
                value={form.medicareId}
                onChange={(e) => set("medicareId", e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Provider / Facility</label>
              <input
                className={inputClasses}
                value={form.providerFacility}
                onChange={(e) => set("providerFacility", e.target.value)}
                placeholder="Provider or facility"
              />
            </div>
          </div>
        </div>

        <div className="w-full space-y-5 rounded-xl border border-border bg-card p-6 shadow-kinetica">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Clinical Notes
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClasses}>Status</label>
              <select
                className={selectClasses}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
          </div>

          <textarea
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            rows={4}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Diagnosis, rehab goals, special considerations..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Patient"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/patients")}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}