"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { sendAppEmail } from "@/lib/email";
import { publicErrorMessage } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";
import { ballotSchema } from "@/lib/validations/vote";

export async function castBallotAction(input: unknown) {
  try {
    const user = await requireUser();
    const headerList = await headers();
    const limited = rateLimit("vote", clientKey(headerList, user.id));
    if (!limited.ok) {
      return { ok: false as const, error: "Too many voting attempts. Try again later." };
    }

    const parsed = ballotSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Select at least one approved design." };
    }

    const contestIds = parsed.data.choices.map((c) => c.contestId);
    if (new Set(contestIds).size !== contestIds.length) {
      return { ok: false as const, error: "Only one vote is allowed per contest." };
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("cast_ballot", {
      p_choices: parsed.data.choices.map((choice) => ({
        contest_id: choice.contestId,
        submission_id: choice.submissionId,
      })),
    });

    if (error) {
      return { ok: false as const, error: publicErrorMessage(error, "Your ballot could not be saved.") };
    }

    const email = user.email
      ? await sendAppEmail({ to: user.email, kind: "voting_confirmation" })
      : { sent: false };

    revalidatePath("/vote");
    revalidatePath("/gallery");
    return { ok: true as const, emailSent: email.sent };
  } catch (error) {
    return { ok: false as const, error: publicErrorMessage(error, "Sign in is required to vote.") };
  }
}
