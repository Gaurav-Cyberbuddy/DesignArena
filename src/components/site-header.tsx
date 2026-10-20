import Link from "next/link";
import { getAdminContext } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/contests", label: "Contests" },
  { href: "/gallery", label: "Gallery" },
  { href: "/vote", label: "Vote" },
  { href: "/results", label: "Results" },
  { href: "/submit", label: "Submit" },
];

export async function SiteHeader() {
  const { user, isAdmin } = await getAdminContext();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md relative">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-lg tracking-tight">
          DesignArena
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <MobileNav />
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/my-submissions">My work</Link>
              </Button>
              {isAdmin ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <SignOutButton />
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
