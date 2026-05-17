# Backend CLAUDE.md — Aletheia

## Role

You are the backend/Notion platform builder for Aletheia. Your job is to make the demo real: Notion Workers, Notion databases, syncs, webhooks, agent tools, API state, and reliable demo triggers.

The frontend can be beautiful, but the project wins only if the backend visibly writes to Notion and drives the Truth Diff.

## Required reading order

Before editing code:

1. Read `PRD.md`.
2. Read `DESIGN.md` to understand frontend expectations.
3. Read `contracts/aletheia-state.ts` if present.
4. Read Notion database schema in this file before creating tables.

## Skills to use

Use these skills when available in Claude Code / Antigravity:

```text
agents-md
software-architecture
backend-dev-guidelines
api-patterns
api-endpoint-builder
agent-tool-builder
tool-design
llm-structured-output
zod-validation-expert
typescript-pro
nextjs-app-router-patterns
notion-automation
database-design
github
webapp-testing
mock-hunter
moyu
debugging-strategies
error-detective
```

Skill intent:

```text
agents-md -> maintain agent docs / CLAUDE.md / AGENTS.md
software-architecture -> preserve clean project structure
backend-dev-guidelines -> reliable services and error handling
agent-tool-builder/tool-design -> narrow Notion agent tools
llm-structured-output/zod-validation-expert -> reliable JSON outputs
notion-automation -> Notion pages/databases/blocks/comments operations
mock-hunter -> verify real writes vs fake UI
moyu -> prevent scope creep
```

## Product summary

Aletheia is CI for company truth.

The backend turns:

```text
External signals -> Notion records -> Truth Diff -> Approvals -> Frontend state
```

Demo claim:

```text
Enterprise launch is ready.
```

Backend must prove it false through a chain of evidence.

## Backend-owned files

You may edit:

```text
apps/worker/**
apps/web/src/app/api/**
contracts/**
data/demo/**
scripts/**
.env.example
README.md
package.json only when needed
```

Do not edit frontend design/components unless required for API wiring.

## Architecture — resolved, no ambiguity

```text
Workers  = event receivers + scheduled syncs ONLY.
           Deploy via ntn CLI. Handle githubPrMerged webhook,
           scheduled CRM/roadmap syncs, and agent tools.
           Workers do NOT serve HTTP responses to the frontend.

Next.js  = thin frontend-facing HTTP layer ONLY.
API routes  Reads Notion directly via @notionhq/client.
           Calls Worker logic by importing shared lib functions
           (not via HTTP to Workers). Assembles and returns AletheiaState.

Shared   = apps/worker/src/lib/**
lib        Business logic (rules engine, truth diff, trial mode,
           Notion write helpers) lives here and is imported by
           both Workers and API routes. No duplication.
```

Never put business logic in API route handlers. Never put HTTP response logic in Workers.

## Notion databases

Create these Notion databases with exact property names and types shown. Do not rename properties. Do not add extra properties during initial setup.

### Raw Signals

```text
Name           title
Source         select    [github, slack, crm, roadmap, notion, browser]
Type           rich_text
Entity         rich_text
Summary        rich_text
Evidence URL   url
Severity       select    [low, medium, high]
Timestamp      date
Processed      checkbox
```

### Concepts

```text
Name               title
Stage              select    [raw, emerging, needs_decision, executing, shipped]
Supporting Signals rich_text (comma-separated Raw Signal page IDs — NOT a relation)
Related Claim      rich_text (Company Claims page ID)
Status             select    [active, resolved]
```

Note: Supporting Signals is stored as plain text IDs, not a Notion relation. This avoids cross-DB relation complexity during the demo build.

### Company Claims

```text
Claim          title
Status         select    [green, yellow, red]
Related Concept rich_text (Concepts page ID)
Truth Diff     rich_text (Truth Diffs page ID)
Verdict        select    [true, contradicted, unclear]
Last Checked   date
```

### Truth Diffs

```text
Claim                title
Belief Lines         rich_text (newline-separated strings)
Reality Lines        rich_text (newline-separated strings)
Verdict              select    [true, contradicted, unclear]
Evidence Receipts    rich_text (comma-separated Evidence Receipt page IDs)
Recommended Actions  rich_text (newline-separated strings)
Status               select    [current, archived]
```

### Evidence Receipts

```text
Source       select    [github, slack, crm, roadmap, notion, browser]
Title        title
Summary      rich_text
Severity     select    [low, medium, high]
Timestamp    date
Source URL   url
Related Claim rich_text (Company Claims page ID)
```

### Approvals

```text
Action      title
Type        rich_text
Risk Level  select    [low, medium, high]
Draft       rich_text
Evidence    rich_text (comma-separated Evidence Receipt page IDs)
Status      select    [needs_approval, approved, rejected]
```

### Truth Briefs

```text
Date               date
Summary            title
Top Risks          rich_text (newline-separated strings)
Pending Approvals  rich_text (newline-separated strings)
Verdict            select    [true, contradicted, unclear]
```

## Worker functions

Each Worker function lives in `apps/worker/src/lib/` as an exported async function and is called from both Workers and API routes.

```text
githubPrMerged(payload: GithubPrPayload): Promise<void>
syncCRM(): Promise<void>
syncRoadmap(): Promise<void>
syncSlackSignals(): Promise<void>
runTruthAudit(claimId: string): Promise<RuleViolation[]>
generateTruthDiff(claimId: string, violations: RuleViolation[]): Promise<void>
putCompanyOnTrial(claimId: string): Promise<TrialResult>
createApproval(action: string, riskLevel: string, evidenceIds: string[]): Promise<void>
generateTruthBrief(): Promise<void>
```

## Call chain — every signal must flow through the audit

After every signal ingestion, call `runTruthAudit` then `generateTruthDiff`. Do not skip this chain.

```text
POST /api/demo/trigger-pr
  -> githubPrMerged(demoPayload)
  -> runTruthAudit(claimId)       <- rules engine, returns violations[]
  -> generateTruthDiff(claimId, violations)
  -> createApproval(...)
  -> assembleState()
  -> return AletheiaState

POST /api/demo/sync-crm
  -> syncCRM()
  -> runTruthAudit(claimId)
  -> generateTruthDiff(claimId, violations)
  -> assembleState()
  -> return AletheiaState

POST /api/demo/sync-roadmap
  -> syncRoadmap()
  -> runTruthAudit(claimId)
  -> generateTruthDiff(claimId, violations)
  -> assembleState()
  -> return AletheiaState

POST /api/demo/add-slack-signal
  -> syncSlackSignals()
  -> runTruthAudit(claimId)
  -> assembleState()
  -> return AletheiaState

POST /api/demo/run-trial
  -> putCompanyOnTrial(claimId)
  -> generateTruthBrief()
  -> assembleState()
  -> return AletheiaState
```

## API endpoints for frontend

Frontend should only rely on:

```text
GET  /api/state
POST /api/demo/reset
POST /api/demo/trigger-pr
POST /api/demo/add-slack-signal
POST /api/demo/sync-crm
POST /api/demo/sync-roadmap
POST /api/demo/run-trial
POST /api/demo/generate-brief
```

Each endpoint returns valid `AletheiaState`. Every endpoint is synchronous — it awaits all Notion writes before returning. No fire-and-forget writes. No polling loops.

## GET /api/state — assembly spec

This is the only place `AletheiaState` is assembled from Notion. Execute in this order:

```typescript
// 1. Active claim
const claim = await queryCompanyClaims({ filter: { status: ["green","yellow","red"] }, first: 1 });

// 2. Signals (last 20, desc by Timestamp)
const signals = await queryRawSignals({ sort: "Timestamp desc", limit: 20 });

// 3. Concepts
const concepts = await queryConcepts({ filter: { status: "active" } });

// 4. Truth Diff for active claim
const truthDiff = await queryTruthDiffs({ filter: { claim: claim.id, status: "current" }, first: 1 });

// 5. Evidence Receipts related to active claim
const evidence = await queryEvidenceReceipts({ filter: { relatedClaim: claim.id } });

// 6. Approvals needing action
const approvals = await queryApprovals({ filter: { status: "needs_approval" } });

// 7. Derive TruthStatus from claim verdict
// true -> "green", unclear -> "yellow", contradicted -> "red"

// 8. syncLog: in-memory only, populated by this request session
// See syncLog section below.
```

Return the assembled object cast against `AletheiaState`. Validate with Zod before returning.

## syncLog — in-memory only

`syncLog` in `AletheiaState` is an in-memory array scoped to the server process. It is NOT persisted to Notion.

```typescript
// apps/web/src/app/api/syncLog.ts
let log: AletheiaState["syncLog"] = [];

export function pushLog(text: string, status: "pending" | "done" | "failed") {
  log.push({ id: crypto.randomUUID(), text, timestamp: new Date().toISOString(), status });
}

export function getLog() { return [...log]; }

export function clearLog() { log = []; }
```

`pushLog` is called inside each Notion write helper immediately after a successful write. `clearLog` is called by `POST /api/demo/reset`.

## Rules engine — location and contract

```text
File:    apps/worker/src/lib/rules.ts
Exports: evaluateClaim(signals: Signal[], claim: ActiveClaim): RuleViolation[]
Called:  runTruthAudit() only — never call directly from API routes
```

```typescript
export type RuleViolation = {
  rule: string;
  severity: "low" | "medium" | "high";
  detail: string;
};

// Rule 1: PR touches auth and OAuth docs not updated
// Rule 2: customer promise due date < roadmap target date
// Rule 3: launch date < dependency approval date
// Rule 4: public marketing claim conflicts with roadmap
```

`generateTruthDiff` receives `violations[]` as input and passes them to the LLM prompt. The LLM's only job is phrasing — it does not evaluate rules.

## Rate limit strategy

Notion API limit is 3 requests/second. Every demo endpoint creates multiple records.

```typescript
// apps/worker/src/lib/notion-client.ts

const WRITE_GAP_MS = 400;

export async function notionWrite<T>(fn: () => Promise<T>): Promise<T> {
  await sleep(WRITE_GAP_MS);
  try {
    return await fn();
  } catch (err: any) {
    if (err?.status === 429) {
      await sleep(1000);
      return await fn(); // one retry
    }
    throw err;
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
```

Wrap every `notion.pages.create`, `notion.pages.update`, and `notion.databases.query` call with `notionWrite()`. Never fire concurrent writes; use sequential awaits.

Target: each `POST /api/demo/*` endpoint completes in under 4 seconds including all Notion writes.

## Demo trigger strategy — no polling loops

Do not use `while true; do ntn workers sync trigger...; done` during the demo. It is fragile and will silently fail mid-presentation.

Every `POST /api/demo/*` endpoint is synchronous. It runs all Workers logic, awaits all Notion writes, and returns the complete updated `AletheiaState` in a single HTTP response. The frontend re-renders from the response body. No polling. No SSE. No WebSockets.

For Workers that are deployed on schedule (CRM/roadmap syncs), the demo endpoints bypass the schedule and invoke the sync function directly. This is intentional.

## Demo data — file schemas

All demo data files live in `data/demo/`. These shapes must match the `Signal` type in `contracts/aletheia-state.ts`. Do not invent new field names.

### `data/demo/github-pr.json`

```json
{
  "id": "pr-182",
  "number": 182,
  "title": "refactor: update OAuth token flow",
  "body": "Changes token refresh behavior in apps/auth/oauth.ts",
  "merged_at": "2026-05-16T08:22:00Z",
  "files_changed": ["apps/auth/oauth.ts", "apps/auth/session.ts"],
  "author": "eng-team",
  "base_branch": "main"
}
```

Maps to Signal: `source: "github"`, `type: "pr_merged"`, `severity: "high"`, `entity: "PR #182"`

### `data/demo/crm-records.json`

```json
{
  "accounts": [
    {
      "id": "acme-001",
      "name": "Acme Corp",
      "arr": 48000,
      "renewal_date": "2026-05-30",
      "requirements": ["SSO", "OAuth stability"],
      "csm": "sarah@company.com",
      "status": "at_risk"
    }
  ]
}
```

Maps to Signal: `source: "crm"`, `type: "renewal_at_risk"`, `severity: "high"`, `entity: "Acme Corp"`

### `data/demo/roadmap.json`

```json
{
  "items": [
    {
      "id": "rm-sso",
      "feature": "SSO / Enterprise Auth",
      "target_quarter": "Q3 2026",
      "target_date": "2026-09-30",
      "status": "planned",
      "owner": "platform-team"
    },
    {
      "id": "rm-enterprise-launch",
      "feature": "Enterprise Launch",
      "target_date": "2026-05-23",
      "status": "scheduled",
      "depends_on": ["rm-sso"],
      "marketing_live": true
    }
  ]
}
```

Maps to Signal: `source: "roadmap"`, `type: "dependency_conflict"`, `severity: "high"`, `entity: "SSO vs Launch"`

### `data/demo/slack-signals.json`

```json
{
  "messages": [
    {
      "id": "slack-001",
      "channel": "#strategy",
      "text": "Should we go enterprise? Feels like the right time.",
      "author": "founder",
      "timestamp": "2026-05-10T14:30:00Z",
      "reactions": ["eyes", "plus1"]
    }
  ]
}
```

Maps to Signal: `source: "slack"`, `type: "idea"`, `severity: "low"`, `entity: "Enterprise Readiness"`

### `data/demo/notion-docs.json`

```json
{
  "pages": [
    {
      "id": "notion-oauth-guide",
      "title": "OAuth Integration Guide",
      "last_edited": "2026-03-12T10:00:00Z",
      "url": "https://notion.so/oauth-guide",
      "stale_since_pr": "pr-182",
      "status": "stale"
    }
  ]
}
```

Maps to Signal: `source: "notion"`, `type: "stale_doc"`, `severity: "medium"`, `entity: "OAuth Guide"`

## LLM usage rules

Use LLM only for:

```text
Truth Diff phrasing (given violations[] as structured input)
Trial Mode charges/verdict
Approval draft copy
Truth Brief narrative
```

Every LLM output must be validated with Zod before writing to Notion or returning to frontend. If Zod parse fails, retry the LLM call once. If it fails again, return a hardcoded fallback so the demo does not break.

```typescript
// Zod schema for trial output
const TrialResultSchema = z.object({
  title: z.string(),
  charges: z.array(z.string()).min(1).max(5),
  verdict: z.string(),
  sentence: z.array(z.string()).min(1).max(5),
});
```

## Implementation phases

### Phase B1 — Notion schema + seed

Create all 7 databases using the exact schemas above. Seed the active claim:

```text
Claim: "Enterprise launch is ready."
Verdict: unclear
Status: green
```

Acceptance:

```text
Can create one Raw Signal manually via script.
Can fetch it back via GET /api/state.
All 7 databases exist with correct properties.
```

### Phase B2 — State contract

Create `contracts/aletheia-state.ts` and `data/demo/demo-state.sample.json`.

Acceptance:

```text
GET /api/state returns valid AletheiaState.
Zod validation passes.
Frontend can render it.
syncLog returns empty array, not undefined.
```

### Phase B3 — PR trigger

Implement `POST /api/demo/trigger-pr`.

Acceptance:

```text
Creates Raw Signal in Notion (verify in workspace).
Creates Evidence Receipt in Notion.
Calls runTruthAudit -> generateTruthDiff.
Creates Approval in Notion.
Returns updated AletheiaState with status: "yellow" or "red".
Completes in < 4 seconds.
```

### Phase B4 — CRM / Roadmap / Slack syncs

Implement remaining sync endpoints.

Acceptance:

```text
POST /api/demo/sync-crm: Acme appears in evidence, severity high.
POST /api/demo/sync-roadmap: SSO conflict appears, status becomes "red".
POST /api/demo/add-slack-signal: Concept created, signal appears.
All write to Notion. All return valid AletheiaState.
```

### Phase B5 — Trial Mode

Implement `POST /api/demo/run-trial`.

Acceptance:

```text
LLM generates trial verdict.
Zod validation passes.
Truth Brief written to Notion.
Frontend receives trial object with title, charges[], verdict, sentence[].
```

### Phase B6 — Demo hardening

Acceptance:

```text
POST /api/demo/reset clears in-memory syncLog and resets Notion claim to green/unclear.
All endpoints return valid AletheiaState.
All Notion page URLs in evidence are real and open correctly.
No endpoint takes > 4 seconds.
Backup demo-state.sample.json is current and renders correctly without backend.
pnpm build passes.
```

## Optional features

### ElevenLabs

Add only after Phase B6 is passing.

```text
POST /api/demo/trial-voice
Input: trial.verdict string
Output: { voiceUrl: string } merged into AletheiaState.trial
Voice line: "Court is now in session. The company stands accused of premature confidence."
```

### Browserbase

Add only after Phase B6 is passing.

```text
Browserbase captures public marketing page claiming "Enterprise SSO available."
Roadmap says SSO Q3.
Creates a Signal with source: "browser", type: "public_truth_violation", severity: "high".
Flows through normal runTruthAudit chain.
```

## Backend quality gates

Before handoff:

```text
pnpm build passes
GET /api/state returns valid AletheiaState (Zod passes)
All POST /api/demo endpoints return valid AletheiaState
Notion records are actually created (check workspace, not just response)
Reset is reliable and idempotent
.env.example has every required key with placeholder values
No secrets committed
Every Notion write is wrapped in notionWrite() helper
syncLog populates correctly and clears on reset
```

## Demo reliability rule

If a real integration fails, use demo payloads from `data/demo/`. But Notion writes must remain real.

Never depend on live OAuth in the final 3-minute demo.

If any endpoint fails during demo, `POST /api/demo/reset` must restore a clean green state within 5 seconds.

## Claude Code-specific instruction

Favor small, testable increments. After each backend task, run the smallest possible validation: endpoint call, Zod parse, Notion write/read, or state render. Do not add abstractions until the end-to-end demo works.

Complete Phase B1 fully before touching B2. Do not scaffold all phases at once.
