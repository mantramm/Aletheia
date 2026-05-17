"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface WordsPullUpProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export function WordsPullUp({ text, className = "", style }: WordsPullUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div
      ref={ref}
      className={`inline-flex flex-wrap ${className}`}
      style={style}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{
            duration: 0.7,
            delay: i * 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block"
          style={{ marginRight: i < words.length - 1 ? "0.25em" : 0 }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
