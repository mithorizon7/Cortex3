import { useParams, Link } from "wouter";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOptionsStudio } from "@/hooks/useOptionsStudio";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/navigation/app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Download,
  FileText,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Users,
  Settings,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Loader2,
  Info,
  Star,
  PlayCircle,
  Eye,
  BookOpen,
  Brain,
  Radar,
  BarChart3
} from "lucide-react";
import type { Assessment, ContextProfile, ExtendedOptionCard } from "@shared/schema";
import { extendOptionCard } from "@shared/schema";
import { 
  OPTION_CARDS, 
  MISCONCEPTION_QUESTIONS, 
  LENS_LABELS,
  AVAILABLE_GOALS,
  UI_COPY,
  ALWAYS_ON_CARDS
} from "@shared/options-studio-data";
import { handleExportPDF, handleExportJSON } from "@/lib/pdf-generator";

// Flow steps for the new v1.0 experience
type FlowStep = 'intro' | 'misconceptions' | 'situation' | 'options' | 'compare' | 'reflection' | 'export';

// Lens icons mapping
const LENS_ICONS = {
  "Speed-to-Value": TrendingUp,
  "Customization & Control": Settings,
  "Data Leverage": Target,
  "Risk & Compliance Load": Shield,
  "Operational Burden": Users,
  "Portability & Lock-in": ArrowRight,
  "Cost Shape": DollarSign
};

interface MisconceptionCardProps {
  question: typeof MISCONCEPTION_QUESTIONS[0];
  response?: boolean;
  onAnswer: (answer: boolean) => void;
  showFeedback: boolean;
}

function MisconceptionCard({ question, response, onAnswer, showFeedback }: MisconceptionCardProps) {
  return (
    <Card className="mb-4" data-testid={`card-misconception-${question.id}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-start gap-2">
          <Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-3">
          <Button
            variant={response === true ? "default" : "outline"}
            size="sm"
            onClick={() => onAnswer(true)}
            data-testid={`button-true-${question.id}`}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            True
          </Button>
          <Button
            variant={response === false ? "default" : "outline"}
            size="sm"
            onClick={() => onAnswer(false)}
            data-testid={`button-false-${question.id}`}
          >
            <XCircle className="w-4 h-4 mr-1" />
            False
          </Button>
        </div>
        
        {showFeedback && response !== undefined && (
          <Alert className={response === question.correctAnswer ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>{response === question.correctAnswer ? "Correct!" : "Not quite."}</strong> {question.explanation}
              {question.links.length > 0 && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Related options: {question.links.join(", ")}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface OptionCardProps {
  option: ExtendedOptionCard;
  isSelected: boolean;
  onToggleSelect: () => void;
  emphasizedLenses: string[];
  cautionFlags: string[];
}

function OptionCardComponent({ option, isSelected, onToggleSelect, emphasizedLenses, cautionFlags }: OptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if this option has caution flags
  const relevantCautions = option.cautions?.filter(caution => 
    cautionFlags.includes(caution)
  ) || [];

  return (
    <Card 
      className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover-elevate'}`} 
      data-testid={`card-option-${option.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={option.category === 'ready' ? 'default' : option.category === 'build' ? 'secondary' : 'outline'}
                data-testid={`badge-category-${option.category}`}
              >
                {option.category.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSelect}
                data-testid={`button-select-${option.id}`}
                className={isSelected ? 'bg-primary text-primary-foreground' : ''}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Selected
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Compare
                  </>
                )}
              </Button>
            </div>
            
            {relevantCautions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {relevantCautions.map(caution => (
                  <Badge 
                    key={caution} 
                    variant="outline" 
                    className="text-xs bg-orange-50 border-orange-200 text-orange-700"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {caution.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            )}
            
            <CardTitle className="text-lg font-semibold mb-1" data-testid={`text-title-${option.id}`}>
              {option.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-what-${option.id}`}>
              {option.what}
            </p>
          </div>
        </div>

        {/* Seven Lenses Radar */}
        <div className="grid grid-cols-7 gap-1 mb-3 p-2 bg-muted/30 rounded-md">
          {LENS_LABELS.map((lens) => {
            const lensKeyMap: Record<string, keyof typeof option.lensValues> = {
              'Speed-to-Value': 'speed',
              'Customization & Control': 'control', 
              'Data Leverage': 'dataLeverage',
              'Risk & Compliance Load': 'riskLoad',
              'Operational Burden': 'opsBurden',
              'Portability & Lock-in': 'portability',
              'Cost Shape': 'costShape'
            };
            const lensKey = lensKeyMap[lens] || 'speed';
            const value = option.lensValues[lensKey] || 0;
            const isEmphasized = emphasizedLenses.includes(lens);
            const IconComponent = LENS_ICONS[lens];
            
            return (
              <div 
                key={lens} 
                className={`text-center p-2 rounded-md transition-colors ${
                  isEmphasized ? 'bg-accent/20 border border-accent/30' : 'bg-background/50'
                }`}
                data-testid={`lens-${option.id}-${lensKey}`}
                title={lens}
              >
                <IconComponent className={`w-3 h-3 mx-auto mb-1 ${isEmphasized ? 'text-accent' : 'text-muted-foreground'}`} />
                <div className={`text-xs font-medium ${isEmphasized ? 'text-accent' : ''}`}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Meters */}
        <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-muted/20 rounded-md">
          {Object.entries({
            Speed: option.timelineMeters.speed,
            Build: option.timelineMeters.buildEffort,
            Ops: option.timelineMeters.ops
          }).map(([label, value]) => (
            <div key={label} className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="flex justify-center">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full mx-0.5 ${
                      i <= value ? 'bg-primary' : 'bg-muted'
                    }`} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-3 border-t"
            data-testid={`button-expand-${option.id}`}
          >
            <span>More Details</span>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">✓ Best for</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {option.bestFor.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">✗ Not ideal when</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {option.notIdeal.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2">Prerequisites</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {option.prerequisites.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-purple-700 mb-2">Key Risks</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {option.risks.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-orange-700 mb-2">Success KPIs</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {option.kpis.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-sm font-medium text-amber-700 mb-1">Common Myth</h4>
                <p className="text-sm text-amber-700 mb-2">"{option.myth.claim}"</p>
                <p className="text-sm text-amber-800"><strong>Reality:</strong> {option.myth.truth}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Data Needs</h4>
                <p className="text-sm text-muted-foreground">{option.dataNeeds}</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface ComparisonTableProps {
  options: ExtendedOptionCard[];
  emphasizedLenses: string[];
}

function ComparisonTable({ options, emphasizedLenses }: ComparisonTableProps) {
  if (options.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border border-border p-3 text-left">Option</th>
            {LENS_LABELS.map(lens => {
              const isEmphasized = emphasizedLenses.includes(lens);
              return (
                <th 
                  key={lens} 
                  className={`border border-border p-3 text-center text-xs ${
                    isEmphasized ? 'bg-accent/20' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="font-medium">{lens.split(' ')[0]}</div>
                    <div className="font-normal">{lens.split(' ').slice(1).join(' ')}</div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {options.map(option => (
            <tr key={option.id} className="hover:bg-muted/30">
              <td className="border border-border p-3">
                <div className="font-medium text-sm">{option.title}</div>
                <div className="text-xs text-muted-foreground">{option.what}</div>
              </td>
              {LENS_LABELS.map(lens => {
                const lensKeyMap: Record<string, keyof typeof option.lensValues> = {
                  'Speed-to-Value': 'speed',
                  'Customization & Control': 'control', 
                  'Data Leverage': 'dataLeverage',
                  'Risk & Compliance Load': 'riskLoad',
                  'Operational Burden': 'opsBurden',
                  'Portability & Lock-in': 'portability',
                  'Cost Shape': 'costShape'
                };
                const lensKey = lensKeyMap[lens] || 'speed';
                const value = option.lensValues[lensKey] || 0;
                const isEmphasized = emphasizedLenses.includes(lens);
                
                return (
                  <td 
                    key={lens}
                    className={`border border-border p-3 text-center ${
                      isEmphasized ? 'bg-accent/10' : ''
                    }`}
                  >
                    <div className="font-bold text-lg">{value}</div>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4].map(i => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full mx-0.5 ${
                            i <= value ? 'bg-primary' : 'bg-muted'
                          }`} 
                        />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OptionsStudio() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <OptionsStudioContent />
      </div>
    </ProtectedRoute>
  );
}

function OptionsStudioContent() {
  const { assessmentId } = useParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<FlowStep>('intro');
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});

  const {
    useCase,
    goals,
    misconceptionResponses,
    comparedOptions,
    completed,
    updateUseCase,
    toggleGoal,
    setMisconceptionResponse,
    toggleCompareOption,
    markCompleted,
    getSessionSummary,
    resetSession,
    getPersonalizedCards,
    getCautionMessages,
    getEmphasizedLenses
  } = useOptionsStudio();

  // Get assessment data
  const { data: assessment, isLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  const contextProfile = assessment?.contextProfile as ContextProfile | undefined;

  // Get personalized data based on context profile
  const personalizedCards = useMemo(() => {
    if (!contextProfile) return OPTION_CARDS.map(card => extendOptionCard(card));
    
    // Use hook function for proper personalization without being prescriptive
    // Cards are sorted by relevance but all options remain visible
    return getPersonalizedCards(contextProfile);
  }, [contextProfile, getPersonalizedCards]);

  const emphasizedLenses = useMemo(() => {
    if (!contextProfile) return [];
    
    const emphasized: string[] = [];
    
    // High regulatory intensity emphasizes Risk & Compliance
    if (contextProfile.regulatory_intensity >= 3) {
      emphasized.push('Risk & Compliance Load');
    }
    
    // High data sensitivity emphasizes Data Leverage and Risk
    if (contextProfile.data_sensitivity >= 3) {
      emphasized.push('Data Leverage', 'Risk & Compliance Load');
    }
    
    // High safety criticality emphasizes Risk and Operational Burden
    if (contextProfile.safety_criticality >= 3) {
      emphasized.push('Risk & Compliance Load', 'Operational Burden');
    }
    
    // High clock speed emphasizes Speed-to-Value
    if (contextProfile.clock_speed >= 3) {
      emphasized.push('Speed-to-Value');
    }
    
    // Low build readiness emphasizes Speed-to-Value
    if (contextProfile.build_readiness <= 1) {
      emphasized.push('Speed-to-Value');
    }
    
    // High finops priority emphasizes Cost
    if (contextProfile.finops_priority >= 3) {
      emphasized.push('Cost Shape');
    }
    
    // Procurement constraints emphasize Portability
    if (contextProfile.procurement_constraints) {
      emphasized.push('Portability & Lock-in');
    }
    
    // Edge operations emphasize Operational Burden and Speed
    if (contextProfile.edge_operations) {
      emphasized.push('Operational Burden', 'Speed-to-Value');
    }
    
    return Array.from(new Set(emphasized));
  }, [contextProfile]);

  const cautionFlags = useMemo(() => {
    if (!contextProfile) return [];
    
    const flags: string[] = [];
    
    if (contextProfile.regulatory_intensity >= 3 || contextProfile.safety_criticality >= 3) {
      flags.push('regulated');
    }
    
    if (contextProfile.data_sensitivity >= 3) {
      flags.push('high_sensitivity');
    }
    
    if (contextProfile.build_readiness <= 1) {
      flags.push('low_readiness');
    }
    
    if (contextProfile.edge_operations) {
      flags.push('edge');
    }
    
    return flags;
  }, [contextProfile]);

  const selectedOptions = useMemo(() => 
    personalizedCards.filter(option => comparedOptions.includes(option.id)),
    [personalizedCards, comparedOptions]
  );

  const handleExport = async (format: 'pdf' | 'json') => {
    if (!assessmentId) return;
    
    try {
      const sessionData = {
        ...getSessionSummary(),
        contextProfile,
        selectedOptions: selectedOptions,
        emphasizedLenses,
        reflectionAnswers,
        exportedAt: new Date().toISOString()
      };

      if (format === 'pdf') {
        await handleExportPDF(sessionData, assessmentId);
        toast({
          title: "PDF Downloaded",
          description: "Your Options Studio learning dossier has been downloaded as PDF."
        });
      } else {
        await handleExportJSON(sessionData, `options-studio-${assessmentId}.json`);
        toast({
          title: "JSON Downloaded", 
          description: "Your Options Studio session data has been downloaded as JSON."
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export session data",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          Loading Options Studio...
        </div>
      </div>
    );
  }

  if (!assessment || !contextProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Assessment not found or context profile missing. Please complete the assessment first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stepProgress = {
    intro: 0,
    misconceptions: 14,
    situation: 28, 
    options: 42,
    compare: 57,
    reflection: 71,
    export: 85
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-studio-title">
          {UI_COPY.introTitle}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          {UI_COPY.introBody}
        </p>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <Progress value={stepProgress[currentStep]} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Intro</span>
            <span>Misconceptions</span>
            <span>Situation</span>
            <span>Options</span>
            <span>Compare</span>
            <span>Reflection</span>
            <span>Export</span>
          </div>
        </div>

        {/* Emphasized Lenses Legend */}
        {emphasizedLenses.length > 0 && (
          <Alert className="mb-6 border-accent/20 bg-accent/5">
            <Radar className="h-4 w-4" />
            <AlertDescription>
              <strong>Focus Areas for Your Context:</strong> {emphasizedLenses.join(' • ')}
              <div className="text-xs text-muted-foreground mt-1">
                {UI_COPY.lensesLegend}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Step Content */}
      <div className="space-y-8">
        {currentStep === 'intro' && (
          <Card data-testid="section-intro">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Welcome to Options Studio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This studio will guide you through the AI solution landscape. You'll explore 9 common patterns, 
                challenge misconceptions, and develop your own perspective on what might work in your context.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {ALWAYS_ON_CARDS.map(card => (
                  <Card key={card.id} className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">{card.body}</p>
                      <p className="text-xs font-medium text-primary">{card.doNow}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button 
                onClick={() => setCurrentStep('misconceptions')}
                className="w-full"
                data-testid="button-start-journey"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Start Your Learning Journey
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 'misconceptions' && (
          <div data-testid="section-misconceptions">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Misconception Check
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Let's start by testing some common beliefs about AI implementation. 
                  Answer True or False for each statement.
                </p>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {MISCONCEPTION_QUESTIONS.map(question => (
                <MisconceptionCard
                  key={question.id}
                  question={question}
                  response={misconceptionResponses[question.id]}
                  onAnswer={(answer) => setMisconceptionResponse(question.id, answer)}
                  showFeedback={misconceptionResponses[question.id] !== undefined}
                />
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('intro')}
                data-testid="button-back-intro"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('situation')}
                disabled={Object.keys(misconceptionResponses).length < MISCONCEPTION_QUESTIONS.length}
                data-testid="button-next-situation"
              >
                Pick Your Situation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'situation' && (
          <div data-testid="section-situation">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Describe Your Situation
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Help us understand what you're trying to achieve with AI.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What's your AI use case or goal?
                  </label>
                  <Textarea
                    placeholder="Describe what you want to accomplish with AI..."
                    value={useCase}
                    onChange={(e) => updateUseCase(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="textarea-usecase"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Select primary goals (choose any that apply):
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_GOALS.map(goal => (
                      <div 
                        key={goal}
                        className="flex items-center space-x-2 p-3 border rounded-md hover-elevate cursor-pointer"
                        onClick={() => toggleGoal(goal)}
                        data-testid={`goal-${goal.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <Checkbox 
                          checked={goals.includes(goal)}
                          onChange={() => toggleGoal(goal)}
                        />
                        <span className="text-sm">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('misconceptions')}
                data-testid="button-back-misconceptions"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('options')}
                disabled={!useCase.trim() || goals.length === 0}
                data-testid="button-next-options"
              >
                Explore Options
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'options' && (
          <div data-testid="section-options">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Explore AI Implementation Options
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Here are 9 common patterns for implementing AI. Select options to compare them in detail.
                </p>
              </CardHeader>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {personalizedCards.map(option => (
                <OptionCardComponent
                  key={option.id}
                  option={option}
                  isSelected={comparedOptions.includes(option.id)}
                  onToggleSelect={() => toggleCompareOption(option.id)}
                  emphasizedLenses={emphasizedLenses}
                  cautionFlags={cautionFlags}
                />
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('situation')}
                data-testid="button-back-situation"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('compare')}
                disabled={comparedOptions.length < 2}
                data-testid="button-next-compare"
              >
                Compare Selected ({comparedOptions.length})
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'compare' && (
          <div data-testid="section-compare">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Compare Your Selected Options
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Side-by-side comparison of the {selectedOptions.length} options you selected.
                </p>
              </CardHeader>
            </Card>

            {selectedOptions.length > 0 && (
              <div className="space-y-6">
                <ComparisonTable 
                  options={selectedOptions}
                  emphasizedLenses={emphasizedLenses}
                />

                <div className="grid gap-4">
                  {selectedOptions.map(option => (
                    <Card key={option.id} className="p-4">
                      <h3 className="font-semibold mb-2">{option.title}</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-green-700 mb-1">Best for:</h4>
                          <ul className="text-muted-foreground space-y-1">
                            {option.bestFor.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-1">Not ideal when:</h4>
                          <ul className="text-muted-foreground space-y-1">
                            {option.notIdeal.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('options')}
                data-testid="button-back-options"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('reflection')}
                data-testid="button-next-reflection"
              >
                Reflect on Learnings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'reflection' && (
          <div data-testid="section-reflection">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Reflection & Next Steps
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Take a moment to reflect on what you've learned.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {UI_COPY.reflectionPrompts.map((prompt, index) => (
                  <div key={index}>
                    <label className="text-sm font-medium mb-2 block">
                      {prompt}
                    </label>
                    <Textarea
                      placeholder="Your thoughts..."
                      value={reflectionAnswers[prompt] || ''}
                      onChange={(e) => setReflectionAnswers(prev => ({
                        ...prev,
                        [prompt]: e.target.value
                      }))}
                      className="min-h-[80px]"
                      data-testid={`textarea-reflection-${index}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('compare')}
                data-testid="button-back-compare"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back
              </Button>
              <Button 
                onClick={() => {
                  markCompleted();
                  setCurrentStep('export');
                }}
                data-testid="button-complete-journey"
              >
                Complete Journey
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'export' && (
          <div data-testid="section-export">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Your Learning Dossier
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {UI_COPY.exportCTA}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Journey Complete!</strong> You've explored {OPTION_CARDS.length} AI patterns, 
                    tested {MISCONCEPTION_QUESTIONS.length} misconceptions, and selected {comparedOptions.length} options for deeper comparison.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-2"
                    data-testid="button-export-pdf"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF Summary
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-2"
                    data-testid="button-export-json"
                  >
                    <Download className="w-4 h-4" />
                    Export Session Data (JSON)
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">What You Explored</h3>
                  <div className="grid gap-2 text-sm">
                    <div>• <strong>Use Case:</strong> {useCase || 'Not specified'}</div>
                    <div>• <strong>Goals:</strong> {goals.join(', ') || 'None selected'}</div>
                    <div>• <strong>Misconceptions Tested:</strong> {Object.keys(misconceptionResponses).length} of {MISCONCEPTION_QUESTIONS.length}</div>
                    <div>• <strong>Options Compared:</strong> {comparedOptions.length} options</div>
                    <div>• <strong>Emphasized Lenses:</strong> {emphasizedLenses.join(', ') || 'None'}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep('intro')}
                    data-testid="button-restart-journey"
                  >
                    Restart Journey
                  </Button>
                  <Link to="/">
                    <Button variant="outline">
                      Return to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}