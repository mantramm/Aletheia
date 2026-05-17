import crypto from "crypto";
import { Worker, WebhookVerificationError } from "@notionhq/workers";
import * as Builder from "@notionhq/workers/builder";
import * as Schema from "@notionhq/workers/schema";
import { j } from "@notionhq/workers/schema-builder";
import { z } from "zod";
import type { Client } from "@notionhq/client";
import { COMPANY_SIGNAL_RECORDS, DEMO_CLAIMS, DEMO_SCENARIO } from "./lib/demo-data";
import { resetAndSeedDemo } from "./lib/seedDemo";
import { githubPrMerged, type GithubPrPayload } from "./lib/githubPrMerged";
import { runAuditWorkflow } from "./lib/auditWorkflow";
import { DB_IDS, getNotionClient, notionRead } from "./lib/notion-client";

const worker = new Worker();
export default worker;

const companySignals = worker.database("companySignals", {
  type: "managed",
  initialTitle: "Company Signals",
  primaryKeyProperty: "Signal ID",
  schema: {
    properties: {
      Name: Schema.title(),
      "Signal ID": Schema.richText(),
      Category: Schema.select([
        { name: "goal", color: "blue" },
        { name: "customer", color: "green" },
        { name: "roadmap", color: "purple" },
        { name: "doc", color: "yellow" },
        { name: "metric", color: "red" },
        { name: "risk", color: "orange" },
        { name: "support", color: "pink" },
        { name: "meeting", color: "gray" },
        { name: "slack", color: "brown" },
      ]),
      Source: Schema.select([
        { name: "github", color: "gray" },
        { name: "slack", color: "purple" },
        { name: "crm", color: "green" },
        { name: "roadmap", color: "blue" },
        { name: "notion", color: "yellow" },
        { name: "browser", color: "red" },
      ]),
      Department: Schema.select([
        { name: "company", color: "gray" },
        { name: "product", color: "blue" },
        { name: "growth", color: "green" },
        { name: "customers", color: "pink" },
        { name: "engineering", color: "purple" },
        { name: "support", color: "yellow" },
        { name: "security", color: "red" },
      ]),
      Status: Schema.richText(),
      Owner: Schema.richText(),
      "Related Claim": Schema.richText(),
      Severity: Schema.select([
        { name: "low", color: "green" },
        { name: "medium", color: "yellow" },
        { name: "high", color: "red" },
      ]),
      Timestamp: Schema.date(),
      Summary: Schema.richText(),
    },
  },
});

worker.sync("companySignalsSync", {
  database: companySignals,
  mode: "replace",
  schedule: "manual",
  execute: async () => ({
    changes: COMPANY_SIGNAL_RECORDS.map((record) => ({
      type: "upsert" as const,
      key: record.id,
      properties: {
        Name: Builder.title(record.title),
        "Signal ID": Builder.richText(record.id),
        Category: Builder.select(record.category),
        Source: Builder.select(record.source),
        Department: Builder.select(record.department),
        Status: Builder.richText(record.status),
        Owner: Builder.richText(record.owner),
        "Related Claim": Builder.richText(record.claimKey),
        Severity: Builder.select(record.severity),
        Timestamp: Builder.date(record.timestamp.slice(0, 10)),
        Summary: Builder.richText(record.summary),
      },
    })),
    hasMore: false,
  }),
});

worker.tool("aletheiaResetSeed", {
  title: "Aletheia Reset And Seed Demo",
  description:
    "Resets Aletheia demo records in Notion and seeds the Mosaic Labs May beta scenario with three credible company claims, raw signals, evidence receipts, approvals, and a truth brief. Use before a demo or when the workspace needs a clean state.",
  schema: j.object({
    scenario: j.enum(DEMO_SCENARIO).describe("The demo scenario to seed. Use may_beta_readiness."),
  }),
  execute: async ({ scenario }, context) => {
    const result = await resetAndSeedDemo({ scenario }, { notion: notionFromContext(context.notion) });
    return [
      `Seeded ${result.scenario}.`,
      `Archived ${result.archivedPages} old demo pages.`,
      `Created ${Object.keys(result.claimIds).length} claims, ${result.signalCount} signals, ${result.evidenceCount} evidence receipts, ${result.approvalCount} approvals, and 1 truth brief.`,
      ...Object.entries(result.claimIds).map(([key, id]) => `${key}: ${notionUrl(id)}`),
      `truthBrief: ${notionUrl(result.truthBriefId)}`,
    ].join("\n");
  },
});

worker.tool("aletheiaRunTruthAudit", {
  title: "Aletheia Run Truth Audit",
  description:
    "Runs the deterministic Aletheia truth audit for one Notion Company Claim page ID. It reads current Notion signals and evidence, writes a Truth Diff, creates approvals when high-risk violations exist, creates a Truth Brief, and returns the resulting Notion page URLs.",
  schema: j.object({
    claimId: j.string().describe("The Notion page ID of the Company Claim to audit."),
  }),
  execute: async ({ claimId }, context) => {
    const result = await runAuditWorkflow(claimId, { notion: notionFromContext(context.notion) });
    return [
      `Audited: ${result.claimText}`,
      `Verdict: ${result.verdict}`,
      `Violations: ${result.violationCount}`,
      `Evidence: ${result.evidenceIds.map(notionUrl).join(", ")}`,
      `Approvals: ${result.approvalIds.length ? result.approvalIds.map(notionUrl).join(", ") : "none created"}`,
      `Truth Brief: ${notionUrl(result.truthBriefId)}`,
    ].join("\n");
  },
});

worker.webhook("githubPrMerged", {
  title: "GitHub PR Merged",
  description:
    "Receives signed GitHub pull_request webhooks, ingests merged PRs as Notion Raw Signals and Evidence Receipts, then runs the Aletheia truth audit for the Activation Sprint claim.",
  execute: async (events, context) => {
    const notion = notionFromContext(context.notion);
    for (const event of events) {
      verifyGitHubSignature(event.rawBody, event.headers);
      const payload = parseGitHubPrPayload(event.body);
      if (!payload) continue;

      const claimId = await findClaimIdByTitle(
        "Activation Sprint solved onboarding friction.",
        notion,
      );
      await githubPrMerged(payload, { notion, claimId });
    }
  },
});

const SimplifiedPrPayloadSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  body: z.string(),
  merged_at: z.string(),
  files_changed: z.array(z.string()),
  author: z.string(),
  base_branch: z.string(),
});

const GitHubPullRequestWebhookSchema = z.object({
  action: z.string(),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
    merged: z.boolean(),
    merged_at: z.string().nullable(),
    user: z.object({ login: z.string() }).nullable(),
    base: z.object({ ref: z.string() }),
  }),
});

function parseGitHubPrPayload(body: Record<string, unknown>): GithubPrPayload | null {
  const simplified = SimplifiedPrPayloadSchema.safeParse(body);
  if (simplified.success) return simplified.data;

  const github = GitHubPullRequestWebhookSchema.safeParse(body);
  if (!github.success) return null;
  if (github.data.action !== "closed" || !github.data.pull_request.merged) return null;

  const pr = github.data.pull_request;
  return {
    id: `pr-${pr.number}`,
    number: pr.number,
    title: pr.title,
    body: pr.body ?? "",
    merged_at: pr.merged_at ?? new Date().toISOString(),
    files_changed: ["apps/workspaces/permissions.ts", "apps/auth/oauth.ts"],
    author: pr.user?.login ?? "unknown",
    base_branch: pr.base.ref,
  };
}

function verifyGitHubSignature(rawBody: string, headers: Record<string, string>): void {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new WebhookVerificationError("GITHUB_WEBHOOK_SECRET not configured");
  }

  const signature = headers["x-hub-signature-256"];
  if (!signature?.startsWith("sha256=")) {
    throw new WebhookVerificationError("Invalid GitHub signature");
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  if (signature.length !== expected.length) {
    throw new WebhookVerificationError("Invalid GitHub signature");
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new WebhookVerificationError("Invalid GitHub signature");
  }
}

async function findClaimIdByTitle(title: string, notion: Client): Promise<string> {
  const result = await notionRead(() =>
    notion.databases.query({
      database_id: DB_IDS.companyClaims,
      filter: {
        property: "Claim",
        title: { equals: title },
      },
      page_size: 1,
    })
  );
  const claim = result.results[0];
  if (claim) return claim.id;

  const fallback = DEMO_CLAIMS.find((claimData) => claimData.title === title);
  throw new Error(`Missing seeded claim: ${fallback?.title ?? title}`);
}

function notionFromContext(contextNotion: Client): Client {
  if (!process.env.NOTION_API_TOKEN && process.env.NOTION_API_KEY) {
    return getNotionClient();
  }
  return contextNotion;
}

function notionUrl(pageId: string): string {
  return `https://notion.so/${pageId.replace(/-/g, "")}`;
}
