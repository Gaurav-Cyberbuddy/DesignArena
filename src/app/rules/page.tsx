export const metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <article className="prose prose-neutral max-w-3xl">
      <h1 className="font-display text-4xl">Competition rules</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Work must be original. One primary image per submission. Supporting PDFs are optional.</p>
        <p>Submissions are private until an organizer approves them. Rejected work never appears in the gallery.</p>
        <p>
          Voting requires a verified email account. Each account may vote once per contest. This reduces
          duplicate ballots but cannot guarantee one real-world person per account.
        </p>
        <p>You cannot vote for your own entry. Votes cannot be changed unless the organizer enables that option.</p>
        <p>If first place is tied on verified votes, the published results will show a tie.</p>
      </div>
    </article>
  );
}
