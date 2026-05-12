"use client";

import { useEffect, useRef, useState } from "react";

export interface FingerPosition {
  x: number;
  y: number;
  isVisible: boolean;
}

export function useFingerTracking(): {
  position: FingerPosition;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
} {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);
  const landmarkerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [position, setPosition] = useState<FingerPosition>({ x: 0, y: 0, isVisible: false });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function init() {
      try {
        const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const resolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(resolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (cancelled) { landmarker.close(); return; }
        landmarkerRef.current = landmarker;

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setIsReady(true);
      } catch (err) {
        console.warn("[useFingerTracking] init failed:", err);
      }
    }

    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    let lastTime = -1;

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick);
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.currentTime === lastTime) return;
      lastTime = video.currentTime;

      const result = landmarker.detectForVideo(video, now);
      const hands = result.landmarks;

      if (!hands || hands.length === 0) {
        setPosition(p => ({ ...p, isVisible: false }));
        return;
      }

      // Landmark 8 = index finger tip
      const tip = hands[0][8];
      // Mirror x since camera is mirrored
      const x = (1 - tip.x) * window.innerWidth;
      const y = tip.y * window.innerHeight;

      setPosition({ x, y, isVisible: true });
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isReady]);

  return { position, videoRef, isReady };
}