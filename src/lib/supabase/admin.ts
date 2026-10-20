import { unstable_noStore as noStore } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getServiceRoleConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  return { url, key, configured: Boolean(url && key) };
}

function optOutOfStaticRendering() {
  try {
    noStore();
  } catch {
    // Unit tests and CLI scripts are not inside a Next.js render.
  }
}

/**
 * Service-role client. Server-only. Call this inside a request, Server Action,
 * or Route Handler after authorization — never at module import time.
 * Bypasses RLS only after ADMIN_EMAILS (or other application checks) have
 * already authorized the caller.
 */
export function createAdminSupabase(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("The service-role client cannot run in the browser.");
  }

  optOutOfStaticRendering();

  const { url, key, configured } = getServiceRoleConfig();
  if (!configured) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. Privileged operations need these server environment variables at runtime.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
