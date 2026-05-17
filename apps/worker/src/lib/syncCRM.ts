import * as path from "path";
import * as fs from "fs";
import { createRawSignal, createEvidenceReceipt } from "./notion-writes";
import { runTruthAudit } from "./runTruthAudit";
import { generateTruthDiff } from "./generateTruthDiff";
import { getSeedClaimId } from "./notion-client";

export async function syncCRM(): Promise<void> {
  const demoPath = path.resolve(process.cwd(), "../../data/demo/crm-records.json");
  const data = JSON.parse(fs.readFileSync(demoPath, "utf-8"));
  const account = data.accounts[0];

  await createRawSignal({
    source: "crm",
    type: "renewal_at_risk",
    label: account.name,
    summary: `$${(account.arr / 1000).toFixed(0)}k renewal at risk. Requires: ${account.requirements.join(", ")}. Renewal date: ${account.renewal_date}`,
    timestamp: new Date().toISOString(),
    severity: "high",
  });

  const evidenceId = await createEvidenceReceipt({
    source: "crm",
    title: `${account.name} — $${(account.arr / 1000).toFixed(0)}k renewal at risk`,
    summary: `${account.name} renewal on ${account.renewal_date}. Requires ${account.requirements.join(", ")}. Status: ${account.status}. CSM: ${account.csm}`,
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
