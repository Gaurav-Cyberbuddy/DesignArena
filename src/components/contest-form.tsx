"use client";

import { useState, useTransition } from "react";
import { upsertContestAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Contest } from "@/lib/types";

function toLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

export function ContestForm({ contest }: { contest?: Contest }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className="grid gap-4 rounded-2xl border bg-card p-6 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await upsertContestAction({
            id: contest?.id,
            name: form.get("name"),
            slug: form.get("slug"),
            description: form.get("description"),
            guidelines: form.get("guidelines"),
            coverImageUrl: form.get("coverImageUrl"),
            codePrefix: form.get("codePrefix"),
            submissionStart: toIso(String(form.get("submissionStart"))),
            submissionEnd: toIso(String(form.get("submissionEnd"))),
            votingStart: toIso(String(form.get("votingStart"))),
            votingEnd: toIso(String(form.get("votingEnd"))),
            status: form.get("status"),
            allowVoteChanges: form.get("allowVoteChanges") === "on",
            resultsPublished: form.get("resultsPublished") === "on",
            showRunnersUp: form.get("showRunnersUp") === "on",
          });
          setOk(result.ok);
          setError(result.ok ? null : result.error);
        });
      }}
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={contest?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required defaultValue={contest?.slug} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="codePrefix">Entry prefix</Label>
        <Input id="codePrefix" name="codePrefix" required defaultValue={contest?.code_prefix ?? "C1"} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required defaultValue={contest?.description} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="guidelines">Guidelines</Label>
        <Textarea id="guidelines" name="guidelines" defaultValue={contest?.guidelines} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="coverImageUrl">Cover image URL</Label>
        <Input id="coverImageUrl" name="coverImageUrl" defaultValue={contest?.cover_image_url ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="submissionStart">Submission start</Label>
        <Input id="submissionStart" type="datetime-local" name="submissionStart" required defaultValue={toLocal(contest?.submission_start)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="submissionEnd">Submission end</Label>
        <Input id="submissionEnd" type="datetime-local" name="submissionEnd" required defaultValue={toLocal(contest?.submission_end)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="votingStart">Voting start</Label>
        <Input id="votingStart" type="datetime-local" name="votingStart" required defaultValue={toLocal(contest?.voting_start)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="votingEnd">Voting end</Label>
        <Input id="votingEnd" type="datetime-local" name="votingEnd" required defaultValue={toLocal(contest?.voting_end)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" defaultValue={contest?.status ?? "draft"} className="h-10 w-full rounded-md border bg-card px-3 text-sm">
          <option value="draft">Draft</option>
          <option value="submissions_open">Submissions open</option>
          <option value="review">Review</option>
          <option value="voting_open">Voting open</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="flex flex-col gap-2 text-sm md:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowVoteChanges" defaultChecked={contest?.allow_vote_changes} />
          Allow vote changes
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="resultsPublished" defaultChecked={contest?.results_published} />
          Publish results
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="showRunnersUp" defaultChecked={contest?.show_runners_up ?? true} />
          Show runners-up
        </label>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : contest ? "Save contest" : "Create contest"}
        </Button>
        {ok ? <p className="mt-2 text-sm text-teal">Saved.</p> : null}
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}
