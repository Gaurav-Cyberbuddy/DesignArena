import { createServerSupabase } from "@/lib/supabase/server";
import type { Contest } from "@/lib/types";

export async function listPublicContests(): Promise<Contest[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .neq("status", "draft")
    .order("code_prefix", { ascending: true });
  if (error) throw new Error("Unable to load contests.");
  return (data ?? []) as Contest[];
}

export async function getContestBySlug(slug: string): Promise<Contest | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("contests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Unable to load contest.");
  if (!data || data.status === "draft") return null;
  return data as Contest;
}

export async function getContestById(id: string): Promise<Contest | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("contests").select("*").eq("id", id).maybeSingle();
  if (!data || data.status === "draft") return null;
  return data as Contest;
}
