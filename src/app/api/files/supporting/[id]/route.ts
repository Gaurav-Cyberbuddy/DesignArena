import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const admin = createAdminSupabase();
    const { data: submission } = await admin
      .from("submissions")
      .select("id, status, participant_id, supporting_file_path")
      .eq("id", id)
      .maybeSingle();
    if (!submission?.supporting_file_path) {
      return NextResponse.json({ error: "No supporting file" }, { status: 404 });
    }

    const { user, isAdmin } = await getAdminContext();
    const allowed =
      submission.status === "approved" ||
      isAdmin ||
      user?.id === submission.participant_id;
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await admin.storage.from("design-files").download(submission.supporting_file_path);
    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=supporting.pdf",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
