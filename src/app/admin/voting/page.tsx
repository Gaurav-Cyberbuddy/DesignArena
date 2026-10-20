import { publishResultsAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { adminVoteSummary } from "@/lib/data/admin";
import { firstPlace, rankByVotes } from "@/lib/results";
import type { GalleryEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Voting · Admin" };

async function PublishButton({ contestId, published }: { contestId: string; published: boolean }) {
  return (
    <form
      action={async () => {
        "use server";
        await publishResultsAction(contestId, !published);
      }}
    >
      <Button type="submit" variant={published ? "outline" : "default"}>
        {published ? "Hide results" : "Publish verified results"}
      </Button>
    </form>
  );
}

export default async function AdminVotingPage() {
  const summary = await adminVoteSummary();

  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        {summary.voteCount} votes recorded. Public pages do not show live totals. Suspicious share flags
        are for manual review only.
      </p>
      {summary.flags.length ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm">
          <p className="font-medium">Possible concentration</p>
          <ul className="mt-2 list-disc pl-5">
            {summary.flags.map((flag) => (
              <li key={flag.submission.id}>
                {flag.submission.entry_code} has {Math.round(flag.share * 100)}% of its contest votes (
                {flag.total}).
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {summary.contests.map((contest) => {
        const entries = summary.submissions
          .filter((s) => s.contest_id === contest.id)
          .map(
            (s) =>
              ({
                id: s.id,
                entry_code: s.entry_code,
                contest_id: s.contest_id,
                title: s.title,
                description: "",
                primary_file_path: "",
                prototype_url: null,
                created_at: "",
              }) satisfies GalleryEntry,
          );
        const counts: Record<string, number> = {};
        for (const entry of entries) counts[entry.id] = summary.counts.get(entry.id)?.total ?? 0;
        const ranked = rankByVotes(entries, counts);
        const { winners, isTie } = firstPlace(ranked);
        return (
          <section key={contest.id} className="rounded-2xl border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl">{contest.name}</h2>
              <PublishButton contestId={contest.id} published={contest.results_published} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {summary.contestTotals.get(contest.id) ?? 0} votes ·{" "}
              {isTie ? "First place is tied" : winners[0] ? `Leader ${winners[0].submission.entry_code}` : "No votes"}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {ranked.map((row) => (
                <li key={row.submission.id} className="flex justify-between">
                  <span>
                    {row.submission.entry_code} — {row.submission.title}
                    {row.tied ? " (tie)" : ""}
                  </span>
                  <span>{row.voteCount}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
