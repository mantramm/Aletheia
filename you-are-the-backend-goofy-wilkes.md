# Aletheia Backend — Implementation Plan

## Context

Aletheia is a "CI for company truth" system built for the Notion Developer Platform Hackathon. The backend ingests signals from GitHub, Slack, CRM, and roadmap data, writes structured records to 7 Notion databases, runs a deterministic rules engine, generates LLM-phrased Truth Diffs, and returns a unified `AletheiaState` to the frontend on every API call.

The project is greenfield — only spec files (CLAUDE.md, PRD.md) and an `env` file exist. No code, no package.json, no git repo. The frontend will be built separately; the backend must not touch frontend UI files.

**Build strategy:** Ship everything in one continuous session, 2 bundles max. Bundle A = scaffolding + Notion schema + all shared lib + all endpoints. Bundle B = demo hardening + reset + reliability sweep.

---

## Bundle A: Full Backend Build (Phases B1–B5)

### Phase 0: Scaffolding

**Prerequisite fixes:**
- `mv env .env`
- `git init` + `.gitignore` (node_modules, .env, .next, dist)
- `npm install -g pnpm`

**Monorepo structure:** `apps/web/` = Next.js app, `apps/worker/src/lib/` = shared business logic imported via tsconfig path aliases.

**Root `package.json`:** scripts for dev, build, setup-notion. devDependencies: tsx, typescript.

**`pnpm-workspace.yaml`:** packages: `["apps/*"]`

**`apps/web/package.json`:** next, react, react-dom, @notionhq/client, @anthropic-ai/sdk, zod, dotenv

**`apps/web/tsconfig.json`** path aliases: `@worker/*` → `../worker/src/*`, `@contracts/*` → `../../contracts/*`

**Directory tree:**
```
apps/web/src/app/api/state/
apps/web/src/app/api/demo/{trigger-pr,sync-crm,sync-roadmap,add-slack-signal,run-trial,generate-brief,reset}/
apps/worker/src/lib/
contracts/
data/demo/
scripts/
```

`pnpm install` from root.

### Phase B1: Notion Schema + Seed

**File: `scripts/setup-notion.ts`**

Creates all 7 Notion databases under `NOTION_PARENT_PAGE_ID`. Seeds Company Claim: "Enterprise launch is ready." (Verdict: unclear, Status: green). Prints all DB IDs + claim page ID to stdout.

| Database | Title prop | Other properties |
|---|---|---|
| Raw Signals | Name | Source(select), Type(rich_text), Entity(rich_text), Summary(rich_text), Evidence URL(url), Severity(select), Timestamp(date), Processed(checkbox) |
| Concepts | Name | Stage(select), Supporting Signals(rich_text), Related Claim(rich_text), Status(select) |
| Company Claims | Claim | Status(select), Related Concept(rich_text), Truth Diff(rich_text), Verdict(select), Last Checked(date) |
| Truth Diffs | Claim | Belief Lines(rich_text), Reality Lines(rich_text), Verdict(select), Evidence Receipts(rich_text), Recommended Actions(rich_text), Status(select) |
| Evidence Receipts | Title | Source(select), Summary(rich_text), Severity(select), Timestamp(date), Source URL(url), Related Claim(rich_text) |
| Approvals | Action | Type(rich_text), Risk Level(select), Draft(rich_text), Evidence(rich_text), Status(select) |
| Truth Briefs | Summary | Date(date), Top Risks(rich_text), Pending Approvals(rich_text), Verdict(select) |

Run script → append 8 env vars to `.env`.

### Phase B2: Shared Lib + State Contract

**Files (in dependency order):**

1. **`contracts/aletheia-state.ts`** — All types from PRD.md + Zod schemas. Types inferred via `z.infer<>`.
2. **`data/demo/demo-state.sample.json`** — Fallback AletheiaState (green, seed claim, empty arrays).
3. **`apps/worker/src/lib/notion-client.ts`** — Notion Client + `notionWrite<T>()` wrapper (400ms gap, 429 retry) + `getDbIds()`.
4. **`apps/worker/src/lib/syncLog.ts`** — `pushLog()`, `getLog()`, `clearLog()`.
5. **`apps/worker/src/lib/notion-utils.ts`** — Property extractors: `getTitle()`, `getSelect()`, `getRichText()`, `getDate()`, `getUrl()`, `getCheckbox()`.
6. **`apps/worker/src/lib/notion-writes.ts`** — All write helpers (createRawSignal, createEvidenceReceipt, createApproval, updateTruthDiff, updateCompanyClaim, createConcept, createTruthBrief). Each wraps in `notionWrite()`, calls `pushLog()`.
7. **`apps/worker/src/lib/rules.ts`** — `evaluateClaim(signals, claim): RuleViolation[]`. 4 deterministic rules, no LLM.
8. **`apps/worker/src/lib/generateTruthDiff.ts`** — LLM call (claude-sonnet-4-20250514) + Zod validate + hardcoded fallback if no API key or double Zod failure.
9. **`apps/worker/src/lib/runTruthAudit.ts`** — Queries signals + claim → `evaluateClaim()`.
10. **`apps/worker/src/lib/assembleState.ts`** — Queries all 7 DBs, maps to types, validates with Zod.

### Phase B3: PR Trigger

**Demo data:** `data/demo/github-pr.json`, `data/demo/notion-docs.json`

**`apps/worker/src/lib/githubPrMerged.ts`** — Create 2 signals, 2 receipts → runTruthAudit → generateTruthDiff → createApproval.

**`apps/web/src/app/api/state/route.ts`** — GET handler.
**`apps/web/src/app/api/demo/trigger-pr/route.ts`** — POST handler.

### Phase B4: CRM + Roadmap + Slack

**Demo data:** `data/demo/crm-records.json`, `data/demo/roadmap.json`, `data/demo/slack-signals.json`

**Worker functions:**
- `syncCRM.ts` — Raw Signal (crm, renewal_at_risk) + Evidence Receipt
- `syncRoadmap.ts` — Raw Signal (roadmap, dependency_conflict) + Evidence Receipt → status flips to red
- `syncSlackSignals.ts` — Raw Signal (slack, idea) + Concept (stage=raw)

**API routes:** `sync-crm/route.ts`, `sync-roadmap/route.ts`, `add-slack-signal/route.ts`

### Phase B5: Trial Mode

**`apps/worker/src/lib/putCompanyOnTrial.ts`** — LLM call → TrialResultSchema → hardcoded fallback.
**`apps/worker/src/lib/generateTruthBrief.ts`** — LLM summary → write to Truth Briefs DB.

**API routes:** `run-trial/route.ts`, `generate-brief/route.ts`

**LLM NOTE:** If ANTHROPIC_API_KEY is missing, all LLM calls immediately return hardcoded fallbacks. Full demo works without it.

**Validation after Bundle A:**
- Start dev server, curl every endpoint, verify Notion records created
- Every response is valid AletheiaState from real Notion queries

---

## Bundle B: Demo Hardening (Phase B6)

### Reset endpoint
**`apps/web/src/app/api/demo/reset/route.ts`**

1. `clearLog()`
2. Archive all pages across Raw Signals, Evidence Receipts, Approvals, Truth Diffs, Concepts (Notion `archived: true`)
3. Reset Company Claim: Status=green, Verdict=unclear
4. `assembleState()` → return clean green state

### Reliability sweep
Run full 7-step demo flow 3 times:
reset → trigger-pr → add-slack-signal → sync-crm → sync-roadmap → run-trial → state → reset

Target: < 30 seconds per full run, each endpoint < 4 seconds.

### Finalization
- Update `demo-state.sample.json` with real post-run state
- Create `.env.example` with all keys + placeholders
- `pnpm build` must pass cleanly
- Update README.md with setup instructions

**Final commit:** `feat: B6 — demo hardening, reset, reliability sweep — backend ready`

---

## Critical Files

| File | Purpose |
|---|---|
| `contracts/aletheia-state.ts` | Shared types + Zod schemas — every other file depends on this |
| `apps/worker/src/lib/notion-client.ts` | Notion client + rate-limit wrapper — all DB ops flow through this |
| `apps/worker/src/lib/assembleState.ts` | State assembly from 7 DBs — called by every endpoint |
| `apps/worker/src/lib/notion-writes.ts` | All Notion write helpers — most complex file (7 DB schemas) |
| `apps/worker/src/lib/rules.ts` | Deterministic rules engine — core business logic |
| `scripts/setup-notion.ts` | DB creation + seed — must run successfully first |

## Resolved Decisions

1. **env → .env**: Rename confirmed.
2. **ANTHROPIC_API_KEY may not be available**: All LLM calls check at runtime; fallback immediately if missing. Demo works fully without it.
3. **pnpm**: Install globally via `npm install -g pnpm`.
4. **ntn Workers**: Demo endpoints call shared lib directly from Next.js API routes (no HTTP to Workers). `ntn workers sync trigger` available for live sync during demo if needed.
5. **Performance**: Batch read queries with `Promise.all()` in assembleState. Write gap at 400ms. Target < 4s per endpoint.
