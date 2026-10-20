import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg">DesignArena</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A curated competition for original design work. One gallery. Three contests. Public voting with verified
            accounts.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Competition</p>
          <div className="mt-3 flex flex-col gap-2 text-muted-foreground">
            <Link href="/rules">Rules</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/results">Results</Link>
            <Link href="/submit">Submit</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium">Organization</p>
          <div className="mt-3 flex flex-col gap-2 text-muted-foreground">
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/contact">Contact</Link>
            <a href="mailto:hello@designarena.local">hello@designarena.local</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
