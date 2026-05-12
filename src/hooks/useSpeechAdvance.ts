"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface SpeechAdvanceResult {
  progress: number;
  isListening: boolean;
  spokenWords: Set<string>;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function useSpeechAdvance(pageText: string): SpeechAdvanceResult {
  const [progress, setProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [spokenWords, setSpokenWords] = useState<Set<string>>(new Set());

  const recognitionRef = useRef<any>(null);
  const targetWordsRef = useRef<Set<string>>(new Set());
  const sessionWordsRef = useRef<Set<string>>(new Set());
  const pageStartRef = useRef<number>(Date.now());
  const pageTextRef = useRef<string>(pageText);
  const MIN_TIME_MS = 5000;

  // Hard reset everything when page text changes
  useEffect(() => {
    pageTextRef.current = pageText;
    targetWordsRef.current = new Set(tokenize(pageText));
    sessionWordsRef.current = new Set();
    pageStartRef.current = Date.now();
    setProgress(0);
    setSpokenWords(new Set());

    // Kill existing recognition and restart fresh
    if (recognitionRef.current) {
      recognitionRef.current._manualStop = true;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    startFresh();
  }, [pageText]);

  function startFresh() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition._manualStop = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      setIsListening(false);
      // Only restart if not manually stopped
      if (!recognition._manualStop) {
        setTimeout(() => {
          if (recognitionRef.current === recognition) {
            recognition.start();
          }
        }, 300);
      }
    };

    recognition.onresult = (event: any) => {
      // Only process results from THIS session — start from index 0 each time
      // because we restarted fresh
      let newTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0].confidence > 0.4) {
          newTranscript += " " + result[0].transcript;
        }
      }

      const newWords = tokenize(newTranscript);
      const target = targetWordsRef.current;

      // Only add words that exist in the target
      newWords.forEach(w => {
        if (target.has(w)) sessionWordsRef.current.add(w);
      });

      const matched = sessionWordsRef.current.size;
      const ratio = target.size > 0 ? matched / target.size : 0;

      const elapsed = Date.now() - pageStartRef.current;
      const gated = elapsed >= MIN_TIME_MS ? ratio : ratio * (elapsed / MIN_TIME_MS);

      setSpokenWords(new Set(sessionWordsRef.current));
      setProgress(gated);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") console.warn("Speech error:", e.error);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      // ignore if already started
    }
  }

  // Initial start
  useEffect(() => {
    startFresh();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current._manualStop = true;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return { progress, isListening, spokenWords };
}