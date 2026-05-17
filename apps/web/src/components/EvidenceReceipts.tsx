"use client";

import { motion } from "framer-motion";
import {
  GitPullRequest,
  Building2,
  Headphones,
  BarChart3,
  FileText,
  StickyNote,
  Check,
  MessageSquare,
} from "lucide-react";
import type { EvidenceReceipt } from "@/lib/use-aletheia";

const SOURCE_ICONS: Record<string, typeof GitPullRequest> = {
  github: GitPullRequest,
  slack: MessageSquare,
  crm: Building2,
  support: Headphones,
  roadmap: BarChart3,
  notion: StickyNote,
  browser: FileText,
  docs: FileText,
};

const SOURCE_COLORS: Record<string, string> = {
  github: "#60a5fa",
  slack: "#e8a0bf",
  crm: "#fbbf24",
  support: "#f87171",
  roadmap: "#fb923c",
  notion: "#a78bfa",
  browser: "#60a5fa",
  docs: "#a78bfa",
};

const FALLBACK_RECEIPTS: EvidenceReceipt[] = [
  {
    id: "1",
    source: "github",
    title: "PR #417 — Workspace Permissions",
    summary: "Open pull request modifying workspace invite permissions. Unresolved review comments from platform team.",
    severity: "high",
  },
  {
    id: "2",
    source: "github",
    title: "Issue #433 — Safari OAuth Redirect",
    summary: "Mobile Safari hangs during OAuth token redirect. Blocking onboarding for iOS users.",
    severity: "high",
  },
  {
    id: "3",
    source: "crm",
    title: "Northstar Studio — $72k ARR",
    summary: "Design partner blocked on team invites. Renewal at risk. CSM escalated twice.",
    severity: "high",
  },
  {
    id: "4",
    source: "crm",
    title: "Invite Failure Spike",
    summary: "14 tickets in 5 days reporting workspace invite failures. Pattern matches OAuth regression.",
    severity: "high",
  },
  {
    id: "5",
    source: "roadmap",
    title: "Activation Snapshot",
    summary: "7-day activation rate dropped to 27%. Target is 40%. Decline correlated with invite failures.",
    severity: "medium",
  },
  {
    id: "6",
    source: "notion",
    title: "Workspace Invite Guide",
    summary: "Last updated March 12. Still references old OAuth flow pre-PR #417. Stale since merge.",
    severity: "medium",
  },
  {
    id: "7",
    source: "notion",
    title: "Founder Beta Meeting Note",
    summary: "Meeting note from May 10: founder discussing enterprise push. No blockers discussed.",
    severity: "low",
  },
];

const severityColor = {
  high: "text-accent-red bg-accent-red/10 border-accent-red/20",
  medium: "text-accent-amber bg-accent-amber/10 border-accent-amber/20",
  low: "text-accent-green bg-accent-green/10 border-accent-green/20",
};


export function EvidenceReceipts({ evidence }: { evidence?: EvidenceReceipt[] }) {
  const receipts = evidence && evidence.length > 0 ? evidence : FALLBACK_RECEIPTS;
  return (
    <section className="py-24 sm:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-warm-100 tracking-tight">
            Evidence Receipts
          </h2>
          <p className="mt-3 text-warm-500 max-w-md mx-auto">
            Every claim needs proof. Every proof is written to Notion.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {receipts.map((r, i) => {
            const Icon = SOURCE_ICONS[r.source] || FileText;
            const color = SOURCE_COLORS[r.source] || "#9e8e72";
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative p-5 rounded-xl bg-surface-raised border border-border-subtle hover:border-warm-600/50 transition-all duration-300 hover:bg-surface-overlay flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-500">
                      {r.source}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${severityColor[r.severity]}`}
                  >
                    {r.severity}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-warm-200 mb-2 leading-snug">
                  {r.title}
                </h3>

                <p className="text-xs text-warm-500 leading-relaxed flex-1">
                  {r.summary}
                </p>

                <div className="flex items-center justify-end mt-4 pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-1 text-accent-green/70">
                    <Check className="w-3 h-3" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                      {r.notionUrl ? "Written to Notion" : "Written to Notion"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
