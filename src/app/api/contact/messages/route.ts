import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SUBJECT_MAX_LENGTH = 150;
const CONTENT_MAX_LENGTH = 4000;

type SubmitMessageBody = {
  subject?: string;
  content?: string;
};

function getDisplayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}): string {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;
  const name =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null;

  return (
    fullName?.trim() ||
    name?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    "משתמש"
  );
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubmitMessageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = body.subject?.trim() ?? "";
  const content = body.content?.trim() ?? "";

  if (!subject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  if (subject.length > SUBJECT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `subject must be at most ${SUBJECT_MAX_LENGTH} characters` },
      { status: 400 },
    );
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `content must be at most ${CONTENT_MAX_LENGTH} characters` },
      { status: 400 },
    );
  }

  const senderName = getDisplayName(user);
  const senderEmail = user.email?.trim();

  if (!senderEmail) {
    return NextResponse.json(
      { error: "Signed-in user does not have an email" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      sender_name: senderName,
      sender_email: senderEmail,
      subject,
      content,
      status: "unread",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messageId: data.id }, { status: 201 });
}
