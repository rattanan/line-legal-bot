import { NextResponse, NextRequest } from "next/server";
import { getChatHistory } from "@/lib/chat-log";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 20;

  if (!userId) {
    return NextResponse.json({ error: "userId query param required" }, { status: 400 });
  }
  const history = await getChatHistory(userId, limit);
  return NextResponse.json(history);
}
