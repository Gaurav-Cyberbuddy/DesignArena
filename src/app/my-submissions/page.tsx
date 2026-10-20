import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmissionForm } from "@/components/submission-form";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth/session";
import { contestPhase } from "@/lib/contests";
import { listPublicContests } from "@/lib/data/contests";
import { listMySubmissions } from "@/lib/data/submissions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "My submissions" };

export default async function MySubmissionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/my-submissions");
  const [submissions, contests] = await Promise.all([
    listMySubmissions().catch(() => []),
    listPublicContests().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">My submissions</h1>
        <p className="mt-3 text-muted-foreground">
          Status is private to you. You may replace a file only while that contest is still accepting
          submissions.
        </p>
      </div>
      {submissions.length === 0 ? (
        <EmptyState title="No entries yet" description="Submit a design to receive an entry ID such as C1-001." />
      ) : (
        <div className="space-y-8">
          {submissions.map((submission) => {
            const contest = contests.find((c) => c.id === submission.contest_id);
            const canEdit = contest ? contestPhase(contest).canEdit : false;
            return (
              <article key={submission.id} className="rounded-2xl border bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{submission.entry_code}</p>
                    <h2 className="font-display text-2xl">{submission.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {contest?.name ?? "Contest"} · {formatDate(submission.created_at)}
                    </p>
                  </div>
                  <SubmissionStatusBadge status={submission.status} />
                </div>
                <p className="mt-3 text-sm">{submission.description}</p>
                {submission.status === "rejected" && submission.rejection_reason ? (
                  <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
                    Organizer note: {submission.rejection_reason}
                  </p>
                ) : null}
                <div className="mt-4 flex gap-3 text-sm">
                  <Link className="text-primary" href={`/api/files/primary/${submission.id}`}>
                    View image
                  </Link>
                  {submission.supporting_file_path ? (
                    <Link className="text-primary" href={`/api/files/supporting/${submission.id}`}>
                      Supporting PDF
                    </Link>
                  ) : null}
                </div>
                {canEdit ? (
                  <div className="mt-6">
                    <SubmissionForm contests={contests} email={user.email ?? ""} initial={submission} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Editing is closed for this contest.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
