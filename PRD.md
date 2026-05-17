# Aletheia PRD

## Product

**Aletheia — CI for company truth**

Aletheia tests what a startup believes against what actually happened. It turns scattered company signals into a structured truth pipeline:

```text
Signals -> Concepts -> Claims -> Execution Reality -> Truth Diff -> Approvals -> Notion Memory
```

This is not a Notion dashboard, not basic RAG, not an AI companion, and not a generic chief-of-staff chatbot. It is an event-driven company truth system built for the Notion Developer Platform hackathon.

## One-line pitch

**Aletheia detects when a startup's ideas, docs, roadmap, customer promises, and shipped work fall out of sync, then creates a Truth Diff, evidence trail, and approval-ready actions inside Notion.**

## Demo scenario

The whole demo revolves around one claim:

```text
Claim: Enterprise launch is ready.
```

Reality says:

```text
- Slack-style idea: "Should we go enterprise?"
- Customer meeting: Acme needs SSO before May 30.
- CRM: Acme is a $48k renewal.
- Roadmap: SSO is Q3.
- GitHub PR #182 changed OAuth behavior.
- Notion docs: OAuth guide is stale.
- Marketing: enterprise launch is scheduled for Friday.
```

Aletheia outputs:

```diff
- Enterprise launch is ready.
+ OAuth docs are stale after PR #182.
+ Acme renewal depends on SSO/OAuth stability.
+ SSO is promised before roadmap supports it.
+ Marketing launch is scheduled before approvals.
+ $48k ARR is exposed.
```

Then it creates evidence receipts, approvals, a Truth Brief, Notion records, and an optional Trial Mode verdict.

## Why it should win

The judging rubric values Technical Demo, Implementation Difficulty, Creativity, and Impact. Aletheia is optimized for all four:

1. **Technical Demo:** visible end-to-end pipeline: webhook/sync/tool -> Worker -> Notion writes -> frontend update -> approvals.
2. **Implementation Difficulty:** real schema, deterministic conflict rules, LLM structured output, Notion Workers, Notion databases, sync workers, agent tools, webhooks.
3. **Creativity:** "Truth Diff" and "The People vs. Enterprise Launch" are memorable and not generic.
4. **Impact:** every startup has drift between ideas, promises, docs, roadmaps, code, and execution.

## Product surfaces

### 1. Truth Room — custom frontend

This is the judge-facing wow surface. It should feel like a playful, premium, alive system interface inspired by the attached references:

- green data-flow visualization: flowing signal field, soft green, many small moving dots, directional transformation;
- Genie-like website: white space, floating playful objects, soft motion, friendly character energy;
- Ko-fi-like website: cream background, chunky editorial type, pets/toys/mascots, playful FAQ/cards.

Truth Room contains:

```text
Convergence Flow
Truth Diff
Evidence Receipts
Trial Mode
Notion Sync Log
Optional Today / Company toggle
```

### 2. Aletheia Memory — Notion workspace

Notion is the system of record. It stores:

```text
Raw Signals
Concepts
Company Claims
Truth Diffs
Evidence Receipts
Approvals
Truth Briefs
```

Every major frontend object should have an "Open in Notion" action.

### 3. Notion Workers — backend engine

Workers handle:

```text
GitHub PR webhook
CRM sync
Roadmap sync
Slack-style signal sync
Agent tools
Notion database writes
Truth Diff generation
Approval creation
Trial verdict generation
Truth Brief generation
```

## MVP feature set

### Must build

#### Truth Diff

Main feature. Shows:

```text
Company claim
What the company believes
What reality says
Verdict
Recommended actions
Evidence receipts
```

#### Evidence Receipts

Every claim must be backed by receipts:

```text
GitHub PR #182
Slack-style idea
Acme meeting note
CRM renewal record
Roadmap item
Notion docs state
Optional website snapshot
```

Each receipt includes source, timestamp, summary, severity, and Notion link.

#### Convergence Flow

High-level visualization, not an Obsidian clone:

```text
Divergent Signals -> Concepts -> Claims -> Execution Reality -> Truth Status
```

It must explain how ideas become execution and how execution is tested against truth.

#### Approval Queue

Actions that require a human:

```text
Publish OAuth docs update
Send Acme follow-up
Delay enterprise launch
Create SSO roadmap review task
```

#### Trial Mode

Chaos/wow button:

```text
Put Company On Trial
```

Output:

```text
The People vs. Enterprise Launch
Verdict: Guilty of premature confidence.
Sentence: align docs, clarify Acme, move launch.
```

#### Notion Sync Log

Frontend panel:

```text
✓ Raw Signal created in Notion
✓ Truth Diff generated
✓ Approval item created
✓ Trial verdict saved
✓ Truth Brief updated
```

### Keep small

```text
Concepts layer
Today / Company toggle
Specialist agent notes
Slack-style signal source
Pet/toy state indicator
```

### Cut for 24-hour build

```text
Full Obsidian graph
Real Slack OAuth
Real Salesforce OAuth
Real meeting transcription
Real Snowflake/Postgres natural-language analytics
Calendar / phone updates
Full external agent orchestration
Founder Shield
All-departments operating system
```

## Demo flow

### 0. Reset state

Truth Room shows:

```text
Claim: Enterprise launch is ready.
Status: Green.
```

### 1. Trigger PR merge

User clicks `Trigger PR Merge`.

Backend simulates or receives GitHub PR #182.

Expected outputs:

```text
Raw Signal created in Notion
Evidence Receipt added
Truth Diff updates: OAuth docs stale
Approval created: Publish OAuth docs update
Frontend status: Green -> Yellow
```

### 2. Add Slack-style idea

User clicks `Add Enterprise Signal`.

Expected outputs:

```text
Signal: "Should we go enterprise?"
Concept: Enterprise Readiness
Convergence Flow gets a new input on the left
```

### 3. Sync CRM

User runs CRM sync.

Expected outputs:

```text
Acme appears as $48k renewal
Acme needs SSO by May 30
Evidence Receipt added
```

### 4. Sync Roadmap

User runs roadmap sync.

Expected outputs:

```text
SSO target: Q3
Marketing launch: Friday
Truth Diff updates: claim contradicted
Frontend status: Red
```

### 5. Trial Mode

User clicks `Put Company On Trial`.

Expected output:

```text
The People vs. Enterprise Launch
Charge I: Shipping before docs are updated.
Charge II: Promising SSO before roadmap supports it.
Charge III: Risking $48k renewal without approval.
Verdict: Guilty of premature confidence.
Sentence: approve docs, clarify Acme, move launch.
```

### 6. Open Notion

Show that records exist in Notion:

```text
Raw Signals
Truth Diffs
Evidence Receipts
Approvals
Truth Briefs
```

## Data model

### Shared state contract

Create `contracts/aletheia-state.ts` and build frontend/backend against it.

```ts
export type TruthStatus = "green" | "yellow" | "red";
export type Verdict = "true" | "contradicted" | "unclear";

export type Signal = {
  id: string;
  source: "github" | "slack" | "crm" | "roadmap" | "notion" | "browser";
  type: string;
  label: string;
  summary: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
};

export type Concept = {
  id: string;
  title: string;
  stage: "raw" | "emerging" | "needs_decision" | "executing" | "shipped";
  supportingSignalIds: string[]; // stored as plain text IDs in Notion, not a relation
};

export type EvidenceReceipt = {
  id: string;
  source: Signal["source"];
  title: string;
  summary: string;
  severity: "low" | "medium" | "high";
  notionUrl?: string;
};

export type Approval = {
  id: string;
  action: string;
  riskLevel: "low" | "medium" | "high";
  status: "needs_approval" | "approved" | "rejected";
  evidenceIds: string[];
};

export type AletheiaState = {
  status: TruthStatus;
  activeClaim: {
    id: string;
    text: string;
    verdict: Verdict;
  };
  signals: Signal[];
  concepts: Concept[];
  truthDiff: {
    belief: string[];
    reality: string[];
    verdict: string;
    recommendedActions: string[];
  };
  evidence: EvidenceReceipt[];
  approvals: Approval[];
  syncLog: { id: string; text: string; status: "pending" | "done" | "failed"; timestamp: string }[];
  trial?: {
    title: string;
    charges: string[];
    verdict: string;
    sentence: string[];
    voiceUrl?: string;
  };
};
```

### syncLog persistence

`syncLog` is in-memory only on the server process. It is not persisted to Notion. It is populated by write helpers after each successful Notion write and is cleared by `POST /api/demo/reset`. If the server restarts, syncLog resets to `[]` — this is acceptable for a 24-hour demo.

### Notion databases

Minimum DBs (exact property types defined in CLAUDE.md):

```text
Raw Signals     — signals from all sources
Concepts        — emerging ideas grouped from signals
Company Claims  — active claims under audit
Truth Diffs     — belief vs reality per claim
Evidence Receipts — sourced receipts backing each claim
Approvals       — human-approval queue
Truth Briefs    — generated narrative summaries
```

`Concept.supportingSignalIds` is stored in Notion as a `rich_text` field containing comma-separated Raw Signal page IDs. It is not a Notion relation. This is intentional to avoid cross-database relation complexity during the build.

## Backend architecture

### Layer separation

```text
Workers (apps/worker/)
  - Receive webhooks from GitHub
  - Run scheduled syncs (CRM, roadmap)
  - Expose agent tools for Notion Custom Agents
  - Call shared lib functions
  - Do NOT serve HTTP responses to the frontend

Next.js API routes (apps/web/src/app/api/)
  - Frontend-facing HTTP layer only
  - Read/write Notion via @notionhq/client
  - Call shared lib functions directly (no HTTP to Workers)
  - Assemble and return AletheiaState

Shared lib (apps/worker/src/lib/)
  - Rules engine (rules.ts)
  - Notion write helpers with rate limiting
  - Truth Diff generation
  - Trial Mode LLM call
  - Truth Brief generation
  - syncLog helpers
```

### Rules engine location

```text
File:    apps/worker/src/lib/rules.ts
Exports: evaluateClaim(signals: Signal[], claim: ActiveClaim): RuleViolation[]
Called:  runTruthAudit() only
```

The rules engine is deterministic TypeScript. It returns structured `RuleViolation[]`. The LLM receives these violations as input and produces only copy/phrasing — it does not evaluate rules.

## Backend endpoints / triggers

Frontend consumes only these during hackathon:

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

All POST endpoints are synchronous. They await all Notion writes before returning `AletheiaState`. Target response time: under 4 seconds per endpoint.

## Worker functions

```text
githubPrMerged(payload)   — ingest PR signal, called by trigger-pr endpoint and webhook
syncCRM()                 — ingest CRM records from data/demo/crm-records.json
syncRoadmap()             — ingest roadmap from data/demo/roadmap.json
syncSlackSignals()        — ingest Slack signals from data/demo/slack-signals.json
runTruthAudit(claimId)    — run rules engine, return RuleViolation[]
generateTruthDiff(claimId, violations) — LLM call, write to Notion Truth Diffs DB
putCompanyOnTrial(claimId) — LLM call, return TrialResult, write to Truth Brief
createApproval(action)    — write to Notion Approvals DB
generateTruthBrief()      — LLM call, write to Notion Truth Briefs DB
```

## Rules engine

Rules live in `apps/worker/src/lib/rules.ts`. Use deterministic rules first; use LLM only for phrasing.

Rules:

```text
If PR touches auth and OAuth docs not updated -> docs drift.
If customer promise due date < roadmap target date -> promise conflict.
If launch date < dependency approval date -> launch risk.
If public marketing claim conflicts with roadmap -> public truth violation.
```

LLM does:

```text
explanation
Truth Diff copy (given RuleViolation[] as structured input)
Trial Mode copy
approval drafts
Truth Brief
```

Every LLM output is validated with Zod before writing to Notion or returning to frontend. On Zod failure: retry once, then use hardcoded fallback. Demo must not break on LLM failure.

## Optional features

### ElevenLabs Trial Voice

Only if Phase B6 is complete and stable.

Voice line:

```text
Court is now in session. The company stands accused of premature confidence.
```

### Browserbase Public Evidence

Only if Phase B6 is complete and stable.

Scenario:

```text
Browserbase captures a marketing page saying "Enterprise SSO available."
Roadmap says SSO is Q3.
Aletheia creates a public truth violation Signal with source: "browser".
Flows through normal runTruthAudit chain.
```

## Build phases and integration checkpoints

### Phase 0: Scope freeze

Deliver:

```text
Repo
PRD.md
DESIGN.md
contracts/aletheia-state.ts
sample demo JSON
```

### Phase 1: Static frontend + Notion DBs

Frontend renders from `demo-state.sample.json`.
Backend creates all 7 DBs with correct property types and manually writes one Raw Signal.

Checkpoint: frontend renders; backend can write to Notion and read back.

### Phase 2: First end-to-end path

Implement `GET /api/state` and `POST /api/demo/trigger-pr`.

Checkpoint: clicking Trigger PR creates Notion records, syncLog populates, frontend updates from real state.

### Phase 3: CRM + roadmap

Implement sync endpoints.

Checkpoint: Acme and roadmap evidence appear in Notion; status turns red.

### Phase 4: Trial Mode + approvals

Implement trial verdict and approvals.

Checkpoint: full demo works from Reset to Open in Notion.

### Phase 5: Optional wow

Add ElevenLabs or Browserbase only if Phase 4 is stable and time allows.

### Phase 6: Demo hardening

Record backup video, make repo public, write README, rehearse.

## Git workflow

Backend person is release owner.

Branches:

```text
main
frontend/truth-room
backend/notion-workers
```

Rules:

```text
Frontend person never pushes directly to main.
Backend person reviews and merges.
Frontend owns apps/web UI files.
Backend owns worker, API routes, contracts, scripts, env, Notion setup.
Shared contract changes require both people to acknowledge.
```

## Install checklist

Everyone:

```bash
brew install node pnpm git gh jq
npm install -g vercel
curl -fsSL https://ntn.dev | bash
ntn login
gh auth login
vercel login
```

Frontend:

```bash
pnpm install
pnpm dlx shadcn@latest init
pnpm add framer-motion lucide-react zod zustand @tanstack/react-query clsx tailwind-merge class-variance-authority
```

Backend:

```bash
pnpm add @notionhq/client zod dotenv @anthropic-ai/sdk openai
ntn workers new apps/worker
```

Optional:

```bash
pnpm add @elevenlabs/elevenlabs-js @browserbasehq/sdk
```

## Readiness checklist

```text
Frontend works with mock JSON.
Frontend works with GET /api/state.
Trigger PR creates records in Notion (verified in workspace, not just response).
CRM sync creates records in Notion.
Roadmap sync creates records in Notion.
Truth Diff updates visually.
Trial Mode works.
Open in Notion links work.
Reset restores green state reliably.
Backup video recorded.
Repo public.
README complete.
```
