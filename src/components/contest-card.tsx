import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ContestStatusBadge } from "@/components/status-badge";
import { formatDateShort } from "@/lib/utils";
import type { Contest } from "@/lib/types";
import { contestPhase } from "@/lib/contests";

export function ContestCard({ contest }: { contest: Contest }) {
  const phase = contestPhase(contest);
  return (
    <Link href={`/contests/${contest.slug}`} className="group block">
      <Card className="overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
        <div className="relative aspect-[16/10] bg-muted">
          {contest.cover_image_url ? (
            contest.cover_image_url.endsWith(".svg") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contest.cover_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Image
                src={contest.cover_image_url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            )
          ) : null}
        </div>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl">{contest.name}</h3>
            <ContestStatusBadge status={contest.status} />
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">{contest.description}</p>
          <p className="text-xs text-muted-foreground">
            {phase.label} · Submissions until {formatDateShort(contest.submission_end)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
