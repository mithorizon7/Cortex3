import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, Target, Edit3, Lightbulb } from 'lucide-react';

interface ValueOverlayTutorialProps {
  open: boolean;
  onClose: () => void;
}

export function ValueOverlayTutorial({ open, onClose }: ValueOverlayTutorialProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Understanding Value Overlays
          </DialogTitle>
          <DialogDescription className="text-base">
            A quick guide to tracking your AI readiness progress with concrete metrics
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* What are they? */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
              What are Value Overlays?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Value overlays are <strong>measurable business metrics</strong> that help you track your progress in each domain. 
              Instead of abstract scores, you get concrete numbers you can monitor over time—like tracking "% of strategic initiatives with AI outcomes" or "AI-enhanced features deployed per quarter."
            </p>
          </div>

          {/* Why use them? */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
              Why Track These Metrics?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              These metrics turn your assessment into an <strong>ongoing measurement system</strong>. You can:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-1">•</span>
                <span>Set baselines to know where you are today</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-1">•</span>
                <span>Define targets to clarify where you want to be</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-1">•</span>
                <span>Track progress monthly or quarterly to see what's working</span>
              </li>
            </ul>
          </div>

          {/* How to use them */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center text-sm">3</span>
              How to Use Them
            </h3>
            
            <div className="space-y-3">
              {/* View metric info */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-background rounded p-1.5 mt-0.5">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">Click the metric badge</div>
                  <p className="text-sm text-muted-foreground">
                    See what it measures, why it matters for your organization, and detailed instructions on how to calculate it.
                  </p>
                </div>
              </div>

              {/* Change metric */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-background rounded p-1.5 mt-0.5">
                  <Edit3 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">Click "Change" to swap metrics</div>
                  <p className="text-sm text-muted-foreground">
                    Each domain has multiple metric options. Pick the one that fits your organization's priorities and measurement capabilities.
                  </p>
                </div>
              </div>

              {/* Set baseline and target */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-background rounded p-1.5 mt-0.5">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">Set your baseline and target</div>
                  <p className="text-sm text-muted-foreground">
                    Enter your current number (baseline) and where you want to be (target). Choose monthly or quarterly tracking based on how often you'll measure.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Getting started tip */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4" data-testid="tutorial-getting-started">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium mb-1">Getting Started</div>
                <p className="text-sm text-muted-foreground">
                  Don't worry about getting everything perfect right away. Start with 1-2 domains that matter most, set rough baselines, and refine as you go. 
                  You can always come back and adjust your metrics later.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} size="lg" data-testid="button-tutorial-close">
            Got It—Let's Go
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
