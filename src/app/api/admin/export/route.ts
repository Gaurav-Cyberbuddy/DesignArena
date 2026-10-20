import { NextResponse } from "next/server";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export async function GET() {
  await connection();
  try {
    await requireAdmin();
    const admin = createAdminSupabase();
    const { data: submissions } = await admin
      .from("submissions")
      .select("entry_code, title, status, contest_id, created_at, contests(name, slug)")
      .order("created_at", { ascending: true });
    const { data: votes } = await admin
      .from("votes")
      .select("contest_id, submission_id, created_at, submissions(entry_code, title)");
    function relation<T>(value: T | T[] | null | undefined): T | null {
      if (!value) return null;
      return Array.isArray(value) ? (value[0] ?? null) : value;
    }

    const lines = [
      "type,contest,entry_code,title,status,created_at",
      ...(submissions ?? []).map((row) => {
        const contest = relation(row.contests as { name: string } | { name: string }[] | null);
        return [
          "submission",
          csvEscape(contest?.name),
          csvEscape(row.entry_code),
          csvEscape(row.title),
          csvEscape(row.status),
          csvEscape(row.created_at),
        ].join(",");
      }),
      ...(votes ?? []).map((row) => {
        const submission = relation(
          row.submissions as { entry_code: string; title: string } | { entry_code: string; title: string }[] | null,
        );
        return [
          "vote",
          csvEscape(row.contest_id),
          csvEscape(submission?.entry_code),
          csvEscape(submission?.title),
          "cast",
          csvEscape(row.created_at),
        ].join(",");
      }),
    ];

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=designarena-export.csv",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
}
