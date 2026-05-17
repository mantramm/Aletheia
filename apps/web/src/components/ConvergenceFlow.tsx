"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Building2,
  GitPullRequest,
  Headphones,
  BarChart3,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { Signal, Concept } from "@/lib/use-aletheia";

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  slack: MessageSquare,
  crm: Building2,
  github: GitPullRequest,
  support: Headphones,
  metrics: BarChart3,
  docs: FileText,
  notion: FileText,
  roadmap: BarChart3,
  browser: FileText,
};

const SOURCE_COLORS: Record<string, string> = {
  slack: "#e8a0bf",
  crm: "#fbbf24",
  github: "#60a5fa",
  support: "#f87171",
  metrics: "#fb923c",
  docs: "#a78bfa",
  notion: "#a78bfa",
  roadmap: "#fb923c",
  browser: "#60a5fa",
};

const FALLBACK_SIGNALS = [
  { id: "1", source: "slack" as const, type: "idea", label: "Slack", summary: '"Can we push the May beta harder?"', timestamp: "", severity: "low" as const },
  { id: "2", source: "crm" as const, type: "renewal", label: "CRM", summary: "Northstar Studio blocked, $72k ARR", timestamp: "", severity: "high" as const },
  { id: "3", source: "github" as const, type: "pr", label: "GitHub", summary: "PR #417 workspace permissions", timestamp: "", severity: "high" as const },
  { id: "4", source: "crm" as const, type: "support", label: "Support", summary: "14 invite failure tickets", timestamp: "", severity: "high" as const },
  { id: "5", source: "roadmap" as const, type: "metrics", label: "Metrics", summary: "Activation 27% vs 40% target", timestamp: "", severity: "high" as const },
  { id: "6", source: "notion" as const, type: "stale_doc", label: "Docs", summary: "Workspace Invite Guide stale", timestamp: "", severity: "medium" as const },
];

const FALLBACK_CONCEPTS = [
  { id: "1", title: "Beta Readiness", stage: "emerging", supportingSignalIds: [] },
  { id: "2", title: "Activation Sprint", stage: "raw", supportingSignalIds: [] },
  { id: "3", title: "Workspace Invites", stage: "needs_decision", supportingSignalIds: [] },
  { id: "4", title: "Design Partner Risk", stage: "raw", supportingSignalIds: [] },
];

export function ConvergenceFlow({
  isActive,
  signals,
  concepts,
  claim,
  verdict,
}: {
  isActive: boolean;
  signals?: Signal[];
  concepts?: Concept[];
  claim?: { text: string; verdict: string } | null;
  verdict?: string;
}) {
  const displaySignals = signals && signals.length > 0 ? signals.slice(0, 6) : FALLBACK_SIGNALS;
  const displayConcepts = concepts && concepts.length > 0 ? concepts : FALLBACK_CONCEPTS;
  const claimText = claim?.text || "May Beta Readiness is green.";
  const verdictText = verdict || (isActive ? "contradicted" : "unclear");

  const stageLabels = ["Signals", "Concepts", "Claim", "Reality", "Truth"];

  const realities = displaySignals
    .filter((s) => s.severity === "high")
    .slice(0, 4)
    .map((s) => s.summary.slice(0, 30));

  return (
    <section className="py-24 sm:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-warm-100 tracking-tight">
            How truth converges
          </h2>
          <p className="mt-3 text-warm-500 max-w-lg mx-auto">
            Scattered signals become tested claims. Every edge tells a story.
          </p>
        </motion.div>

        <div className="hidden md:flex justify-between max-w-5xl mx-auto mb-8 px-4">
          {stageLabels.map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-xs font-semibold uppercase tracking-widest text-warm-600"
            >
              {label}
            </motion.span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_auto_1fr_auto_0.8fr_auto_1fr_auto_0.6fr] items-start gap-y-6 md:gap-x-3">
          {/* Signals */}
          <div className="space-y-2.5">
            {displaySignals.map((s, i) => {
              const Icon = SOURCE_ICONS[s.source] || FileText;
              const color = SOURCE_COLORS[s.source] || "#9e8e72";
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                  className="group flex items-start gap-2.5 p-3 rounded-xl bg-surface-raised border border-border-subtle hover:border-warm-600 transition-all duration-300 cursor-default"
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-warm-600 block">
                      {s.label || s.source}
                    </span>
                    <span className="text-xs text-warm-300 leading-snug block mt-0.5">
                      {s.summary}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="hidden md:flex items-center justify-center self-center">
            <ChevronRight className="w-5 h-5 text-warm-700" />
          </div>

          {/* Concepts */}
          <div className="space-y-2.5 self-center">
            {displayConcepts.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="px-4 py-2.5 rounded-xl bg-surface-raised border border-warm-800/40 text-warm-300 text-sm font-medium text-center"
              >
                {c.title}
              </motion.div>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-center self-center">
            <ChevronRight className="w-5 h-5 text-warm-700" />
          </div>

          {/* Claim */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="self-center"
          >
            <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-green/10 to-accent-green/5 border border-accent-green/20 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-green/60 block mb-2">
                Company Claim
              </span>
              <p className="text-base font-semibold text-warm-100 leading-snug">
                &ldquo;{claimText}&rdquo;
              </p>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center justify-center self-center">
            <ChevronRight className="w-5 h-5 text-warm-700" />
          </div>

          {/* Reality */}
          <div className="space-y-2 self-center">
            {(realities.length > 0
              ? realities
              : ["Activation down", "Invite flow broken", "Docs stale", "Customer blocked"]
            ).map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                className="px-3 py-2 rounded-lg bg-accent-red/8 border border-accent-red/15 text-accent-red text-xs font-medium"
              >
                {r}
              </motion.div>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-center self-center">
            <ChevronRight className="w-5 h-5 text-warm-700" />
          </div>

          {/* Verdict */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 0.6, type: "spring" }}
            className="self-center"
          >
            <div
              className={`p-4 rounded-2xl text-center border-2 ${
                verdictText === "contradicted"
                  ? "bg-accent-red/10 border-accent-red/30"
                  : verdictText === "unclear"
                    ? "bg-accent-amber/10 border-accent-amber/30"
                    : "bg-accent-green/10 border-accent-green/30"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-warm-500 block mb-1">
                Verdict
              </span>
              <span
                className={`text-lg font-black tracking-wide uppercase ${
                  verdictText === "contradicted"
                    ? "text-accent-red"
                    : verdictText === "unclear"
                      ? "text-accent-amber"
                      : "text-accent-green"
                }`}
              >
                {verdictText}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
