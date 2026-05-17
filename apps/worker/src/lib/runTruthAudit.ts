import type { Signal, RuleViolation } from "./types";
import { getNotionClient, DB_IDS, notionRead, getSeedClaimId } from "./notion-client";
import { evaluateClaim } from "./rules";

type NotionClient = ReturnType<typeof getNotionClient>;

export async function runTruthAudit(claimIdInput?: string, options?: {
  notion?: NotionClient;
}): Promise<{
  violations: RuleViolation[];
  claimText: string;
  claimId: string;
}> {
  const notion = options?.notion ?? getNotionClient();

  const existingResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.rawSignals,
      sorts: [{ property: "Timestamp", direction: "descending" }],
      page_size: 50,
    })
  );

  const allSignals: Signal[] = existingResult.results.map((page: any) => ({
    id: page.id,
    source: page.properties.Source?.select?.name ?? "notion",
    type: page.properties.Type?.rich_text?.[0]?.plain_text ?? "",
    label: page.properties.Name?.title?.[0]?.plain_text ?? "",
    summary: page.properties.Summary?.rich_text?.[0]?.plain_text ?? "",
    timestamp: page.properties.Timestamp?.date?.start ?? new Date().toISOString(),
    severity: page.properties.Severity?.select?.name ?? "low",
  }));

  // Fetch the active claim
  const claimId = claimIdInput ?? getSeedClaimId();
  const claimPage = await notionRead(() => notion.pages.retrieve({ page_id: claimId }));
  const props = (claimPage as any).properties;
  const claim = {
    id: claimId,
    text: props.Claim?.title?.[0]?.plain_text ?? "May Beta Readiness is green.",
    verdict: (props.Verdict?.select?.name ?? "unclear") as "true" | "contradicted" | "unclear",
  };

  const violations = evaluateClaim(allSignals, claim);
  return { violations, claimText: claim.text, claimId };
}
