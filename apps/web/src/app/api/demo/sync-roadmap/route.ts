import "../../env";
import { NextResponse } from "next/server";
import { syncRoadmap } from "@aletheia/worker/lib/syncRoadmap";
import { assembleState } from "@aletheia/worker/lib/assembleState";

export async function POST() {
  const start = Date.now();
  try {
    await syncRoadmap();
    const state = await assembleState();
    console.log(`[POST /api/demo/sync-roadmap] Done in ${Date.now() - start}ms`);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("[POST /api/demo/sync-roadmap] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
