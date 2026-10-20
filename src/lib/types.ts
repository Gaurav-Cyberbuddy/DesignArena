export const CONTEST_STATUSES = [
  "draft",
  "submissions_open",
  "review",
  "voting_open",
  "completed",
] as const;

export type ContestStatus = (typeof CONTEST_STATUSES)[number];

export const SUBMISSION_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export type Contest = {
  id: string;
  name: string;
  slug: string;
  description: string;
  guidelines: string;
  cover_image_url: string | null;
  code_prefix: string;
  submission_start: string;
  submission_end: string;
  voting_start: string;
  voting_end: string;
  status: ContestStatus;
  allow_vote_changes: boolean;
  results_published: boolean;
  show_runners_up: boolean;
  created_at: string;
  updated_at: string;
};

export type GalleryEntry = {
  id: string;
  entry_code: string;
  contest_id: string;
  title: string;
  description: string;
  primary_file_path: string;
  prototype_url: string | null;
  has_supporting_file?: boolean;
  created_at: string;
};

export type MySubmission = {
  id: string;
  entry_code: string;
  contest_id: string;
  title: string;
  description: string;
  primary_file_path: string;
  supporting_file_path: string | null;
  prototype_url: string | null;
  status: SubmissionStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminSubmission = MySubmission & {
  participant_id: string;
  participant_email: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type VoteRecord = {
  id: string;
  contest_id: string;
  submission_id: string;
  created_at: string;
};

export type SessionUser = {
  id: string;
  email: string | null;
};

export type ContestPhase = {
  canSubmit: boolean;
  canVote: boolean;
  canEdit: boolean;
  submissionsOpen: boolean;
  votingOpen: boolean;
  resultsVisible: boolean;
  label: string;
};

export type ResultRow = {
  submission: GalleryEntry;
  voteCount: number;
  rank: number;
  tied: boolean;
};
