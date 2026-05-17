import { z } from "zod";
import { DEMO_CLAIMS, CORE_DEMO_SIGNALS, DEMO_SCENARIO } from "./demo-data";
import { getNotionClient } from "./notion-client";
import {
  archiveCoreDemo,
  createApproval,
  createCompanyClaim,
  createConcept,
  createEvidenceReceipt,
  createRawSignal,
  createTruthBrief,
  notionPageUrl,
} from "./notion-writes";
import { clearLog } from "./syncLog";

const SeedScenarioSchema = z.enum([DEMO_SCENARIO]);

type NotionClient = ReturnType<typeof getNotionClient>;

export type SeedDemoResult = {
  scenario: typeof DEMO_SCENARIO;
  archivedPages: number;
  claimIds: Record<string, string>;
  signalCount: number;
  evidenceCount: number;
  approvalCount: number;
  truthBriefId: string;
};

export async function resetAndSeedDemo(input: {
  scenario: string;
}, options?: {
  notion?: NotionClient;
}): Promise<SeedDemoResult> {
  SeedScenarioSchema.parse(input.scenario);
  const notion = options?.notion ?? getNotionClient();

  clearLog();
  const archivedPages = await archiveCoreDemo({ notion });
  const claimIds: Record<string, string> = {};

  for (const claim of DEMO_CLAIMS) {
    const claimId = await createCompanyClaim({
      text: claim.title,
      status: "green",
      verdict: "unclear",
    }, { notion });
    claimIds[claim.key] = claimId;

    await createConcept({
      title: claim.concept,
      stage: "needs_decision",
      supportingSignalIds: [],
      relatedClaimId: claimId,
    }, { notion });
  }

  let signalCount = 0;
  let evidenceCount = 0;
  let approvalCount = 0;

  for (const signal of CORE_DEMO_SIGNALS) {
    const claimId = claimIds[signal.claimKey];
    if (!claimId) continue;

    const rawSignalId = await createRawSignal({
      source: signal.source,
      type: signal.type,
      label: signal.label,
      summary: signal.summary,
      timestamp: signal.timestamp,
      severity: signal.severity,
    }, { notion, claimId });
    signalCount++;

    const evidenceId = await createEvidenceReceipt({
      source: signal.source,
      title: signal.evidenceTitle,
      summary: `${signal.evidenceSummary} Raw Signal: ${rawSignalId}`,
      severity: signal.severity,
      timestamp: signal.timestamp,
      sourceUrl: notionPageUrl(rawSignalId),
    }, { notion, claimId });
    evidenceCount++;

    if (signal.approvalAction) {
      await createApproval(signal.approvalAction, signal.severity, [evidenceId], { notion });
      approvalCount++;
    }
  }

  const truthBriefId = await createTruthBrief({
    summary: "Mosaic Labs May beta truth brief: three claims seeded for audit.",
    topRisks: [
      "Activation is 27% against a 40% beta target.",
      "Workspace invite failures are blocking design partners.",
      "Trust and security materials are stale while SSO remains Q3.",
    ],
    pendingApprovals: [
      "Move May Beta Readiness to at-risk.",
      "Escalate PR #417 before activation sprint sign-off.",
      "Send security readiness update to design partners.",
    ],
    verdict: "unclear",
  }, { notion });

  return {
    scenario: DEMO_SCENARIO,
    archivedPages,
    claimIds,
    signalCount,
    evidenceCount,
    approvalCount,
    truthBriefId,
  };
}
