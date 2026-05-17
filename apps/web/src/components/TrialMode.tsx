"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Gavel, X, Scale, Loader2 } from "lucide-react";
import { TruthPet } from "./TruthPet";
import { GlassButton } from "./ui/glass-button";
import type { Trial } from "@/lib/use-aletheia";

const FALLBACK_CHARGES = [
  "Claiming beta readiness while activation is 13 points below target.",
  "Letting invite failures block design partners.",
  "Planning launch comms before docs and permissions are aligned.",
  "Calling onboarding solved while Safari OAuth still breaks.",
];

const FALLBACK_SENTENCES = [
  "Fix invite flow.",
  "Update docs.",
  "Notify design partners.",
  "Delay the announcement.",
];

export function TrialMode({
  onRunTrial,
  trial,
  loading,
}: {
  onRunTrial: () => void;
  trial?: Trial;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const charges = trial?.charges && trial.charges.length > 0 ? trial.charges : FALLBACK_CHARGES;
  const sentences = trial?.sentence && trial.sentence.length > 0 ? trial.sentence : FALLBACK_SENTENCES;
  const trialTitle = trial?.title || "The People vs. May Beta Readiness";
  const trialVerdict = trial?.verdict || "Guilty of premature confidence.";

  function handleOpen() {
    setOpen(true);
    setRevealed(false);
    onRunTrial();
    setTimeout(() => setRevealed(true), 1800);
  }

  return (
    <section id="trial" className="py-24 sm:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-warm-100 tracking-tight">
            Still not convinced?
          </h2>
          <p className="mt-3 text-warm-500 max-w-md mx-auto">
            Put the company&apos;s claim on trial. Let the evidence speak.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex justify-center"
        >
          <GlassButton size="lg" onClick={handleOpen} disabled={loading} className="group">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Gavel className="w-5 h-5 text-accent-amber group-hover:rotate-[-15deg] transition-transform duration-300" />
            )}
            Put This On Trial
          </GlassButton>
        </motion.div>
      </div>

      {/* Trial Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-2xl sm:max-h-[85vh] overflow-y-auto rounded-2xl bg-surface-raised border border-border-subtle shadow-2xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-warm-500 hover:text-warm-200 hover:bg-warm-800 transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8 sm:p-10">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <div className="flex justify-center mb-4">
                    <TruthPet mood="judge" size={80} />
                  </div>
                  <Scale className="w-6 h-6 text-accent-amber mx-auto mb-3" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-warm-50 tracking-tight">
                    {trialTitle}
                  </h3>
                  <p className="mt-2 text-sm text-warm-500">
                    Mosaic Labs, Case No. 2026-05-17
                  </p>
                </motion.div>

                <div className="mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent-amber/70 block mb-4">
                    Charges
                  </span>
                  <div className="space-y-3">
                    {charges.map((charge, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.5 + i * 0.15,
                          duration: 0.4,
                        }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-surface-overlay border border-border-subtle"
                      >
                        <span className="text-xs font-bold text-accent-amber/60 shrink-0 mt-0.5 font-mono">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-warm-300 leading-relaxed">
                          {charge}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 150,
                      }}
                    >
                      <div className="text-center mb-6 p-6 rounded-xl bg-accent-red/8 border border-accent-red/20">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-warm-500 block mb-2">
                          Verdict
                        </span>
                        <p className="text-xl font-bold text-accent-red">
                          {trialVerdict}
                        </p>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-warm-500 block mb-3">
                          Sentence
                        </span>
                        <div className="flex flex-wrap justify-center gap-2">
                          {sentences.map((s, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: i * 0.1,
                                duration: 0.3,
                              }}
                              className="px-3 py-1.5 rounded-lg bg-warm-800 border border-warm-700 text-warm-300 text-xs font-medium"
                            >
                              {s}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center"
                      >
                        <span className="text-[10px] font-medium text-accent-green/60 uppercase tracking-wider">
                          Verdict written to Notion
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!revealed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Scale className="w-6 h-6 text-accent-amber/50 mx-auto" />
                    </motion.div>
                    <p className="mt-3 text-sm text-warm-600">
                      Deliberating...
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
