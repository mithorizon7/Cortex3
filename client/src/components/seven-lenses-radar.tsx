import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import type { ExtendedOptionCard } from "@shared/schema";
import { LENS_LABELS } from "@shared/options-studio-data";

interface SevenLensesRadarProps {
  selectedOptions: ExtendedOptionCard[];
  emphasizedLenses?: string[];
  className?: string;
}

// Color palette for different options in the radar chart
const CHART_COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#ca8a04', // yellow-600
  '#9333ea', // violet-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#be123c', // rose-600
];

interface RadarDataPoint {
  lens: string;
  fullName: string;
  [key: string]: string | number; // Dynamic keys for each option
}

export function SevenLensesRadar({ selectedOptions, emphasizedLenses = [], className }: SevenLensesRadarProps) {
  // Map lens labels to lens value keys
  const lensKeyMap: Record<string, keyof ExtendedOptionCard['lensValues']> = {
    'Speed-to-Value': 'speed',
    'Customization & Control': 'control',
    'Data Leverage': 'dataLeverage', 
    'Risk & Compliance Load': 'riskLoad',
    'Operational Burden': 'opsBurden',
    'Portability & Lock-in': 'portability',
    'Cost Shape': 'costShape'
  };

  // Transform data for recharts radar format
  const radarData: RadarDataPoint[] = LENS_LABELS.map(lens => {
    const lensKey = lensKeyMap[lens];
    const dataPoint: RadarDataPoint = {
      lens: lens.split(' ')[0], // Abbreviated name for display
      fullName: lens,
    };
    
    // Add each selected option's value for this lens
    selectedOptions.forEach((option, index) => {
      dataPoint[`option_${index}`] = option.lensValues[lensKey] || 0;
    });
    
    return dataPoint;
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const lensData = radarData.find(d => d.lens === label);
      return (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{lensData?.fullName}</p>
          {payload.map((entry: any, index: number) => {
            const option = selectedOptions[index];
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{option?.title.split('(')[0].trim()}</span>
                <span className="ml-auto font-semibold">{entry.value}</span>
              </div>
            );
          })}
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            <LensScaleExplanation lens={lensData?.fullName || ''} />
          </div>
        </div>
      );
    }
    return null;
  };

  if (selectedOptions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Seven Lenses Radar Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Select 2 or more options to visualize their positioning on the Seven Lenses framework
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="radar-chart-container">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Seven Lenses Positioning
          </CardTitle>
          <div className="flex flex-wrap gap-1">
            {emphasizedLenses.map(lens => (
              <Badge key={lens} variant="secondary" className="text-xs">
                {lens.split(' ')[0]}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="lens" 
                tick={{ fontSize: 12, textAnchor: 'middle' }}
                className="text-sm font-medium"
              />
              <PolarRadiusAxis 
                angle={0} 
                domain={[0, 4]} 
                tick={{ fontSize: 10 }}
                tickCount={5}
              />
              
              {selectedOptions.map((option, index) => (
                <Radar
                  key={`option_${index}`}
                  name={option.title.split('(')[0].trim()}
                  dataKey={`option_${index}`}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, r: 4 }}
                />
              ))}
              
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Lens Explanation */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="font-semibold text-primary">Quick Reference:</div>
            <div>Speed-to-Value: 0=months+, 4=days</div>
            <div>Customization: 0=out-of-box, 4=deeply tailored</div>
            <div>Data Leverage: 0=no custom data, 4=strong proprietary use</div>
            <div>Risk Load: 0=minimal controls, 4=heavy governance</div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-primary">Continued:</div>
            <div>Ops Burden: 0=near zero ops, 4=dedicated team</div>
            <div>Portability: 0=hard to switch, 4=easy to migrate</div>
            <div>Cost Shape: 0=heavy CapEx, 4=variable OpEx</div>
          </div>
        </div>

        {emphasizedLenses.length > 0 && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/15">
            <div className="text-sm font-medium text-primary mb-1">
              Emphasized for your context:
            </div>
            <div className="text-xs text-foreground/80">
              {emphasizedLenses.join(', ')} - These lenses are particularly important based on your assessment profile.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for lens scale explanations
function LensScaleExplanation({ lens }: { lens: string }) {
  const explanations: Record<string, string> = {
    'Speed-to-Value': '0=months+, 2=weeks, 4=days to deploy',
    'Customization & Control': '0=out-of-box, 2=configurable, 4=deeply tailored',
    'Data Leverage': '0=no custom data, 2=basic use, 4=strong proprietary advantage',
    'Risk & Compliance Load': '0=minimal controls, 2=standard governance, 4=heavy compliance',
    'Operational Burden': '0=near zero ops, 2=light maintenance, 4=dedicated team required',
    'Portability & Lock-in': '0=hard to switch, 2=some flexibility, 4=easy to migrate',
    'Cost Shape': '0=heavy fixed/CapEx, 2=mixed model, 4=variable/throttleable OpEx'
  };

  return (
    <span>{explanations[lens] || 'Scale: 0-4 (low to high)'}</span>
  );
}