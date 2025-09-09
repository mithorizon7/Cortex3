import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CORTEX_PILLARS, MATURITY_STAGES, getStageColor } from "@/lib/cortex";

interface DomainCardProps {
  pillar: string;
  stage: number;
  priority?: number;
  contextReason?: string;
}

const DOMAIN_GUIDANCE = {
  C: {
    whyMatters: "Prevents pilot sprawl; aligns capital and talent to the few bets that change outcomes.",
    whatGoodLooks: [
      "Written AI ambition with measurable outcomes",
      "Named accountable leader with budget authority", 
      "Quarterly executive reviews with reallocation",
      "Clear CoE and Business Unit responsibilities"
    ],
    howToImprove: [
      "Refine OKRs to include specific AI metrics",
      "Establish C-suite AI literacy program",
      "Document reallocation decisions from reviews",
      "Integrate AI into annual strategic planning"
    ]
  },
  O: {
    whyMatters: "Operational maturity determines whether AI delivers reliable business value or becomes a liability. Poor data governance and monitoring leads to costly outages and compliance violations.",
    whatGoodLooks: [
      "Documented AI lifecycle with monitoring dashboards",
      "Named data owners with searchable catalogues",
      "Standardized intake process for new AI initiatives", 
      "Automated quality checks and drift detection"
    ],
    howToImprove: [
      "Turn on logging & alerts for existing AI systems",
      "Publish intake template for new AI use-cases",
      "Identify golden datasets and assign ownership",
      "Implement HITL checkpoints for high-risk decisions"
    ]
  },
  R: {
    whyMatters: "Robust risk management protects your social license to operate and ensures regulatory compliance. Proactive security prevents costly breaches and reputational damage.",
    whatGoodLooks: [
      "Complete AI inventory with risk assessments",
      "Automated bias and drift monitoring",
      "Regular security red-teaming exercises",
      "Tested incident response procedures"
    ],
    howToImprove: [
      "Automate compliance reporting for efficiency",
      "Expand red-team scenarios beyond current scope", 
      "Share best practices with industry peers",
      "Consider AI risk insurance options"
    ]
  },
  T: {
    whyMatters: "People adoption determines AI success more than technology. Without proper skills and incentives, even the best AI tools won't drive business value.",
    whatGoodLooks: [
      "Role-specific AI training programs",
      "Updated job descriptions and SOPs",
      "Regular sharing of AI wins and lessons",
      "Incentives aligned with AI adoption"
    ],
    howToImprove: [
      "Expand training coverage to all AI-touching roles",
      "Create AI success stories library",
      "Review promotion criteria to include AI fluency",
      "Establish AI mentorship programs"
    ]
  },
  E: {
    whyMatters: "Scalable, cost-effective infrastructure prevents project delays and budget overruns. Strategic partnerships provide capabilities while avoiding vendor lock-in.",
    whatGoodLooks: [
      "Elastic compute with cost monitoring and alerts",
      "Multiple vendor relationships with exit strategies",
      "Secure APIs for external data exchange",
      "FinOps dashboards showing unit economics"
    ],
    howToImprove: [
      "Implement FinOps tracking for AI spend visibility",
      "Document exit clauses in key vendor contracts",
      "Set up cost alerts to prevent budget surprises",
      "Establish API standards for data interoperability"
    ]
  },
  X: {
    whyMatters: "Systematic experimentation prevents \"pilot purgatory\" and accelerates learning. Clear success/sunset criteria ensure resources flow to what works.",
    whatGoodLooks: [
      "Safe sandbox environment with real data",
      "Reserved innovation budget and time",
      "Pre-defined success metrics for pilots",
      "Regular external scanning and competitive intelligence"
    ],
    howToImprove: [
      "Create safe sandbox with production-like data",
      "Reserve 10-15% budget for exploration",
      "Define pilot success criteria upfront",
      "Schedule quarterly tech scanning sessions"
    ]
  }
};

export default function DomainCard({ pillar, stage, priority, contextReason }: DomainCardProps) {
  const pillarInfo = CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS];
  const stageInfo = MATURITY_STAGES[stage];
  const guidance = DOMAIN_GUIDANCE[pillar as keyof typeof DOMAIN_GUIDANCE];
  
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
            <i className={`fas fa-${pillarInfo.icon} text-lg`}></i>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{pillarInfo.name}</h3>
            <p className="text-sm text-muted-foreground">
              Stage {stage} - {stageInfo.name}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-primary">Why This Matters</h4>
            <p className="text-sm text-muted-foreground">
              {guidance.whyMatters}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-primary">What Good Looks Like</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {guidance.whatGoodLooks.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-primary">How to Improve</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {guidance.howToImprove.map((item, index) => (
                <li key={index}>• <strong>{item.split(' ')[0]} {item.split(' ')[1]}</strong> {item.split(' ').slice(2).join(' ')}</li>
              ))}
            </ul>
            {contextReason && (
              <p className="text-xs text-amber-700 mt-2 bg-amber-50 dark:bg-amber-950 p-2 rounded">
                <i className="fas fa-info-circle mr-1"></i>
                <strong>Because:</strong> {contextReason}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
