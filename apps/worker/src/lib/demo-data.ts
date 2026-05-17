import type { Signal } from "./types";

export const DEMO_SCENARIO = "may_beta_readiness" as const;

export type DemoClaim = {
  key: string;
  title: string;
  category: string;
  owner: string;
  concept: string;
};

export type DemoSignal = Omit<Signal, "id"> & {
  key: string;
  claimKey: string;
  evidenceTitle: string;
  evidenceSummary: string;
  approvalAction?: string;
};

export type CompanySignalRecord = {
  id: string;
  category: "goal" | "customer" | "roadmap" | "doc" | "metric" | "risk" | "support" | "meeting" | "slack";
  title: string;
  source: Signal["source"];
  claimKey: string;
  department: "company" | "product" | "growth" | "customers" | "engineering" | "support" | "security";
  summary: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
  owner: string;
  status: string;
};

export const DEMO_CLAIMS: DemoClaim[] = [
  {
    key: "may-beta-readiness",
    title: "May Beta Readiness is green.",
    category: "Beta Readiness",
    owner: "maya@mosaiclabs.co",
    concept: "May Beta Readiness",
  },
  {
    key: "activation-sprint",
    title: "Activation Sprint solved onboarding friction.",
    category: "Activation Sprint",
    owner: "eli@mosaiclabs.co",
    concept: "Activation Sprint",
  },
  {
    key: "trust-security",
    title: "Trust & Security is ready for design partners.",
    category: "Trust & Security",
    owner: "noor@mosaiclabs.co",
    concept: "Trust & Security Readiness",
  },
];

export const COMPANY_SIGNAL_RECORDS: CompanySignalRecord[] = [
  {
    id: "goal-company-beta-activation",
    category: "goal",
    title: "Company Goal: 40% beta activation by May 31",
    source: "notion",
    claimKey: "may-beta-readiness",
    department: "company",
    summary: "Mosaic Labs committed to 40% activated beta teams by May 31 without concierge onboarding.",
    severity: "medium",
    timestamp: "2026-05-01T09:00:00Z",
    owner: "maya@mosaiclabs.co",
    status: "at_risk",
  },
  {
    id: "metric-beta-activation-27",
    category: "metric",
    title: "Activation is 27% against 40% target",
    source: "crm",
    claimKey: "may-beta-readiness",
    department: "growth",
    summary: "Beta activation is 27%; mobile Safari OAuth drop-off is 41%; 9 of 33 invited teams reached a shared workspace.",
    severity: "high",
    timestamp: "2026-05-15T17:00:00Z",
    owner: "rhea@mosaiclabs.co",
    status: "red",
  },
  {
    id: "support-invite-failures",
    category: "support",
    title: "Invite failures spiked across design partners",
    source: "slack",
    claimKey: "activation-sprint",
    department: "support",
    summary: "Support logged 14 invite failure tickets in 5 days, including 6 from design partners blocked after OAuth redirect.",
    severity: "high",
    timestamp: "2026-05-14T20:20:00Z",
    owner: "talia@mosaiclabs.co",
    status: "open",
  },
  {
    id: "github-pr-417",
    category: "roadmap",
    title: "GitHub PR #417: workspace permission boundary refactor",
    source: "github",
    claimKey: "activation-sprint",
    department: "engineering",
    summary: "PR #417 is unmerged and blocks the workspace invite fix. Files touched: apps/workspaces/permissions.ts, apps/auth/oauth.ts.",
    severity: "high",
    timestamp: "2026-05-16T08:22:00Z",
    owner: "platform-team",
    status: "blocked",
  },
  {
    id: "doc-workspace-invite-guide",
    category: "doc",
    title: "Workspace Invite Guide references old OAuth flow",
    source: "notion",
    claimKey: "activation-sprint",
    department: "product",
    summary: "The Workspace Invite Guide was last edited before the OAuth callback change and still describes the old accept-invite flow.",
    severity: "medium",
    timestamp: "2026-05-12T10:00:00Z",
    owner: "docs@mosaiclabs.co",
    status: "stale",
  },
  {
    id: "customer-northstar-studio",
    category: "customer",
    title: "Northstar Studio blocked on invites and SOC2-lite packet",
    source: "crm",
    claimKey: "trust-security",
    department: "customers",
    summary: "Northstar Studio is a $72k ARR design partner waiting on workspace invites, SSO direction, and the SOC2-lite security packet.",
    severity: "high",
    timestamp: "2026-05-13T16:30:00Z",
    owner: "sarah@mosaiclabs.co",
    status: "blocked",
  },
  {
    id: "customer-atlas-collective",
    category: "customer",
    title: "Atlas Collective needs SSO before legal review",
    source: "crm",
    claimKey: "trust-security",
    department: "customers",
    summary: "Atlas Collective will not start legal review until SSO timing and data retention answers are documented.",
    severity: "high",
    timestamp: "2026-05-14T15:45:00Z",
    owner: "sarah@mosaiclabs.co",
    status: "blocked",
  },
  {
    id: "roadmap-sso-q3",
    category: "roadmap",
    title: "SSO is planned for Q3, not May beta",
    source: "roadmap",
    claimKey: "trust-security",
    department: "engineering",
    summary: "Roadmap shows SSO / Enterprise Auth target date as 2026-09-30 while May beta security copy implies near-term readiness.",
    severity: "high",
    timestamp: "2026-05-10T11:00:00Z",
    owner: "platform-team",
    status: "planned",
  },
  {
    id: "doc-security-faq-old-auth",
    category: "doc",
    title: "Security FAQ references old auth behavior",
    source: "notion",
    claimKey: "trust-security",
    department: "security",
    summary: "Security FAQ still references the old token refresh behavior and has no SOC2-lite packet owner.",
    severity: "medium",
    timestamp: "2026-05-09T12:10:00Z",
    owner: "noor@mosaiclabs.co",
    status: "stale",
  },
  {
    id: "meeting-beta-review",
    category: "meeting",
    title: "Founder beta review: launch announcement pressure",
    source: "notion",
    claimKey: "may-beta-readiness",
    department: "company",
    summary: "Founder review notes propose announcing the May beta next Tuesday despite activation, invite, and security readiness gaps.",
    severity: "medium",
    timestamp: "2026-05-16T18:00:00Z",
    owner: "maya@mosaiclabs.co",
    status: "needs_decision",
  },
];

export const CORE_DEMO_SIGNALS: DemoSignal[] = COMPANY_SIGNAL_RECORDS
  .filter((record) => record.severity !== "low")
  .map((record) => ({
    key: record.id,
    claimKey: record.claimKey,
    source: record.source,
    type: record.category === "metric"
      ? "metric_miss"
      : record.category === "support"
        ? "support_escalation"
        : record.category === "doc"
          ? "stale_doc"
          : record.category === "roadmap"
            ? "dependency_conflict"
            : record.category === "customer"
              ? "customer_blocker"
              : record.category,
    label: record.title,
    summary: record.summary,
    timestamp: record.timestamp,
    severity: record.severity,
    evidenceTitle: record.title,
    evidenceSummary: record.summary,
    approvalAction: approvalActionFor(record.id),
  }));

function approvalActionFor(recordId: string): string | undefined {
  const approvals: Record<string, string> = {
    "metric-beta-activation-27": "Move May beta readiness from green to at-risk until activation recovers.",
    "support-invite-failures": "Escalate workspace invite failures before the next beta cohort email.",
    "github-pr-417": "Prioritize PR #417 and block activation sprint sign-off until merged.",
    "customer-northstar-studio": "Send Northstar Studio a security and invite remediation update.",
    "roadmap-sso-q3": "Remove SSO-ready wording from design partner security materials.",
  };
  return approvals[recordId];
}
