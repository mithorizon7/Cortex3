import { sanitizeInsight, sanitizeContextMirror, violatesPolicy } from "./sanitizeInsight";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Target } from "lucide-react";
import type { ContextMirror } from "@shared/schema";

interface ContextReflectionProps {
  // Legacy format (backward compatibility)
  insight?: string;
  disclaimer?: string;
  
  // Context Mirror 2.0 format
  mirror?: ContextMirror;
}

export function ContextReflection(props: ContextReflectionProps) {
  // Handle legacy format for backward compatibility
  if (props.insight && props.disclaimer && !props.mirror) {
    return renderLegacyFormat(props.insight, props.disclaimer);
  }
  
  // Handle Context Mirror 2.0 format
  if (props.mirror) {
    return renderContextMirror2(props.mirror);
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

function renderContextMirror2(mirror: ContextMirror) {
  const sanitized = sanitizeContextMirror(mirror);
  
  // Policy violation check
  if (sanitized.insight && violatesPolicy(sanitized.insight)) {
    return renderFallbackMessage();
  }

  // Render Context Mirror 2.0 executive dashboard
  return (
    <div className="space-y-6">
      {/* Executive Headline */}
      {sanitized.headline && (
        <div className="space-y-1" data-testid="context-headline">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {sanitized.headline}
          </h3>
        </div>
      )}

      {/* Context Insight (Core narrative) */}
      {sanitized.insight && (
        <div className="space-y-4" data-testid="context-insight">
          {sanitized.insight.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed text-foreground font-medium">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      )}

      {/* Actions Section */}
      {sanitized.actions && sanitized.actions.length > 0 && (
        <div className="space-y-3" data-testid="context-actions">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4" />
            Immediate Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            {sanitized.actions.map((action, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-3 py-1 font-medium"
                data-testid={`action-chip-${index}`}
              >
                {action}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Watch-outs Section */}
      {sanitized.watchouts && sanitized.watchouts.length > 0 && (
        <div className="space-y-3" data-testid="context-watchouts">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Watch-outs
          </h4>
          <div className="flex flex-wrap gap-2">
            {sanitized.watchouts.map((watchout, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-3 py-1 font-medium border-amber-200 text-amber-800 dark:border-amber-800 dark:text-amber-200"
                data-testid={`watchout-chip-${index}`}
              >
                {watchout}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Scenario Planning */}
      {sanitized.scenarios && (
        <div className="space-y-3" data-testid="context-scenarios">
          <h4 className="text-sm font-semibold text-foreground">Scenario Planning</h4>
          <div className="grid gap-3 text-sm">
            {sanitized.scenarios.if_regulation_tightens && (
              <div className="p-3 rounded-md bg-muted/50" data-testid="scenario-regulation">
                <span className="font-medium text-muted-foreground">If regulation tightens:</span>
                <p className="mt-1 text-foreground">{sanitized.scenarios.if_regulation_tightens}</p>
              </div>
            )}
            {sanitized.scenarios.if_budgets_tighten && (
              <div className="p-3 rounded-md bg-muted/50" data-testid="scenario-budget">
                <span className="font-medium text-muted-foreground">If budgets tighten:</span>
                <p className="mt-1 text-foreground">{sanitized.scenarios.if_budgets_tighten}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {sanitized.disclaimer && (
        <p className="text-xs text-muted-foreground mt-6 italic border-t pt-3" data-testid="context-disclaimer">
          {sanitized.disclaimer}
        </p>
      )}
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