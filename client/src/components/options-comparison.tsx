import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight,
  Target,
  Zap,
  Shield,
  Users,
  Settings,
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Wrench,
  Activity,
  X
} from "lucide-react";
import type { ExtendedOptionCard } from "@shared/schema";
import { LENS_LABELS } from "@shared/options-studio-data";
import { SevenLensesRadar } from "./seven-lenses-radar";

interface OptionsComparisonProps {
  selectedOptions: ExtendedOptionCard[];
  emphasizedLenses: string[];
  onRemoveOption: (optionId: string) => void;
  onClearAll: () => void;
}

// Color mapping for consistency with radar chart
const OPTION_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
];

const LENS_ICONS = {
  "Speed-to-Value": TrendingUp,
  "Customization & Control": Settings,
  "Data Leverage": Target,
  "Risk & Compliance Load": Shield,
  "Operational Burden": Users,
  "Portability & Lock-in": ArrowRight,
  "Cost Shape": DollarSign
};

const TIMELINE_ICONS = {
  speed: Zap,
  buildEffort: Wrench,
  ops: Activity
};

export function OptionsComparison({ 
  selectedOptions, 
  emphasizedLenses, 
  onRemoveOption, 
  onClearAll 
}: OptionsComparisonProps) {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  if (selectedOptions.length === 0) {
    return null;
  }

  const toggleDetails = (optionId: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  // Map lens labels to keys
  const lensKeyMap: Record<string, keyof ExtendedOptionCard['lensValues']> = {
    'Speed-to-Value': 'speed',
    'Customization & Control': 'control',
    'Data Leverage': 'dataLeverage',
    'Risk & Compliance Load': 'riskLoad',
    'Operational Burden': 'opsBurden',
    'Portability & Lock-in': 'portability',
    'Cost Shape': 'costShape'
  };

  return (
    <div className="space-y-6" data-testid="options-comparison-container">
      {/* Header with selected options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Comparing {selectedOptions.length} Options
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearAll}
              data-testid="button-clear-all-comparisons"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map((option, index) => (
              <Badge 
                key={option.id} 
                variant="outline" 
                className={`${OPTION_COLORS[index % OPTION_COLORS.length]} px-3 py-1`}
                data-testid={`badge-comparing-${option.id}`}
              >
                <span className="mr-2">{option.title.split('(')[0].trim()}</span>
                <button
                  onClick={() => onRemoveOption(option.id)}
                  className="ml-1 hover:text-destructive"
                  data-testid={`button-remove-comparison-${option.id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="radar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="radar" data-testid="tab-radar-chart">Radar Chart</TabsTrigger>
          <TabsTrigger value="sidebyside" data-testid="tab-side-by-side">Side-by-Side</TabsTrigger>
          <TabsTrigger value="table" data-testid="tab-comparison-table">Comparison Table</TabsTrigger>
        </TabsList>

        <TabsContent value="radar" className="space-y-4">
          <SevenLensesRadar 
            selectedOptions={selectedOptions}
            emphasizedLenses={emphasizedLenses}
          />
        </TabsContent>

        <TabsContent value="sidebyside" className="space-y-4">
          <div className="grid gap-6">
            {selectedOptions.map((option, index) => (
              <Card 
                key={option.id} 
                className={`border-l-4 ${OPTION_COLORS[index % OPTION_COLORS.length].split(' ')[2]} ${OPTION_COLORS[index % OPTION_COLORS.length].split(' ')[6]}`}
                data-testid={`card-detailed-${option.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {option.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={option.category === 'ready' ? 'default' : option.category === 'build' ? 'secondary' : 'outline'}>
                          {option.category.toUpperCase()}
                        </Badge>
                        <div className={`px-2 py-1 rounded text-xs font-medium border ${OPTION_COLORS[index % OPTION_COLORS.length]}`}>
                          Option {index + 1}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDetails(option.id)}
                      data-testid={`button-toggle-details-${option.id}`}
                    >
                      {expandedDetails[option.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Core Description */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-what-detailed-${option.id}`}>
                      {option.what}
                    </p>
                    <p className="text-sm" data-testid={`text-description-detailed-${option.id}`}>
                      {option.shortDescription}
                    </p>
                  </div>

                  {/* Seven Lenses Values */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {LENS_LABELS.map((lens) => {
                      const lensKey = lensKeyMap[lens];
                      const value = option.lensValues[lensKey] || 0;
                      const isEmphasized = emphasizedLenses.includes(lens);
                      const IconComponent = LENS_ICONS[lens];
                      
                      return (
                        <div 
                          key={lens} 
                          className={`text-center p-3 rounded-lg border ${
                            isEmphasized 
                              ? 'bg-accent/20 border-accent/40' 
                              : 'bg-muted/50'
                          }`}
                          data-testid={`lens-detailed-${option.id}-${lensKey}`}
                        >
                          <IconComponent className={`w-4 h-4 mx-auto mb-2 ${
                            isEmphasized ? 'text-accent' : 'text-muted-foreground'
                          }`} />
                          <div className="text-xs font-medium mb-1">
                            {lens.split(' ')[0]}
                          </div>
                          <div className={`text-lg font-bold ${
                            isEmphasized ? 'text-accent' : ''
                          }`}>
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline Meters */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                    {[
                      { key: 'speed' as const, label: 'Speed', color: 'text-green-600' },
                      { key: 'buildEffort' as const, label: 'Build', color: 'text-orange-600' },
                      { key: 'ops' as const, label: 'Ops', color: 'text-blue-600' }
                    ].map(({ key, label, color }) => {
                      const IconComponent = TIMELINE_ICONS[key];
                      const value = option.timelineMeters[key];
                      return (
                        <div key={key} className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <IconComponent className={`w-3 h-3 ${color}`} />
                            <span className="text-xs font-medium">{label}</span>
                          </div>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4].map(i => (
                              <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full ${
                                  i <= value ? color.replace('text', 'bg') : 'bg-muted'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Caution Chips */}
                  {option.cautions && option.cautions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {option.cautions.map((caution) => {
                        const cautionConfig = {
                          regulated: { label: 'Regulated', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
                          high_sensitivity: { label: 'High Sensitivity', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
                          low_readiness: { label: 'Build Later', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
                          edge: { label: 'Edge/Offline', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' }
                        };
                        const config = cautionConfig[caution as keyof typeof cautionConfig];
                        return config ? (
                          <Badge 
                            key={caution} 
                            variant="outline" 
                            className={`text-xs ${config.color}`}
                            data-testid={`badge-caution-${caution}-${option.id}`}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Expandable Details */}
                  <Collapsible open={expandedDetails[option.id]}>
                    <CollapsibleContent className="space-y-4">
                      {/* Best For */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">
                          Best For:
                        </h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          {option.bestFor.map((item, i) => (
                            <li key={i} data-testid={`text-best-for-${i}-${option.id}`}>• {item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Not Ideal */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-orange-700 dark:text-orange-400">
                          Not Ideal When:
                        </h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          {option.notIdeal.map((item, i) => (
                            <li key={i} data-testid={`text-not-ideal-${i}-${option.id}`}>• {item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Prerequisites */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-400">
                          Prerequisites:
                        </h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          {option.prerequisites.map((item, i) => (
                            <li key={i} data-testid={`text-prerequisite-${i}-${option.id}`}>• {item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Data Needs & Risks */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Data Needs:</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-data-needs-${option.id}`}>
                            {option.dataNeeds}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Key Risks:</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            {option.risks.map((risk, i) => (
                              <li key={i} data-testid={`text-risk-${i}-${option.id}`}>• {risk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <ComparisonTable 
            selectedOptions={selectedOptions}
            emphasizedLenses={emphasizedLenses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component for the comparison table
interface ComparisonTableProps {
  selectedOptions: ExtendedOptionCard[];
  emphasizedLenses: string[];
}

function ComparisonTable({ selectedOptions, emphasizedLenses }: ComparisonTableProps) {
  const lensKeyMap: Record<string, keyof ExtendedOptionCard['lensValues']> = {
    'Speed-to-Value': 'speed',
    'Customization & Control': 'control', 
    'Data Leverage': 'dataLeverage',
    'Risk & Compliance Load': 'riskLoad',
    'Operational Burden': 'opsBurden',
    'Portability & Lock-in': 'portability',
    'Cost Shape': 'costShape'
  };

  return (
    <Card data-testid="comparison-table-card">
      <CardHeader>
        <CardTitle>Detailed Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Attribute</TableHead>
                {selectedOptions.map((option, index) => (
                  <TableHead key={option.id} className="min-w-48">
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium border ${OPTION_COLORS[index % OPTION_COLORS.length]}`}>
                      Option {index + 1}
                    </div>
                    <div className="font-normal mt-1 text-xs">
                      {option.title.split('(')[0].trim()}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Category Row */}
              <TableRow>
                <TableCell className="font-medium">Category</TableCell>
                {selectedOptions.map(option => (
                  <TableCell key={`category-${option.id}`}>
                    <Badge 
                      variant={option.category === 'ready' ? 'default' : option.category === 'build' ? 'secondary' : 'outline'}
                      data-testid={`table-category-${option.id}`}
                    >
                      {option.category.toUpperCase()}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>

              {/* Seven Lenses Rows */}
              {LENS_LABELS.map(lens => {
                const lensKey = lensKeyMap[lens];
                const isEmphasized = emphasizedLenses.includes(lens);
                return (
                  <TableRow key={lens} className={isEmphasized ? 'bg-accent/10' : ''}>
                    <TableCell className={`font-medium ${isEmphasized ? 'text-accent' : ''}`}>
                      <div className="flex items-center gap-2">
{(() => {
                          const IconComponent = LENS_ICONS[lens];
                          return <IconComponent className={`w-4 h-4 ${isEmphasized ? 'text-accent' : 'text-muted-foreground'}`} />;
                        })()}
                        {lens}
                        {isEmphasized && <Badge variant="secondary" className="text-xs ml-1">Key</Badge>}
                      </div>
                    </TableCell>
                    {selectedOptions.map(option => {
                      const value = option.lensValues[lensKey] || 0;
                      return (
                        <TableCell key={`${lens}-${option.id}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${isEmphasized ? 'text-accent' : ''}`}>
                              {value}
                            </span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4].map(i => (
                                <div 
                                  key={i} 
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i <= value 
                                      ? (isEmphasized ? 'bg-accent' : 'bg-primary') 
                                      : 'bg-muted'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

              {/* Timeline Meters Section */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={selectedOptions.length + 1} className="font-semibold text-center">
                  Timeline & Effort
                </TableCell>
              </TableRow>
              
              {[
                { key: 'speed' as const, label: 'Speed to Deploy', icon: Zap },
                { key: 'buildEffort' as const, label: 'Build Effort', icon: Wrench },
                { key: 'ops' as const, label: 'Operations Load', icon: Activity }
              ].map(({ key, label, icon: Icon }) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </div>
                  </TableCell>
                  {selectedOptions.map(option => {
                    const value = option.timelineMeters[key];
                    return (
                      <TableCell key={`${key}-${option.id}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{value}/4</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => (
                              <div 
                                key={i} 
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i <= value ? 'bg-primary' : 'bg-muted'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}