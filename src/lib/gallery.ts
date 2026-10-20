import type { GalleryEntry, SubmissionStatus } from "@/lib/types";

export type InternalEntry = GalleryEntry & {
  status: SubmissionStatus;
  participant_id?: string;
  rejection_reason?: string | null;
};

export function toPublicGallery(entries: InternalEntry[]): GalleryEntry[] {
  return entries
    .filter((entry) => entry.status === "approved")
      .map((entry) => ({
        id: entry.id,
        entry_code: entry.entry_code,
        contest_id: entry.contest_id,
        title: entry.title,
        description: entry.description,
        primary_file_path: entry.primary_file_path,
        prototype_url: entry.prototype_url,
        has_supporting_file: entry.has_supporting_file,
        created_at: entry.created_at,
      }));
}
