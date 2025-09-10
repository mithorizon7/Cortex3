import { Button } from "@/components/ui/button";
import { Check, Download } from "lucide-react";

interface ProgressHeaderProps {
  currentStep: number;
  onExport?: () => void;
}

export default function ProgressHeader({ currentStep, onExport }: ProgressHeaderProps) {
  const steps = [
    { id: 1, name: "Context Profile" },
    { id: 2, name: "Profile Summary" },
    { id: 3, name: "Pulse Check" },
    { id: 4, name: "Results" }
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-display font-bold text-lg">
              CORTEX™
            </div>
            <span className="text-muted-foreground text-sm font-ui">Executive AI Readiness Assessment</span>
          </div>
          
          {/* Progress Indicator */}
          <div className="hidden md:flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div 
                    className={`step-indicator w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id < currentStep ? 'completed' : 
                      step.id === currentStep ? 'active' : 
                      'bg-muted text-muted-foreground'
                    }`}
                    data-testid={`step-indicator-${step.id}`}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`text-sm ${
                    step.id === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-px bg-border mx-2" />
                )}
              </div>
            ))}
          </div>
          
          {onExport && (
            <Button onClick={onExport} data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
