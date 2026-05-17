import * as path from "path";
import * as fs from "fs";
import { createRawSignal, createEvidenceReceipt } from "./notion-writes";
import { runTruthAudit } from "./runTruthAudit";
import { generateTruthDiff } from "./generateTruthDiff";
import { getSeedClaimId } from "./notion-client";

export async function syncRoadmap(): Promise<void> {
  const demoPath = path.resolve(process.cwd(), "../../data/demo/roadmap.json");
  const data = JSON.parse(fs.readFileSync(demoPath, "utf-8"));

  const ssoItem = data.items.find((i: any) => i.id === "rm-sso");
  const launchItem = data.items.find((i: any) => i.id === "rm-may-beta");

  await createRawSignal({
    source: "roadmap",
    type: "dependency_conflict",
    label: "SSO vs May Beta",
    summary: `May Beta scheduled ${launchItem.target_date} depends on SSO direction (target: ${ssoItem.target_quarter}, ${ssoItem.target_date}). Marketing is live but SSO will not ship until after beta.`,
    timestamp: new Date().toISOString(),
    severity: "high",
  });

  const evidenceId = await createEvidenceReceipt({
    source: "roadmap",
    title: "SSO vs May Beta - dependency conflict",
    summary: `Launch date ${launchItem.target_date} requires SSO, but SSO target is ${ssoItem.target_date} (${ssoItem.target_quarter}). Marketing already live: ${launchItem.marketing_live}.`,
    severity: "high",
    timestamp: new Date().toISOString(),
  });

  const { violations, claimText } = await runTruthAudit();

  await generateTruthDiff(
    getSeedClaimId(),
    claimText,
    violations,
    [evidenceId]
  );
}
