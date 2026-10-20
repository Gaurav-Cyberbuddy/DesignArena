import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Page not found</h1>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
