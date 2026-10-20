import type { Contest, ContestPhase } from "@/lib/types";

export function contestPhase(contest: Contest, now = new Date()): ContestPhase {
  const n = now.getTime();
  const subStart = new Date(contest.submission_start).getTime();
  const subEnd = new Date(contest.submission_end).getTime();
  const voteStart = new Date(contest.voting_start).getTime();
  const voteEnd = new Date(contest.voting_end).getTime();

  const inSubmissionWindow = n >= subStart && n <= subEnd;
  const inVotingWindow = n >= voteStart && n <= voteEnd;

  const submissionsOpen =
    contest.status === "submissions_open" && inSubmissionWindow;
  const votingOpen = contest.status === "voting_open" && inVotingWindow;
  const resultsVisible = contest.results_published === true;

  let label = "Scheduled";
  if (contest.status === "draft") label = "Draft";
  else if (submissionsOpen) label = "Submissions open";
  else if (contest.status === "review" || (n > subEnd && n < voteStart))
    label = "In review";
  else if (votingOpen) label = "Voting open";
  else if (contest.status === "completed" || n > voteEnd) label = "Completed";
  else if (contest.status === "voting_open") label = "Voting closed";

  return {
    canSubmit: submissionsOpen,
    canVote: votingOpen,
    canEdit: submissionsOpen,
    submissionsOpen,
    votingOpen,
    resultsVisible,
    label,
  };
}

export function earliestDeadline(contests: Contest[]): Date | null {
  const dates = contests
    .flatMap((c) => [c.submission_end, c.voting_end])
    .map((d) => new Date(d).getTime())
    .filter((t) => t > Date.now());
  if (!dates.length) return null;
  return new Date(Math.min(...dates));
}
