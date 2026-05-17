"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Webhook, SearchCheck, Loader2 } from "lucide-react";
import { WordsPullUp } from "./ui/words-pull-up";
import { GlassButton } from "./ui/glass-button";
import { SplineScene } from "./ui/splite";
import { Spotlight } from "./ui/spotlight";

const badges = [
  { label: "Notion Worker deployed", icon: Shield },
  { label: "Sync live", icon: Zap },
  { label: "Webhook registered", icon: Webhook },
  { label: "Truth audit verified", icon: SearchCheck },
];

export function Hero({
  onRunCheck,
  loading,
  status,
}: {
  onRunCheck: () => void;
  loading?: boolean;
  status?: "green" | "yellow" | "red";
}) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" size={400} />

      <div className="absolute inset-0 z-0 opacity-60">
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface/40 via-transparent to-surface/90 z-[1]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface/70 via-surface/30 to-transparent z-[1]" />

      {/* Status indicator */}
      {status && status !== "green" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 z-20"
        >
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              status === "red"
                ? "bg-accent-red/10 border-accent-red/30 text-accent-red"
                : "bg-accent-amber/10 border-accent-amber/30 text-accent-amber"
            }`}
          >
            {status === "red" ? "Contradicted" : "Warning"}
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 pb-6 sm:pb-10 z-10">
        <div className="grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 lg:col-span-7">
            <h1 className="font-bold leading-[0.9] tracking-[-0.04em] text-[14vw] sm:text-[12vw] md:text-[10vw] lg:text-[8vw] xl:text-[7vw] text-warm-50">
              <WordsPullUp text="CI for company truth." />
            </h1>
          </div>

          <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 pb-2 lg:pb-4">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-warm-400 leading-relaxed"
            >
              Aletheia turns scattered startup signals into claims, tests them
              against reality, and writes the evidence back to Notion.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-3"
            >
              <GlassButton
                size="default"
                onClick={onRunCheck}
                disabled={loading}
                className="group"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Run Reality Check
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warm-50/10 transition-transform group-hover:scale-110">
                      <ArrowRight className="h-3.5 w-3.5 text-warm-200" />
                    </span>
                  </>
                )}
              </GlassButton>

              <GlassButton
                size="default"
                onClick={() =>
                  document.getElementById("trial")?.scrollIntoView({ behavior: "smooth" })
                }
                glassColor="rgba(254,253,251,0.03)"
              >
                See the Trial
              </GlassButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-wrap gap-2 mt-1"
            >
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-warm-900/40 border border-warm-800/30 text-warm-500 text-[10px] font-medium backdrop-blur-sm"
                >
                  <badge.icon className="w-3 h-3 text-accent-green/70" />
                  {badge.label}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
