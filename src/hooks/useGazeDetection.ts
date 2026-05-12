"use client";

import { useEffect, useRef, useState } from "react";

// NormalizedLandmark shape inlined from @mediapipe/tasks-vision to avoid any
// static import of that package — its vision_bundle.mjs uses dynamic import()
// internally, which Turbopack cannot resolve during the server-side build pass.
type NormalizedLandmark = { x: number; y: number; z: number; visibility?: number };

export type GazeZone = "top" | "middle" | "bottom";

export interface GazeDetectionResult {
  gazeZone: GazeZone;
  /** 0 → 1 over DWELL_MS of sustained bottom gaze */
  dwellProgress: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DWELL_MS = 1500;

// WASM runtime and model must be version-matched.
// Bump both if you upgrade @mediapipe/tasks-vision in package.json.
const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// ── Iris landmark indices (MediaPipe 478-point mesh) ──────────────────────────
//
// Vertical eye geometry:
//   TOP landmark sits at the upper eyelid centre.
//   BOT landmark sits at the lower eyelid centre.
//   IRIS is the iris ring centre (only present in the 478-point model).
//
// We compute (iris.y - top.y) / (bot.y - top.y) for each eye.
//   ≈ 0.0  → looking up
//   ≈ 0.5  → looking straight ahead
//   ≈ 1.0  → looking down
//
const L_EYE_TOP = 159;
const L_EYE_BOT = 145;
const L_IRIS    = 468;
const R_EYE_TOP = 386;
const R_EYE_BOT = 374;
const R_IRIS    = 473;



// Thresholds tuned against a seated user with the screen ~60 cm away.
const BOTTOM_THRESHOLD = 0.55;
const TOP_THRESHOLD    = 0.45;


// ── Pure gaze calculation ─────────────────────────────────────────────────────

function getGazeZone(landmarks: NormalizedLandmark[]): GazeZone {
  // The 478-point model includes iris landmarks; bail if they're absent.
  if (landmarks.length < 478) return "middle";

  const lTop  = landmarks[L_EYE_TOP]!;
  const lBot  = landmarks[L_EYE_BOT]!;
  const lIris = landmarks[L_IRIS]!;
  const rTop  = landmarks[R_EYE_TOP]!;
  const rBot  = landmarks[R_EYE_BOT]!;
  const rIris = landmarks[R_IRIS]!;

  const lHeight = lBot.y - lTop.y;
  const rHeight = rBot.y - rTop.y;

  // Skip if eye appears closed or blink-blurred (height collapses near zero).
  if (lHeight < 0.005 || rHeight < 0.005) return "middle";

  const lRatio = (lIris.y - lTop.y) / lHeight;
  const rRatio = (rIris.y - rTop.y) / rHeight;
  const avg    = (lRatio + rRatio) / 2;

  console.log("iris avg:", avg.toFixed(3));

  if (avg > BOTTOM_THRESHOLD) return "bottom";
  if (avg < TOP_THRESHOLD)    return "top";
  return "middle";
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGazeDetection(): GazeDetectionResult {
  const videoRef         = useRef<HTMLVideoElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef    = useRef<any>(null);
  const rafRef           = useRef<number>(0);
  const dwellStartRef    = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const [gazeZone,      setGazeZone]      = useState<GazeZone>("middle");
  const [dwellProgress, setDwellProgress] = useState(0);
  const [isReady,       setIsReady]       = useState(false);

  // ── Initialise FaceLandmarker + webcam ──────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function init() {
      try {
        // Dynamic import keeps @mediapipe/tasks-vision out of the server bundle
        // entirely — Next.js / Turbopack never attempts to resolve its internal
        // dynamic imports at build time.
        /** @ts-ignore */
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

        const resolver = await FilesetResolver.forVisionTasks(WASM_CDN);
        const landmarker = await FaceLandmarker.createFromOptions(resolver, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1,
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
        // Gaze detection is an enhancement — log and degrade gracefully.
        console.warn("[useGazeDetection] Could not initialise:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  // ── Detection loop — starts once webcam + model are both ready ──────────────
  useEffect(() => {
    if (!isReady) return;

    function tick(now: DOMHighResTimeStamp) {
      rafRef.current = requestAnimationFrame(tick);

      const video      = videoRef.current;
      const landmarker = landmarkerRef.current;

      // Skip if video hasn't produced a new frame yet.
      if (!video || !landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (video.currentTime === lastVideoTimeRef.current) return;
      lastVideoTimeRef.current = video.currentTime;

      const result = landmarker.detectForVideo(video, now);
      const faces  = result.faceLandmarks;

      if (!faces || faces.length === 0) {
        dwellStartRef.current = null;
        setGazeZone("middle");
        setDwellProgress(0);
        return;
      }

      const zone = getGazeZone(faces[0]!);
      setGazeZone(zone);

      if (zone === "bottom") {
        if (dwellStartRef.current === null) dwellStartRef.current = now;
        const elapsed = now - dwellStartRef.current;
        setDwellProgress(Math.min(1, elapsed / DWELL_MS));
      } else {
        dwellStartRef.current = null;
        setDwellProgress(0);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isReady]);

  return { gazeZone, dwellProgress, videoRef, isReady };
}