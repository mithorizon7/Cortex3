import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Edit3, HelpCircle } from 'lucide-react';
import { getMetricsByPillar, getMetricById, getMetricContextExplanation, type Metric } from '@/lib/value-overlay';
import type { ValueOverlayPillar, ContextProfile } from '@shared/schema';

interface ValueMetricChipProps {
  pillar: string;
  metric: Metric;
  contextProfile?: ContextProfile;
  onChangeMetric?: (metricId: string) => void;
}

export function ValueMetricChip({ pillar, metric, contextProfile, onChangeMetric }: ValueMetricChipProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const alternateMetrics = getMetricsByPillar(pillar).filter(m => m.id !== metric.id);
  const contextExplanation = contextProfile ? getMetricContextExplanation(metric.id, contextProfile) : null;

  const handleMetricChange = (metricId: string) => {
    onChangeMetric?.(metricId);
    setIsDialogOpen(false);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-sm px-3 py-1 cursor-help" data-testid={`badge-metric-${pillar.toLowerCase()}`}>
              <Info className="w-3 h-3 mr-1" />
              {metric.name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">Metric to track</p>
            <p className="text-sm text-muted-foreground">{metric.definition}</p>
            {contextExplanation && (
              <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                💡 {contextExplanation}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs px-2 h-6" data-testid={`button-change-metric-${pillar.toLowerCase()}`}>
            <Edit3 className="w-3 h-3 mr-1" />
            Change
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose metric for {pillar} pillar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium text-sm mb-1">Current: {metric.name}</div>
              <div className="text-xs text-muted-foreground">{metric.definition}</div>
            </div>
            
            {alternateMetrics.length > 0 && (
              <>
                <div className="text-sm font-medium">Alternatives:</div>
                <div className="space-y-2">
                  {alternateMetrics.map((altMetric) => (
                    <div key={altMetric.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">{altMetric.name}</div>
                          <div className="text-xs text-muted-foreground">{altMetric.definition}</div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMetricChange(altMetric.id)}
                          data-testid={`button-select-metric-${altMetric.id}`}
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            How to measure: {metric.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="font-medium text-sm mb-2">Quick summary</div>
            <div className="text-sm">{metric.definition}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Unit: {metric.unit} • Pillar: {metric.pillar}
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div 
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: metric.howToMeasure
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^(.*)$/, '<p>$1</p>')
              }} 
            />
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