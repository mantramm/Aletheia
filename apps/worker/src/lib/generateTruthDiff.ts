import { z } from "zod";
import type { RuleViolation } from "./types";
import { writeTruthDiff, updateClaimStatus } from "./notion-writes";
import { pushLog } from "./syncLog";
import { getNotionClient } from "./notion-client";

const TruthDiffOutputSchema = z.object({
  belief: z.array(z.string()).min(1).max(5),
  reality: z.array(z.string()).min(1).max(5),
  verdict: z.enum(["true", "contradicted", "unclear"]),
  recommendedActions: z.array(z.string()).min(1).max(5),
});

type TruthDiffOutput = z.infer<typeof TruthDiffOutputSchema>;
type NotionClient = ReturnType<typeof getNotionClient>;

type TruthDiffOptions = {
  notion?: NotionClient;
};

function hardcodedFallback(violations: RuleViolation[]): TruthDiffOutput {
  return {
    belief: ["The claim is marked green.", "The team believes launch blockers are under control."],
    reality: violations.length
      ? violations.map((v) => v.detail).slice(0, 5)
      : ["No contradictions were found in the current Notion evidence."],
    verdict: violations.some((v) => v.severity === "high")
      ? "contradicted"
      : "unclear",
    recommendedActions: [
      "Move the claim to at-risk until the blocking evidence is resolved.",
      "Assign owners to the highest-severity evidence receipts.",
      "Publish a Truth Brief before the next founder review.",
    ].slice(0, Math.max(violations.length, 1)),
  };
}

async function callLLM(
  claimText: string,
  violations: RuleViolation[]
): Promise<TruthDiffOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [
        {
          name: "write_truth_diff",
          description:
            "Return concise Truth Diff copy from deterministic rule violations. Do not invent new evidence.",
          input_schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              belief: {
                type: "array",
                minItems: 1,
                maxItems: 5,
                items: { type: "string" },
              },
              reality: {
                type: "array",
                minItems: 1,
                maxItems: 5,
                items: { type: "string" },
              },
              verdict: {
                type: "string",
                enum: ["true", "contradicted", "unclear"],
              },
              recommendedActions: {
                type: "array",
                minItems: 1,
                maxItems: 5,
                items: { type: "string" },
              },
            },
            required: ["belief", "reality", "verdict", "recommendedActions"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "write_truth_diff" },
      messages: [
        {
          role: "user",
          content: `You are Aletheia, a company truth system. Given a company claim and rule violations detected by the system, produce a Truth Diff.

CLAIM: "${claimText}"

VIOLATIONS (structured data from rules engine):
${JSON.stringify(violations, null, 2)}

Each array must have 1-5 items. Be concise and specific. Reference the actual violations.`,
        },
      ],
    } as any);

    const toolUse = response.content.find((part: any) => part.type === "tool_use");
    if (!toolUse) return null;

    return TruthDiffOutputSchema.parse((toolUse as any).input);
  } catch {
    return null;
  }
}

export async function generateTruthDiff(
  claimId: string,
  claimText: string,
  violations: RuleViolation[],
  evidenceReceiptIds: string[],
  options?: TruthDiffOptions
): Promise<void> {
  pushLog("Generating Truth Diff...", "pending");

  let output = await callLLM(claimText, violations);

  if (!output) {
    // Retry once
    output = await callLLM(claimText, violations);
  }

  if (!output) {
    output = hardcodedFallback(violations);
    pushLog("Truth Diff generated (fallback)", "done");
  } else {
    pushLog("Truth Diff generated (LLM)", "done");
  }

  const verdictMap: Record<string, "true" | "contradicted" | "unclear"> = {
    contradicted: "contradicted",
    unclear: "unclear",
    true: "true",
  };
  const verdict = verdictMap[output.verdict] ?? "unclear";

  const statusMap: Record<string, "green" | "yellow" | "red"> = {
    true: "green",
    unclear: "yellow",
    contradicted: "red",
  };
  const status = statusMap[verdict];

  await writeTruthDiff({
    claimText,
    beliefLines: output.belief,
    realityLines: output.reality,
    verdict,
    evidenceReceiptIds,
    recommendedActions: output.recommendedActions,
  }, { notion: options?.notion, claimId });

  await updateClaimStatus(verdict, status, { notion: options?.notion, claimId });
}
