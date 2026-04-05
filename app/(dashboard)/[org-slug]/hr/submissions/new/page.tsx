"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  getEmployees,
  createSubmission,
  submitSubmission,
  type Employee,
  type SubmissionType,
} from "@/lib/actions/hr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

const SUBMISSION_TYPES: { value: SubmissionType; label: string; description: string }[] = [
  { value: "sick_note", label: "Sick Note (eAU)", description: "Submit an electronic sick note from an employee's doctor." },
  { value: "kurzarbeit", label: "Kurzarbeit Application", description: "Apply for short-time work compensation (Kurzarbeitergeld)." },
  { value: "hiring_support", label: "Hiring Support", description: "Apply for a hiring support grant from the employment agency." },
];

export default function NewSubmissionPage() {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedEmployeeId = searchParams.get("employee_id") ?? "";

  const [step, setStep] = useState<Step>(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<SubmissionType | "">("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(preselectedEmployeeId);
  const [notes, setNotes] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [submitImmediately, setSubmitImmediately] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      if (!currentOrg) return;
      try {
        const data = await getEmployees(currentOrg.id, { status: "active" });
        setEmployees(data);
      } catch {
        toast.error("Failed to load employees");
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, [currentOrg]);

  // Metadata fields per type
  function getMetadataFields(): { key: string; label: string; type: string; required: boolean }[] {
    if (selectedType === "sick_note") {
      return [
        { key: "start_date", label: "Sick Leave Start Date", type: "date", required: true },
        { key: "end_date", label: "Sick Leave End Date", type: "date", required: true },
        { key: "diagnosis_code", label: "Diagnosis Code (ICD-10)", type: "text", required: false },
      ];
    }
    if (selectedType === "kurzarbeit") {
      return [
        { key: "start_date", label: "Short-Time Work Start Date", type: "date", required: true },
        { key: "affected_employees", label: "Number of Affected Employees", type: "number", required: true },
        { key: "reason", label: "Reason for Short-Time Work", type: "text", required: true },
      ];
    }
    if (selectedType === "hiring_support") {
      return [
        { key: "position_title", label: "Position Title", type: "text", required: true },
        { key: "start_date", label: "Planned Start Date", type: "date", required: true },
        { key: "grant_type", label: "Grant Type", type: "text", required: false },
      ];
    }
    return [];
  }

  async function handleFinish() {
    if (!currentOrg || !selectedType || !selectedEmployeeId) return;
    setIsSubmitting(true);
    try {
      const submission = await createSubmission(currentOrg.id, {
        employee_id: selectedEmployeeId,
        submission_type: selectedType,
        metadata: metadata as Record<string, unknown>,
        notes: notes || undefined,
      });

      if (submitImmediately) {
        await submitSubmission(submission.id);
        toast.success("Submission created and submitted");
      } else {
        toast.success("Draft submission created");
      }

      router.push(`/${currentOrg.slug}/hr/submissions/${submission.id}`);
    } catch {
      toast.error("Failed to create submission");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const metadataFields = getMetadataFields();

  if (!currentOrg) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/${currentOrg.slug}/hr/submissions`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">New Submission</h2>
          <p className="text-slate-600">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-slate-900" : "bg-slate-200"}`} />
        ))}
      </div>

      {/* Step 1: Choose type */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Choose Submission Type</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {SUBMISSION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedType === t.value
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-medium text-slate-900">{t.label}</p>
                <p className="text-sm text-slate-500 mt-1">{t.description}</p>
              </button>
            ))}
            <div className="pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedType}
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select employee */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Select Employee</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoadingEmployees ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="employee-select">Employee</Label>
                <Select value={selectedEmployeeId} onValueChange={(v) => v && setSelectedEmployeeId(v)}>
                  <SelectTrigger id="employee-select">
                    <SelectValue placeholder="Select an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.last_name}, {e.first_name} ({e.employee_number}) · {e.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedEmployeeId}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fill form details */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Submission Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {metadataFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={metadata[field.key] ?? ""}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  required={field.required}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & submit */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Review & Submit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <dl className="text-sm space-y-3">
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium">{SUBMISSION_TYPES.find((t) => t.value === selectedType)?.label}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Employee</dt>
                <dd className="font-medium">
                  {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} (${selectedEmployee.employee_number})` : "—"}
                </dd>
              </div>
              {Object.entries(metadata).filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
              {notes && (
                <div>
                  <dt className="text-slate-500">Notes</dt>
                  <dd>{notes}</dd>
                </div>
              )}
            </dl>

            <div className="border-t pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="submit-immediately"
                  checked={submitImmediately}
                  onChange={(e) => setSubmitImmediately(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Submit immediately (skip draft state)</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleFinish} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />{submitImmediately ? "Create & Submit" : "Save as Draft"}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
