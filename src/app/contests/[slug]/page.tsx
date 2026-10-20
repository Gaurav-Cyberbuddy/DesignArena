import Link from "next/link";
import { notFound } from "next/navigation";
import { DesignCard } from "@/components/design-card";
import { EmptyState } from "@/components/empty-state";
import { ContestStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { contestPhase } from "@/lib/contests";
import { getContestBySlug, listPublicContests } from "@/lib/data/contests";
import { listGalleryEntries } from "@/lib/data/submissions";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  try {
    const contests = await listPublicContests();
    return contests.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export default async function ContestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const contest = await getContestBySlug(slug).catch(() => null);
  if (!contest) notFound();
  const phase = contestPhase(contest);
  const { entries } = await listGalleryEntries({ contestId: contest.id, pageSize: 9 });

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <ContestStatusBadge status={contest.status} />
        <h1 className="font-display text-5xl">{contest.name}</h1>
        <p className="text-lg text-muted-foreground">{contest.description}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Submissions</dt>
            <dd>
              {formatDate(contest.submission_start)} – {formatDate(contest.submission_end)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Voting</dt>
            <dd>
              {formatDate(contest.voting_start)} – {formatDate(contest.voting_end)}
            </dd>
          </div>
        </dl>
        {contest.guidelines ? (
          <div className="rounded-2xl border bg-card p-5 text-sm leading-relaxed">{contest.guidelines}</div>
        ) : null}
        <div className="flex gap-3">
          <Button asChild disabled={!phase.canSubmit}>
            <Link href={`/submit?contest=${contest.slug}`}>Submit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/gallery?contest=${contest.slug}`}>Gallery</Link>
          </Button>
        </div>
      </div>
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Approved entries</h2>
        {entries.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <DesignCard key={entry.id} entry={entry} contest={contest} />
            ))}
          </div>
        ) : (
          <EmptyState title="No approved work yet" description="Entries appear here after organizer review." />
        )}
      </section>
    </div>
  );
}
