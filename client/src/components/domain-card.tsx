import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CORTEX_PILLARS, MATURITY_STAGES, getStageColor } from "@/lib/cortex";
import { getMicroGuidesByPillar, getMicroGuidesByTags } from "@/lib/micro-guides";
import { getMetricById, getContextAwareDefaults, getDefaultMetricForPillar } from "@/lib/value-overlay";
import { ValueMetricChip, ValueInputFields, HowToMeasureDialog } from "@/components/value-overlay";
import { Star, Info, Target, Cog, Shield, Users, Network, Lightbulb, TrendingUp, ArrowRight, BookOpen, ChevronDown, HelpCircle, CheckSquare } from "lucide-react";
import { useState } from "react";
import type { ValueOverlay, ValueOverlayPillar, ContextProfile } from "@shared/schema";

// Local types for guides with optional steps
interface GuideStep {
  order: number;
  title: string;
  timeframe?: string;
}

type GuideWithSteps = import("@/lib/micro-guides").MicroGuide & { steps?: GuideStep[] };

interface DomainCardProps {
  pillar: string;
  stage: number;
  priority?: number;
  contextReason?: string;
  contextGuidance?: any;
  contextProfile?: ContextProfile;
  valueOverlay?: ValueOverlayPillar;
  onValueOverlayUpdate?: (pillar: string, updates: Partial<ValueOverlayPillar>) => void;
  priorityMoves?: Array<{
    id: string;
    pillar: string;
    title: string;
    rank: number;
    priority: number;
    explain?: {
      gapBoost: number;
      profileBoost: number;
      pillarScore: number;
      triggeringDimensions?: string[];
    };
  }>;
}

const DOMAIN_GUIDANCE = {
  C: {
    whyMatters: "Clarity turns AI from scattered pilots into business outcomes. When leaders publish a simple, measurable AI ambition and name a single owner with budget authority, teams stop guessing. A routine executive review creates momentum: work that moves the needle is funded and scaled; experiments that don't deliver are sunset. This alignment reduces duplicated effort, accelerates learning, and ties AI to revenue, cost, and risk.",
    whatGoodLooks: [
      "A one‑page AI ambition linked to business outcomes and customers",
      "A named senior owner and a clear split between CoE (enable/govern) and BUs (adopt/deliver)",
      "Quarterly executive/board review with reallocation decisions (fund/defund)",
      "Leaders share a common language for AI scope, risks, and value"
    ],
    howToImprove: [
      "Progress usually starts with publishing a simple ambition (outcomes, not technologies), then clarifying who owns what between a Center of Excellence and business units. Reviews move from \"show‑and‑tell\" to decide‑and‑do—small amounts of money shift to what works, with clear rationale. Over time, AI outcomes appear in strategy documents and operating plans. In more regulated settings, leadership reviews also check that safeguards and evidence are in place."
    ],
    commonPitfalls: [
      "Vision without ownership; ownership without budget",
      "Treating the CoE as a gatekeeper instead of an enabler", 
      "Endless exploration with no reallocation"
    ],
    discussionPrompts: [
      "What two business outcomes will AI influence this year?",
      "Who is accountable for those outcomes and what budget do they control?",
      "What will we stop doing if it doesn't perform?"
    ]
  },
  O: {
    whyMatters: "Stable operations and governed data are the difference between a demo and a dependable service. Monitoring, human‑in‑the‑loop where risk warrants it, and basic data hygiene prevent silent failures, surprise bills, and reputational harm.",
    whatGoodLooks: [
      "A documented lifecycle: design → deploy → monitor → update → retire",
      "Logging, alerts, and simple dashboards for usage, cost, latency, and failure rates",
      "Human review and quality assurance checkpoints where stakes are high",
      "A searchable data catalogue with owners, lineage, quality thresholds",
      "A lightweight value/feasibility gate for new use‑cases"
    ],
    howToImprove: [
      "Start with monitoring what you already run (latency, cost, error rate) and add simple alerts. Introduce a two‑page intake for new ideas: value hypothesis, data sources, risk level. Designate data owners for key tables or content used by AI. Where decisions affect customers, add human approval until you have evidence that automation is safe."
    ],
    commonPitfalls: [
      "Over‑engineering MLOps before any value has shipped",
      "No drift or cost alerts; discovering issues from users or invoices",
      "Unowned data; stale or inconsistent sources"
    ],
    discussionPrompts: [
      "What do we measure today on our AI services? What's missing?",
      "Which one dataset, if cleaned and owned, would unlock the most value?",
      "Where should a human stay in the loop for now?"
    ]
  },
  R: {
    whyMatters: "Trust and safety make AI adoption sustainable. Stakeholders expect you to know what AI you run, the risks it carries, and how you'll respond when something goes wrong. Basic assurance practices prevent reputational damage and regulatory setbacks.",
    whatGoodLooks: [
      "An AI inventory with owners and risk levels",
      "Scheduled checks for fairness, privacy, and model/data drift",
      "Periodic red‑teaming for prompts/jailbreaks and data exfiltration attempts",
      "An incident response runbook with roles and communications",
      "Internal or third‑party review of controls (as required)"
    ],
    howToImprove: [
      "Catalog what you already use (systems, vendors, purpose, data). Schedule basic checks for high‑impact use‑cases and test your defenses with simple adversarial prompts. Draft a one‑page IR plan: who triages, who decides, who informs customers. Regulated contexts often add annual assurance whether internal or external."
    ],
    commonPitfalls: [
      "Policy documents without monitoring",
      "Unknown owners; no one reacts when metrics drift",
      "Treating red‑teaming as a one‑time event"
    ],
    discussionPrompts: [
      "Which AI system could create the most damage if it failed? Do we monitor it?",
      "Who picks up the phone when an AI incident occurs?",
      "How often do we test for bias, privacy, and jailbreaks?"
    ]
  },
  T: {
    whyMatters: "Adoption is about work, not tools. People need role‑specific skills and updated workflows that show when to use AI, when to verify, and how to escalate. Stories and incentives help good behaviors spread.",
    whatGoodLooks: [
      "Clear job families with role‑based AI fluency",
      "SOPs/SOP checklists updated to include AI tasks and checkpoints",
      "\"Wins and lessons\" shared on a regular rhythm",
      "Incentives that reward safe, effective use"
    ],
    howToImprove: [
      "Pick two or three job families that touch customers or costly processes. Create before/after task maps and add simple guardrails (checklists, approval steps). Offer short, role‑specific training with real examples. Share what works and what fails—both teach."
    ],
    commonPitfalls: [
      "Generic training without job redesign",
      "Incentives that reward activity over outcomes",
      "\"One wizard\" knows everything; no diffusion"
    ],
    discussionPrompts: [
      "Which roles will benefit most from AI in 90 days?",
      "What checkpoints keep customers safe while we learn?",
      "How will we recognize and reward smart usage?"
    ]
  },
  E: {
    whyMatters: "Partners and platform choices determine speed, cost, and flexibility. Elastic capacity keeps teams moving; portability and clear terms help you avoid lock‑in and surprises.",
    whatGoodLooks: [
      "Elastic capacity and simple FinOps visibility (unit costs, quotas)",
      "Strategic partners that fill capability gaps",
      "Exit/portability plans in contracts (export formats, second source)",
      "Governed APIs and basic interoperability standards"
    ],
    howToImprove: [
      "Start by measuring unit costs and watching quotas. Consolidate on a few well‑understood services with clear terms (\"no training on our data/outputs\" when needed). Draft a one‑page exit plan: how we would switch, what we'd export, and a secondary option for critical paths."
    ],
    commonPitfalls: [
      "Vendor lock‑in via proprietary formats and unclear rights",
      "Quota bottlenecks; budget surprises",
      "One‑off integrations that don't scale"
    ],
    discussionPrompts: [
      "Which costs or quotas block us most often?",
      "What contractual term would protect our data and options?",
      "If our primary vendor failed tomorrow, what's our plan?"
    ]
  },
  X: {
    whyMatters: "AI changes quickly. Disciplined experimentation—safe sandboxes, small budgets, explicit success and sunset criteria—increases learning velocity and prevents \"pilot purgatory.\"",
    whatGoodLooks: [
      "A guarded sandbox with representative data and spending caps",
      "A ring‑fenced slice of time/credits for experiments",
      "Every pilot has success and sunset criteria and a decision date",
      "Lightweight horizon scanning of tech, policy, and competitors"
    ],
    howToImprove: [
      "Provide a clear on‑ramp: where to try ideas, what's allowed, and how to request data. Require a simple metric and decision date for every pilot. Run a short horizon brief quarterly to decide what to watch or ignore. Retire experiments on time so resources return to the pool."
    ],
    commonPitfalls: [
      "Pilots with no metrics or end dates",
      "Sandboxes with real data but no guardrails",
      "Chasing every new model without a hypothesis"
    ],
    discussionPrompts: [
      "Which two experiments should we run next quarter, and why?",
      "What decision will each pilot inform?",
      "What will we stop if it doesn't meet the threshold?"
    ]
  }
};

export default function DomainCard({ pillar, stage, priority, contextReason, contextGuidance, contextProfile, valueOverlay, onValueOverlayUpdate, priorityMoves }: DomainCardProps) {
  const [showGuides, setShowGuides] = useState(false);
  const pillarInfo = CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS];
  const stageIndex = Math.floor(stage);
  const stageInfo = MATURITY_STAGES[stageIndex];
  const guidance = contextGuidance?.[pillar] || DOMAIN_GUIDANCE[pillar as keyof typeof DOMAIN_GUIDANCE];
  
  // Get micro-guides for this pillar and context
  const pillarGuides = getMicroGuidesByPillar(pillar);
  const contextTags = contextGuidance?.contentTags || [];
  const contextGuides = getMicroGuidesByTags(contextTags);
  const relevantGuides = ([...pillarGuides, ...contextGuides].slice(0, 2)) as GuideWithSteps[]; // Show top 2 most relevant
  
  // Handle Value Overlay
  const selectedMetric = valueOverlay ? getMetricById(valueOverlay.metric_id) : (contextProfile ? getMetricById(getContextAwareDefaults(contextProfile)[pillar]) : getDefaultMetricForPillar(pillar));
  
  const handleMetricChange = (metricId: string) => {
    if (!onValueOverlayUpdate) return;
    const metric = getMetricById(metricId);
    if (!metric) return;
    
    onValueOverlayUpdate(pillar, {
      metric_id: metricId,
      name: metric.name,
      unit: metric.unit,
      baseline: null,
      target: null,
      cadence: pillar === 'X' ? 'quarterly' : 'monthly'
    });
  };

  const handleValueUpdate = (updates: Partial<ValueOverlayPillar>) => {
    if (!onValueOverlayUpdate) return;
    onValueOverlayUpdate(pillar, updates);
  };
  
  if (!pillarInfo || !stageInfo || !guidance) return null;

  return (
    <Card className="relative">
      <CardContent className="p-6">
        {priority && priority <= 3 && (
          <div className="absolute top-4 right-4">
            <Badge 
              variant={priority === 1 ? "destructive" : "secondary"}
              data-testid={`priority-badge-${pillar}`}
            >
              Priority #{priority}
            </Badge>
          </div>
        )}
        
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="text-white p-2 rounded-lg"
            style={{ backgroundColor: getStageColor(stage) }}
          >
            {pillar === 'C' && <Target className="h-5 w-5" />}
            {pillar === 'O' && <Cog className="h-5 w-5" />}
            {pillar === 'R' && <Shield className="h-5 w-5" />}
            {pillar === 'T' && <Users className="h-5 w-5" />}
            {pillar === 'E' && <Network className="h-5 w-5" />}
            {pillar === 'X' && <Lightbulb className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-lg font-display">{pillarInfo.name}</h3>
            <p className="text-sm text-muted-foreground font-ui">
              {pillar} — Score {stage.toFixed(2)}/3 ({stageInfo.name})
            </p>
          </div>
        </div>
        
        {/* Value Overlay Section */}
        {selectedMetric && (
          <div className="border-t pt-4 mb-4">
            <h4 className="font-medium mb-2 text-primary flex items-center space-x-2 font-display">
              <TrendingUp className="h-4 w-4" />
              <span>Value Overlay</span>
            </h4>
            
            <ValueMetricChip
              pillar={pillar}
              metric={selectedMetric}
              contextProfile={contextProfile}
              onChangeMetric={handleMetricChange}
            />
            
            {valueOverlay && (
              <ValueInputFields
                pillar={pillar}
                valueData={valueOverlay}
                onUpdate={handleValueUpdate}
              />
            )}
            
            <div className="mt-2">
              <HowToMeasureDialog metric={selectedMetric}>
                <Button variant="ghost" size="sm" className="text-xs px-2 h-6" data-testid={`button-how-to-measure-${pillar.toLowerCase()}`}>
                  <HelpCircle className="w-3 h-3 mr-1" />
                  How to measure
                </Button>
              </HowToMeasureDialog>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-primary font-display">Why This Matters</h4>
            <p className="text-sm text-muted-foreground font-ui">
              {guidance.why_it_matters || guidance.whyMatters}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-primary font-display flex items-center space-x-2">
              <CheckSquare className="h-4 w-4" />
              <span>What Good Can Look Like</span>
            </h4>
            <div className="space-y-2">
              {(guidance.what_good_looks_like || guidance.whatGoodLooks || []).map((item: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                  <div className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">
                    <CheckSquare className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm text-foreground font-ui leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-primary font-display">How to Improve</h4>
            <ul className="text-sm text-muted-foreground space-y-1 font-ui">
              {(guidance.how_to_improve || guidance.howToImprove || []).map((item: string, index: number) => (
                <li key={index}>• <strong>{item.split(' ')[0]} {item.split(' ')[1]}</strong> {item.split(' ').slice(2).join(' ')}</li>
              ))}
            </ul>
            
            {/* Context-specific priority note */}
            {guidance.priority_note && (
              <p className="text-xs text-primary mt-2 bg-primary/5 p-2 rounded font-ui border border-primary/15">
                <Star className="h-4 w-4 mr-1" />
                <strong>Context Priority:</strong> {guidance.priority_note}
              </p>
            )}
            
            {contextReason && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 bg-orange-50 dark:bg-orange-950/30 p-2 rounded font-ui border border-orange-200 dark:border-orange-800">
                <Info className="h-4 w-4 mr-1" />
                <strong>Because:</strong> {contextReason}
              </p>
            )}
          </div>
          
          {/* Common Pitfalls */}
          {(guidance.common_pitfalls || guidance.commonPitfalls) && (
            <div>
              <h4 className="font-medium mb-2 text-primary font-display">Common Pitfalls</h4>
              <ul className="text-sm text-muted-foreground space-y-1 font-ui">
                {(guidance.common_pitfalls || guidance.commonPitfalls || []).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Discussion Prompts */}
          {(guidance.discussion_prompts || guidance.discussionPrompts) && (
            <div>
              <h4 className="font-medium mb-2 text-primary font-display">Discussion Prompts</h4>
              <ul className="text-sm text-muted-foreground space-y-1 font-ui">
                {(guidance.discussion_prompts || guidance.discussionPrompts || []).map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Priority Moves */}
          {priorityMoves && priorityMoves.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-primary flex items-center space-x-2 font-display">
                <TrendingUp className="h-4 w-4" />
                <span>Top Priority Moves</span>
              </h4>
              <div className="space-y-2">
                {priorityMoves.slice(0, 2).map((move) => (
                  <div key={move.id} className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          #{move.rank}
                        </Badge>
                        <span className="font-medium text-sm font-ui">{move.title}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    
                    {move.explain && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Gap Impact: <span className="font-medium">+{(move.explain.gapBoost * 100).toFixed(0)}%</span></div>
                          <div>Context Fit: <span className="font-medium">+{(move.explain.profileBoost * 100).toFixed(0)}%</span></div>
                        </div>
                        {move.explain.triggeringDimensions && move.explain.triggeringDimensions.length > 0 && (
                          <p className="text-xs mt-1 text-primary/70">
                            <strong>Why prioritized:</strong> {move.explain.triggeringDimensions.join(', ').replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Micro-Guides */}
          {relevantGuides.length > 0 && (
            <Collapsible open={showGuides} onOpenChange={setShowGuides}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">Implementation Guides ({relevantGuides.length})</span>
                  </div>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showGuides ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                {relevantGuides.map((guide) => (
                  <div key={guide.id} className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm">{guide.title}</h5>
                      <Badge variant="outline" className="text-xs">
                        {guide.steps?.length ? `${guide.steps.length} steps` : 'Guide'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{guide.overview}</p>
                    
                    {guide.steps?.slice(0, 2).map((step: GuideStep) => (
                      <div key={step.order} className="flex items-start space-x-2 text-xs mb-1">
                        <div className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {step.order}
                        </div>
                        <div>
                          <span className="font-medium">{step.title}</span>
                          <span className="text-muted-foreground ml-1">({step.timeframe})</span>
                        </div>
                      </div>
                    ))}
                    
                    {guide.steps && guide.steps.length > 2 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{guide.steps.length - 2} more steps...
                      </p>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
