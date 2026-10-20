import { z } from "zod";
import { CONTEST_STATUSES } from "@/lib/types";

export const contestUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(3).max(80),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug with hyphens."),
    description: z.string().trim().min(10).max(2000),
    guidelines: z.string().trim().max(4000).optional().or(z.literal("")),
    coverImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
    codePrefix: z.string().regex(/^C[0-9]+$/, "Prefix must look like C1."),
    submissionStart: z.string().datetime(),
    submissionEnd: z.string().datetime(),
    votingStart: z.string().datetime(),
    votingEnd: z.string().datetime(),
    status: z.enum(CONTEST_STATUSES),
    allowVoteChanges: z.boolean(),
    resultsPublished: z.boolean(),
    showRunnersUp: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.submissionEnd) <= new Date(value.submissionStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Submission close must be after open.",
        path: ["submissionEnd"],
      });
    }
    if (new Date(value.votingEnd) <= new Date(value.votingStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Voting close must be after open.",
        path: ["votingEnd"],
      });
    }
  });

export type ContestUpsert = z.infer<typeof contestUpsertSchema>;
