import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PaginationBar({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link href={hrefFor(Math.max(1, page - 1))} aria-disabled={page <= 1}>
          Previous
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </p>
      <Button variant="outline" size="sm" asChild disabled={page >= pages}>
        <Link href={hrefFor(Math.min(pages, page + 1))}>Next</Link>
      </Button>
    </nav>
  );
}
