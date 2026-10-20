"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/contests", label: "Contests" },
  { href: "/gallery", label: "Gallery" },
  { href: "/vote", label: "Vote" },
  { href: "/results", label: "Results" },
  { href: "/submit", label: "Submit" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open ? (
        <nav className="absolute left-0 right-0 top-16 border-b bg-background px-4 py-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
