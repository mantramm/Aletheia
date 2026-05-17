import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const parentPageId = process.env.NOTION_PARENT_PAGE_ID!;

if (!process.env.NOTION_API_KEY || !parentPageId) {
  console.error("Missing NOTION_API_KEY or NOTION_PARENT_PAGE_ID in .env");
  process.exit(1);
}

const WRITE_GAP_MS = 400;
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createDatabase(
  title: string,
  properties: Record<string, any>
): Promise<string> {
  await sleep(WRITE_GAP_MS);
  const response = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: title } }],
    properties,
  });
  console.log(`✓ Created "${title}" — ${response.id}`);
  return response.id;
}

function selectProp(options: string[]) {
  return {
    select: {
      options: options.map((name) => ({ name })),
    },
  };
}

async function main() {
  console.log("Setting up Aletheia Notion databases...\n");

  // 1. Raw Signals
  const rawSignalsId = await createDatabase("Raw Signals", {
    Name: { title: {} },
    Source: selectProp(["github", "slack", "crm", "roadmap", "notion", "browser"]),
    Type: { rich_text: {} },
    Entity: { rich_text: {} },
    Summary: { rich_text: {} },
    "Evidence URL": { url: {} },
    Severity: selectProp(["low", "medium", "high"]),
    Timestamp: { date: {} },
    Processed: { checkbox: {} },
  });

  // 2. Concepts
  const conceptsId = await createDatabase("Concepts", {
    Name: { title: {} },
    Stage: selectProp(["raw", "emerging", "needs_decision", "executing", "shipped"]),
    "Supporting Signals": { rich_text: {} },
    "Related Claim": { rich_text: {} },
    Status: selectProp(["active", "resolved"]),
  });

  // 3. Company Claims
  const companyClaimsId = await createDatabase("Company Claims", {
    Claim: { title: {} },
    Status: selectProp(["green", "yellow", "red"]),
    "Related Concept": { rich_text: {} },
    "Truth Diff": { rich_text: {} },
    Verdict: selectProp(["true", "contradicted", "unclear"]),
    "Last Checked": { date: {} },
  });

  // 4. Truth Diffs
  const truthDiffsId = await createDatabase("Truth Diffs", {
    Claim: { title: {} },
    "Belief Lines": { rich_text: {} },
    "Reality Lines": { rich_text: {} },
    Verdict: selectProp(["true", "contradicted", "unclear"]),
    "Evidence Receipts": { rich_text: {} },
    "Recommended Actions": { rich_text: {} },
    Status: selectProp(["current", "archived"]),
  });

  // 5. Evidence Receipts
  const evidenceReceiptsId = await createDatabase("Evidence Receipts", {
    Title: { title: {} },
    Source: selectProp(["github", "slack", "crm", "roadmap", "notion", "browser"]),
    Summary: { rich_text: {} },
    Severity: selectProp(["low", "medium", "high"]),
    Timestamp: { date: {} },
    "Source URL": { url: {} },
    "Related Claim": { rich_text: {} },
  });

  // 6. Approvals
  const approvalsId = await createDatabase("Approvals", {
    Action: { title: {} },
    Type: { rich_text: {} },
    "Risk Level": selectProp(["low", "medium", "high"]),
    Draft: { rich_text: {} },
    Evidence: { rich_text: {} },
    Status: selectProp(["needs_approval", "approved", "rejected"]),
  });

  // 7. Truth Briefs
  const truthBriefsId = await createDatabase("Truth Briefs", {
    Summary: { title: {} },
    Date: { date: {} },
    "Top Risks": { rich_text: {} },
    "Pending Approvals": { rich_text: {} },
    Verdict: selectProp(["true", "contradicted", "unclear"]),
  });

  const seedClaims = [
    "May Beta Readiness is green.",
    "Activation Sprint solved onboarding friction.",
    "Trust & Security is ready for design partners.",
  ];
  const claimPages = [];
  for (const claim of seedClaims) {
    await sleep(WRITE_GAP_MS);
    const page = await notion.pages.create({
      parent: { database_id: companyClaimsId },
      properties: {
        Claim: { title: [{ text: { content: claim } }] },
        Status: { select: { name: "green" } },
        Verdict: { select: { name: "unclear" } },
        "Related Concept": { rich_text: [] },
        "Truth Diff": { rich_text: [] },
      },
    });
    claimPages.push(page);
    console.log(`\n✓ Seeded claim — ${claim}: ${page.id}`);
  }

  // Print env block
  console.log("\n═══ Add these to your .env ═══\n");
  console.log(`NOTION_DB_RAW_SIGNALS=${rawSignalsId}`);
  console.log(`NOTION_DB_CONCEPTS=${conceptsId}`);
  console.log(`NOTION_DB_COMPANY_CLAIMS=${companyClaimsId}`);
  console.log(`NOTION_DB_TRUTH_DIFFS=${truthDiffsId}`);
  console.log(`NOTION_DB_EVIDENCE_RECEIPTS=${evidenceReceiptsId}`);
  console.log(`NOTION_DB_APPROVALS=${approvalsId}`);
  console.log(`NOTION_DB_TRUTH_BRIEFS=${truthBriefsId}`);
  console.log(`NOTION_SEED_CLAIM_ID=${claimPages[0]?.id}`);

  // Auto-append to .env
  const envPath = path.resolve(__dirname, "../.env");
  const envContent = fs.readFileSync(envPath, "utf-8");

  const envUpdates: Record<string, string> = {
    NOTION_DB_RAW_SIGNALS: rawSignalsId,
    NOTION_DB_CONCEPTS: conceptsId,
    NOTION_DB_COMPANY_CLAIMS: companyClaimsId,
    NOTION_DB_TRUTH_DIFFS: truthDiffsId,
    NOTION_DB_EVIDENCE_RECEIPTS: evidenceReceiptsId,
    NOTION_DB_APPROVALS: approvalsId,
    NOTION_DB_TRUTH_BRIEFS: truthBriefsId,
    NOTION_SEED_CLAIM_ID: claimPages[0]?.id ?? "",
  };

  let updatedEnv = envContent;
  for (const [key, value] of Object.entries(envUpdates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(updatedEnv)) {
      updatedEnv = updatedEnv.replace(regex, `${key}=${value}`);
    } else {
      updatedEnv += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, updatedEnv);
  console.log("\n✓ Updated .env with all database IDs");
  console.log("\nSetup complete!");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
