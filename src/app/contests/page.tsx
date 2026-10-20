import { ContestCard } from "@/components/contest-card";
import { EmptyState } from "@/components/empty-state";
import { listPublicContests } from "@/lib/data/contests";
import type { Contest } from "@/lib/types";

export const metadata = { title: "Contests" };

export default async function ContestsPage() {
  let contests: Contest[] = [];
  try {
    contests = await listPublicContests();
  } catch {
    contests = [];
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-teal">Program</p>
        <h1 className="mt-2 font-display text-4xl">Three contests, one season</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Names, dates, and guidelines are loaded from the database so organizers can update them without
          shipping a new site.
        </p>
      </div>
      {contests.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      ) : (
        <EmptyState title="No published contests" description="Draft contests are hidden until the organizer publishes them." />
      )}
    </div>
  );
}
