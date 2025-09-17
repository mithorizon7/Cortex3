import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Analyzing your context profile (regulation, data posture, market tempo)…",
  "Checking where human-in-the-loop adds the most certainty…",
  "Considering integration complexity versus likely time-to-value…",
  "Mapping quick-win pilots that create visible outcomes…",
  "Flagging continuity needs (latency thresholds, rollback paths)…",
  "Linking context to early governance and auditability…",
  "Estimating where retrieval beats re-building from scratch…",
  "Looking for pilots with clear before/after metrics…",
  "Scanning for customer-visible surfaces that are safe to improve…",
  "Weighing data sensitivity against model placement options…",
  "Preferring patterns that scale with systems of record…",
  "Translating context into next-step strategy implications…",
];

export function LoadingTips({ intervalMs = 2500 }: { intervalMs?: number }) {
  const [i, setI] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => setI((v) => (v + 1) % MESSAGES.length), intervalMs);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [intervalMs]);

  return (
    <div className="flex items-center gap-3" aria-live="polite" aria-busy="true">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <p className="text-sm text-muted-foreground">{MESSAGES[i]}</p>
    </div>
  );
}