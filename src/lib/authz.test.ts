import { describe, expect, it } from "vitest";
import { canModerate, canSubmitOrVote, publicOnlyApproved, stripPrivateSubmissionFields } from "@/lib/authz";
import { toPublicGallery } from "@/lib/gallery";
import type { InternalEntry } from "@/lib/gallery";

describe("authorization", () => {
  it("does not allow unauthenticated submit or vote", () => {
    expect(canSubmitOrVote(false)).toBe(false);
    expect(canSubmitOrVote(true)).toBe(true);
  });

  it("never includes unapproved entries in the public gallery", () => {
    const rows: InternalEntry[] = [
      {
        id: "1",
        entry_code: "C1-001",
        contest_id: "c",
        title: "Pending",
        description: "secret",
        primary_file_path: "p",
        prototype_url: null,
        created_at: "",
        status: "pending_review",
        participant_id: "user-1",
        rejection_reason: null,
      },
      {
        id: "2",
        entry_code: "C1-002",
        contest_id: "c",
        title: "Rejected",
        description: "no",
        primary_file_path: "r",
        prototype_url: null,
        created_at: "",
        status: "rejected",
        participant_id: "user-2",
        rejection_reason: "off brief",
      },
      {
        id: "3",
        entry_code: "C1-003",
        contest_id: "c",
        title: "Approved",
        description: "ok",
        primary_file_path: "a",
        prototype_url: null,
        created_at: "",
        status: "approved",
        participant_id: "user-3",
        rejection_reason: null,
      },
    ];
    const publicRows = toPublicGallery(rows);
    expect(publicRows).toHaveLength(1);
    expect(publicRows[0]?.title).toBe("Approved");
    expect(publicOnlyApproved(rows)).toHaveLength(1);
    expect(JSON.stringify(publicRows)).not.toContain("user-3");
    expect(JSON.stringify(publicRows)).not.toContain("off brief");
  });

  it("blocks participants from admin operations", () => {
    expect(canModerate("student@college.edu", "organizer@college.edu")).toBe(false);
    expect(canModerate("organizer@college.edu", "organizer@college.edu")).toBe(true);
  });

  it("strips private moderation fields from public payloads", () => {
    const publicRow = stripPrivateSubmissionFields({
      id: "1",
      title: "Work",
      participant_id: "secret",
      participant_email: "hidden@example.com",
      rejection_reason: "internal",
      reviewed_by: "admin",
      reviewed_at: "now",
      supporting_file_path: "private.pdf",
    });
    expect(publicRow).toEqual({ id: "1", title: "Work" });
  });
});
