import { describe, expect, it } from "vitest";
import { contestPhase } from "@/lib/contests";
import type { Contest } from "@/lib/types";

const base: Contest = {
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
  status: "submissions_open",
  allow_vote_changes: false,
  results_published: false,
  show_runners_up: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("contest phases", () => {
  it("closes submissions after the deadline", () => {
    const phase = contestPhase(base, new Date("2026-01-11T00:00:00.000Z"));
    expect(phase.canSubmit).toBe(false);
    expect(phase.canEdit).toBe(false);
  });

  it("opens voting only inside the window and status", () => {
    const voting = { ...base, status: "voting_open" as const };
    expect(contestPhase(voting, new Date("2026-01-15T00:00:00.000Z")).canVote).toBe(true);
    expect(contestPhase(voting, new Date("2026-01-21T00:00:00.000Z")).canVote).toBe(false);
  });
});
