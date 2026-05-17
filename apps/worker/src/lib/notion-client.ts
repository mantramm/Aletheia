import { Client } from "@notionhq/client";

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

function getEnvAny(...keys: string[]): string {
  for (const key of keys) {
    const val = process.env[key];
    if (val) return val;
  }
  throw new Error(`Missing env var: ${keys.join(" or ")}`);
}

export function getNotionClient(): Client {
  const auth = process.env.NOTION_API_TOKEN ?? process.env.NOTION_API_KEY;
  if (!auth) throw new Error("Missing env var: NOTION_API_TOKEN or NOTION_API_KEY");
  return new Client({ auth });
}

export const DB_IDS = {
  get rawSignals() { return getEnvAny("ALETHEIA_DB_RAW_SIGNALS", "NOTION_DB_RAW_SIGNALS"); },
  get concepts() { return getEnvAny("ALETHEIA_DB_CONCEPTS", "NOTION_DB_CONCEPTS"); },
  get companyClaims() { return getEnvAny("ALETHEIA_DB_COMPANY_CLAIMS", "NOTION_DB_COMPANY_CLAIMS"); },
  get truthDiffs() { return getEnvAny("ALETHEIA_DB_TRUTH_DIFFS", "NOTION_DB_TRUTH_DIFFS"); },
  get evidenceReceipts() { return getEnvAny("ALETHEIA_DB_EVIDENCE_RECEIPTS", "NOTION_DB_EVIDENCE_RECEIPTS"); },
  get approvals() { return getEnvAny("ALETHEIA_DB_APPROVALS", "NOTION_DB_APPROVALS"); },
  get truthBriefs() { return getEnvAny("ALETHEIA_DB_TRUTH_BRIEFS", "NOTION_DB_TRUTH_BRIEFS"); },
} as const;

export function getSeedClaimId(): string {
  return getEnvAny("ALETHEIA_SEED_CLAIM_ID", "NOTION_SEED_CLAIM_ID");
}

const WRITE_GAP_MS = 350;
const READ_GAP_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function notionWrite<T>(fn: () => Promise<T>): Promise<T> {
  await sleep(WRITE_GAP_MS);
  try {
    return await fn();
  } catch (err: any) {
    if (err?.status === 429) {
      await sleep(1000);
      return await fn();
    }
    throw err;
  }
}

export async function notionRead<T>(fn: () => Promise<T>): Promise<T> {
  await sleep(READ_GAP_MS);
  try {
    return await fn();
  } catch (err: any) {
    if (err?.status === 429) {
      await sleep(1000);
      return await fn();
    }
    throw err;
  }
}
