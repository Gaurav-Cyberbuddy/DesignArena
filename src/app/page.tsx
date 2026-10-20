import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Vote } from "lucide-react";
import { ContestCard } from "@/components/contest-card";
import { DesignCard } from "@/components/design-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { contestPhase, earliestDeadline } from "@/lib/contests";
import { listPublicContests } from "@/lib/data/contests";
import { listFeaturedEntries } from "@/lib/data/submissions";
import type { Contest, GalleryEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  let contests: Contest[] = [];
  let featured: GalleryEntry[] = [];
  try {
    contests = await listPublicContests();
    featured = await listFeaturedEntries(6);
  } catch {
    contests = [];
    featured = [];
  }
  const deadline = earliestDeadline(contests);
  const votingOpen = contests.some((c) => contestPhase(c).canVote);

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
        <div className="animate-fade-up space-y-6">
          <p className="text-sm uppercase tracking-[0.2em] text-teal">Annual design competition</p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Your Creativity. Your Competition.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Submit original work to three curated contests, wait for organizer review, then vote for your
            favorites. One account. One vote per contest.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/submit">
                Submit a design <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/gallery">Explore the gallery</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {votingOpen
              ? "Voting is open now."
              : deadline
                ? `Next deadline: ${formatDate(deadline)}`
                : "Contest dates will be announced by the organizer."}
          </p>
        </div>
        <div className="editorial-shadow overflow-hidden rounded-3xl border bg-card">
          <div className="aspect-[4/3] bg-[linear-gradient(135deg,#3b2a86_0%,#2a8a7e_55%,#f4efe6_55%)] p-8 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Showcase</p>
            <p className="mt-6 font-display text-4xl leading-tight">Three briefs. One gallery.</p>
            <p className="mt-4 max-w-sm text-sm text-white/85">
              Approved work lives in a single public gallery. Unpublished totals stay hidden until results
              are certified.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl">The contests</h2>
          <Link href="/contests" className="text-sm text-primary">
            View all
          </Link>
        </div>
        {contests.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {contests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Contests are being prepared"
            description="Once the organizer publishes the three briefs, they will appear here."
          />
        )}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-3xl">Featured approved work</h2>
        {featured.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((entry) => (
              <DesignCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="The gallery is still empty"
            description="Approved designs will be featured here after review."
          />
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { icon: CheckCircle2, title: "Submit", body: "Sign in with email, upload your primary image, and receive an entry ID." },
          { icon: Shield, title: "Get approved", body: "Organizers review each entry. Only approved work appears in the public gallery." },
          { icon: Vote, title: "Vote", body: "Choose one favorite in each contest. Totals stay private until results are published." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border bg-card p-6">
            <item.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-display text-xl">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
