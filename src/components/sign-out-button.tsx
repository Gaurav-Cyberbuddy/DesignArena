"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const supabase = createBrowserSupabase();
        await supabase.auth.signOut();
        router.refresh();
        router.push("/");
      }}
    >
      Sign out
    </Button>
  );
}
