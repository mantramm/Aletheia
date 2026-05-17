import * as path from "path";
import * as fs from "fs";
import { createRawSignal, createEvidenceReceipt } from "./notion-writes";
import { getNotionClient, getSeedClaimId } from "./notion-client";
import { runAuditWorkflow } from "./auditWorkflow";

export type GithubPrPayload = {
  id: string;
  number: number;
  title: string;
  body: string;
  merged_at: string;
  files_changed: string[];
  author: string;
  base_branch: string;
};

type GithubPrMergedOptions = {
  notion?: ReturnType<typeof getNotionClient>;
  claimId?: string;
};

export async function githubPrMerged(
  payload?: GithubPrPayload,
  options?: GithubPrMergedOptions,
): Promise<void> {
  const demoPath = path.resolve(process.cwd(), "../../data/demo/github-pr.json");
  const pr = payload ?? JSON.parse(fs.readFileSync(demoPath, "utf-8"));
  const notion = options?.notion ?? getNotionClient();
  const claimId = options?.claimId ?? getSeedClaimId();

  await createRawSignal({
    source: "github",
    type: "pr_merged",
    label: `PR #${pr.number}: ${pr.title}`,
    summary: pr.body,
    timestamp: pr.merged_at,
    severity: "high",
  }, { notion, claimId });

  await createEvidenceReceipt({
    source: "github",
    title: `GitHub PR #${pr.number} — ${pr.title}`,
    summary: `${pr.body}. Files changed: ${pr.files_changed.join(", ")}`,
    severity: "high",
    timestamp: pr.merged_at,
  }, { notion, claimId });

  await runAuditWorkflow(claimId, { notion });
}
