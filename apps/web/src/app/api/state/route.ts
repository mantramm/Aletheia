import "../env";
import { NextResponse } from "next/server";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function GET() {
  try {
    const state = await assembleState();
    console.log("[GET /api/state] Zod validation passed");
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("[GET /api/state] Error:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
