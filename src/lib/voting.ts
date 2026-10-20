import { contestPhase } from "@/lib/contests";
import type { Contest, GalleryEntry } from "@/lib/types";

export type VoteAttempt = {
  voterId: string;
  contestId: string;
  submissionId: string;
  now?: Date;
};

export function evaluateVote(input: {
  attempt: VoteAttempt;
  contest: Contest | null;
  entry: GalleryEntry | null;
  entryOwnerId: string | null;
  existingVoteSubmissionId: string | null;
  authenticated: boolean;
}) {
  if (!input.authenticated) return { ok: false as const, error: "Sign in required." };
  if (!input.contest || input.contest.id !== input.attempt.contestId) {
    return { ok: false as const, error: "Contest not found." };
  }
  const phase = contestPhase(input.contest, input.attempt.now ?? new Date());
  if (!phase.canVote) {
    return { ok: false as const, error: "Voting is not open for this contest." };
  }
  if (!input.entry || input.entry.id !== input.attempt.submissionId) {
    return { ok: false as const, error: "Entry not found." };
  }
  if (input.entry.contest_id !== input.attempt.contestId) {
    return { ok: false as const, error: "Entry does not belong to this contest." };
  }
  if (input.entryOwnerId === input.attempt.voterId) {
    return { ok: false as const, error: "You cannot vote for your own entry." };
  }
  if (input.existingVoteSubmissionId && !input.contest.allow_vote_changes) {
    return { ok: false as const, error: "You have already voted in this contest." };
  }
  return { ok: true as const };
}

export function applyVote(
  votes: { contestId: string; voterId: string; submissionId: string }[],
  next: { contestId: string; voterId: string; submissionId: string },
  allowChanges: boolean,
) {
  const existingIndex = votes.findIndex(
    (vote) => vote.contestId === next.contestId && vote.voterId === next.voterId,
  );
  if (existingIndex >= 0) {
    if (!allowChanges) {
      throw new Error("duplicate");
    }
    const copy = votes.slice();
    copy[existingIndex] = next;
    return copy;
  }
  return [...votes, next];
}

export function tally(votes: { submissionId: string }[]) {
  const counts: Record<string, number> = {};
  for (const vote of votes) counts[vote.submissionId] = (counts[vote.submissionId] ?? 0) + 1;
  return counts;
}
