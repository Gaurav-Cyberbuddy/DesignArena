import { ContestForm } from "@/components/contest-form";
import { ContestStatusBadge } from "@/components/status-badge";
import { adminOverview } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contests · Admin" };

export default async function AdminContestsPage() {
  const { contests } = await adminOverview();
  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        Opening voting requires status “voting open” and a current voting window. Publishing results
        reveals totals on the public results page.
      </p>
      {contests.map((contest) => (
        <section key={contest.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl">{contest.name}</h2>
            <ContestStatusBadge status={contest.status} />
          </div>
          <ContestForm contest={contest} />
        </section>
      ))}
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Create contest</h2>
        <ContestForm />
      </section>
    </div>
  );
}
