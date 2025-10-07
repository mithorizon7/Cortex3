import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Edit3, HelpCircle } from 'lucide-react';
import { getMetricsByPillar, getMetricById, getMetricContextExplanation, type Metric } from '@/lib/value-overlay';
import { getMetricGuide } from '@/lib/metric-guides';
import type { ValueOverlayPillar, ContextProfile } from '@shared/schema';
import DOMPurify from 'dompurify';

interface ValueMetricChipProps {
  pillar: string;
  metric: Metric;
  contextProfile?: ContextProfile;
  onChangeMetric?: (metricId: string) => void;
}

export function ValueMetricChip({ pillar, metric, contextProfile, onChangeMetric }: ValueMetricChipProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const alternateMetrics = getMetricsByPillar(pillar).filter(m => m.id !== metric.id);
  const contextExplanation = contextProfile ? getMetricContextExplanation(metric.id, contextProfile) : null;
  const metricGuide = getMetricGuide(metric.id);

  const handleMetricChange = (metricId: string) => {
    onChangeMetric?.(metricId);
    setIsChangeOpen(false);
  };

  // Format the metric guide content with markdown-like formatting
  const formatMetricGuide = (content: string) => {
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    
    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'br'],
      ALLOWED_ATTR: []
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 sm:mb-4">
      {/* Metric Info Dialog */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="secondary" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto w-full sm:w-auto"
            data-testid={`button-metric-info-${pillar.toLowerCase()}`}
          >
            <Info className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{metric.name}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">{metric.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            {/* Quick Definition */}
            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <div className="font-medium text-xs sm:text-sm mb-1.5 sm:mb-2">What this measures</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{metric.definition}</div>
            </div>

            {/* Context Explanation if available */}
            {contextExplanation && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-medium text-xs sm:text-sm mb-1.5 sm:mb-2 text-blue-900 dark:text-blue-100">
                  💡 Why this metric fits your organization
                </div>
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">{contextExplanation}</div>
              </div>
            )}

            {/* Full Measurement Guide */}
            {metricGuide && (
              <div className="prose prose-sm max-w-none">
                <div className="font-medium text-xs sm:text-sm mb-2 sm:mb-3">How to measure it</div>
                <div 
                  className="text-xs sm:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMetricGuide(metricGuide.content)
                  }} 
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Metric Dialog */}
      <Dialog open={isChangeOpen} onOpenChange={setIsChangeOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs px-2 h-6 w-full sm:w-auto" data-testid={`button-change-metric-${pillar.toLowerCase()}`}>
            <Edit3 className="w-3 h-3 mr-1" />
            Change
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Choose metric for {pillar} pillar</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 sm:space-y-3">
            <div className="p-2 sm:p-3 bg-muted rounded-lg">
              <div className="font-medium text-xs sm:text-sm mb-1">Current: {metric.name}</div>
              <div className="text-xs text-muted-foreground">{metric.definition}</div>
            </div>
            
            {alternateMetrics.length > 0 && (
              <>
                <div className="text-xs sm:text-sm font-medium">Alternatives:</div>
                <div className="space-y-2">
                  {alternateMetrics.map((altMetric) => (
                    <div key={altMetric.id} className="border rounded-lg p-2 sm:p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col sm:flex-row items-start gap-2 sm:justify-between">
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="font-medium text-xs sm:text-sm mb-1">{altMetric.name}</div>
                          <div className="text-xs text-muted-foreground">{altMetric.definition}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMetricChange(altMetric.id)}
                          data-testid={`button-select-metric-${altMetric.id}`}
                          className="w-full sm:w-auto text-xs flex-shrink-0"
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ValueInputFieldsProps {
  pillar: string;
  valueData: ValueOverlayPillar;
  onUpdate: (updates: Partial<ValueOverlayPillar>) => void;
}

export function ValueInputFields({ pillar, valueData, onUpdate }: ValueInputFieldsProps) {
  const [baseline, setBaseline] = useState(valueData.baseline?.toString() ?? '');
  const [target, setTarget] = useState(valueData.target?.toString() ?? '');
  const [cadence, setCadence] = useState(valueData.cadence);

  const handleBaselineChange = (value: string) => {
    setBaseline(value);
    const numValue = value === '' ? null : parseFloat(value);
    if (!isNaN(numValue as number) || numValue === null) {
      onUpdate({ baseline: numValue });
    }
  };

  const handleTargetChange = (value: string) => {
    setTarget(value);
    const numValue = value === '' ? null : parseFloat(value);
    if (!isNaN(numValue as number) || numValue === null) {
      onUpdate({ target: numValue });
    }
  };

  const handleCadenceChange = (value: 'monthly' | 'quarterly') => {
    setCadence(value);
    onUpdate({ cadence: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
      <div className="space-y-2">
        <Label htmlFor={`baseline-${pillar}`} className="text-xs font-medium">
          Baseline
        </Label>
        <div className="flex items-center gap-1">
          <Input
            id={`baseline-${pillar}`}
            type="number"
            step="any"
            placeholder="Current value"
            value={baseline}
            onChange={(e) => handleBaselineChange(e.target.value)}
            className="h-8 text-xs"
            data-testid={`input-baseline-${pillar.toLowerCase()}`}
          />
          <span className="text-xs text-muted-foreground min-w-fit">
            {valueData.unit}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`target-${pillar}`} className="text-xs font-medium">
          90-day target
        </Label>
        <div className="flex items-center gap-1">
          <Input
            id={`target-${pillar}`}
            type="number"
            step="any"
            placeholder="Goal value"
            value={target}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="h-8 text-xs"
            data-testid={`input-target-${pillar.toLowerCase()}`}
          />
          <span className="text-xs text-muted-foreground min-w-fit">
            {valueData.unit}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`cadence-${pillar}`} className="text-xs font-medium">
          Update cadence
        </Label>
        <Select value={cadence} onValueChange={handleCadenceChange}>
          <SelectTrigger className="h-8 text-xs" id={`cadence-${pillar}`} data-testid={`select-cadence-${pillar.toLowerCase()}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface HowToMeasureDialogProps {
  metric: Metric;
  children: React.ReactNode;
}

export function HowToMeasureDialog({ metric, children }: HowToMeasureDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const metricGuide = getMetricGuide(metric.id);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">How to measure: {metric.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-muted p-3 sm:p-4 rounded-lg">
            <div className="font-medium text-xs sm:text-sm mb-1.5 sm:mb-2">Quick summary</div>
            <div className="text-xs sm:text-sm">{metric.definition}</div>
            <div className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
              Unit: {metric.unit} • Pillar: {metric.pillar}
            </div>
          </div>
          
          {metricGuide ? (
            <div className="prose prose-sm max-w-none">
              <div 
                className="text-xs sm:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(
                    metricGuide.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/^(.*)$/, '<p>$1</p>'),
                    {
                      ALLOWED_TAGS: ['p', 'strong', 'em', 'br', 'ul', 'ol', 'li'],
                      ALLOWED_ATTR: []
                    }
                  )
                }} 
              />
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-muted-foreground">
              <p>Detailed measurement guide for this metric is being prepared.</p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p><strong>Attribution note:</strong> This tracks directional impact; not pure causality.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ValueSnapshotProps {
  valueOverlay: Record<string, ValueOverlayPillar> | null;
  totalPillars: number;
}

export function ValueSnapshot({ valueOverlay, totalPillars }: ValueSnapshotProps) {
  if (!valueOverlay) {
    return null;
  }

  const selectedCount = Object.keys(valueOverlay).length;
  const withTargets = Object.values(valueOverlay).filter(v => v.target !== null).length;

  return (
    <div className="bg-muted/50 border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        <span className="font-medium text-sm">Value Snapshot</span>
      </div>
      <p className="text-sm text-muted-foreground">
        You selected {selectedCount} metrics (one per domain). 
        {withTargets > 0 ? (
          <span className="text-primary"> {withTargets} have targets set to track progress next quarter.</span>
        ) : (
          <span> Add baselines/targets to track progress next quarter.</span>
        )}
      </p>
    </div>
  );
}