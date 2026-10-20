import { createServerSupabase } from "@/lib/supabase/server";
import type { VoteRecord } from "@/lib/types";

export async function listMyVotes(): Promise<VoteRecord[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("votes")
    .select("id, contest_id, submission_id, created_at");
  if (error) return [];
  return (data ?? []) as VoteRecord[];
}

export async function publishedTotals(contestId: string): Promise<Record<string, number>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("published_vote_totals", {
    p_contest_id: contestId,
  });
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as { submission_id: string; vote_count: number }[]) {
    counts[row.submission_id] = Number(row.vote_count);
  }
  return counts;
}
