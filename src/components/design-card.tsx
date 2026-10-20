"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Contest, GalleryEntry } from "@/lib/types";
import { contestPhase } from "@/lib/contests";

export function DesignCard({
  entry,
  contest,
  selectable,
  selected,
  onSelect,
  voteLocked,
}: {
  entry: GalleryEntry;
  contest?: Contest;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  voteLocked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const phase = contest ? contestPhase(contest) : null;
  const imageSrc = `/api/files/primary/${entry.id}`;

  return (
    <>
      <Card className={`overflow-hidden ${selected ? "ring-2 ring-primary" : ""}`}>
        <button type="button" className="block w-full text-left" onClick={() => setOpen(true)}>
          <div className="relative aspect-[4/3] bg-muted">
            <Image
              src={imageSrc}
              alt={entry.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </button>
        <div className="space-y-2 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{entry.entry_code}</p>
          <h3 className="font-display text-lg leading-tight">{entry.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{entry.description}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              Preview
            </Button>
            {selectable && onSelect ? (
              <Button
                size="sm"
                variant={selected ? "default" : "teal"}
                onClick={onSelect}
                disabled={voteLocked}
              >
                {voteLocked ? "Recorded" : selected ? "Selected" : "Vote"}
              </Button>
            ) : selectable ? (
              <Button size="sm" variant="teal" asChild>
                <Link href="/vote">Vote</Link>
              </Button>
            ) : null}
          </div>
          {phase && !phase.canVote && selectable ? (
            <p className="text-xs text-muted-foreground">This contest is not accepting votes.</p>
          ) : null}
        </div>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {entry.title} · {entry.entry_code}
            </DialogTitle>
            <DialogDescription>{entry.description}</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <Image src={imageSrc} alt={entry.title} fill unoptimized className="object-contain" sizes="800px" />
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.prototype_url ? (
              <Button asChild variant="outline" size="sm">
                <a href={entry.prototype_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Prototype
                </a>
              </Button>
            ) : null}
            {entry.has_supporting_file ? (
              <Button asChild variant="outline" size="sm">
                <a href={`/api/files/supporting/${entry.id}`} rel="noopener noreferrer">
                  <FileText className="h-4 w-4" />
                  Supporting file
                </a>
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
