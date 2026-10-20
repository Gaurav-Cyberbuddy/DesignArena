export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
      <h1 className="font-display text-4xl text-foreground">Privacy policy</h1>
      <p>
        We store your email for authentication, your submissions, and your votes. Public pages show only
        approved designs: image, entry ID, title, description, and optional prototype link.
      </p>
      <p>
        Participant emails, account identifiers, pending work, rejection notes, and individual ballots are
        not shown on public pages. Organizers can inspect participant information for moderation.
      </p>
      <p>Magic-link emails are sent by Supabase Auth. Optional application emails use Resend when configured.</p>
    </article>
  );
}
