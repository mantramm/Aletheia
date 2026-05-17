# Aletheia — CI for Company Truth

Aletheia tests what a startup believes against what actually happened. It turns scattered signals into a structured truth pipeline backed by Notion.

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Fill in NOTION_API_KEY, NOTION_WORKSPACE_ID, NOTION_PARENT_PAGE_ID
# Share the parent page with your "aletheia" Notion integration

# 3. Create Notion databases and seed claim
npx tsx scripts/setup-notion.ts
# This creates 7 databases and adds their IDs to .env

# 4. (Optional) Add ANTHROPIC_API_KEY for LLM-powered Truth Diff and Trial Mode

# 5. Start dev server
pnpm dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/state` | Returns current AletheiaState from Notion |
| POST | `/api/demo/reset` | Reset to clean green state |
| POST | `/api/demo/trigger-pr` | Simulate GitHub PR merge |
| POST | `/api/demo/add-slack-signal` | Add enterprise idea signal |
| POST | `/api/demo/sync-crm` | Sync CRM renewal data |
| POST | `/api/demo/sync-roadmap` | Sync roadmap conflicts |
| POST | `/api/demo/run-trial` | Put the company on trial |
| POST | `/api/demo/generate-brief` | Generate truth brief |

## Demo Flow

1. `POST /api/demo/reset` — clean green state
2. `POST /api/demo/trigger-pr` — PR changes auth, docs drift detected
3. `POST /api/demo/add-slack-signal` — enterprise idea concept created
4. `POST /api/demo/sync-crm` — Acme $48k renewal at risk
5. `POST /api/demo/sync-roadmap` — SSO vs launch conflict, status turns red
6. `POST /api/demo/run-trial` — "The People vs. Enterprise Launch"

All endpoints return `AletheiaState` and write real records to Notion.

## Architecture

```
apps/web/src/app/api/  — Next.js API routes (frontend-facing HTTP)
apps/worker/src/lib/   — Shared business logic (rules engine, Notion writes, LLM calls)
contracts/             — Shared TypeScript types and Zod schemas
data/demo/             — Demo data fixtures
scripts/               — Notion setup script
```
