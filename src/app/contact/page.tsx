export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-display text-4xl">Contact</h1>
      <p className="text-muted-foreground">
        Questions about briefs, deadlines, or accessibility:{" "}
        <a className="text-primary" href="mailto:hello@designarena.local">
          hello@designarena.local
        </a>
      </p>
    </div>
  );
}
