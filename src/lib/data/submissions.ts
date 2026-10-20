import { createServerSupabase } from "@/lib/supabase/server";
import type { GalleryEntry, MySubmission } from "@/lib/types";

export async function listGalleryEntries(options?: {
  contestId?: string;
  query?: string;
  sort?: "newest" | "oldest" | "title";
  page?: number;
  pageSize?: number;
}): Promise<{ entries: GalleryEntry[]; total: number }> {
  const supabase = await createServerSupabase();
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, options?.pageSize ?? 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("gallery_entries")
    .select("*", { count: "exact" });

  if (options?.contestId) request = request.eq("contest_id", options.contestId);
  if (options?.query) {
    const q = options.query.replace(/[%_,]/g, " ").trim();
    if (q) {
      request = request.or(`title.ilike.%${q}%,entry_code.ilike.%${q}%,description.ilike.%${q}%`);
    }
  }

  if (options?.sort === "oldest") request = request.order("created_at", { ascending: true });
  else if (options?.sort === "title") request = request.order("title", { ascending: true });
  else request = request.order("created_at", { ascending: false });

  const { data, error, count } = await request.range(from, to);
  if (error) throw new Error("Unable to load the gallery.");
  return { entries: (data ?? []) as GalleryEntry[], total: count ?? 0 };
}

export async function getGalleryEntry(id: string): Promise<GalleryEntry | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("gallery_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as GalleryEntry | null) ?? null;
}

export async function listMySubmissions(): Promise<MySubmission[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("my_submissions");
  if (error) throw new Error("Unable to load your submissions.");
  return (data ?? []) as MySubmission[];
}

export async function listFeaturedEntries(limit = 6): Promise<GalleryEntry[]> {
  const { entries } = await listGalleryEntries({ page: 1, pageSize: limit, sort: "newest" });
  return entries;
}
