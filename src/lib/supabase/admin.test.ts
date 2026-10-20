import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

describe("service-role client initialization", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    vi.resetModules();
  });

  it("can be imported without credentials", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const mod = await import("@/lib/supabase/admin");
    expect(mod.getServiceRoleConfig().configured).toBe(false);
  });

  it("throws a clear error only when a privileged client is requested", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createAdminSupabase } = await import("@/lib/supabase/admin");
    expect(() => createAdminSupabase()).toThrow(
      /Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("does not treat a public anon key as sufficient", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { getServiceRoleConfig, createAdminSupabase } = await import("@/lib/supabase/admin");
    expect(getServiceRoleConfig().configured).toBe(false);
    expect(() => createAdminSupabase()).toThrow(/Privileged operations need these server environment variables/);
  });
});
