"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  text: string;
  spokenWords?: Set<string>;
  isCurrentPage?: boolean;
  caterpillarX?: number;
  caterpillarY?: number;
}

const PUSH_RADIUS = 80;
const PUSH_STRENGTH = 40;

export default function StoryText({
  text,
  spokenWords = new Set(),
  isCurrentPage = true,
  caterpillarX = -999,
  caterpillarY = -999,
}: Props) {
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>([]);
  const words = text.split(" ");

  // Recalculate word offsets when caterpillar moves
  useEffect(() => {
    if (caterpillarX === -999) return;

    const newOffsets = wordRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };

      const rect = el.getBoundingClientRect();
      const wordCenterX = rect.left + rect.width / 2;
      const wordCenterY = rect.top + rect.height / 2;

      const dx = wordCenterX - caterpillarX;
      const dy = wordCenterY - caterpillarY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > PUSH_RADIUS || dist === 0) return { x: 0, y: 0 };

      const force = (1 - dist / PUSH_RADIUS) * PUSH_STRENGTH;
      return {
        x: (dx / dist) * force,
        y: (dy / dist) * force,
      };
    });

    setOffsets(newOffsets);
  }, [caterpillarX, caterpillarY]);

  return (
    <p
      className="text-2xl leading-relaxed font-serif text-center"
      style={{ opacity: isCurrentPage ? 1 : 0.25 }}
    >
      {words.map((word, i) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, "");
        const spoken = isCurrentPage && spokenWords.has(clean);
        const offset = offsets[i] ?? { x: 0, y: 0 };

        return (
          <motion.span
            key={i}
            ref={el => { wordRefs.current[i] = el; }}
            animate={{
              x: offset.x,
              y: offset.y,
              color: spoken
                ? "#16a34a"
                : isCurrentPage
                ? "#1c1917"
                : "#9ca3af",
            }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 25 },
              y: { type: "spring", stiffness: 300, damping: 25 },
              color: { duration: 0.3 },
            }}
            style={{
              display: "inline-block",
              marginRight: "0.3em",
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </p>
  );
}