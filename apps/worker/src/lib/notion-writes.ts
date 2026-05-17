import type { Signal } from "./types";
import { getNotionClient, DB_IDS, notionWrite, getSeedClaimId } from "./notion-client";
import { pushLog } from "./syncLog";

type NotionClient = ReturnType<typeof getNotionClient>;

type WriteOptions = {
  notion?: NotionClient;
  claimId?: string;
};

function clientFromOptions(options?: WriteOptions): NotionClient {
  return options?.notion ?? getNotionClient();
}

function pageUrl(pageId: string): string {
  return `https://notion.so/${pageId.replace(/-/g, "")}`;
}

export async function createRawSignal(
  signal: Omit<Signal, "id">,
  options?: WriteOptions
): Promise<string> {
  const notion = clientFromOptions(options);
  const page = await notionWrite(() =>
    notion.pages.create({
      parent: { database_id: DB_IDS.rawSignals },
      properties: {
        Name: { title: [{ text: { content: signal.label } }] },
        Source: { select: { name: signal.source } },
        Type: { rich_text: [{ text: { content: signal.type } }] },
        Entity: { rich_text: [{ text: { content: signal.label } }] },
        Summary: { rich_text: [{ text: { content: signal.summary } }] },
        Severity: { select: { name: signal.severity } },
        Timestamp: { date: { start: signal.timestamp } },
        Processed: { checkbox: true },
      },
    })
  );
  pushLog(`Raw Signal created: ${signal.label}`, "done");
  return page.id;
}

export async function createEvidenceReceipt(receipt: {
  source: Signal["source"];
  title: string;
  summary: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
  sourceUrl?: string;
}, options?: WriteOptions): Promise<string> {
  const notion = clientFromOptions(options);
  const claimId = options?.claimId ?? getSeedClaimId();
  const page = await notionWrite(() =>
    notion.pages.create({
      parent: { database_id: DB_IDS.evidenceReceipts },
      properties: {
        Title: { title: [{ text: { content: receipt.title } }] },
        Source: { select: { name: receipt.source } },
        Summary: { rich_text: [{ text: { content: receipt.summary } }] },
        Severity: { select: { name: receipt.severity } },
        Timestamp: { date: { start: receipt.timestamp } },
        "Source URL": receipt.sourceUrl ? { url: receipt.sourceUrl } : { url: null },
        "Related Claim": { rich_text: [{ text: { content: claimId } }] },
      },
    })
  );
  pushLog(`Evidence Receipt created: ${receipt.title}`, "done");
  return page.id;
}

export async function createApproval(
  action: string,
  riskLevel: "low" | "medium" | "high",
  evidenceIds: string[],
  options?: WriteOptions
): Promise<string> {
  const notion = clientFromOptions(options);
  const page = await notionWrite(() =>
    notion.pages.create({
      parent: { database_id: DB_IDS.approvals },
      properties: {
        Action: { title: [{ text: { content: action } }] },
        Type: { rich_text: [{ text: { content: "action_required" } }] },
        "Risk Level": { select: { name: riskLevel } },
        Draft: { rich_text: [] },
        Evidence: {
          rich_text: [{ text: { content: evidenceIds.join(", ") } }],
        },
        Status: { select: { name: "needs_approval" } },
      },
    })
  );
  pushLog(`Approval created: ${action}`, "done");
  return page.id;
}

export async function updateClaimStatus(
  verdict: "true" | "contradicted" | "unclear",
  status: "green" | "yellow" | "red",
  options?: WriteOptions
): Promise<void> {
  const notion = clientFromOptions(options);
  const claimId = options?.claimId ?? getSeedClaimId();
  await notionWrite(() =>
    notion.pages.update({
      page_id: claimId,
      properties: {
        Verdict: { select: { name: verdict } },
        Status: { select: { name: status } },
        "Last Checked": { date: { start: new Date().toISOString() } },
      },
    })
  );
  pushLog(`Claim updated: verdict=${verdict}, status=${status}`, "done");
}

export async function writeTruthDiff(diff: {
  claimText: string;
  beliefLines: string[];
  realityLines: string[];
  verdict: "true" | "contradicted" | "unclear";
  evidenceReceiptIds: string[];
  recommendedActions: string[];
}, options?: WriteOptions): Promise<string> {
  const notion = clientFromOptions(options);
  const page = await notionWrite(() =>
    notion.pages.create({
      parent: { database_id: DB_IDS.truthDiffs },
      properties: {
        Claim: { title: [{ text: { content: diff.claimText } }] },
        "Belief Lines": {
          rich_text: [{ text: { content: diff.beliefLines.join("\n") } }],
        },
        "Reality Lines": {
          rich_text: [{ text: { content: diff.realityLines.join("\n") } }],
        },
        Verdict: { select: { name: diff.verdict } },
        "Evidence Receipts": {
          rich_text: [
            { text: { content: diff.evidenceReceiptIds.join(", ") } },
          ],
        },
        "Recommended Actions": {
          rich_text: [
            { text: { content: diff.recommendedActions.join("\n") } },
          ],
        },
        Status: { select: { name: "current" } },
      },
    })
  );
  pushLog("Truth Diff written to Notion", "done");
  if (options?.claimId) {
    await notionWrite(() =>
      notion.pages.update({
        page_id: options.claimId!,
        properties: {
          "Truth Diff": { rich_text: [{ text: { content: page.id } }] },
        },
      })
    );
  }
  return page.id;
}

export async function createConcept(concept: {
  title: string;
  stage: "raw" | "emerging" | "needs_decision" | "executing" | "shipped";
  supportingSignalIds: string[];
  relatedClaimId?: string;
}, options?: WriteOptions): Promise<string> {
  const notion = clientFromOptions(options);
  const page = await notionWrite(() =>
    notion.pages.create({
      parent: { database_id: DB_IDS.concepts },
      properties: {
        Name: { title: [{ text: { content: concept.title } }] },
        Stage: { select: { name: concept.stage } },
        "Supporting Signals": {
          rich_text: [
            { text: { content: concept.supportingSignalIds.join(", ") } },
          ],
        },
        "Related Claim": {
          rich_text: concept.relatedClaimId
            ? [{ text: { content: concept.relatedClaimId } }]
            : [],
        },
        Status: { select: { name: "active" } },
      },
    })
  );
  pushLog(`Concept created: ${concept.title}`, "done");
  return page.id;
}

export async function createTruthBrief(brief: {
  summary: string;
  topRisks: string[];
  pendingApprovals: string[];
  verdict: "true" | "contradicted" | "unclear";
}, options?: WriteOptions): Promise<string> {
  const notion = clientFromOptions(options);
  const page = await notionWrite(() =>
    notion.pages.create({
      parent: { database_id: DB_IDS.truthBriefs },
      properties: {
        Summary: { title: [{ text: { content: brief.summary } }] },
        Date: { date: { start: new Date().toISOString().split("T")[0] } },
        "Top Risks": {
          rich_text: [{ text: { content: brief.topRisks.join("\n") } }],
        },
        "Pending Approvals": {
          rich_text: [
            { text: { content: brief.pendingApprovals.join("\n") } },
          ],
        },
        Verdict: { select: { name: brief.verdict } },
      },
    })
  );
  pushLog("Truth Brief written to Notion", "done");
  return page.id;
}

export async function createCompanyClaim(claim: {
  text: string;
  status?: "green" | "yellow" | "red";
  verdict?: "true" | "contradicted" | "unclear";
  relatedConceptId?: string;
}, options?: WriteOptions): Promise<string> {
  const notion = clientFromOptions(options);
  const page = await notionWrite(() =>
    notion.pages.create({
      parent: { database_id: DB_IDS.companyClaims },
      properties: {
        Claim: { title: [{ text: { content: claim.text } }] },
        Status: { select: { name: claim.status ?? "green" } },
        "Related Concept": claim.relatedConceptId
          ? { rich_text: [{ text: { content: claim.relatedConceptId } }] }
          : { rich_text: [] },
        "Truth Diff": { rich_text: [] },
        Verdict: { select: { name: claim.verdict ?? "unclear" } },
        "Last Checked": { date: { start: new Date().toISOString() } },
      },
    })
  );
  pushLog(`Company Claim created: ${claim.text}`, "done");
  return page.id;
}

export async function archiveDatabasePages(databaseId: string, options?: WriteOptions): Promise<number> {
  const notion = clientFromOptions(options);
  const result = await notionWrite(() =>
    notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    })
  );

  let archived = 0;
  for (const page of result.results) {
    await notionWrite(() =>
      notion.pages.update({
        page_id: page.id,
        archived: true,
      })
    );
    archived++;
  }
  return archived;
}

export async function archiveCoreDemo(options?: WriteOptions): Promise<number> {
  let total = 0;
  for (const databaseId of [
    DB_IDS.rawSignals,
    DB_IDS.concepts,
    DB_IDS.companyClaims,
    DB_IDS.truthDiffs,
    DB_IDS.evidenceReceipts,
    DB_IDS.approvals,
    DB_IDS.truthBriefs,
  ]) {
    total += await archiveDatabasePages(databaseId, options);
  }
  return total;
}

export { pageUrl as notionPageUrl };
