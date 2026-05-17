import { z } from "zod";

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
  supportingSignalIds: string[];
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
  syncLog: {
    id: string;
    text: string;
    status: "pending" | "done" | "failed";
    timestamp: string;
  }[];
  trial?: {
    title: string;
    charges: string[];
    verdict: string;
    sentence: string[];
    voiceUrl?: string;
  };
};

// ─── Zod schemas ────────────────────────────────────────────────────────────

const SignalSourceSchema = z.enum([
  "github",
  "slack",
  "crm",
  "roadmap",
  "notion",
  "browser",
]);

const SeveritySchema = z.enum(["low", "medium", "high"]);

export const SignalSchema = z.object({
  id: z.string(),
  source: SignalSourceSchema,
  type: z.string(),
  label: z.string(),
  summary: z.string(),
  timestamp: z.string(),
  severity: SeveritySchema,
});

export const ConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  stage: z.enum(["raw", "emerging", "needs_decision", "executing", "shipped"]),
  supportingSignalIds: z.array(z.string()),
});

export const EvidenceReceiptSchema = z.object({
  id: z.string(),
  source: SignalSourceSchema,
  title: z.string(),
  summary: z.string(),
  severity: SeveritySchema,
  notionUrl: z.string().optional(),
});

export const ApprovalSchema = z.object({
  id: z.string(),
  action: z.string(),
  riskLevel: SeveritySchema,
  status: z.enum(["needs_approval", "approved", "rejected"]),
  evidenceIds: z.array(z.string()),
});

export const SyncLogEntrySchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.enum(["pending", "done", "failed"]),
  timestamp: z.string(),
});

export const TrialResultSchema = z.object({
  title: z.string(),
  charges: z.array(z.string()).min(1).max(5),
  verdict: z.string(),
  sentence: z.array(z.string()).min(1).max(5),
  voiceUrl: z.string().optional(),
});

export const AletheiaStateSchema = z.object({
  status: z.enum(["green", "yellow", "red"]),
  activeClaim: z.object({
    id: z.string(),
    text: z.string(),
    verdict: z.enum(["true", "contradicted", "unclear"]),
  }),
  signals: z.array(SignalSchema),
  concepts: z.array(ConceptSchema),
  truthDiff: z.object({
    belief: z.array(z.string()),
    reality: z.array(z.string()),
    verdict: z.string(),
    recommendedActions: z.array(z.string()),
  }),
  evidence: z.array(EvidenceReceiptSchema),
  approvals: z.array(ApprovalSchema),
  syncLog: z.array(SyncLogEntrySchema),
  trial: TrialResultSchema.optional(),
});

// ─── Rule violation type (used by rules engine, not part of AletheiaState) ──

export type RuleViolation = {
  rule: string;
  severity: "low" | "medium" | "high";
  detail: string;
};

export const RuleViolationSchema = z.object({
  rule: z.string(),
  severity: SeveritySchema,
  detail: z.string(),
});
