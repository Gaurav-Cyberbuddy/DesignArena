import { Badge } from "@/components/ui/badge";
import type { ContestStatus, SubmissionStatus } from "@/lib/types";

const contestMap: Record<ContestStatus, { label: string; variant: "default" | "teal" | "muted" | "warning" | "success" }> = {
  draft: { label: "Draft", variant: "muted" },
  submissions_open: { label: "Submissions open", variant: "teal" },
  review: { label: "In review", variant: "warning" },
  voting_open: { label: "Voting open", variant: "default" },
  completed: { label: "Completed", variant: "success" },
};

const submissionMap: Record<SubmissionStatus, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending_review: { label: "Pending review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

export function ContestStatusBadge({ status }: { status: ContestStatus }) {
  const item = contestMap[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const item = submissionMap[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
