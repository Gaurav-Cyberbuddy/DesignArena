import type { GalleryEntry, ResultRow } from "@/lib/types";

export function rankByVotes(
  entries: GalleryEntry[],
  counts: Record<string, number>,
): ResultRow[] {
  const rows = entries
    .map((submission) => ({
      submission,
      voteCount: counts[submission.id] ?? 0,
    }))
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.submission.entry_code.localeCompare(b.submission.entry_code);
    });

  const ranked: ResultRow[] = [];
  let lastCount = Number.NaN;
  let lastRank = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const count = rows[i].voteCount;
    const rank = count === lastCount ? lastRank : i + 1;
    lastCount = count;
    lastRank = rank;
    ranked.push({
      ...rows[i],
      rank,
      tied: false,
    });
  }

  const byRank = new Map<number, number>();
  for (const row of ranked) {
    byRank.set(row.rank, (byRank.get(row.rank) ?? 0) + 1);
  }
  return ranked.map((row) => ({
    ...row,
    tied: (byRank.get(row.rank) ?? 0) > 1,
  }));
}

export function firstPlace(rows: ResultRow[]) {
  const winners = rows.filter((row) => row.rank === 1);
  return {
    winners,
    isTie: winners.length > 1,
    hasVotes: winners.some((w) => w.voteCount > 0),
  };
}
