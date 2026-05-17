"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SplineScene } from "./ui/splite";

type PetMood = "calm" | "curious" | "anxious" | "judge";

const MOOD_SCENES: Record<PetMood, string> = {
  calm: "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  curious: "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  anxious: "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  judge: "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
};

const MOOD_COLORS = {
  calm: { border: "border-accent-green/20", bg: "bg-accent-green/5", label: "Calm", color: "text-accent-green" },
  curious: { border: "border-accent-amber/20", bg: "bg-accent-amber/5", label: "Curious", color: "text-accent-amber" },
  anxious: { border: "border-accent-red/20", bg: "bg-accent-red/5", label: "Anxious", color: "text-accent-red" },
  judge: { border: "border-purple-400/20", bg: "bg-purple-400/5", label: "Judge", color: "text-purple-400" },
};

export function TruthPet({
  mood = "calm",
  size = 120,
  className = "",
  showLabel = false,
}: {
  mood?: PetMood;
  size?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const config = MOOD_COLORS[mood];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        className={`relative rounded-2xl overflow-hidden ${config.border} ${config.bg} border`}
        style={{ width: size, height: size }}
        animate={{
          y: mood === "anxious" ? [0, -4, 0, 3, 0] : [0, -3, 0],
          rotate: mood === "judge" ? [0, -1, 1, 0] : 0,
        }}
        transition={{
          duration: mood === "anxious" ? 0.7 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <SplineScene
          scene={MOOD_SCENES[mood]}
          className="w-full h-full"
        />
      </motion.div>

      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.span
            key={mood}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`text-[10px] font-bold uppercase tracking-widest ${config.color}`}
          >
            {config.label}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}
