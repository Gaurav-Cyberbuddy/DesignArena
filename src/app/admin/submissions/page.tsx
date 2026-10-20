import Link from "next/link";
import { AdminSubmissionTable } from "@/components/admin-submission-table";
import { PaginationBar } from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminListSubmissions, adminOverview } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submissions · Admin" };

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ contest?: string; status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const overview = await adminOverview();
  const page = Math.max(1, Number(params.page || 1) || 1);
  const { submissions, total, pageSize } = await adminListSubmissions({
    contestId: params.contest,
    status: params.status,
    q: params.q,
    page,
  });

  const hrefFor = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (params.contest) sp.set("contest", params.contest);
    if (params.status) sp.set("status", params.status);
    if (params.q) sp.set("q", params.q);
    if (nextPage > 1) sp.set("page", String(nextPage));
    return `/admin/submissions?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-3 md:flex-row" action="/admin/submissions">
        <select name="contest" defaultValue={params.contest ?? ""} className="h-10 rounded-md border bg-card px-3 text-sm">
          <option value="">All contests</option>
          {overview.contests.map((contest) => (
            <option key={contest.id} value={contest.id}>
              {contest.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-md border bg-card px-3 text-sm">
          <option value="">All statuses</option>
          <option value="pending_review">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Input name="q" placeholder="Entry ID or title" defaultValue={params.q} />
        <Button type="submit">Search</Button>
      </form>
      <AdminSubmissionTable submissions={submissions} />
      <PaginationBar page={page} pageSize={pageSize} total={total} hrefFor={hrefFor} />
      <Button variant="outline" asChild>
        <Link href="/admin">Back to overview</Link>
      </Button>
    </div>
  );
}
