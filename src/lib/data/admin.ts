import { connection } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { AdminSubmission, Contest } from "@/lib/types";

export async function adminOverview() {
  await connection();
  const admin = createAdminSupabase();
  const { data: submissions } = await admin.from("submissions").select("id, status, contest_id");
  const { data: votes } = await admin.from("votes").select("id, contest_id");
  const { data: contests } = await admin.from("contests").select("*").order("code_prefix");
  const { count: profiles } = await admin.from("profiles").select("id", { count: "exact", head: true });

  const list = submissions ?? [];
  const byStatus = {
    total: list.length,
    pending_review: list.filter((s) => s.status === "pending_review").length,
    approved: list.filter((s) => s.status === "approved").length,
    rejected: list.filter((s) => s.status === "rejected").length,
  };

  const byContest = (contests ?? []).map((contest) => ({
    contest: contest as Contest,
    submissions: list.filter((s) => s.contest_id === contest.id).length,
    votes: (votes ?? []).filter((v) => v.contest_id === contest.id).length,
  }));

  return {
    ...byStatus,
    votes: votes?.length ?? 0,
    participants: profiles ?? 0,
    byContest,
    contests: (contests ?? []) as Contest[],
  };
}

export async function adminListSubmissions(filters: {
  contestId?: string;
  status?: string;
  q?: string;
  page?: number;
}) {
  await connection();
  const admin = createAdminSupabase();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  let query = admin
    .from("submissions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (filters.contestId) query = query.eq("contest_id", filters.contestId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const q = filters.q.replace(/[%_,]/g, " ").trim();
    if (q) query = query.or(`entry_code.ilike.%${q}%,title.ilike.%${q}%`);
  }
  const { data, count } = await query.range(from, from + pageSize - 1);
  const rows = data ?? [];
  const emails = new Map<string, string | null>();
  for (const row of rows) {
    if (!emails.has(row.participant_id)) {
      const { data: user } = await admin.auth.admin.getUserById(row.participant_id);
      emails.set(row.participant_id, user.user?.email ?? null);
    }
  }
  const submissions: AdminSubmission[] = rows.map((row) => ({
    ...row,
    participant_email: emails.get(row.participant_id) ?? null,
  }));
  return { submissions, total: count ?? 0, page, pageSize };
}

export async function adminVoteSummary() {
  await connection();
  const admin = createAdminSupabase();
  const { data: votes } = await admin.from("votes").select("contest_id, submission_id, voter_id, created_at");
  const { data: submissions } = await admin
    .from("submissions")
    .select("id, entry_code, title, contest_id, status, participant_id")
    .eq("status", "approved");
  const { data: contests } = await admin.from("contests").select("*").order("code_prefix");

  const counts = new Map<string, { total: number; voters: Set<string> }>();
  for (const vote of votes ?? []) {
    const current = counts.get(vote.submission_id) ?? { total: 0, voters: new Set() };
    current.total += 1;
    current.voters.add(vote.voter_id);
    counts.set(vote.submission_id, current);
  }

  const contestTotals = new Map<string, number>();
  for (const vote of votes ?? []) {
    contestTotals.set(vote.contest_id, (contestTotals.get(vote.contest_id) ?? 0) + 1);
  }

  const flags = (submissions ?? [])
    .map((submission) => {
      const total = counts.get(submission.id)?.total ?? 0;
      const contestTotal = contestTotals.get(submission.contest_id) ?? 0;
      const share = contestTotal === 0 ? 0 : total / contestTotal;
      return { submission, total, share, suspicious: share >= 0.6 && total >= 5 };
    })
    .filter((row) => row.suspicious);

  return {
    contests: (contests ?? []) as Contest[],
    submissions: submissions ?? [],
    counts,
    contestTotals,
    flags,
    voteCount: votes?.length ?? 0,
  };
}
