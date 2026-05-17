import type { RuleViolation } from "./types";
import { getNotionClient, DB_IDS, notionRead } from "./notion-client";
import { runTruthAudit } from "./runTruthAudit";
import { generateTruthDiff } from "./generateTruthDiff";
import { generateTruthBrief } from "./generateTruthBrief";
import { createApproval, createEvidenceReceipt, notionPageUrl } from "./notion-writes";

type NotionClient = ReturnType<typeof getNotionClient>;

export type AuditWorkflowResult = {
  claimId: string;
  claimText: string;
  verdict: "true" | "contradicted" | "unclear";
  violationCount: number;
  evidenceIds: string[];
  approvalIds: string[];
  truthBriefId: string;
};

export async function runAuditWorkflow(claimId: string, options?: {
  notion?: NotionClient;
}): Promise<AuditWorkflowResult> {
  const notion = options?.notion ?? getNotionClient();
  const { violations, claimText } = await runTruthAudit(claimId, { notion });
  const evidenceIds = await evidenceIdsForClaim(claimId, { notion });
  const ensuredEvidenceIds = evidenceIds.length
    ? evidenceIds
    : await createViolationEvidence(claimId, violations, { notion });

  await generateTruthDiff(claimId, claimText, violations, ensuredEvidenceIds, { notion });

  const approvalIds: string[] = [];
  const highViolation = violations.find((violation) => violation.severity === "high");
  if (highViolation) {
    const approvalId = await createApproval(
      `Review truth diff for ${claimText}`,
      highViolation.severity,
      ensuredEvidenceIds,
      { notion },
    );
    approvalIds.push(approvalId);
  }

  const truthBriefId = await generateTruthBrief(claimId, { notion });
  return {
    claimId,
    claimText,
    verdict: violations.some((violation) => violation.severity === "high")
      ? "contradicted"
      : violations.length
        ? "unclear"
        : "true",
    violationCount: violations.length,
    evidenceIds: ensuredEvidenceIds,
    approvalIds,
    truthBriefId,
  };
}

async function evidenceIdsForClaim(claimId: string, options: {
  notion: NotionClient;
}): Promise<string[]> {
  const result = await notionRead(() =>
    options.notion.databases.query({
      database_id: DB_IDS.evidenceReceipts,
      filter: {
        property: "Related Claim",
        rich_text: { contains: claimId },
      },
      page_size: 50,
    })
  );
  return result.results.map((page) => page.id);
}

async function createViolationEvidence(claimId: string, violations: RuleViolation[], options: {
  notion: NotionClient;
}): Promise<string[]> {
  const ids: string[] = [];
  for (const violation of violations.slice(0, 5)) {
    const id = await createEvidenceReceipt({
      source: "notion",
      title: violation.rule,
      summary: violation.detail,
      severity: violation.severity,
      timestamp: new Date().toISOString(),
      sourceUrl: notionPageUrl(claimId),
    }, { notion: options.notion, claimId });
    ids.push(id);
  }
  return ids;
}
