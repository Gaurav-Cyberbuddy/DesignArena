"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth/session";
import { sendAppEmail } from "@/lib/email";
import { publicErrorMessage } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/types";
import { contestUpsertSchema } from "@/lib/validations/contest";

async function guardAdmin() {
  const adminUser = await requireAdmin();
  const headerList = await headers();
  const limited = rateLimit("admin", clientKey(headerList, adminUser.id));
  if (!limited.ok) throw new Error("Too many admin requests. Try again later.");
  return adminUser;
}

async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  const admin = createAdminSupabase();
  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });
}

export async function moderateSubmissionAction(input: {
  submissionId: string;
  status: SubmissionStatus;
  rejectionReason?: string;
}) {
  try {
    const adminUser = await guardAdmin();
    if (!SUBMISSION_STATUSES.includes(input.status)) {
      return { ok: false as const, error: "Invalid status." };
    }
    if (input.status === "rejected" && !input.rejectionReason?.trim()) {
      return { ok: false as const, error: "Add an internal rejection reason." };
    }

    const admin = createAdminSupabase();
    const { data: submission, error } = await admin
      .from("submissions")
      .select("*, contests(name), profiles(id)")
      .eq("id", input.submissionId)
      .single();
    if (error || !submission) return { ok: false as const, error: "Submission not found." };

    const { error: updateError } = await admin
      .from("submissions")
      .update({
        status: input.status,
        rejection_reason: input.status === "rejected" ? input.rejectionReason?.trim() : null,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.submissionId);
    if (updateError) return { ok: false as const, error: "Could not update the entry." };

    await audit(adminUser.id, `submission_${input.status}`, "submission", input.submissionId, {
      entry_code: submission.entry_code,
    });

    const { data: authUser } = await admin.auth.admin.getUserById(submission.participant_id);
    if (authUser.user?.email && (input.status === "approved" || input.status === "rejected")) {
      await sendAppEmail({
        to: authUser.user.email,
        kind: input.status === "approved" ? "submission_approved" : "submission_rejected",
        entryCode: submission.entry_code,
        contestName: Array.isArray(submission.contests)
          ? submission.contests[0]?.name
          : submission.contests?.name,
        title: submission.title,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/gallery");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error, "Not authorized.") };
  }
}

export async function upsertContestAction(input: unknown) {
  try {
    const adminUser = await guardAdmin();
    const parsed = contestUpsertSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid contest." };
    }
    const value = parsed.data;
    const admin = createAdminSupabase();
    const row = {
      name: value.name,
      slug: value.slug,
      description: value.description,
      guidelines: value.guidelines || "",
      cover_image_url: value.coverImageUrl || null,
      code_prefix: value.codePrefix,
      submission_start: value.submissionStart,
      submission_end: value.submissionEnd,
      voting_start: value.votingStart,
      voting_end: value.votingEnd,
      status: value.status,
      allow_vote_changes: value.allowVoteChanges,
      results_published: value.resultsPublished,
      show_runners_up: value.showRunnersUp,
    };

    const query = value.id
      ? admin.from("contests").update(row).eq("id", value.id).select("id").single()
      : admin.from("contests").insert(row).select("id").single();
    const { data, error } = await query;
    if (error || !data) return { ok: false as const, error: "Could not save the contest." };

    await audit(
      adminUser.id,
      value.id ? "contest_updated" : "contest_created",
      "contest",
      data.id,
      { results_published: value.resultsPublished, status: value.status },
    );

    revalidatePath("/");
    revalidatePath("/contests");
    revalidatePath("/gallery");
    revalidatePath("/results");
    revalidatePath("/admin");
    return { ok: true as const, id: data.id as string };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error, "Not authorized.") };
  }
}

export async function publishResultsAction(contestId: string, published: boolean) {
  try {
    const adminUser = await guardAdmin();
    const admin = createAdminSupabase();
    const { error } = await admin
      .from("contests")
      .update(published ? { results_published: true, status: "completed" } : { results_published: false })
      .eq("id", contestId);
    if (error) return { ok: false as const, error: "Could not update results visibility." };
    await audit(adminUser.id, published ? "results_published" : "results_hidden", "contest", contestId);
    revalidatePath("/results");
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error, "Not authorized.") };
  }
}
