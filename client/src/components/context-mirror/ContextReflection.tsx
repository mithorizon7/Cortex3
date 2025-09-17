import { sanitizeInsight, violatesPolicy } from "./sanitizeInsight";

export function ContextReflection({ insight, disclaimer }: { insight: string; disclaimer: string }) {
  const clean = sanitizeInsight(insight);
  const bad = violatesPolicy(clean);
  if (bad) {
    // Render a graceful fallback; your container should re-request the model in parallel
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your context suggests clear opportunities alongside constraints. We're refreshing this brief to
          state those implications in narrative form. Please hold for a moment…
        </p>
      </div>
    );
  }

  const [p1, p2] = clean.split(/\n{2,}/);
  return (
    <div className="space-y-4">
      <p className="text-base leading-relaxed text-foreground font-medium">{p1}</p>
      <p className="text-base leading-relaxed text-foreground font-medium">{p2}</p>
      <p className="text-xs text-muted-foreground mt-3 italic border-t pt-3">{disclaimer}</p>
    </div>
  );
}