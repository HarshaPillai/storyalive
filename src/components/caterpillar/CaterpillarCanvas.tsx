"use client";

import { useEffect, useRef } from "react";

interface Segment {
  x: number;
  y: number;
  angle: number;
}

const SEGMENT_SIZE = 60;
const SEGMENT_DISTANCE = 40;
const BODY_VARIANTS = 7;

export default function CaterpillarCanvas({
  fingerX,
  fingerY,
  segments = 6,
}: {
  fingerX: number;
  fingerY: number;
  segments?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chainRef = useRef<Segment[]>([]);
  const imagesRef = useRef<{
    head: HTMLImageElement;
    bodies: HTMLImageElement[];
  } | null>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: fingerX, y: fingerY });

  // Load images once
  useEffect(() => {
    const head = new Image();
    head.src = "/assets/pngs/head.png";

    const bodies = Array.from({ length: BODY_VARIANTS }, (_, i) => {
      const img = new Image();
      img.src = `/assets/pngs/bodyVarient${i + 1}.png`;
      return img;
    });

    imagesRef.current = { head, bodies };

    // Init chain positions
    chainRef.current = Array.from({ length: segments + 1 }, (_, i) => ({
      x: 300 - i * SEGMENT_DISTANCE,
      y: 200,
      angle: 0,
    }));
  }, [segments]);

  // Update target when finger moves
  useEffect(() => {
    targetRef.current = { x: fingerX, y: fingerY };
  }, [fingerX, fingerY]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const chain = chainRef.current;
      if (!chain.length) return;

      // Move head toward finger
      const head = chain[0]!;
      const dx = targetRef.current.x - head.x;
      const dy = targetRef.current.y - head.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        head.x += (dx / dist) * Math.min(dist, 8);
        head.y += (dy / dist) * Math.min(dist, 8);
      }
      head.angle = Math.atan2(dy, dx);

      // Chain physics — each segment follows the one ahead
      for (let i = 1; i < chain.length; i++) {
        const prev = chain[i - 1]!;
        const curr = chain[i]!;
        const ddx = prev.x - curr.x;
        const ddy = prev.y - curr.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        const angle = Math.atan2(ddy, ddx);

        if (d > SEGMENT_DISTANCE) {
          curr.x = prev.x - Math.cos(angle) * SEGMENT_DISTANCE;
          curr.y = prev.y - Math.sin(angle) * SEGMENT_DISTANCE;
        }
        curr.angle = angle;
      }

      const imgs = imagesRef.current;
      if (!imgs) return;

      // Draw back to front (tail first)
      for (let i = chain.length - 1; i >= 0; i--) {
        const seg = chain[i]!;
        const img = i === 0
          ? imgs.head
          : imgs.bodies[(i - 1) % BODY_VARIANTS]!;

        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.rotate(seg.angle + Math.PI / 2);
        ctx.drawImage(
          img,
          -SEGMENT_SIZE / 2,
          -SEGMENT_SIZE / 2,
          SEGMENT_SIZE,
          SEGMENT_SIZE
        );
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: "100%", height: "100%" }}
    />
  );
}