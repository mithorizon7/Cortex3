import { useEffect, useRef, useState } from "react";

// Context Mirror 2.0: Phased loading with executive focus
const PHASE_MESSAGES = {
  analyzing: [
    "Analyzing your context profile (regulation, data posture, market tempo)…",
    "Checking where human-in-the-loop adds the most certainty…",
    "Weighing data sensitivity against model placement options…",
    "Considering integration complexity versus likely time-to-value…",
  ],
  drafting: [
    "Drafting your executive headline and strategic narrative…",
    "Mapping quick-win actions that create visible outcomes…",
    "Identifying key watch-outs and potential pitfalls…",
    "Considering scenario implications for budget and regulation…",
  ],
  polishing: [
    "Polishing insights for executive consumption…",
    "Linking context to next-step strategy implications…",
    "Ensuring compliance with leadership communication standards…",
    "Finalizing your Context Mirror 2.0 dashboard…",
  ]
};

// Legacy messages for backward compatibility
const LEGACY_MESSAGES = [
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

export function LoadingTips({ intervalMs = 2500, usePhased = true }: { intervalMs?: number; usePhased?: boolean }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'analyzing' | 'drafting' | 'polishing'>('analyzing');
  const timer = useRef<number | null>(null);
  const phaseTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!usePhased) {
      // Legacy behavior - cycle through all messages
      timer.current = window.setInterval(() => setI((v) => (v + 1) % LEGACY_MESSAGES.length), intervalMs);
    } else {
      // Context Mirror 2.0: Phased loading
      const phaseMessages = PHASE_MESSAGES[phase];
      timer.current = window.setInterval(() => {
        setI((v) => (v + 1) % phaseMessages.length);
      }, intervalMs);
      
      // Progress through phases over time
      phaseTimer.current = window.setInterval(() => {
        setPhase(currentPhase => {
          if (currentPhase === 'analyzing') return 'drafting';
          if (currentPhase === 'drafting') return 'polishing';
          return 'analyzing'; // Reset cycle
        });
        setI(0); // Reset message index when changing phase
      }, intervalMs * 4); // Change phase every 4 messages
    }

    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (phaseTimer.current) window.clearInterval(phaseTimer.current);
    };
  }, [intervalMs, usePhased, phase]);

  const currentMessages = usePhased ? PHASE_MESSAGES[phase] : LEGACY_MESSAGES;
  const currentMessage = currentMessages[i];
  
  // Phase indicator for Context Mirror 2.0
  const phaseLabels = {
    analyzing: 'Analyzing',
    drafting: 'Drafting', 
    polishing: 'Polishing'
  };

  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true" data-testid="loading-tips">
      {usePhased && (
        <div className="flex items-center justify-center gap-4" data-testid="loading-phases">
          <div className={`text-xs px-3 py-1 rounded-full transition-colors ${
            phase === 'analyzing' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {phaseLabels.analyzing}
          </div>
          <div className={`text-xs px-3 py-1 rounded-full transition-colors ${
            phase === 'drafting'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            {phaseLabels.drafting}
          </div>
          <div className={`text-xs px-3 py-1 rounded-full transition-colors ${
            phase === 'polishing'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            {phaseLabels.polishing}
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">{currentMessage}</p>
      </div>
    </div>
  );
}