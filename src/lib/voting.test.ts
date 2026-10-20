import { describe, expect, it } from "vitest";
import type { Contest, GalleryEntry } from "@/lib/types";
import { applyVote, evaluateVote, tally } from "@/lib/voting";

function contest(overrides: Partial<Contest> = {}): Contest {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Contest 1",
    slug: "contest-1",
    description: "Brief",
    guidelines: "",
    cover_image_url: null,
    code_prefix: "C1",
    submission_start: "2026-01-01T00:00:00.000Z",
    submission_end: "2026-01-10T00:00:00.000Z",
    voting_start: "2026-01-11T00:00:00.000Z",
    voting_end: "2026-01-20T00:00:00.000Z",
    status: "voting_open",
    allow_vote_changes: false,
    results_published: false,
    show_runners_up: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function entry(overrides: Partial<GalleryEntry> = {}): GalleryEntry {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    entry_code: "C1-001",
    contest_id: "11111111-1111-1111-1111-111111111111",
    title: "Poster",
    description: "A poster",
    primary_file_path: "a.png",
    prototype_url: null,
    created_at: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

const voter = "33333333-3333-3333-3333-333333333333";
const now = new Date("2026-01-15T12:00:00.000Z");

describe("voting eligibility", () => {
  it("rejects unauthenticated voters", () => {
    const result = evaluateVote({
      authenticated: false,
      attempt: { voterId: voter, contestId: contest().id, submissionId: entry().id, now },
      contest: contest(),
      entry: entry(),
      entryOwnerId: "other",
      existingVoteSubmissionId: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a second vote in the same contest", () => {
    const result = evaluateVote({
      authenticated: true,
      attempt: { voterId: voter, contestId: contest().id, submissionId: entry().id, now },
      contest: contest(),
      entry: entry(),
      entryOwnerId: "other",
      existingVoteSubmissionId: "44444444-4444-4444-4444-444444444444",
    });
    expect(result.ok).toBe(false);
  });

  it("allows one vote in each of three contests", () => {
    const c1 = contest();
    const c2 = contest({ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", slug: "contest-2", code_prefix: "C2" });
    const c3 = contest({ id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", slug: "contest-3", code_prefix: "C3" });
    let votes: { contestId: string; voterId: string; submissionId: string }[] = [];
    for (const item of [c1, c2, c3]) {
      votes = applyVote(votes, { contestId: item.id, voterId: voter, submissionId: entry({ contest_id: item.id }).id }, false);
    }
    expect(votes).toHaveLength(3);
  });

  it("rejects voting for your own entry", () => {
    const result = evaluateVote({
      authenticated: true,
      attempt: { voterId: voter, contestId: contest().id, submissionId: entry().id, now },
      contest: contest(),
      entry: entry(),
      entryOwnerId: voter,
      existingVoteSubmissionId: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects votes after the deadline", () => {
    const result = evaluateVote({
      authenticated: true,
      attempt: {
        voterId: voter,
        contestId: contest().id,
        submissionId: entry().id,
        now: new Date("2026-01-21T00:00:00.000Z"),
      },
      contest: contest(),
      entry: entry(),
      entryOwnerId: "other",
      existingVoteSubmissionId: null,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an entry that belongs to another contest", () => {
    const result = evaluateVote({
      authenticated: true,
      attempt: { voterId: voter, contestId: contest().id, submissionId: entry().id, now },
      contest: contest(),
      entry: entry({ contest_id: "cccccccc-cccc-cccc-cccc-cccccccccccc" }),
      entryOwnerId: "other",
      existingVoteSubmissionId: null,
    });
    expect(result.ok).toBe(false);
  });
});

describe("vote persistence helpers", () => {
  it("keeps totals correct when a duplicate is rejected", () => {
    const first = { contestId: contest().id, voterId: voter, submissionId: entry().id };
    const votes = applyVote([], first, false);
    expect(() => applyVote(votes, first, false)).toThrow("duplicate");
    expect(tally(votes)[entry().id]).toBe(1);
  });

  it("counts concurrent unique voters without inflating duplicates", () => {
    const a = { contestId: contest().id, voterId: voter, submissionId: entry().id };
    const b = {
      contestId: contest().id,
      voterId: "55555555-5555-5555-5555-555555555555",
      submissionId: entry().id,
    };
    let votes = applyVote([], a, false);
    votes = applyVote(votes, b, false);
    expect(tally(votes)[entry().id]).toBe(2);
    expect(() => applyVote(votes, a, false)).toThrow("duplicate");
    expect(tally(votes)[entry().id]).toBe(2);
  });
});
