import {
  type AletheiaState,
  type TruthStatus,
  type Verdict,
  AletheiaStateSchema,
} from "./types";
import { getNotionClient, DB_IDS, notionRead } from "./notion-client";
import { getLog } from "./syncLog";

function richTextPlain(prop: any): string {
  if (!prop?.rich_text?.length) return "";
  return prop.rich_text.map((t: any) => t.plain_text).join("");
}

function titlePlain(prop: any): string {
  if (!prop?.title?.length) return "";
  return prop.title.map((t: any) => t.plain_text).join("");
}

function selectValue(prop: any): string | null {
  return prop?.select?.name ?? null;
}

function dateValue(prop: any): string | null {
  return prop?.date?.start ?? null;
}

function urlValue(prop: any): string | null {
  return prop?.url ?? null;
}

function notionPageUrl(pageId: string): string {
  return `https://notion.so/${pageId.replace(/-/g, "")}`;
}

export async function assembleState(): Promise<AletheiaState> {
  const notion = getNotionClient();

  // 1. Active claim (first with status green/yellow/red)
  const claimsResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.companyClaims,
      filter: {
        property: "Status",
        select: { is_not_empty: true },
      },
      page_size: 1,
    })
  );

  const claimPage = claimsResult.results[0] as any;
  if (!claimPage) {
    throw new Error("No active claim found in Company Claims database");
  }

  const claimId = claimPage.id;
  const claimText = titlePlain(claimPage.properties.Claim);
  const claimVerdict = (selectValue(claimPage.properties.Verdict) ?? "unclear") as Verdict;
  const claimStatus = (selectValue(claimPage.properties.Status) ?? "green") as TruthStatus;

  // 2. Signals (last 20, desc by Timestamp)
  const signalsResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.rawSignals,
      sorts: [{ property: "Timestamp", direction: "descending" }],
      page_size: 20,
    })
  );

  const signals = signalsResult.results.map((page: any) => ({
    id: page.id,
    source: (selectValue(page.properties.Source) ?? "notion") as AletheiaState["signals"][0]["source"],
    type: richTextPlain(page.properties.Type),
    label: titlePlain(page.properties.Name),
    summary: richTextPlain(page.properties.Summary),
    timestamp: dateValue(page.properties.Timestamp) ?? new Date().toISOString(),
    severity: (selectValue(page.properties.Severity) ?? "low") as "low" | "medium" | "high",
  }));

  // 3. Concepts (active only)
  const conceptsResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.concepts,
      filter: {
        property: "Status",
        select: { equals: "active" },
      },
    })
  );

  const concepts = conceptsResult.results.map((page: any) => {
    const idsStr = richTextPlain(page.properties["Supporting Signals"]);
    return {
      id: page.id,
      title: titlePlain(page.properties.Name),
      stage: (selectValue(page.properties.Stage) ?? "raw") as AletheiaState["concepts"][0]["stage"],
      supportingSignalIds: idsStr ? idsStr.split(",").map((s: string) => s.trim()) : [],
    };
  });

  // 4. Truth Diff for active claim (current status)
  const truthDiffsResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.truthDiffs,
      filter: {
        and: [
          {
            property: "Status",
            select: { equals: "current" },
          },
          {
            property: "Claim",
            title: { equals: claimText },
          },
        ],
      },
      page_size: 1,
    })
  );

  let truthDiff: AletheiaState["truthDiff"] = {
    belief: [],
    reality: [],
    verdict: "",
    recommendedActions: [],
  };

  if (truthDiffsResult.results.length > 0) {
    const td = truthDiffsResult.results[0] as any;
    const beliefStr = richTextPlain(td.properties["Belief Lines"]);
    const realityStr = richTextPlain(td.properties["Reality Lines"]);
    const actionsStr = richTextPlain(td.properties["Recommended Actions"]);
    truthDiff = {
      belief: beliefStr ? beliefStr.split("\n").filter(Boolean) : [],
      reality: realityStr ? realityStr.split("\n").filter(Boolean) : [],
      verdict: selectValue(td.properties.Verdict) ?? "",
      recommendedActions: actionsStr ? actionsStr.split("\n").filter(Boolean) : [],
    };
  }

  // 5. Evidence Receipts related to active claim
  const evidenceResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.evidenceReceipts,
    })
  );

  const evidence = evidenceResult.results.map((page: any) => ({
    id: page.id,
    source: (selectValue(page.properties.Source) ?? "notion") as AletheiaState["evidence"][0]["source"],
    title: titlePlain(page.properties.Title),
    summary: richTextPlain(page.properties.Summary),
    severity: (selectValue(page.properties.Severity) ?? "low") as "low" | "medium" | "high",
    notionUrl: notionPageUrl(page.id),
  }));

  // 6. Approvals needing action
  const approvalsResult = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.approvals,
      filter: {
        property: "Status",
        select: { equals: "needs_approval" },
      },
    })
  );

  const approvals = approvalsResult.results.map((page: any) => {
    const evidenceStr = richTextPlain(page.properties.Evidence);
    return {
      id: page.id,
      action: titlePlain(page.properties.Action),
      riskLevel: (selectValue(page.properties["Risk Level"]) ?? "low") as "low" | "medium" | "high",
      status: (selectValue(page.properties.Status) ?? "needs_approval") as AletheiaState["approvals"][0]["status"],
      evidenceIds: evidenceStr ? evidenceStr.split(",").map((s: string) => s.trim()) : [],
    };
  });

  // 7. Derive TruthStatus from claim verdict
  // true -> "green", unclear -> "yellow", contradicted -> "red"
  // But we use the claim's Status property directly since we update it during processing
  const status = claimStatus;

  const state: AletheiaState = {
    status,
    activeClaim: {
      id: claimId,
      text: claimText,
      verdict: claimVerdict,
    },
    signals,
    concepts,
    truthDiff,
    evidence,
    approvals,
    syncLog: getLog(),
  };

  return AletheiaStateSchema.parse(state);
}
