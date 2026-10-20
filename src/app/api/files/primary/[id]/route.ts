import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/session";
import { canAccessSubmissionFile, isSubmissionId } from "@/lib/files";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSubmissionId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const admin = createAdminSupabase();
    const { data: submission } = await admin
      .from("submissions")
      .select("id, status, participant_id, primary_file_path")
      .eq("id", id)
      .maybeSingle();
    if (!submission?.primary_file_path) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { user, isAdmin } = await getAdminContext();
    const allowed = canAccessSubmissionFile({
      status: submission.status,
      participantId: submission.participant_id,
      viewerId: user?.id,
      isAdmin,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await admin.storage.from("design-files").download(submission.primary_file_path);
    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cache = submission.status === "approved" ? "public, max-age=300" : "private, no-store";
    const buffer = Buffer.from(await data.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": data.type || "image/jpeg",
        "Cache-Control": cache,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
