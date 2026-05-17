import { getNotionClient, DB_IDS, notionRead, getSeedClaimId } from "./notion-client";
import { createTruthBrief } from "./notion-writes";

type NotionClient = ReturnType<typeof getNotionClient>;

export async function generateTruthBrief(claimIdInput?: string, options?: {
  notion?: NotionClient;
}): Promise<string> {
  const notion = options?.notion ?? getNotionClient();
  const claimId = claimIdInput ?? getSeedClaimId();

  const claimPage = await notionRead(() => notion.pages.retrieve({ page_id: claimId }));
  const approvalsResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.approvals,
      filter: { property: "Status", select: { equals: "needs_approval" } },
    })
  );
  const evidenceResult = await notionRead(() =>
    notion.databases.query({ database_id: DB_IDS.evidenceReceipts })
  );

  const verdict = (claimPage as any).properties.Verdict?.select?.name ?? "unclear";

  const topRisks = evidenceResult.results
    .filter((p: any) => p.properties.Severity?.select?.name === "high")
    .map(
      (p: any) =>
        p.properties.Title?.title?.[0]?.plain_text ?? "Unknown risk"
    )
    .slice(0, 5);

  const pendingApprovals = approvalsResult.results
    .map(
      (p: any) =>
        p.properties.Action?.title?.[0]?.plain_text ?? "Pending action"
    )
    .slice(0, 5);

  const claimText =
    (claimPage as any).properties.Claim?.title?.[0]?.plain_text ??
    "May Beta Readiness is green.";

  return createTruthBrief({
    summary: `Truth Brief: ${claimText} — verdict: ${verdict}`,
    topRisks,
    pendingApprovals,
    verdict: verdict as "true" | "contradicted" | "unclear",
  }, { notion });
}
