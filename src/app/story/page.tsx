"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { hungryCaterpillarStory } from "@/data/stories/hungry-caterpillar";
import { useSpeechAdvance } from "@/hooks/useSpeechAdvance";
import { useFingerTracking } from "@/hooks/useFingerTracking";
import CaterpillarCanvas from "@/components/caterpillar/CaterpillarCanvas";
import StoryText from "@/components/scene/StoryText";

function bgColorForScene(background: string): string {
  if (background.includes("night")) return "#1a1a2e";
  if (background.includes("morning")) return "#fef3c7";
  if (background.includes("butterfly")) return "#fce7f3";
  if (background.includes("cocoon")) return "#d1fae5";
  return "#e0f2fe";
}

export default function StoryPage() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const hasAdvancedRef = useRef(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const page = hungryCaterpillarStory[currentPageIndex]!;
  const isLastPage = currentPageIndex === hungryCaterpillarStory.length - 1;
  const bgColor = bgColorForScene(page.background);

  const { progress, isListening, spokenWords } = useSpeechAdvance(page.text);
  const { position, videoRef: handVideoRef } = useFingerTracking();

  function advance() {
    if (!isLastPage) setCurrentPageIndex(i => i + 1);
  }

  useEffect(() => {
    if (progress >= 0.8 && !hasAdvancedRef.current) {
      hasAdvancedRef.current = true;
      advance();
    }
    if (progress === 0) hasAdvancedRef.current = false;
  }, [progress]);

  useEffect(() => {
    const pageEl = pageRefs.current[currentPageIndex];
    const container = scrollContainerRef.current;
    if (!pageEl || !container) return;
    const targetScroll = pageEl.offsetTop - window.innerHeight / 2 + pageEl.offsetHeight / 2;
    container.scrollTo({ top: targetScroll, behavior: "smooth" });
  }, [currentPageIndex]);

  return (
    <motion.div
      className="relative w-screen h-screen overflow-hidden"
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    >
      <video
        ref={handVideoRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
        playsInline
        muted
        aria-hidden
      />

      {/* Scrollable text column */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-scroll"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex flex-col items-center px-8 py-48">
          {hungryCaterpillarStory.map((p, i) => {
            const isCurrent = i === currentPageIndex;
            const isPast = i < currentPageIndex;

            return (
              <div
                key={p.id}
                ref={el => { pageRefs.current[i] = el; }}
                className="w-full max-w-2xl mb-24"
                style={{ opacity: isCurrent ? 1 : isPast ? 0.2 : 0.45, transition: "opacity 0.6s ease" }}
              >
                {isCurrent && p.foodItems.length > 0 && (
                  <div className="flex gap-4 mb-6 justify-center">
                    {p.foodItems.map((food) => (
                      <motion.img
                        key={food.name}
                        src={`/assets/pngs/${food.name.replace(" ", "")}.png`}
                        alt={food.name}
                        className="w-16 h-16 object-contain"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", delay: 0.3 }}
                      />
                    ))}
                  </div>
                )}

                <StoryText
                  text={p.text}
                  spokenWords={isCurrent ? spokenWords : new Set()}
                  isCurrentPage={isCurrent}
                  caterpillarX={isCurrent ? position.x : -999}
                  caterpillarY={isCurrent ? position.y : -999}
                />
              </div>
            );
          })}
        </div>
      </div>

      <CaterpillarCanvas
        fingerX={position.isVisible ? position.x : window.innerWidth / 2}
        fingerY={position.isVisible ? position.y : window.innerHeight / 2}
        segments={6}
      />

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <span className="text-xs font-medium tabular-nums opacity-40">
          {currentPageIndex + 1} / {hungryCaterpillarStory.length}
        </span>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 h-[3px]">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress * 100}%`, backgroundColor: "rgba(22,163,74,0.6)" }}
        />
      </div>

      {isListening && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs opacity-40">reading aloud</span>
        </div>
      )}

      {!isLastPage && (
        <button
          onClick={advance}
          className="fixed bottom-8 right-8 z-30 rounded-full px-5 py-3 text-sm font-medium shadow-lg"
          style={{ backgroundColor: "rgba(28,25,23,0.8)", color: "#fff" }}
        >
          Next
        </button>
      )}
    </motion.div>
  );
}