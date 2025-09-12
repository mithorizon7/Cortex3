import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, Brain, CheckCircle, XCircle, Download, GitCompare, Info, Lightbulb, Target } from "lucide-react";
import { useOptionsStudio } from "@/hooks/useOptionsStudio";
import { OPTION_CARDS, MISCONCEPTION_QUESTIONS, LENS_LABELS, CAUTION_MESSAGES } from "@shared/options-studio-data";
import type { ContextProfile, OptionCard } from "@shared/schema";

export default function OptionsStudio() {
  const [currentSection, setCurrentSection] = useState<"intro" | "misconceptions" | "situation" | "explore" | "reflection" | "export">("intro");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [contextProfile, setContextProfile] = useState<ContextProfile | undefined>();
  
  const {
    session,
    updateSession,
    answerMisconception,
    viewOption,
    compareOptions,
    updateReflections,
    completeSession,
    personalization,
    enrichedOptionCards,
  } = useOptionsStudio(contextProfile);

  // Mock context profile for now - in a real implementation, this would come from the assessment
  useEffect(() => {
    // Simulate loading context profile
    setContextProfile({
      regulatory_intensity: 2,
      data_sensitivity: 3,
      safety_criticality: 1,
      brand_exposure: 2,
      clock_speed: 3,
      latency_edge: 1,
      scale_throughput: 2,
      data_advantage: 3,
      build_readiness: 2,
      finops_priority: 2,
      procurement_constraints: false,
      edge_operations: false,
    });
  }, []);

  const scrollToSection = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
  };

  const renderIntroSection = () => (
    <section id="intro" className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold" data-testid="text-options-studio-title">
            Options Studio — Understand Your AI Solution Patterns
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Explore common ways organizations use AI, the trade-offs that matter, and where myths can mislead. 
          We'll highlight a few lenses based on your context. We won't prescribe a choice.
        </p>
      </div>

      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Seven Lenses — How We'll Explore Each Option
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(LENS_LABELS).map(([key, label]) => (
            <Badge 
              key={key} 
              variant={personalization.emphasizedLenses.includes(key) ? "default" : "secondary"}
              className="text-sm p-2 justify-start"
              data-testid={`badge-lens-${key}`}
            >
              {personalization.emphasizedLenses.includes(key) && "★ "}
              {label}
            </Badge>
          ))}
        </div>
        {personalization.emphasizedLenses.length > 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            ★ Highlighted based on your organizational context
          </p>
        )}
      </div>

      <div className="text-center">
        <Button 
          size="lg" 
          onClick={() => {
            setCurrentSection("misconceptions");
            scrollToSection("misconceptions");
          }}
          data-testid="button-start-learning"
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Start Learning
        </Button>
      </div>
    </section>
  );

  const renderMisconceptionsSection = () => (
    <section id="misconceptions" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold" data-testid="text-misconceptions-title">
          Five Quick Statements — True or False?
        </h2>
        <p className="text-muted-foreground">
          Test your AI knowledge and correct common misconceptions
        </p>
      </div>

      <div className="space-y-4">
        {MISCONCEPTION_QUESTIONS.map((question) => {
          const userAnswer = session.misconceptionsAnswered[question.id];
          const isAnswered = userAnswer !== undefined;
          const isCorrect = isAnswered && userAnswer === question.correct;

          return (
            <Card key={question.id} className="transition-all duration-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-lg font-medium">{question.statement}</p>
                  
                  <div className="flex gap-4">
                    <Button
                      variant={isAnswered && userAnswer === true ? (isCorrect ? "default" : "destructive") : "outline"}
                      onClick={() => answerMisconception(question.id, true)}
                      disabled={isAnswered}
                      data-testid={`button-true-${question.id}`}
                    >
                      {isAnswered && userAnswer === true && (
                        isCorrect ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />
                      )}
                      True
                    </Button>
                    <Button
                      variant={isAnswered && userAnswer === false ? (isCorrect ? "default" : "destructive") : "outline"}
                      onClick={() => answerMisconception(question.id, false)}
                      disabled={isAnswered}
                      data-testid={`button-false-${question.id}`}
                    >
                      {isAnswered && userAnswer === false && (
                        isCorrect ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />
                      )}
                      False
                    </Button>
                  </div>

                  {isAnswered && (
                    <div className={`p-4 rounded-lg ${isCorrect ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
                      <p className="text-sm">
                        <span className="font-semibold">
                          {isCorrect ? "Correct!" : `Incorrect. The answer is ${question.correct ? "True" : "False"}.`}
                        </span>
                        {" "}{question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.keys(session.misconceptionsAnswered).length === MISCONCEPTION_QUESTIONS.length && (
        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => {
              setCurrentSection("situation");
              scrollToSection("situation");
            }}
            data-testid="button-continue-to-situation"
          >
            Continue to Options
          </Button>
        </div>
      )}
    </section>
  );

  const renderSituationSection = () => (
    <section id="situation" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Pick a Situation (Optional)</h2>
        <p className="text-muted-foreground">
          Which problem are you thinking about? This helps anchor your learning.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usecase">Use Case or Problem (one line)</Label>
            <Input
              id="usecase"
              placeholder="e.g., Customer support knowledge base, Contract analysis, Product recommendations..."
              value={session.useCaseTitle || ""}
              onChange={(e) => updateSession({ useCaseTitle: e.target.value })}
              data-testid="input-usecase-title"
            />
          </div>

          <div className="space-y-2">
            <Label>Primary Goals (select up to 2)</Label>
            <div className="flex flex-wrap gap-2">
              {["speed", "quality", "compliance", "cost"].map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={session.goals?.includes(goal as any) || false}
                    onCheckedChange={(checked) => {
                      const currentGoals = session.goals || [];
                      if (checked && currentGoals.length < 2) {
                        updateSession({ goals: [...currentGoals, goal as any] });
                      } else if (!checked) {
                        updateSession({ goals: currentGoals.filter(g => g !== goal) });
                      }
                    }}
                    data-testid={`checkbox-goal-${goal}`}
                  />
                  <Label htmlFor={goal} className="capitalize">{goal}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          size="lg" 
          onClick={() => {
            setCurrentSection("explore");
            scrollToSection("explore");
          }}
          data-testid="button-explore-options"
        >
          Explore Options
        </Button>
      </div>
    </section>
  );

  const renderOptionCard = (option: OptionCard) => {
    const isViewed = session.optionsViewed.includes(option.id);
    const isSelected = selectedOptions.includes(option.id);
    
    return (
      <Card 
        key={option.id} 
        className={`cursor-pointer transition-all duration-200 hover-elevate ${isViewed ? "ring-1 ring-primary/20" : ""}`}
        onClick={() => {
          if (compareMode) {
            if (isSelected) {
              setSelectedOptions(prev => prev.filter(id => id !== option.id));
            } else if (selectedOptions.length < 2) {
              setSelectedOptions(prev => [...prev, option.id]);
            }
          } else {
            viewOption(option.id);
          }
        }}
        data-testid={`card-option-${option.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{option.title}</CardTitle>
            {compareMode && (
              <Checkbox 
                checked={isSelected}
                disabled={!isSelected && selectedOptions.length >= 2}
                data-testid={`checkbox-compare-${option.id}`}
              />
            )}
          </div>
          <CardDescription className="text-sm">{option.what}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-wrap gap-1">
            {/* Show top 2 lens badges */}
            {Object.entries(option.axes)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 2)
              .map(([lens, value]) => (
                <Badge key={lens} variant="secondary" className="text-xs">
                  {LENS_LABELS[lens as keyof typeof LENS_LABELS]} ({value}/4)
                </Badge>
              ))}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Best for:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {option.bestFor.slice(0, 2).map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>

          {option.cautions && option.cautions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {option.cautions.map((caution) => (
                <TooltipProvider key={caution}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                        <Info className="w-3 h-3 mr-1" />
                        {caution.replace('_', ' ')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{CAUTION_MESSAGES[caution as keyof typeof CAUTION_MESSAGES]}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Myth:</span> {option.myth.claim}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              <span className="font-medium">Reality:</span> {option.myth.truth}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderExploreSection = () => (
    <section id="explore" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">AI Solution Options</h2>
        <p className="text-muted-foreground">
          Click any card to explore details. Use compare mode to see trade-offs side by side.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={compareMode ? "default" : "outline"}
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedOptions([]);
            }}
            data-testid="button-toggle-compare"
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Compare Mode
          </Button>
          {compareMode && selectedOptions.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedOptions.length}/2 selected
            </span>
          )}
        </div>

        {compareMode && selectedOptions.length === 2 && (
          <Button 
            onClick={() => {
              compareOptions(selectedOptions);
              // Would open comparison dialog
            }}
            data-testid="button-compare-selected"
          >
            Compare Selected Options
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedOptionCards.map(renderOptionCard)}
      </div>
    </section>
  );

  const renderReflectionSection = () => (
    <section id="reflection" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Mini-Reflection</h2>
        <p className="text-muted-foreground">
          Capture your thoughts to complete your learning journey
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Which two options feel most promising to learn more about, and why?</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Reflect on which options caught your attention and why they might fit your situation..."
              value={session.reflections.promisingOptions || ""}
              onChange={(e) => updateReflections({ promisingOptions: e.target.value })}
              className="min-h-[100px]"
              maxLength={240}
              data-testid="textarea-promising-options"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {(session.reflections.promisingOptions || "").length}/240 characters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Which lens mattered most for your situation?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={session.reflections.priorityLenses?.[0] || ""}
              onValueChange={(value) => updateReflections({ priorityLenses: [value] })}
            >
              {Object.entries(LENS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={key} data-testid={`radio-lens-${key}`} />
                  <Label htmlFor={key}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          size="lg" 
          onClick={() => {
            completeSession();
            setCurrentSection("export");
            scrollToSection("export");
          }}
          disabled={!session.reflections.promisingOptions || !session.reflections.priorityLenses?.[0]}
          data-testid="button-complete-reflection"
        >
          <Lightbulb className="mr-2 h-5 w-5" />
          Complete Session
        </Button>
      </div>
    </section>
  );

  const renderExportSection = () => (
    <section id="export" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Your Options Studio Summary</h2>
        <p className="text-muted-foreground">
          Download your learning summary and insights
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Use Case: </p>
            <p className="text-muted-foreground">{session.useCaseTitle || "Not specified"}</p>
          </div>
          
          <div>
            <p className="font-medium">Goals: </p>
            <p className="text-muted-foreground">
              {session.goals?.join(", ") || "Not specified"}
            </p>
          </div>

          <div>
            <p className="font-medium">Options Explored: </p>
            <p className="text-muted-foreground">{session.optionsViewed.length} of {OPTION_CARDS.length}</p>
          </div>

          <div>
            <p className="font-medium">Misconceptions Corrected: </p>
            <p className="text-muted-foreground">
              {Object.values(session.misconceptionsAnswered).filter(Boolean).length} of {MISCONCEPTION_QUESTIONS.length}
            </p>
          </div>

          <div>
            <p className="font-medium">Promising Options: </p>
            <p className="text-muted-foreground">{session.reflections.promisingOptions}</p>
          </div>

          <div>
            <p className="font-medium">Priority Lens: </p>
            <p className="text-muted-foreground">
              {session.reflections.priorityLenses?.[0] ? 
                LENS_LABELS[session.reflections.priorityLenses[0] as keyof typeof LENS_LABELS] : 
                "Not specified"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button size="lg" data-testid="button-download-summary">
          <Download className="mr-2 h-5 w-5" />
          Download Your Options Studio Summary
        </Button>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-16">
        {renderIntroSection()}
        {renderMisconceptionsSection()}
        {renderSituationSection()}
        {renderExploreSection()}
        {renderReflectionSection()}
        {renderExportSection()}
      </div>
    </div>
  );
}