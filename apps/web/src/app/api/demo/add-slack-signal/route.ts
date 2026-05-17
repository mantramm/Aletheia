import "../../env";
import { NextResponse } from "next/server";
import { syncSlackSignals } from "@aletheia/worker/lib/syncSlackSignals";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function POST() {
  const start = Date.now();
  try {
    await syncSlackSignals();
    const state = await assembleState();
    console.log(`[POST /api/demo/add-slack-signal] Done in ${Date.now() - start}ms`);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("[POST /api/demo/add-slack-signal] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
