import "../../env";
import { NextResponse } from "next/server";
import { generateTruthBrief } from "@aletheia/worker/lib/generateTruthBrief";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function POST() {
  const start = Date.now();
  try {
    await generateTruthBrief();
    const state = await assembleState();
    console.log(`[POST /api/demo/generate-brief] Done in ${Date.now() - start}ms`);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("[POST /api/demo/generate-brief] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
