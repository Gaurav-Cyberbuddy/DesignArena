import { z } from "zod";

export const submissionFieldsSchema = z.object({
  contestId: z.string().uuid("Select a contest."),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(2000, "Description must be 2000 characters or fewer."),
  prototypeUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),
  submissionId: z.string().uuid().optional(),
});

export type SubmissionFields = z.infer<typeof submissionFieldsSchema>;
