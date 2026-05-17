import "../../env";
import { NextResponse } from "next/server";
import { resetDemo } from "@aletheia/worker/lib/resetDemo";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function POST() {
  const start = Date.now();
  try {
    await resetDemo();
    const state = await assembleState();
    console.log(`[POST /api/demo/reset] Done in ${Date.now() - start}ms`);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("[POST /api/demo/reset] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
