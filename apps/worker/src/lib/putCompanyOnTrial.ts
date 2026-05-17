import { z } from "zod";
import { TrialResultSchema } from "./types";
import { getNotionClient, DB_IDS, notionRead, getSeedClaimId } from "./notion-client";
import { pushLog } from "./syncLog";

type TrialResult = z.infer<typeof TrialResultSchema>;

const HARDCODED_FALLBACK: TrialResult = {
  title: "The People vs. May Beta Readiness",
  charges: [
    "Calling beta readiness green while activation is below target.",
    "Declaring onboarding solved while invite failures block design partners.",
    "Claiming trust readiness while security docs and SSO timing are unresolved.",
  ],
  verdict: "Guilty of premature confidence.",
  sentence: [
    "Move beta readiness to at-risk.",
    "Escalate the workspace invite fix.",
    "Send design partners a trust readiness update.",
  ],
};

async function callTrialLLM(context: string): Promise<TrialResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a dramatic courtroom AI putting a company claim on trial. Given this evidence context, produce a trial verdict.

CONTEXT:
${context}

Respond with ONLY valid JSON matching this exact shape:
{
  "title": "The People vs. [claim topic]",
  "charges": ["charge 1", "charge 2", ...],
  "verdict": "Guilty of [memorable phrase].",
  "sentence": ["action 1", "action 2", ...]
}

charges: 1-5 items. Each is one sentence.
sentence: 1-5 recommended actions. Each is one sentence.
Be dramatic but specific. Reference actual evidence.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return TrialResultSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    return null;
  }
}

export async function putCompanyOnTrial(): Promise<TrialResult> {
  pushLog("Putting company on trial...", "pending");

  const notion = getNotionClient();
  const claimId = getSeedClaimId();

  // Gather evidence context
  const [evidenceResult, approvalsResult, claimPage] = await Promise.all([
    notionRead(() =>
      notion.databases.query({ database_id: DB_IDS.evidenceReceipts })
    ),
    notionRead(() =>
      notion.databases.query({ database_id: DB_IDS.approvals })
    ),
    notionRead(() => notion.pages.retrieve({ page_id: claimId })),
  ]);

  const claimText =
    (claimPage as any).properties.Claim?.title?.[0]?.plain_text ??
    "May Beta Readiness is green.";

  const evidenceSummaries = evidenceResult.results
    .map(
      (p: any) =>
        `- ${p.properties.Title?.title?.[0]?.plain_text ?? "Evidence"}: ${p.properties.Summary?.rich_text?.[0]?.plain_text ?? ""}`
    )
    .join("\n");

  const approvalSummaries = approvalsResult.results
    .map(
      (p: any) =>
        `- ${p.properties.Action?.title?.[0]?.plain_text ?? "Action"} (${p.properties.Status?.select?.name ?? "pending"})`
    )
    .join("\n");

  const context = `CLAIM: "${claimText}"

EVIDENCE:
${evidenceSummaries || "No evidence collected yet."}

PENDING APPROVALS:
${approvalSummaries || "No pending approvals."}`;

  let result = await callTrialLLM(context);
  if (!result) {
    result = await callTrialLLM(context);
  }
  if (!result) {
    result = HARDCODED_FALLBACK;
    pushLog("Trial verdict generated (fallback)", "done");
  } else {
    pushLog("Trial verdict generated (LLM)", "done");
  }

  return result;
}
