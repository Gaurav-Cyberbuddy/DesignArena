"use client";

import { useMemo, useState, useTransition } from "react";
import { castBallotAction } from "@/actions/votes";
import { DesignCard } from "@/components/design-card";
import { EmptyState } from "@/components/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { contestPhase } from "@/lib/contests";
import type { Contest, GalleryEntry, VoteRecord } from "@/lib/types";

export function VotingBooth({
  contests,
  entries,
  existingVotes,
}: {
  contests: Contest[];
  entries: GalleryEntry[];
  existingVotes: VoteRecord[];
}) {
  const [choices, setChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(existingVotes.map((vote) => [vote.contest_id, vote.submission_id])),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locked = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const contest of contests) {
      const hasVote = existingVotes.some((v) => v.contest_id === contest.id);
      map[contest.id] = hasVote && !contest.allow_vote_changes;
    }
    return map;
  }, [contests, existingVotes]);

  const payload = Object.entries(choices)
    .filter(([contestId, submissionId]) => {
      if (!submissionId) return false;
      const existing = existingVotes.find((vote) => vote.contest_id === contestId);
      if (existing?.submission_id === submissionId) return false;
      if (existing && locked[contestId]) return false;
      return true;
    })
    .map(([contestId, submissionId]) => ({ contestId, submissionId }));

  return (
    <div className="space-y-12">
      {contests.map((contest) => {
        const phase = contestPhase(contest);
        const contestEntries = entries.filter((entry) => entry.contest_id === contest.id);
        return (
          <section key={contest.id} className="space-y-4">
            <div>
              <h2 className="font-display text-2xl">{contest.name}</h2>
              <p className="text-sm text-muted-foreground">
                {phase.canVote
                  ? locked[contest.id]
                    ? "Your vote is recorded and locked."
                    : "Select one approved design. You do not have to vote in every contest."
                  : "This contest is not accepting votes."}
              </p>
            </div>
            {contestEntries.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {contestEntries.map((entry) => (
                  <DesignCard
                    key={entry.id}
                    entry={entry}
                    contest={contest}
                    selectable={phase.canVote}
                    selected={choices[contest.id] === entry.id}
                    voteLocked={locked[contest.id]}
                    onSelect={() => {
                      if (!phase.canVote || locked[contest.id]) return;
                      setChoices((current) => ({ ...current, [contest.id]: entry.id }));
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Nothing to vote on yet" description="Approved designs will appear here." />
            )}
          </section>
        );
      })}

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-display text-xl">Review your ballot</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {contests.map((contest) => {
            const entry = entries.find((item) => item.id === choices[contest.id]);
            return (
              <li key={contest.id}>
                <span className="font-medium">{contest.name}:</span>{" "}
                {entry ? `${entry.entry_code} — ${entry.title}` : "No selection"}
              </li>
            );
          })}
        </ul>
        <Button className="mt-4" disabled={pending || payload.length === 0} onClick={() => setConfirmOpen(true)}>
          Confirm votes
        </Button>
        {message ? <p className="mt-3 text-sm text-teal">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this ballot?</AlertDialogTitle>
            <AlertDialogDescription>
              One account may vote once per contest. Votes cannot be changed unless the organizer enables
              that setting. Totals stay hidden until results are published.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                start(async () => {
                  const result = await castBallotAction({ choices: payload });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setError(null);
                  setMessage(
                    result.emailSent
                      ? "Votes saved. A confirmation email was sent."
                      : "Votes saved. Email delivery is not configured, so this confirmation is in-app only.",
                  );
                });
              }}
            >
              Submit ballot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
