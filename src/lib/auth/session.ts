import { cache } from "react";
import { isAdminEmail } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Sign in required.");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) {
    throw new Error("Administrator access required.");
  }
  return user;
}

export async function getAdminContext() {
  const user = await getSessionUser();
  return {
    user,
    isAdmin: isAdminEmail(user?.email),
  };
}
