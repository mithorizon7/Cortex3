import { sanitizeInsight, sanitizeSituationAssessment, violatesPolicy } from "./sanitizeInsight";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Target } from "lucide-react";
import type { SituationAssessment, SituationAssessmentWithDiagnostics, GenerationMetadata } from "@shared/schema";
import { DiagnosticModal } from "./DiagnosticModal";

interface SituationReflectionProps {
  // Legacy format (backward compatibility)
  insight?: string;
  disclaimer?: string;
  
  // Situation Assessment 2.0 format
  mirror?: SituationAssessment;
  
  // Enhanced format with diagnostics
  mirrorWithDiagnostics?: SituationAssessmentWithDiagnostics;
  
  // Retry callback for diagnostic modal
  onRetry?: () => void;
}

export function SituationReflection(props: SituationReflectionProps) {
  // Prioritize enhanced format with diagnostics
  if (props.mirrorWithDiagnostics) {
    return renderSituationAssessmentWithDiagnostics(props.mirrorWithDiagnostics, props.onRetry);
  }
  
  // Handle legacy format for backward compatibility
  if (props.insight && props.disclaimer && !props.mirror) {
    return renderLegacyFormat(props.insight, props.disclaimer);
  }
  
  // Handle Situation Assessment 2.0 format
  if (props.mirror) {
    return renderSituationAssessment2(props.mirror);
  }
  
  return null;
}

function renderLegacyFormat(insight: string, disclaimer: string) {
  const clean = sanitizeInsight(insight);
  const bad = violatesPolicy(clean);
  if (bad) {
    return renderFallbackMessage();
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

function renderSituationAssessment2(mirror: SituationAssessment) {
  const sanitized = sanitizeSituationAssessment(mirror);
  
  // Policy violation check
  if (sanitized.insight && violatesPolicy(sanitized.insight)) {
    return renderFallbackMessage();
  }

  // Render Situation Assessment 2.0 executive dashboard
  return (
    <div className="space-y-6">
      {/* Executive Headline */}
      {sanitized.headline && (
        <div className="space-y-1" data-testid="situation-headline">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {sanitized.headline}
          </h3>
        </div>
      )}

      {/* Situation Insight (Core narrative) */}
      {sanitized.insight && (
        <div className="space-y-4" data-testid="situation-insight">
          {sanitized.insight.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed text-foreground font-medium">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      )}

      {/* Actions & Watch-outs Grid - matching plan's layout */}
      {(sanitized.actions?.length || sanitized.watchouts?.length) && (
        <div className="grid md:grid-cols-2 gap-4 pt-2" data-testid="situation-actions-watchouts">
          {sanitized.actions?.length ? (
            <div data-testid="situation-actions">
              <div className="text-sm font-medium mb-2">Leadership actions</div>
              <div className="flex flex-wrap gap-2">
                {sanitized.actions.map((action, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-1 rounded-full border bg-card"
                    data-testid={`action-chip-${index}`}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {sanitized.watchouts?.length ? (
            <div data-testid="situation-watchouts">
              <div className="text-sm font-medium mb-2">Watch‑outs</div>
              <div className="flex flex-wrap gap-2">
                {sanitized.watchouts.map((watchout, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-1 rounded-full border bg-card"
                    data-testid={`watchout-chip-${index}`}
                  >
                    {watchout}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Scenario Lens - matching plan's approach */}
      {sanitized.scenarios && (sanitized.scenarios.if_regulation_tightens || sanitized.scenarios.if_budgets_tighten) && (
        <div className="pt-2 border-t" data-testid="situation-scenarios">
          <div className="text-sm font-medium mb-2">Scenario lens</div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {sanitized.scenarios.if_regulation_tightens && (
              <li data-testid="scenario-regulation">{sanitized.scenarios.if_regulation_tightens}</li>
            )}
            {sanitized.scenarios.if_budgets_tighten && (
              <li data-testid="scenario-budget">{sanitized.scenarios.if_budgets_tighten}</li>
            )}
          </ul>
        </div>
      )}

      {/* Disclaimer - simplified styling */}
      {sanitized.disclaimer && (
        <p className="text-xs text-muted-foreground mt-2 italic" data-testid="situation-disclaimer">
          {sanitized.disclaimer}
        </p>
      )}
    </div>
  );
}

function renderSituationAssessmentWithDiagnostics(mirrorWithDiagnostics: SituationAssessmentWithDiagnostics, onRetry?: () => void) {
  const mirror: SituationAssessment = {
    headline: mirrorWithDiagnostics.headline,
    insight: mirrorWithDiagnostics.insight,
    actions: mirrorWithDiagnostics.actions,
    watchouts: mirrorWithDiagnostics.watchouts,
    scenarios: mirrorWithDiagnostics.scenarios,
    disclaimer: mirrorWithDiagnostics.disclaimer
  };
  
  const sanitized = sanitizeSituationAssessment(mirror);
  
  // Policy violation check
  if (sanitized.insight && violatesPolicy(sanitized.insight)) {
    return renderFallbackMessage();
  }

  // Render Situation Assessment 2.0 executive dashboard with diagnostic source button
  return (
    <div className="space-y-6">
      {/* Executive Headline */}
      {sanitized.headline && (
        <div className="space-y-1" data-testid="situation-headline">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {sanitized.headline}
          </h3>
        </div>
      )}

      {/* Situation Insight (Core narrative) */}
      {sanitized.insight && (
        <div className="space-y-4" data-testid="situation-insight">
          {sanitized.insight.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed text-foreground font-medium">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      )}

      {/* Actions & Watch-outs Grid - matching plan's layout */}
      {(sanitized.actions?.length || sanitized.watchouts?.length) && (
        <div className="grid md:grid-cols-2 gap-4 pt-2" data-testid="situation-actions-watchouts">
          {sanitized.actions?.length ? (
            <div data-testid="situation-actions">
              <div className="text-sm font-medium mb-2">Leadership actions</div>
              <div className="flex flex-wrap gap-2">
                {sanitized.actions.map((action, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-1 rounded-full border bg-card"
                    data-testid={`action-chip-${index}`}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {sanitized.watchouts?.length ? (
            <div data-testid="situation-watchouts">
              <div className="text-sm font-medium mb-2">Watch‑outs</div>
              <div className="flex flex-wrap gap-2">
                {sanitized.watchouts.map((watchout, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-1 rounded-full border bg-card"
                    data-testid={`watchout-chip-${index}`}
                  >
                    {watchout}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Scenario Lens - matching plan's approach */}
      {sanitized.scenarios && (sanitized.scenarios.if_regulation_tightens || sanitized.scenarios.if_budgets_tighten) && (
        <div className="pt-2 border-t" data-testid="situation-scenarios">
          <div className="text-sm font-medium mb-2">Scenario lens</div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {sanitized.scenarios.if_regulation_tightens && (
              <li data-testid="scenario-regulation">{sanitized.scenarios.if_regulation_tightens}</li>
            )}
            {sanitized.scenarios.if_budgets_tighten && (
              <li data-testid="scenario-budget">{sanitized.scenarios.if_budgets_tighten}</li>
            )}
          </ul>
        </div>
      )}

      {/* Disclaimer with Source Button */}
      <div className="flex items-end justify-between">
        <div className="flex-1">
          {sanitized.disclaimer && (
            <p className="text-xs text-muted-foreground italic" data-testid="situation-disclaimer">
              {sanitized.disclaimer}
            </p>
          )}
        </div>
        <div className="ml-4">
          <DiagnosticModal debug={mirrorWithDiagnostics.debug} onRetry={onRetry} />
        </div>
      </div>
    </div>
  );
}

function renderFallbackMessage() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Your context suggests clear opportunities alongside constraints. We're refreshing this brief to
        state those implications in narrative form. Please hold for a moment…
      </p>
    </div>
  );
}