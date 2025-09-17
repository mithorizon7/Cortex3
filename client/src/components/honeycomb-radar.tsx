import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PillarScores, ConfidenceGaps } from "@shared/schema";
import { CORTEX_PILLARS, calculateRingRadius, getPillarPosition, getStageColor, MATURITY_STAGES } from "@/lib/cortex";
import { BarChart3, AlertTriangle } from "lucide-react";

interface HoneycombRadarProps {
  pillarScores: PillarScores;
  confidenceGaps?: ConfidenceGaps;
  className?: string;
}

// Helper function to get confidence level based on unsure count
function getConfidenceLevel(unsureCount: number): { level: string; color: string; opacity: string } {
  if (unsureCount === 0) {
    return { level: 'High', color: 'rgb(34, 197, 94)', opacity: '0.8' }; // green-500
  } else if (unsureCount === 1) {
    return { level: 'Medium', color: 'rgb(245, 158, 11)', opacity: '0.7' }; // amber-500  
  } else {
    return { level: 'Low', color: 'rgb(239, 68, 68)', opacity: '0.6' }; // red-500
  }
}

export default function HoneycombRadar({ pillarScores, confidenceGaps, className }: HoneycombRadarProps) {
  const [showTable, setShowTable] = useState(false);
  
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 60;
  
  const pillarOrder = ['C', 'O', 'R', 'T', 'E', 'X'];
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">CORTEX Maturity Radar</h2>
        <Button 
          variant="ghost" 
          onClick={() => setShowTable(!showTable)}
          data-testid="button-toggle-radar-view"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {showTable ? 'Chart View' : 'Table View'}
        </Button>
      </div>
      
      {!showTable ? (
        <>
          <div className="relative">
            <svg viewBox="0 0 400 400" className="w-full h-auto max-w-md mx-auto" data-testid="radar-chart">
              {/* Background grid rings (equal area) */}
              <g className="radar-grid">
                {/* Equal-area rings */}
                {[1, 2, 3].map(stage => (
                  <circle 
                    key={stage}
                    cx={centerX} 
                    cy={centerY} 
                    r={calculateRingRadius(stage, maxRadius)}
                    className="radar-grid"
                  />
                ))}
                
                {/* Hexagon grid lines */}
                {[1, 2, 3].map(stage => {
                  const radius = calculateRingRadius(stage, maxRadius);
                  const points = [];
                  for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3 - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    points.push(`${x},${y}`);
                  }
                  return (
                    <polygon 
                      key={`hex-${stage}`}
                      points={points.join(' ')} 
                      className="radar-grid"
                    />
                  );
                })}
                
                {/* Spoke lines */}
                {pillarOrder.map((_, index) => {
                  const angle = (index * Math.PI) / 3 - Math.PI / 2;
                  const endX = centerX + maxRadius * Math.cos(angle);
                  const endY = centerY + maxRadius * Math.sin(angle);
                  return (
                    <line 
                      key={`spoke-${index}`}
                      x1={centerX} 
                      y1={centerY} 
                      x2={endX} 
                      y2={endY}
                      className="radar-grid"
                    />
                  );
                })}
              </g>
              
              {/* Filled areas for each pillar */}
              {pillarOrder.map((pillar, index) => {
                const score = pillarScores[pillar as keyof PillarScores];
                if (score === 0) return null;
                
                const radius = calculateRingRadius(score, maxRadius);
                const angle = (index * Math.PI) / 3 - Math.PI / 2;
                const nextAngle = ((index + 1) * Math.PI) / 3 - Math.PI / 2;
                
                const x1 = centerX + radius * Math.cos(angle);
                const y1 = centerY + radius * Math.sin(angle);
                const x2 = centerX + radius * Math.cos(nextAngle);
                const y2 = centerY + radius * Math.sin(nextAngle);
                
                return (
                  <path 
                    key={`fill-${pillar}`}
                    d={`M ${centerX},${centerY} L ${x1},${y1} A ${radius} ${radius} 0 0 1 ${x2},${y2} Z`}
                    fill={getStageColor(score)}
                    fillOpacity="0.6"
                    stroke={getStageColor(score)}
                    strokeWidth="2"
                  />
                );
              })}
              
              {/* Confidence gap overlays */}
              {confidenceGaps && pillarOrder.map((pillar, index) => {
                const score = pillarScores[pillar as keyof PillarScores];
                const unsureCount = confidenceGaps[pillar as keyof ConfidenceGaps];
                if (score === 0 || unsureCount === 0) return null;
                
                const radius = calculateRingRadius(score, maxRadius);
                const angle = (index * Math.PI) / 3 - Math.PI / 2;
                const nextAngle = ((index + 1) * Math.PI) / 3 - Math.PI / 2;
                
                const x1 = centerX + radius * Math.cos(angle);
                const y1 = centerY + radius * Math.sin(angle);
                const x2 = centerX + radius * Math.cos(nextAngle);
                const y2 = centerY + radius * Math.sin(nextAngle);
                
                const { color, opacity } = getConfidenceLevel(unsureCount);
                
                return (
                  <g key={`confidence-${pillar}`}>
                    {/* Create defs for dotted pattern */}
                    <defs>
                      <pattern 
                        id={`dots-${pillar}`} 
                        x="0" y="0" width="8" height="8" 
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="4" cy="4" r="1.5" fill={color} fillOpacity={opacity} />
                      </pattern>
                    </defs>
                    
                    {/* Apply dotted overlay to the filled area */}
                    <path 
                      d={`M ${centerX},${centerY} L ${x1},${y1} A ${radius} ${radius} 0 0 1 ${x2},${y2} Z`}
                      fill={`url(#dots-${pillar})`}
                      stroke={color}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      strokeOpacity={opacity}
                    />
                  </g>
                );
              })}
              
              {/* Labels with confidence indicators */}
              {pillarOrder.map((pillar, index) => {
                const labelRadius = maxRadius + 20;
                const angle = (index * Math.PI) / 3 - Math.PI / 2;
                const x = centerX + labelRadius * Math.cos(angle);
                const y = centerY + labelRadius * Math.sin(angle);
                
                const unsureCount = confidenceGaps?.[pillar as keyof ConfidenceGaps] || 0;
                const { level, color } = getConfidenceLevel(unsureCount);
                
                return (
                  <g key={`label-${pillar}`}>
                    {/* Pillar letter */}
                    <text 
                      x={x} 
                      y={y + 4} 
                      textAnchor="middle" 
                      className="text-sm font-medium fill-foreground"
                    >
                      {pillar}
                    </text>
                    
                    {/* Confidence indicator */}
                    {confidenceGaps && (
                      <g>
                        <text 
                          x={x} 
                          y={y + 18} 
                          textAnchor="middle" 
                          className="text-xs fill-muted-foreground"
                        >
                          Conf: {level}
                        </text>
                        {/* Small dot indicator */}
                        <circle 
                          cx={x + 25} 
                          cy={y + 14} 
                          r="3" 
                          fill={color} 
                          opacity="0.8"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
              
              {/* Center logo */}
              <circle cx={centerX} cy={centerY} r="20" fill="hsl(var(--primary))" opacity="0.1"/>
              <text x={centerX} y={centerY + 4} textAnchor="middle" className="text-xs font-bold fill-primary">
                CORTEX
              </text>
            </svg>
            
            {/* Legend */}
            <div className="flex justify-center mt-4">
              <div className="flex flex-wrap gap-4 text-sm">
                {MATURITY_STAGES.slice(1).map((stage) => (
                  <div key={stage.level} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span>{stage.name} ({stage.level})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <Table data-testid="radar-table">
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead className="text-center">Stage</TableHead>
              <TableHead>Status</TableHead>
              {confidenceGaps && <TableHead>Confidence</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pillarOrder.map((pillar) => {
              const score = pillarScores[pillar as keyof PillarScores];
              const stage = MATURITY_STAGES[score];
              const unsureCount = confidenceGaps?.[pillar as keyof ConfidenceGaps] || 0;
              const { level, color } = getConfidenceLevel(unsureCount);
              
              return (
                <TableRow key={pillar}>
                  <TableCell>{CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS].name}</TableCell>
                  <TableCell className="text-center">{score}</TableCell>
                  <TableCell>
                    <span style={{ color: stage.color }} className="font-medium">
                      {stage.name}
                    </span>
                  </TableCell>
                  {confidenceGaps && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm">{level} ({3 - unsureCount}/3)</span>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
