import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { contestPhase } from "@/lib/contests";
import { listPublicContests } from "@/lib/data/contests";
import { listGalleryEntries } from "@/lib/data/submissions";
import { publishedTotals } from "@/lib/data/votes";
import { firstPlace, rankByVotes } from "@/lib/results";

export const metadata = { title: "Results" };

export default async function ResultsPage() {
  const contests = await listPublicContests().catch(() => []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl">Results</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Vote totals and winners appear only after the organizer publishes certified results. Ties are
          shown as ties.
        </p>
      </div>
      {contests.length === 0 ? (
        <EmptyState title="No contests" description="Results will appear when contests are published." />
      ) : (
        <div className="space-y-12">
          {await Promise.all(
            contests.map(async (contest) => {
              const phase = contestPhase(contest);
              if (!phase.resultsVisible) {
                return (
                  <section key={contest.id} className="rounded-2xl border bg-card p-6">
                    <h2 className="font-display text-2xl">{contest.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Results are hidden while voting is underway or until the organizer publishes them.
                    </p>
                  </section>
                );
              }
              const { entries } = await listGalleryEntries({ contestId: contest.id, pageSize: 24 });
              const counts = await publishedTotals(contest.id);
              const ranked = rankByVotes(entries, counts);
              const { winners, isTie, hasVotes } = firstPlace(ranked);
              const runners = contest.show_runners_up ? ranked.filter((row) => row.rank > 1).slice(0, 3) : [];

              return (
                <section key={contest.id} className="space-y-4">
                  <h2 className="font-display text-3xl">{contest.name}</h2>
                  {!hasVotes || winners.length === 0 ? (
                    <EmptyState title="No verified votes" description="There is no winner to display." />
                  ) : (
                    <div className="rounded-2xl border bg-card p-6">
                      {isTie ? (
                        <p className="text-sm text-teal">Tie at first place. Organizers will follow published tie-break rules.</p>
                      ) : (
                        <p className="text-sm uppercase tracking-wide text-teal">Winner</p>
                      )}
                      <div className="mt-4 grid gap-6 md:grid-cols-2">
                        {winners.map((row) => (
                          <div key={row.submission.id}>
                            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                              <Image
                                src={`/api/files/primary/${row.submission.id}`}
                                alt={row.submission.title}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">{row.submission.entry_code}</p>
                            <h3 className="font-display text-2xl">{row.submission.title}</h3>
                            <p className="text-sm">{row.voteCount} verified votes</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {runners.length ? (
                    <div>
                      <h3 className="font-display text-xl">Runners-up</h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        {runners.map((row) => (
                          <li key={row.submission.id}>
                            {row.submission.entry_code} — {row.submission.title} · {row.voteCount} votes
                            {row.tied ? " (tie)" : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
