import { NextResponse } from "next/server";
import { callGateway } from "@/lib/llm/gateway";

// Server-only route. All client-initiated clinical LLM calls land here.
// Auth enforcement is intentionally minimal in this first cut — the dev
// sandbox runs unauthenticated so we can exercise the gateway end-to-end.
// Production gating moves in alongside the patient/clinician auth feature.

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const response = await callGateway(body);
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Gateway error",
      },
      { status: 400 },
    );
  }
}
