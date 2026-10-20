"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { safeRedirectPath, siteUrl } from "@/lib/utils";

const emailSchema = z.string().trim().email().max(254);

export async function requestMagicLink(formData: FormData) {
  const headerList = await headers();
  const limited = rateLimit("auth", clientKey(headerList));
  if (!limited.ok) {
    return { ok: false as const, error: "Too many sign-in attempts. Try again later." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  const next = safeRedirectPath(String(formData.get("next") || "/"));
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { ok: false as const, error: "Unable to send a sign-in link right now." };
  }

  return { ok: true as const };
}
