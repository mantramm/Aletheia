import "../../env";
import { NextResponse } from "next/server";
import { githubPrMerged } from "@aletheia/worker/lib/githubPrMerged";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function POST() {
  const start = Date.now();
  try {
    await githubPrMerged();
    const state = await assembleState();
    const elapsed = Date.now() - start;
    console.log(`[POST /api/demo/trigger-pr] Done in ${elapsed}ms`);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("[POST /api/demo/trigger-pr] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
