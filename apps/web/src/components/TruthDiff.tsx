"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const FALLBACK_BELIEF = [
  "May Beta Readiness is green.",
  "Onboarding friction is mostly solved.",
  "Product Hunt beta announcement can go out next week.",
];

const FALLBACK_REALITY = [
  "Activation is 27% against a 40% target.",
  "14 invite-failure tickets appeared in 5 days.",
  "Mobile Safari hangs after OAuth redirect.",
  "Workspace permissions PR #417 is unresolved.",
  "Northstar Studio is blocked on team invites.",
  "Invite docs still reference the old OAuth flow.",
];

const FALLBACK_APPROVALS = [
  "Approve Workspace Invite Guide hotfix",
  "Escalate PR #417 before beta review",
  "Send design partners a transparent beta readiness update",
  "Delay Product Hunt beta announcement until invite fix lands",
];

export function TruthDiff({
  belief,
  reality,
  verdict,
  approvals,
}: {
  belief?: string[];
  reality?: string[];
  verdict?: string;
  approvals?: string[];
}) {
  const beliefLines = belief && belief.length > 0 ? belief : FALLBACK_BELIEF;
  const realityLines = reality && reality.length > 0 ? reality : FALLBACK_REALITY;
  const displayApprovals = approvals && approvals.length > 0 ? approvals : FALLBACK_APPROVALS;
  const verdictText = verdict || "contradicted";
  return (
    <section className="py-24 sm:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-warm-100 tracking-tight">
            The Truth Diff
          </h2>
          <p className="mt-3 text-warm-500 max-w-md mx-auto">
            What the company believes vs. what reality proves.
          </p>
        </motion.div>

        {/* Diff panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-2xl overflow-hidden border border-border-subtle bg-surface-raised shadow-2xl shadow-black/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-surface-overlay/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent-red/70" />
                <div className="w-3 h-3 rounded-full bg-accent-amber/70" />
                <div className="w-3 h-3 rounded-full bg-accent-green/70" />
              </div>
              <span className="ml-3 text-xs font-mono text-warm-500">
                truth-diff / may-beta-readiness.diff
              </span>
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1, duration: 0.4, type: "spring" }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                verdictText === "true"
                  ? "bg-accent-green/15 text-accent-green"
                  : verdictText === "unclear"
                    ? "bg-accent-amber/15 text-accent-amber"
                    : "bg-accent-red/15 text-accent-red"
              }`}
            >
              {verdictText === "true" ? "Confirmed" : verdictText === "unclear" ? "Unclear" : "Contradicted"}
            </motion.span>
          </div>

          {/* Diff body */}
          <div className="font-mono text-sm leading-relaxed">
            {/* Belief (removed) */}
            {beliefLines.map((line, i) => (
              <motion.div
                key={`b-${i}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                className="px-5 py-1.5 bg-accent-red/6 border-l-2 border-accent-red/40"
              >
                <span className="text-accent-red/60 select-none mr-2">
                  -
                </span>
                <span className="text-accent-red/80">{line}</span>
              </motion.div>
            ))}

            {/* Spacer */}
            <div className="px-5 py-1 text-warm-800 select-none">...</div>

            {/* Reality (added) */}
            {realityLines.map((line, i) => (
              <motion.div
                key={`r-${i}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
                className="px-5 py-1.5 bg-accent-green/6 border-l-2 border-accent-green/40"
              >
                <span className="text-accent-green/60 select-none mr-2">
                  +
                </span>
                <span className="text-accent-green/80">{line}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recommended Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 p-6 rounded-xl bg-surface-raised border border-border-subtle"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-accent-amber" />
            <span className="text-sm font-semibold text-warm-200">
              Recommended Approvals
            </span>
          </div>
          <div className="space-y-2.5">
            {displayApprovals.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-accent-amber shrink-0" />
                <span className="text-sm text-warm-400">{a}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
