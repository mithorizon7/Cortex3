import { useParams, Link } from "wouter";
import { useState } from "react";
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
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Eye,
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
  Star
} from "lucide-react";
import type { Assessment, ContextProfile, ExtendedOptionCard } from "@shared/schema";
import { extendMisconceptionQuestion, extendOptionCard } from "@shared/schema";
import { OPTION_CARDS, MISCONCEPTION_QUESTIONS, LENS_LABELS } from "@shared/options-studio-data";
import { handleExportPDF, handleExportJSON } from "@/lib/pdf-generator";

// Available goals for selection
const AVAILABLE_GOALS = [
  "Increase operational efficiency",
  "Enhance customer experience", 
  "Reduce manual workload",
  "Improve decision-making speed",
  "Generate new revenue streams",
  "Strengthen competitive advantage",
  "Reduce operational costs",
  "Scale existing processes"
];

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

interface OptionCardProps {
  option: ExtendedOptionCard;
  isSelected: boolean;
  onToggleSelect: () => void;
  emphasizedLenses: string[];
}

function OptionCardComponent({ option, isSelected, onToggleSelect, emphasizedLenses }: OptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`} data-testid={`card-option-${option.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
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
            <CardTitle className="text-lg font-semibold mb-1" data-testid={`text-title-${option.id}`}>
              {option.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-description-${option.id}`}>
              {option.shortDescription}
            </p>
          </div>
        </div>

        {/* Lens Values */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {LENS_LABELS.map((lens, index) => {
            const lensKey = lens.replace(/[^a-zA-Z]/g, '').slice(0, 6) as keyof typeof option.lensValues;
            const value = option.lensValues[lensKey] || 1;
            const isEmphasized = emphasizedLenses.includes(lens);
            const IconComponent = LENS_ICONS[lens];
            
            return (
              <div 
                key={lens} 
                className={`text-center p-2 rounded-md transition-colors ${
                  isEmphasized ? 'bg-accent/20 border border-accent/30' : 'bg-muted/50'
                }`}
                data-testid={`lens-${option.id}-${lensKey}`}
              >
                <IconComponent className={`w-3 h-3 mx-auto mb-1 ${isEmphasized ? 'text-accent' : 'text-muted-foreground'}`} />
                <div className={`text-xs font-medium ${isEmphasized ? 'text-accent' : ''}`}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground mb-2">
          {LENS_LABELS.map((lens, i) => (
            <span key={lens}>
              {lens.split(' ')[0]}{i < LENS_LABELS.length - 1 ? ' • ' : ''}
            </span>
          ))}
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between px-6 py-2"
            data-testid={`button-expand-${option.id}`}
          >
            <span>View Details</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-foreground mb-3" data-testid={`text-full-description-${option.id}`}>
                  {option.fullDescription}
                </p>
              </div>

              <Tabs defaultValue="pros" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pros" data-testid={`tab-pros-${option.id}`}>Pros</TabsTrigger>
                  <TabsTrigger value="cons" data-testid={`tab-cons-${option.id}`}>Cons</TabsTrigger>
                  <TabsTrigger value="bestFor" data-testid={`tab-best-for-${option.id}`}>Best For</TabsTrigger>
                  <TabsTrigger value="examples" data-testid={`tab-examples-${option.id}`}>Examples</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pros" className="mt-3">
                  <ul className="space-y-1" data-testid={`list-pros-${option.id}`}>
                    {option.pros.map((pro, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="cons" className="mt-3">
                  <ul className="space-y-1" data-testid={`list-cons-${option.id}`}>
                    {option.cons.map((con, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <XCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="bestFor" className="mt-3">
                  <ul className="space-y-1" data-testid={`list-best-for-${option.id}`}>
                    {option.bestFor.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <Star className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="examples" className="mt-3">
                  <ul className="space-y-1" data-testid={`list-examples-${option.id}`}>
                    {option.examples.map((example, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function OptionsStudioPageContent() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [reflectionResponse1, setReflectionResponse1] = useState("");
  const [reflectionResponse2, setReflectionResponse2] = useState("");

  // Fetch assessment data
  const { data: assessment, isLoading, error } = useQuery<Assessment>({
    queryKey: ['/api/assessments', id],
    enabled: !!id,
  });

  // Options Studio hook
  const {
    useCase,
    goals,
    misconceptionResponses,
    comparedOptions,
    updateUseCase,
    toggleGoal,
    setMisconceptionResponse,
    toggleCompareOption,
    getPersonalizedCards,
    getCautionMessages,
    getEmphasizedLenses,
    getSessionSummary,
    sessionProgress
  } = useOptionsStudio();

  // Get personalized data based on context profile
  const contextProfile = assessment?.contextProfile;
  const personalizedCards = contextProfile ? getPersonalizedCards(contextProfile) : OPTION_CARDS.map(card => extendOptionCard(card));
  const cautionMessages = contextProfile ? getCautionMessages(contextProfile) : [];
  const emphasizedLenses = contextProfile ? getEmphasizedLenses(contextProfile) : [];

  const selectedCards = personalizedCards.filter(card => comparedOptions.includes(card.id));

  // Progress calculation
  const sections = [
    { name: "Intro", completed: true },
    { name: "Misconceptions", completed: Object.keys(misconceptionResponses).length === 5 },
    { name: "Situation", completed: useCase.length > 0 && goals.length > 0 },
    { name: "Options", completed: comparedOptions.length >= 2 },
    { name: "Reflection", completed: reflectionResponse1.length > 0 && reflectionResponse2.length > 0 }
  ];
  const completedSections = sections.filter(s => s.completed).length;
  const progressPercentage = (completedSections / sections.length) * 100;

  // Export handlers
  const handlePDFExport = async () => {
    if (!assessment || !contextProfile) {
      toast({
        title: "Cannot export PDF",
        description: "Assessment data is not available",
        variant: "destructive"
      });
      return;
    }

    setIsExportingPDF(true);
    try {
      const sessionData = {
        ...getSessionSummary(),
        reflectionResponse1,
        reflectionResponse2,
        selectedOptions: selectedCards,
        emphasizedLenses,
        contextProfile
      };

      await handleExportPDF(sessionData, id!);
      toast({
        title: "PDF exported successfully",
        description: "Your Options Studio report has been downloaded"
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export failed", 
        description: error instanceof Error ? error.message : "Failed to export PDF",
        variant: "destructive"
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleJSONExport = () => {
    if (!assessment || !contextProfile) {
      toast({
        title: "Cannot export data",
        description: "Assessment data is not available",
        variant: "destructive"
      });
      return;
    }

    setIsExportingJSON(true);
    try {
      const sessionData = {
        ...getSessionSummary(),
        reflectionResponse1,
        reflectionResponse2,
        selectedOptions: selectedCards,
        emphasizedLenses,
        contextProfile,
        assessmentId: id
      };

      handleExportJSON(sessionData);
      toast({
        title: "Data exported successfully",
        description: "Your Options Studio session data has been downloaded"
      });
    } catch (error) {
      console.error('JSON export failed:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive"
      });
    } finally {
      setIsExportingJSON(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2 text-muted-foreground">Loading assessment data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              Failed to load assessment data. Please try refreshing the page or go back to the results.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href={`/results/${id}`}>
              <Button variant="outline" data-testid="button-back-to-results">
                ← Back to Results
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="options-studio-page">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
                Options Studio
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Explore AI implementation approaches tailored to your context
              </p>
            </div>
            <Link href={`/results/${id}`}>
              <Button variant="outline" data-testid="button-back-to-results">
                ← Back to Results
              </Button>
            </Link>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{completedSections}/{sections.length} sections complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" data-testid="progress-completion" />
          </div>
        </div>

        {/* Caution Messages */}
        {cautionMessages.length > 0 && (
          <div className="mb-8 space-y-3">
            {cautionMessages.map((message, index) => (
              <Alert key={index} className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-700 dark:text-orange-300">
                  {message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <div className="space-y-12">
          {/* 1. Introduction */}
          <section data-testid="section-intro">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Seven Lenses Framework
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Each AI implementation approach is evaluated across seven key dimensions. Your organizational context 
                  determines which lenses are most critical for your success.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {LENS_LABELS.map((lens) => {
                    const IconComponent = LENS_ICONS[lens];
                    const isEmphasized = emphasizedLenses.includes(lens);
                    
                    return (
                      <div 
                        key={lens}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isEmphasized ? 'bg-accent/10 border border-accent/20' : 'bg-muted/50'
                        }`}
                        data-testid={`lens-explanation-${lens.replace(/[^a-zA-Z]/g, '').toLowerCase()}`}
                      >
                        <IconComponent className={`w-5 h-5 ${isEmphasized ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div>
                          <div className={`font-medium ${isEmphasized ? 'text-accent' : ''}`}>
                            {lens}
                            {isEmphasized && <Badge variant="secondary" className="ml-2 text-xs">Important for you</Badge>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 2. Misconception Check */}
          <section data-testid="section-misconceptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Knowledge Check: Common AI Misconceptions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test your understanding of AI implementation realities. Each question reveals important insights.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {MISCONCEPTION_QUESTIONS.map((question, index) => {
                    const userAnswer = misconceptionResponses[question.id];
                    const hasAnswered = userAnswer !== undefined;
                    const isCorrect = hasAnswered && userAnswer === question.correctAnswer;
                    
                    return (
                      <div key={question.id} className="space-y-3" data-testid={`question-${question.id}`}>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-1">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium mb-3" data-testid={`text-question-${question.id}`}>
                              {extendMisconceptionQuestion(question).question}
                            </p>
                            
                            <div className="flex gap-4 mb-3">
                              <Button
                                variant={userAnswer === true ? (isCorrect ? "default" : "destructive") : "outline"}
                                size="sm"
                                onClick={() => setMisconceptionResponse(question.id, true)}
                                data-testid={`button-true-${question.id}`}
                              >
                                True
                                {hasAnswered && userAnswer === true && (
                                  isCorrect ? <CheckCircle2 className="w-4 h-4 ml-1" /> : <XCircle className="w-4 h-4 ml-1" />
                                )}
                              </Button>
                              <Button
                                variant={userAnswer === false ? (isCorrect ? "default" : "destructive") : "outline"}
                                size="sm"
                                onClick={() => setMisconceptionResponse(question.id, false)}
                                data-testid={`button-false-${question.id}`}
                              >
                                False
                                {hasAnswered && userAnswer === false && (
                                  isCorrect ? <CheckCircle2 className="w-4 h-4 ml-1" /> : <XCircle className="w-4 h-4 ml-1" />
                                )}
                              </Button>
                            </div>
                            
                            {hasAnswered && (
                              <Alert className={isCorrect ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20" : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"}>
                                <AlertDescription className={isCorrect ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}>
                                  <strong>{isCorrect ? "Correct!" : "Not quite."}</strong> {question.explanation}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 3. Situation */}
          <section data-testid="section-situation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your AI Implementation Context
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Help us understand your specific use case and objectives.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="use-case">
                    Describe your primary AI use case:
                  </label>
                  <Textarea
                    id="use-case"
                    placeholder="e.g., Automate customer support responses, Analyze financial documents, Generate content for marketing..."
                    value={useCase}
                    onChange={(e) => updateUseCase(e.target.value)}
                    className="min-h-24"
                    data-testid="textarea-use-case"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">
                    What are your primary goals? (Select all that apply)
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {AVAILABLE_GOALS.map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={goal}
                          checked={goals.includes(goal)}
                          onCheckedChange={() => toggleGoal(goal)}
                          data-testid={`checkbox-goal-${goal.replace(/[^a-zA-Z]/g, '').toLowerCase()}`}
                        />
                        <label htmlFor={goal} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {goal}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 4. Option Exploration */}
          <section data-testid="section-options">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  AI Implementation Options
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select 2-3 options to compare in detail. Options are personalized based on your organizational context.
                </p>
              </CardHeader>
              <CardContent>
                {comparedOptions.length > 0 && (
                  <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <h4 className="font-medium mb-2">Comparing {comparedOptions.length} options:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCards.map((card) => (
                        <Badge key={card.id} variant="default" data-testid={`badge-selected-${card.id}`}>
                          {card.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-6">
                  {personalizedCards.map((option) => (
                    <OptionCardComponent
                      key={option.id}
                      option={option}
                      isSelected={comparedOptions.includes(option.id)}
                      onToggleSelect={() => toggleCompareOption(option.id)}
                      emphasizedLenses={emphasizedLenses}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 5. Reflection */}
          <section data-testid="section-reflection">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Strategic Reflection
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Capture your insights to guide implementation decisions.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="reflection-1">
                    Based on your selections, what are the key trade-offs you're willing to make?
                  </label>
                  <Textarea
                    id="reflection-1"
                    placeholder="Consider speed vs. control, cost vs. capability, risk vs. innovation..."
                    value={reflectionResponse1}
                    onChange={(e) => setReflectionResponse1(e.target.value)}
                    className="min-h-32"
                    data-testid="textarea-reflection-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="reflection-2">
                    What specific next steps will you take to move forward with your AI implementation?
                  </label>
                  <Textarea
                    id="reflection-2"
                    placeholder="Think about pilot projects, team preparation, vendor evaluation, technical requirements..."
                    value={reflectionResponse2}
                    onChange={(e) => setReflectionResponse2(e.target.value)}
                    className="min-h-32"
                    data-testid="textarea-reflection-2"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 6. Export */}
          <section data-testid="section-export">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Export Your Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Save your Options Studio session for future reference and team discussions.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={handlePDFExport}
                    disabled={isExportingPDF || comparedOptions.length === 0}
                    data-testid="button-export-pdf"
                  >
                    {isExportingPDF ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Export PDF Report
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleJSONExport}
                    disabled={isExportingJSON}
                    data-testid="button-export-json"
                  >
                    {isExportingJSON ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export Data (JSON)
                  </Button>
                </div>
                
                {comparedOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select at least one option to enable PDF export.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function OptionsStudio() {
  return (
    <ProtectedRoute>
      <OptionsStudioPageContent />
    </ProtectedRoute>
  );
}