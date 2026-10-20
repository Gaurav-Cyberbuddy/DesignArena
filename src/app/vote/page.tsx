import { redirect } from "next/navigation";
import { VotingBooth } from "@/components/voting-booth";
import { getSessionUser } from "@/lib/auth/session";
import { listPublicContests } from "@/lib/data/contests";
import { listGalleryEntries } from "@/lib/data/submissions";
import { listMyVotes } from "@/lib/data/votes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vote" };

export default async function VotePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/vote");
  const contests = await listPublicContests().catch(() => []);
  const { entries } = await listGalleryEntries({ pageSize: 48 }).catch(() => ({ entries: [] }));
  const votes = await listMyVotes();

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl">Public voting</h1>
        <p className="mt-3 text-muted-foreground">
          Choose a favorite in any contest that is open. You may vote in one, two, or all three. Account
          limits reduce duplicate ballots; they cannot guarantee one real-world person per account.
        </p>
      </div>
      <VotingBooth contests={contests} entries={entries} existingVotes={votes} />
    </div>
  );
}
