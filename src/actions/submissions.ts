"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { contestPhase } from "@/lib/contests";
import { sendAppEmail } from "@/lib/email";
import { publicErrorMessage } from "@/lib/errors";
import { validateUpload } from "@/lib/files";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Contest } from "@/lib/types";
import { sanitizePrototypeUrl } from "@/lib/urls";
import { submissionFieldsSchema } from "@/lib/validations/submission";

async function readFile(file: File | null, kind: "primary" | "supporting") {
  if (!file || file.size === 0) return null;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const result = validateUpload({
    kind,
    filename: file.name,
    mime: file.type,
    size: file.size,
    bytes: buffer,
  });
  if (!result.ok) throw new Error(result.error);
  return { buffer, ext: result.ext, mime: file.type };
}

export async function submitDesignAction(formData: FormData) {
  try {
    const user = await requireUser();
    const headerList = await headers();
    const limited = rateLimit("submit", clientKey(headerList, user.id));
    if (!limited.ok) {
      return { ok: false as const, error: "Too many submissions. Try again later." };
    }

    const fields = submissionFieldsSchema.parse({
      contestId: formData.get("contestId"),
      title: formData.get("title"),
      description: formData.get("description"),
      prototypeUrl: formData.get("prototypeUrl") ?? "",
      submissionId: formData.get("submissionId") || undefined,
    });

    const supabase = await createServerSupabase();
    const { data: contest, error: contestError } = await supabase
      .from("contests")
      .select("*")
      .eq("id", fields.contestId)
      .maybeSingle();
    if (contestError || !contest) return { ok: false as const, error: "Contest not found." };

    const phase = contestPhase(contest as Contest);
    if (!phase.canSubmit) {
      return { ok: false as const, error: "Submissions are closed for this contest." };
    }

    const primary = await readFile(formData.get("primaryFile") as File | null, "primary");
    const supporting = await readFile(formData.get("supportingFile") as File | null, "supporting");
    const isEdit = Boolean(fields.submissionId);
    if (!isEdit && !primary) {
      return { ok: false as const, error: "A primary PNG, JPG, or WEBP file is required." };
    }

    let prototypeUrl: string | null = null;
    try {
      prototypeUrl = sanitizePrototypeUrl(fields.prototypeUrl || null);
    } catch (error) {
      return { ok: false as const, error: publicErrorMessage(error) };
    }

    const admin = createAdminSupabase();
    const submissionId = fields.submissionId ?? crypto.randomUUID();

    if (isEdit) {
      const { data: existing } = await supabase.rpc("my_submissions");
      const mine = (existing ?? []).find((row: { id: string }) => row.id === submissionId);
      if (!mine) return { ok: false as const, error: "You can only edit your own entry." };
      if (mine.contest_id !== fields.contestId) {
        return { ok: false as const, error: "Contest cannot be changed after submission." };
      }
    }

    let primaryPath: string | undefined;
    let supportingPath: string | undefined;

    if (primary) {
      primaryPath = `${fields.contestId}/${user.id}/${submissionId}/primary.${primary.ext}`;
      const { error } = await admin.storage.from("design-files").upload(primaryPath, primary.buffer, {
        contentType: primary.mime,
        upsert: true,
      });
      if (error) return { ok: false as const, error: "Could not store the primary image." };
    }

    if (supporting) {
      supportingPath = `${fields.contestId}/${user.id}/${submissionId}/supporting.pdf`;
      const { error } = await admin.storage.from("design-files").upload(supportingPath, supporting.buffer, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (error) return { ok: false as const, error: "Could not store the supporting PDF." };
    }

    if (!isEdit) {
      const { data, error } = await supabase
        .from("submissions")
        .insert({
          id: submissionId,
          contest_id: fields.contestId,
          participant_id: user.id,
          title: fields.title,
          description: fields.description,
          primary_file_path: primaryPath,
          supporting_file_path: supportingPath ?? null,
          prototype_url: prototypeUrl,
        })
        .select("entry_code")
        .single();
      if (error) return { ok: false as const, error: "Could not create the submission." };

      const email = await sendAppEmail({
        to: user.email ?? "",
        kind: "submission_received",
        entryCode: data.entry_code,
        contestName: (contest as Contest).name,
        title: fields.title,
      });

      revalidatePath("/my-submissions");
      revalidatePath("/submit");
      return {
        ok: true as const,
        entryCode: data.entry_code as string,
        emailSent: email.sent,
      };
    }

    const patch: Record<string, unknown> = {
      title: fields.title,
      description: fields.description,
      prototype_url: prototypeUrl,
      status: "pending_review",
    };
    if (primaryPath) patch.primary_file_path = primaryPath;
    if (supportingPath) patch.supporting_file_path = supportingPath;

    const { error } = await supabase.from("submissions").update(patch).eq("id", submissionId);
    if (error) return { ok: false as const, error: "Could not update the submission." };

    revalidatePath("/my-submissions");
    return { ok: true as const, entryCode: undefined, emailSent: false };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error, "Could not save the submission.") };
  }
}
