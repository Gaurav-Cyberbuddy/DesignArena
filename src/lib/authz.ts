import { isAdminEmail } from "@/lib/admin";
import { contestPhase } from "@/lib/contests";
import type { Contest, GalleryEntry, SubmissionStatus } from "@/lib/types";
import { evaluateVote, type VoteAttempt } from "@/lib/voting";

export function canSubmitOrVote(authenticated: boolean) {
  return authenticated;
}

export function publicOnlyApproved<T extends { status: SubmissionStatus }>(rows: T[]) {
  return rows.filter((row) => row.status === "approved");
}

export function stripPrivateSubmissionFields<T extends Record<string, unknown>>(row: T) {
  const privateKeys = [
    "participant_id",
    "participant_email",
    "rejection_reason",
    "reviewed_by",
    "reviewed_at",
    "supporting_file_path",
  ];
  return Object.fromEntries(Object.entries(row).filter(([key]) => !privateKeys.includes(key)));
}

export function canModerate(email: string | null | undefined, adminEmails?: string) {
  return isAdminEmail(email, adminEmails);
}

export function evaluateBallot(input: {
  authenticated: boolean;
  voterId: string;
  attempt: VoteAttempt;
  contest: Contest | null;
  entry: GalleryEntry | null;
  entryOwnerId: string | null;
  existingVoteSubmissionId: string | null;
}) {
  return evaluateVote(input);
}

export function unpublishedResultsVisible(resultsPublished: boolean) {
  return resultsPublished === true;
}

export function contestAcceptsSubmissions(contest: Contest, now = new Date()) {
  return contestPhase(contest, now).canSubmit;
}
