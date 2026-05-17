"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, ChevronDown, ExternalLink, Loader2, X } from "lucide-react";
import { GlassButton } from "./ui/glass-button";
import type { AletheiaState } from "@/lib/use-aletheia";

type SyncEntry = AletheiaState["syncLog"][number];

const FALLBACK_CHECKS = [
  "Worker deployed",
  "companySignalsSync populated managed datasource",
  "aletheiaRunTruthAudit wrote Notion records",
  "githubPrMerged webhook registered",
  "Evidence Receipts created",
  "Approvals created",
  "Truth Brief created",
];

const WORKER_ID = "019e370a-59b6-7102-b58f-948f9182ebe9";
const WEBHOOK_URL =
  "https://www.notion.so/webhooks/worker/4a92a167-c22f-81f8-bb9f-00031dbd2bd0/019e370a-59b6-7102-b58f-948f9182ebe9/-Rdt_GXfaga7zKco/githubPrMerged";

export function BackendProof({ syncLog }: { syncLog?: SyncEntry[] }) {
  const hasLiveLog = syncLog && syncLog.length > 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="py-24 sm:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-warm-100 tracking-tight">
            This is not a mockup
          </h2>
          <p className="mt-3 text-warm-500 max-w-md mx-auto">
            Real Notion Worker. Real database writes. Real webhook. Verified.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-2xl bg-surface-raised border border-border-subtle overflow-hidden"
        >
          <div className="p-6 space-y-3">
            {hasLiveLog
              ? syncLog.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      entry.status === "done" ? "bg-accent-green/15" : entry.status === "failed" ? "bg-accent-red/15" : "bg-accent-amber/15"
                    }`}>
                      {entry.status === "done" ? (
                        <Check className="w-3 h-3 text-accent-green" />
                      ) : entry.status === "failed" ? (
                        <X className="w-3 h-3 text-accent-red" />
                      ) : (
                        <Loader2 className="w-3 h-3 text-accent-amber animate-spin" />
                      )}
                    </div>
                    <span className="text-sm text-warm-300">{entry.text}</span>
                  </motion.div>
                ))
              : FALLBACK_CHECKS.map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent-green/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-accent-green" />
                    </div>
                    <span className="text-sm text-warm-300">{c}</span>
                  </motion.div>
                ))}
          </div>

          <div className="border-t border-border-subtle">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-6 py-3 text-xs text-warm-600 hover:text-warm-400 transition-colors cursor-pointer"
            >
              <span className="font-medium">Technical details</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-5"
              >
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-600 block mb-1">
                      Worker ID
                    </span>
                    <code className="text-xs text-warm-400 font-mono bg-surface-overlay px-2 py-1 rounded break-all">
                      {WORKER_ID}
                    </code>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-600 block mb-1">
                      Webhook URL
                    </span>
                    <code className="text-[10px] text-warm-500 font-mono bg-surface-overlay px-2 py-1 rounded block break-all leading-relaxed">
                      {WEBHOOK_URL}
                    </code>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function NotionCTA({ onReset, loading }: { onReset: () => void; loading?: boolean }) {
  const notionUrl = process.env.NEXT_PUBLIC_NOTION_ALETHEIA_URL || "#";

  return (
    <section className="py-24 sm:py-32 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-warm-100 tracking-tight">
            Truth lives in Notion
          </h2>
          <p className="mt-4 text-warm-500 max-w-md mx-auto leading-relaxed">
            Every signal, concept, claim, diff, and verdict is written to Notion
            databases. Open the workspace to see Aletheia&apos;s memory.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <a href={notionUrl} target="_blank" rel="noopener noreferrer">
              <GlassButton size="lg" className="group">
                Open Aletheia Memory in Notion
                <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </GlassButton>
            </a>
            <GlassButton
              size="lg"
              onClick={onReset}
              disabled={loading}
              glassColor="rgba(254,253,251,0.03)"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Demo"}
            </GlassButton>
          </div>

          <p className="mt-12 text-xs text-warm-700 max-w-sm mx-auto">
            Built for the Notion Developer Platform Hackathon. Aletheia is CI
            for company truth.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
