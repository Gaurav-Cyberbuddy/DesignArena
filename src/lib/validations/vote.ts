import { z } from "zod";

export const voteChoiceSchema = z.object({
  contestId: z.string().uuid(),
  submissionId: z.string().uuid(),
});

export const ballotSchema = z.object({
  choices: z.array(voteChoiceSchema).min(1, "Select at least one design.").max(3),
});

export type BallotInput = z.infer<typeof ballotSchema>;
