import { sanitizeInsight, sanitizeSituationAssessment, violatesPolicy } from "./sanitizeInsight";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Target, CheckCircle, TrendingUp } from "lucide-react";
import type { SituationAssessment, SituationAssessmentWithDiagnostics, GenerationMetadata } from "@shared/schema";
import { DiagnosticModal } from "./DiagnosticModal";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-8">
      {/* Executive Headline - Hero Treatment */}
      {sanitized.headline && (
        <div className="space-y-2 pb-4 border-l-4 border-primary pl-4" data-testid="situation-headline">
          <h3 className="text-2xl font-bold text-foreground leading-tight">
            {sanitized.headline}
          </h3>
        </div>
      )}

      {/* Situation Insight (Core narrative) - Enhanced Typography */}
      {sanitized.insight && (
        <div className="space-y-5 bg-muted/30 p-6 rounded-lg" data-testid="situation-insight">
          {sanitized.insight.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed text-foreground" style={{ lineHeight: '1.8' }}>
              {paragraph.trim()}
            </p>
          ))}
        </div>
      )}

      {/* Actions & Watch-outs - Enhanced Card Treatment */}
      {(sanitized.actions?.length || sanitized.watchouts?.length) && (
        <div className="grid md:grid-cols-2 gap-6 pt-2" data-testid="situation-actions-watchouts">
          {sanitized.actions?.length ? (
            <div data-testid="situation-actions" className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <div className="p-1.5 rounded-md bg-[hsl(var(--success-lighter))] dark:bg-[hsl(var(--success-light))]">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--success-text))] dark:text-[hsl(var(--success))]" />
                </div>
                <span>Leadership Actions</span>
              </div>
              <div className="space-y-2">
                {sanitized.actions.map((action, index) => (
                  <Card 
                    key={index}
                    className="border-l-4 border-l-[hsl(var(--success))] hover-elevate transition-all duration-200"
                    data-testid={`action-chip-${index}`}
                  >
                    <CardContent className="p-3 flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-[hsl(var(--success-text))] dark:text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed text-foreground">
                        {action}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
          {sanitized.watchouts?.length ? (
            <div data-testid="situation-watchouts" className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                </div>
                <span>Watch-outs</span>
              </div>
              <div className="space-y-2">
                {sanitized.watchouts.map((watchout, index) => (
                  <Card 
                    key={index}
                    className="border-l-4 border-l-amber-500 hover-elevate transition-all duration-200"
                    data-testid={`watchout-chip-${index}`}
                  >
                    <CardContent className="p-3 flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed text-foreground">
                        {watchout}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Scenario Lens - Enhanced Visual Treatment */}
      {sanitized.scenarios && (sanitized.scenarios.if_regulation_tightens || sanitized.scenarios.if_budgets_tighten) && (
        <div className="pt-6 border-t space-y-3" data-testid="situation-scenarios">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
            <span>Scenario Lens</span>
          </div>
          <div className="space-y-2">
            {sanitized.scenarios.if_regulation_tightens && (
              <Card 
                className="border-l-4 border-l-blue-500"
                data-testid="scenario-regulation"
              >
                <CardContent className="p-3">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                    If regulation tightens
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {sanitized.scenarios.if_regulation_tightens}
                  </p>
                </CardContent>
              </Card>
            )}
            {sanitized.scenarios.if_budgets_tighten && (
              <Card 
                className="border-l-4 border-l-blue-500"
                data-testid="scenario-budget"
              >
                <CardContent className="p-3">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                    If budgets tighten
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {sanitized.scenarios.if_budgets_tighten}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer - Subtle Styling */}
      {sanitized.disclaimer && (
        <p className="text-xs text-muted-foreground italic pt-4 border-t" data-testid="situation-disclaimer">
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
    <div className="space-y-8">
      {/* Executive Headline - Hero Treatment */}
      {sanitized.headline && (
        <div className="space-y-2 pb-4 border-l-4 border-primary pl-4" data-testid="situation-headline">
          <h3 className="text-2xl font-bold text-foreground leading-tight">
            {sanitized.headline}
          </h3>
        </div>
      )}

      {/* Situation Insight (Core narrative) - Enhanced Typography */}
      {sanitized.insight && (
        <div className="space-y-5 bg-muted/30 p-6 rounded-lg" data-testid="situation-insight">
          {sanitized.insight.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed text-foreground" style={{ lineHeight: '1.8' }}>
              {paragraph.trim()}
            </p>
          ))}
        </div>
      )}

      {/* Actions & Watch-outs - Enhanced Card Treatment */}
      {(sanitized.actions?.length || sanitized.watchouts?.length) && (
        <div className="grid md:grid-cols-2 gap-6 pt-2" data-testid="situation-actions-watchouts">
          {sanitized.actions?.length ? (
            <div data-testid="situation-actions" className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <div className="p-1.5 rounded-md bg-[hsl(var(--success-lighter))] dark:bg-[hsl(var(--success-light))]">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--success-text))] dark:text-[hsl(var(--success))]" />
                </div>
                <span>Leadership Actions</span>
              </div>
              <div className="space-y-2">
                {sanitized.actions.map((action, index) => (
                  <Card 
                    key={index}
                    className="border-l-4 border-l-[hsl(var(--success))] hover-elevate transition-all duration-200"
                    data-testid={`action-chip-${index}`}
                  >
                    <CardContent className="p-3 flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-[hsl(var(--success-text))] dark:text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed text-foreground">
                        {action}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
          {sanitized.watchouts?.length ? (
            <div data-testid="situation-watchouts" className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                </div>
                <span>Watch-outs</span>
              </div>
              <div className="space-y-2">
                {sanitized.watchouts.map((watchout, index) => (
                  <Card 
                    key={index}
                    className="border-l-4 border-l-amber-500 hover-elevate transition-all duration-200"
                    data-testid={`watchout-chip-${index}`}
                  >
                    <CardContent className="p-3 flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed text-foreground">
                        {watchout}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Scenario Lens - Enhanced Visual Treatment */}
      {sanitized.scenarios && (sanitized.scenarios.if_regulation_tightens || sanitized.scenarios.if_budgets_tighten) && (
        <div className="pt-6 border-t space-y-3" data-testid="situation-scenarios">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
            <span>Scenario Lens</span>
          </div>
          <div className="space-y-2">
            {sanitized.scenarios.if_regulation_tightens && (
              <Card 
                className="border-l-4 border-l-blue-500"
                data-testid="scenario-regulation"
              >
                <CardContent className="p-3">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                    If regulation tightens
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {sanitized.scenarios.if_regulation_tightens}
                  </p>
                </CardContent>
              </Card>
            )}
            {sanitized.scenarios.if_budgets_tighten && (
              <Card 
                className="border-l-4 border-l-blue-500"
                data-testid="scenario-budget"
              >
                <CardContent className="p-3">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                    If budgets tighten
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {sanitized.scenarios.if_budgets_tighten}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer with Source Button */}
      <div className="flex items-end justify-between pt-4 border-t">
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