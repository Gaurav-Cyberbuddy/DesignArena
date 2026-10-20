/**
 * Development-only sample entries. Never runs automatically in production.
 *
 *   npm run seed:dev
 *
 * Requires local .env.local with Supabase URL + service role key.
 * Created designs are labeled [SAMPLE] and should be deleted before a live contest.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local is optional when the variables are already exported.
  }
}

loadLocalEnv();

const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Refusing to seed demo entries in production.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = "demo-participant@designarena.local";
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: "Sample Studio" },
  });
  if (userError && !/already/i.test(userError.message)) {
    throw userError;
  }

  const { data: users } = await admin.auth.admin.listUsers();
  const user = created.user ?? users.users.find((item) => item.email === email);
  if (!user) throw new Error("Could not create or find the demo participant.");

  const { data: contests, error: contestError } = await admin.from("contests").select("*").order("code_prefix");
  if (contestError || !contests?.length) {
    throw new Error("Apply migrations so the three contests exist before seeding.");
  }

  for (const contest of contests) {
    const submissionId = crypto.randomUUID();
    const path = `${contest.id}/${user.id}/${submissionId}/primary.png`;
    const { error: uploadError } = await admin.storage.from("design-files").upload(path, PNG, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { error: insertError } = await admin.from("submissions").insert({
      id: submissionId,
      contest_id: contest.id,
      participant_id: user.id,
      title: `[SAMPLE] ${contest.name} study`,
      description:
        "Sample content for local gallery testing. This entry is labeled SAMPLE and is not part of a live competition.",
      primary_file_path: path,
      status: "approved",
    });
    if (insertError && !/duplicate/i.test(insertError.message)) throw insertError;
  }

  console.log("Seeded labeled [SAMPLE] entries for each contest. Delete them before going live.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
