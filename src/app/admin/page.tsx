import { adminOverview } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const stats = await adminOverview();
  const cards = [
    ["Total submissions", stats.total],
    ["Pending reviews", stats.pending_review],
    ["Approved", stats.approved],
    ["Rejected", stats.rejected],
    ["Votes cast", stats.votes],
    ["Participants", stats.participants],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-display text-xl">Participation by contest</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {stats.byContest.map((row) => (
            <li key={row.contest.id} className="flex justify-between gap-4 border-b pb-3">
              <span>{row.contest.name}</span>
              <span className="text-muted-foreground">
                {row.submissions} entries · {row.votes} votes
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
