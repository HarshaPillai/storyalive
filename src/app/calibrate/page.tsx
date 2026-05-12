"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechAdvance } from "@/hooks/useSpeechAdvance";
import { useFingerTracking } from "@/hooks/useFingerTracking";
import CaterpillarCanvas from "@/components/caterpillar/CaterpillarCanvas";

type Step = "intro" | "camera" | "voice" | "hands" | "ready";
const STEPS: Step[] = ["intro", "camera", "voice", "hands", "ready"];
const TEST_PHRASE = "in the light of the moon a little egg lay on a leaf";

export default function CalibratePage() {
  const [step, setStep] = useState<Step>("intro");
  const [cameraReady, setCameraReady] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [handsReady, setHandsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { progress, isListening } = useSpeechAdvance(
    step === "voice" ? TEST_PHRASE : ""
  );

  const {
    position,
    videoRef: handVideoRef,
    isReady: handTrackingReady,
  } = useFingerTracking();

  // Camera setup for camera step
  useEffect(() => {
    if (step !== "camera") return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraReady(true);
      })
      .catch(() => setCameraReady(false));
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [step]);

  // Auto advance voice step
  useEffect(() => {
    if (step === "voice" && progress >= 0.8) {
      setVoiceReady(true);
      setTimeout(() => setStep("hands"), 800);
    }
  }, [progress, step]);

  // Auto advance hands step when finger detected
  useEffect(() => {
    if (step === "hands" && position.isVisible && !handsReady) {
      setHandsReady(true);
    }
  }, [position.isVisible, step, handsReady]);

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* Hidden video for hand tracking */}
      <video
        ref={handVideoRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
        playsInline
        muted
        aria-hidden
      />

      {/* Caterpillar follows finger on hands step */}
      {step === "hands" && (
        <CaterpillarCanvas
          fingerX={position.isVisible ? position.x : window.innerWidth / 2}
          fingerY={position.isVisible ? position.y : window.innerHeight / 2}
          segments={4}
        />
      )}

      {/* Step dots */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {STEPS.map((s) => (
          <div
            key={s}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                s === step
                  ? "#fff"
                  : STEPS.indexOf(s) < STEPS.indexOf(step)
                  ? "rgba(255,255,255,0.4)"
                  : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Intro */}
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm"
          >
            <div className="text-6xl">📖</div>
            <h1 className="text-3xl font-medium tracking-tight">
              Let's get you set up
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              StoryAlive uses your camera, voice, and hands to bring the story
              to life. We'll check each one — takes about 60 seconds.
            </p>
            <button
              onClick={next}
              className="mt-4 rounded-full bg-white text-black px-8 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Let's go
            </button>
          </motion.div>
        )}

        {/* Camera */}
        {step === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm"
          >
            <div className="text-4xl">👁</div>
            <h2 className="text-2xl font-medium">Camera check</h2>
            <p className="text-white/50 text-sm">
              Make sure your face is visible and well lit.
            </p>
            <div className="relative w-64 h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]"
                playsInline
                muted
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/30 text-xs">Waiting for camera...</p>
                </div>
              )}
              {cameraReady && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-white/70">Camera active</span>
                </div>
              )}
            </div>
            <button
              onClick={next}
              disabled={!cameraReady}
              className="rounded-full bg-white text-black px-8 py-3 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Looks good
            </button>
          </motion.div>
        )}

        {/* Voice */}
        {step === "voice" && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center max-w-md"
          >
            <div className="text-4xl">🎤</div>
            <h2 className="text-2xl font-medium">Voice check</h2>
            <p className="text-white/50 text-sm">
              Read this sentence out loud — the story advances when you finish each page.
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-lg font-serif italic leading-relaxed text-white/80">
              "In the light of the moon a little egg lay on a leaf."
            </div>
            <div className="w-full max-w-xs">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-400 rounded-full"
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-white/30">
                  {isListening ? "Listening..." : "Starting..."}
                </span>
                <span className="text-xs text-white/30">
                  {Math.round(progress * 100)}%
                </span>
              </div>
            </div>
            {voiceReady && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-400 text-sm"
              >
                <span>✓</span>
                <span>Voice detected — moving on</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Hands */}
        {step === "hands" && (
          <motion.div
            key="hands"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm z-10"
          >
            <div className="text-4xl">✋</div>
            <h2 className="text-2xl font-medium">Hand check</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Point your index finger at the camera and move it around.
              The caterpillar will follow your finger.
            </p>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
              <div
                className="w-2 h-2 rounded-full transition-colors duration-300"
                style={{ backgroundColor: position.isVisible ? "#4ade80" : "#374151" }}
              />
              <span className="text-sm text-white/60">
                {!handTrackingReady
                  ? "Loading hand tracking..."
                  : position.isVisible
                  ? "Finger detected!"
                  : "Show your index finger"}
              </span>
            </div>

            {handsReady && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-400 text-sm"
              >
                <span>✓</span>
                <span>Hand detected</span>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                onClick={next}
                disabled={!handsReady}
                className="rounded-full bg-white text-black px-8 py-3 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {handsReady ? "Continue" : "Waiting..."}
              </button>
              <button
                onClick={next}
                className="rounded-full border border-white/20 text-white/50 px-6 py-3 text-sm hover:text-white/80 transition-colors"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* Ready */}
        {step === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-6xl"
            >
              🐛
            </motion.div>
            <h2 className="text-3xl font-medium">All set!</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Read each page aloud and guide your caterpillar with your finger.
              The story will turn the pages when you finish reading.
            </p>
            <div className="flex flex-col gap-2 w-full text-left">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <span>🎤</span>
                <span className="text-sm text-white/70">Read aloud to turn pages</span>
                <span className="ml-auto text-green-400 text-xs">✓</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <span>👁</span>
                <span className="text-sm text-white/70">Camera active</span>
                <span className="ml-auto text-green-400 text-xs">✓</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <span>✋</span>
                <span className="text-sm text-white/70">Guide caterpillar with finger</span>
                <span className="ml-auto text-green-400 text-xs">
                  {handsReady ? "✓" : "—"}
                </span>
              </div>
            </div>
            <a
              href="/story"
              className="mt-2 rounded-full bg-white text-black px-8 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Begin the story
            </a>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}