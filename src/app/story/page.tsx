"use client";

import { sampleStory } from "@/data/stories/sample";

export default function StoryPage() {
  const story = sampleStory;
  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-100">
      <div className="relative z-10 flex min-h-screen items-end justify-center pb-16">
        <div className="max-w-prose rounded-2xl bg-white/70 px-8 py-6 text-center text-lg text-stone-800 shadow backdrop-blur-sm">
          <p className="italic text-stone-400">{story.scenes[0].text}</p>
        </div>
      </div>
    </main>
  );
}