import { describe, expect, it } from "vitest";
import { firstPlace, rankByVotes } from "@/lib/results";
import { unpublishedResultsVisible } from "@/lib/authz";
import type { GalleryEntry } from "@/lib/types";

const a: GalleryEntry = {
  id: "a",
  entry_code: "C1-001",
  contest_id: "c",
  title: "A",
  description: "",
  primary_file_path: "a",
  prototype_url: null,
  created_at: "",
};
const b: GalleryEntry = { ...a, id: "b", entry_code: "C1-002", title: "B" };

describe("results", () => {
  it("hides unpublished results", () => {
    expect(unpublishedResultsVisible(false)).toBe(false);
    expect(unpublishedResultsVisible(true)).toBe(true);
  });

  it("marks a tie instead of inventing a winner", () => {
    const ranked = rankByVotes([a, b], { a: 4, b: 4 });
    const { winners, isTie } = firstPlace(ranked);
    expect(isTie).toBe(true);
    expect(winners).toHaveLength(2);
    expect(ranked.every((row) => row.tied)).toBe(true);
  });

  it("ranks a unique winner first", () => {
    const ranked = rankByVotes([a, b], { a: 3, b: 5 });
    const { winners, isTie } = firstPlace(ranked);
    expect(isTie).toBe(false);
    expect(winners[0]?.submission.id).toBe("b");
    expect(winners[0]?.voteCount).toBe(5);
  });
});
