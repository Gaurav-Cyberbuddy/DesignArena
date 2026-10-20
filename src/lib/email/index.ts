type EmailKind =
  | "submission_received"
  | "submission_approved"
  | "submission_rejected"
  | "voting_confirmation";

type EmailPayload = {
  to: string;
  kind: EmailKind;
  entryCode?: string;
  contestName?: string;
  title?: string;
};

function compose(payload: EmailPayload) {
  switch (payload.kind) {
    case "submission_received":
      return {
        subject: `We received ${payload.entryCode ?? "your entry"}`,
        text: `Your design “${payload.title}” for ${payload.contestName} is in review. Entry ID: ${payload.entryCode}.`,
      };
    case "submission_approved":
      return {
        subject: `${payload.entryCode} is approved`,
        text: `“${payload.title}” is now in the public gallery for ${payload.contestName}.`,
      };
    case "submission_rejected":
      return {
        subject: `Update on ${payload.entryCode}`,
        text: `“${payload.title}” was not approved for ${payload.contestName}. Sign in to view the organizer note.`,
      };
    case "voting_confirmation":
      return {
        subject: "Your DesignArena votes are recorded",
        text: "Your ballot has been saved. Vote totals stay hidden until the organizer publishes results.",
      };
  }
}

export type EmailResult = { sent: boolean; reason?: string };

export async function sendAppEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { sent: false, reason: "Email delivery is not configured." };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const message = compose(payload);
    const { error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: message.subject,
      text: message.text,
    });
    if (error) return { sent: false, reason: "Email provider rejected the message." };
    return { sent: true };
  } catch {
    return { sent: false, reason: "Email delivery failed." };
  }
}
