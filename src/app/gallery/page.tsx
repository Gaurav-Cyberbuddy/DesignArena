import Link from "next/link";
import { DesignCard } from "@/components/design-card";
import { EmptyState } from "@/components/empty-state";
import { PaginationBar } from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contestPhase } from "@/lib/contests";
import { listPublicContests } from "@/lib/data/contests";
import { listGalleryEntries } from "@/lib/data/submissions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Gallery" };

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ contest?: string; q?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const contests = await listPublicContests().catch(() => []);
  const selected = contests.find((c) => c.slug === params.contest);
  const page = Math.max(1, Number(params.page || 1) || 1);
  const sort = params.sort === "oldest" || params.sort === "title" ? params.sort : "newest";
  const { entries, total } = await listGalleryEntries({
    contestId: selected?.id,
    query: params.q,
    sort,
    page,
    pageSize: 12,
  }).catch(() => ({ entries: [], total: 0 }));

  const makeHref = (pageNumber: number) => {
    const sp = new URLSearchParams();
    if (params.contest) sp.set("contest", params.contest);
    if (params.q) sp.set("q", params.q);
    if (sort !== "newest") sp.set("sort", sort);
    if (pageNumber > 1) sp.set("page", String(pageNumber));
    const qs = sp.toString();
    return qs ? `/gallery?${qs}` : "/gallery";
  };

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.2em] text-teal">Showcase</p>
        <h1 className="mt-2 font-display text-4xl">Public gallery</h1>
        <p className="mt-3 text-muted-foreground">
          Approved work from every contest lives here. Pending and rejected entries are never shown.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={!selected ? "default" : "outline"} size="sm" asChild>
          <Link href="/gallery">All contests</Link>
        </Button>
        {contests.map((contest) => (
          <Button key={contest.id} variant={selected?.id === contest.id ? "default" : "outline"} size="sm" asChild>
            <Link href={`/gallery?contest=${contest.slug}`}>{contest.name}</Link>
          </Button>
        ))}
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" action="/gallery">
        {params.contest ? <input type="hidden" name="contest" value={params.contest} /> : null}
        <Input name="q" placeholder="Search title or entry ID" defaultValue={params.q} />
        <select
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-md border bg-card px-3 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title</option>
        </select>
        <Button type="submit">Filter</Button>
      </form>

      {selected ? (
        <p className="text-sm text-muted-foreground">
          {contestPhase(selected).canVote
            ? `Voting is open until ${formatDate(selected.voting_end)}.`
            : `Voting is not open. Window: ${formatDate(selected.voting_start)} – ${formatDate(selected.voting_end)}.`}
        </p>
      ) : null}

      {entries.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => {
            const contest = contests.find((c) => c.id === entry.contest_id);
            return (
              <DesignCard
                key={entry.id}
                entry={entry}
                contest={contest}
                selectable={Boolean(contest && contestPhase(contest).canVote)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No approved designs yet"
          description="The gallery stays empty until the organizer approves entries. Sample seed content is development-only."
        />
      )}

      <PaginationBar page={page} pageSize={12} total={total} hrefFor={makeHref} />

      <div className="rounded-2xl border bg-card p-6">
        <p className="font-display text-xl">Ready to vote?</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Review your favorites here, then confirm on the voting page. One verified account can vote once
          per contest.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/vote">Go to voting</Link>
        </Button>
      </div>
    </div>
  );
}
