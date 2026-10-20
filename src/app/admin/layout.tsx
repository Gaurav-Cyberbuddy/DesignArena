import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getAdminContext();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin) {
    return (
      <div className="rounded-2xl border bg-card p-8">
        <h1 className="font-display text-2xl">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Organizer access is granted only to emails listed in the server-side ADMIN_EMAILS configuration.
        </p>
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/submissions", label: "Submissions" },
    { href: "/admin/contests", label: "Contests" },
    { href: "/admin/voting", label: "Voting" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-teal">Organizer</p>
        <h1 className="font-display text-4xl">Admin dashboard</h1>
      </div>
      <nav className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-full border bg-card px-4 py-2 text-sm">
            {link.label}
          </Link>
        ))}
        <a href="/api/admin/export" className="rounded-full border bg-card px-4 py-2 text-sm">
          Export CSV
        </a>
      </nav>
      {children}
    </div>
  );
}
