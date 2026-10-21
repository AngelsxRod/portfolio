import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const apiUrl = process.env.API_URL || "http://localhost:3001";

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/message/${encodeURIComponent(name)}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "API unavailable" }, { status: 502 });
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "API unavailable" }, { status: 502 });
  }
}
