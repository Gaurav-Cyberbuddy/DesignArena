"use client";

import { useState, useTransition } from "react";
import { moderateSubmissionAction } from "@/actions/admin";
import { SubmissionStatusBadge } from "@/components/status-badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminSubmission, SubmissionStatus } from "@/lib/types";

export function AdminSubmissionTable({ submissions }: { submissions: AdminSubmission[] }) {
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<{ id: string; status: SubmissionStatus } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entry</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Files</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.entry_code}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell className="text-xs">{row.participant_email ?? row.participant_id}</TableCell>
              <TableCell>
                <SubmissionStatusBadge status={row.status} />
              </TableCell>
              <TableCell className="space-x-2 text-xs">
                <a className="text-primary" href={`/api/files/primary/${row.id}`} target="_blank" rel="noreferrer">
                  Image
                </a>
                {row.supporting_file_path ? (
                  <a className="text-primary" href={`/api/files/supporting/${row.id}`} target="_blank" rel="noreferrer">
                    PDF
                  </a>
                ) : null}
              </TableCell>
              <TableCell className="space-x-2">
                <Button size="sm" variant="teal" onClick={() => setTarget({ id: row.id, status: "approved" })}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTarget({ id: row.id, status: "pending_review" })}>
                  Pending
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setTarget({ id: row.id, status: "rejected" })}>
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <AlertDialog open={Boolean(target)} onOpenChange={() => setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {target?.status === "approved"
                ? "Approve this entry?"
                : target?.status === "pending_review"
                  ? "Return this entry to pending review?"
                  : "Reject this entry?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This changes public visibility. Approved work appears in the gallery. Pending and rejected
              entries stay private. Rejection reasons are visible only to the participant and organizers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {target?.status === "rejected" ? (
            <Textarea
              placeholder="Internal rejection reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                if (!target) return;
                start(async () => {
                  const result = await moderateSubmissionAction({
                    submissionId: target.id,
                    status: target.status,
                    rejectionReason: reason,
                  });
                  if (!result.ok) setError(result.error);
                });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
