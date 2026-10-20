import { SubmissionForm } from "@/components/submission-form";
import { getSessionUser } from "@/lib/auth/session";
import { listPublicContests } from "@/lib/data/contests";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit" };

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ contest?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/submit");
  const contests = await listPublicContests().catch(() => []);
  const { contest: slug } = await searchParams;
  const selected = contests.find((item) => item.slug === slug);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl">Submit a design</h1>
        <p className="mt-3 text-muted-foreground">
          One primary image per entry, up to 10 MB. Optional PDF up to 15 MB. Server-side checks apply —
          browser validation is only a convenience.
        </p>
      </div>
      <SubmissionForm contests={contests} email={user.email ?? ""} defaultContestId={selected?.id} />
    </div>
  );
}
