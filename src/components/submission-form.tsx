"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitDesignAction } from "@/actions/submissions";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Contest, MySubmission } from "@/lib/types";
import { contestPhase } from "@/lib/contests";
import { submissionFieldsSchema, type SubmissionFields } from "@/lib/validations/submission";

export function SubmissionForm({
  contests,
  email,
  initial,
  defaultContestId,
}: {
  contests: Contest[];
  email: string;
  initial?: MySubmission;
  defaultContestId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const openContests = contests.filter((c) => contestPhase(c).canSubmit);
  const form = useForm<SubmissionFields>({
    resolver: zodResolver(submissionFieldsSchema),
    defaultValues: {
      contestId: initial?.contest_id ?? defaultContestId ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      prototypeUrl: initial?.prototype_url ?? "",
      submissionId: initial?.id,
    },
  });

  return (
    <form
      className="space-y-5 rounded-2xl border bg-card p-6"
      onSubmit={form.handleSubmit((values) => {
        if (!initial && !primaryFile) {
          setError("A primary PNG, JPG, or WEBP file is required.");
          return;
        }
        const formData = new FormData();
        formData.set("contestId", values.contestId);
        formData.set("title", values.title);
        formData.set("description", values.description);
        formData.set("prototypeUrl", values.prototypeUrl ?? "");
        if (values.submissionId) formData.set("submissionId", values.submissionId);
        if (primaryFile) formData.set("primaryFile", primaryFile);
        if (supportingFile) formData.set("supportingFile", supportingFile);
        start(async () => {
          setError(null);
          const result = await submitDesignAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSuccess(
            result.entryCode
              ? `Submitted. Your entry ID is ${result.entryCode}.${result.emailSent ? " A confirmation email was sent." : " Keep this ID — email delivery is not configured."}`
              : "Your entry was updated.",
          );
          router.refresh();
        });
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="contestId">Contest</Label>
        <select
          id="contestId"
          disabled={Boolean(initial)}
          className="h-10 w-full rounded-md border bg-card px-3 text-sm"
          {...form.register("contestId")}
        >
          <option value="" disabled>
            Select a contest
          </option>
          {openContests.map((contest) => (
            <option key={contest.id} value={contest.id}>
              {contest.name}
            </option>
          ))}
        </select>
        {form.formState.errors.contestId ? (
          <p className="text-sm text-destructive">{form.formState.errors.contestId.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Design title</Label>
        <Input id="title" maxLength={120} {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Short description</Label>
        <Textarea id="description" maxLength={2000} {...form.register("description")} />
        {form.formState.errors.description ? (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        ) : null}
      </div>
      <UploadDropzone
        name="primaryFile"
        label="Primary design file"
        accept="image/png,image/jpeg,image/webp"
        kind="primary"
        required={!initial}
        onFileChange={setPrimaryFile}
      />
      <UploadDropzone
        name="supportingFile"
        label="Optional supporting PDF"
        accept="application/pdf"
        kind="supporting"
        onFileChange={setSupportingFile}
      />
      <div className="space-y-2">
        <Label htmlFor="prototypeUrl">Optional prototype URL</Label>
        <Input id="prototypeUrl" placeholder="https://www.figma.com/..." {...form.register("prototypeUrl")} />
        <p className="text-xs text-muted-foreground">
          HTTPS links to Figma, Behance, Dribbble, Framer, Adobe, Notion, Webflow, Readymag, or Cargo.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Participant email</Label>
        <Input value={email} readOnly />
      </div>
      <Button type="submit" disabled={pending || openContests.length === 0}>
        {pending ? "Uploading…" : initial ? "Update submission" : "Submit design"}
      </Button>
      {openContests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contest is accepting submissions right now.</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-teal">{success}</p> : null}
    </form>
  );
}
