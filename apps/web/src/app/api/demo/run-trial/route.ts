import "../../env";
import { NextResponse } from "next/server";
import { putCompanyOnTrial } from "@aletheia/worker/lib/putCompanyOnTrial";
import { generateTruthBrief } from "@aletheia/worker/lib/generateTruthBrief";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function POST() {
  const start = Date.now();
  try {
    const trial = await putCompanyOnTrial();
    await generateTruthBrief();
    const state = await assembleState();
    const stateWithTrial = { ...state, trial };
    console.log(`[POST /api/demo/run-trial] Done in ${Date.now() - start}ms`);
    return NextResponse.json(stateWithTrial);
  } catch (err: any) {
    console.error("[POST /api/demo/run-trial] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
