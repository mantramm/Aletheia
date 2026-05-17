import "../../env";
import { NextResponse } from "next/server";
import { syncCRM } from "@aletheia/worker/lib/syncCRM";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function POST() {
  const start = Date.now();
  try {
    await syncCRM();
    const state = await assembleState();
    console.log(`[POST /api/demo/sync-crm] Done in ${Date.now() - start}ms`);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("[POST /api/demo/sync-crm] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
