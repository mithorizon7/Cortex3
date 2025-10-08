import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PillarScores } from "@shared/schema";
import { CORTEX_PILLARS, calculateRingRadius, getPillarPosition, getPillarColor, MATURITY_STAGES } from "@/lib/cortex";
import { BarChart3 } from "lucide-react";

interface HoneycombRadarProps {
  pillarScores: PillarScores;
  className?: string;
}

export default function HoneycombRadar({ pillarScores, className }: HoneycombRadarProps) {
  const [showTable, setShowTable] = useState(false);
  
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 130;
  
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
            <svg viewBox="0 0 400 400" className="w-full h-auto max-w-lg mx-auto" data-testid="radar-chart">
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
                // Don't render if score is undefined or null (not answered yet)
                if (score === undefined || score === null) return null;
                
                const pillarColor = getPillarColor(pillar as any);
                
                // For score of 0, render a small dot at center to show domain was assessed
                if (score === 0) {
                  const angle = (index * Math.PI) / 3 - Math.PI / 2;
                  const dotRadius = 8; // Small dot at center
                  const dotX = centerX + dotRadius * Math.cos(angle);
                  const dotY = centerY + dotRadius * Math.sin(angle);
                  
                  return (
                    <circle
                      key={`zero-${pillar}`}
                      cx={dotX}
                      cy={dotY}
                      r="4"
                      fill={pillarColor}
                      fillOpacity="0.5"
                      stroke={pillarColor}
                      strokeWidth="1"
                    />
                  );
                }
                
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
                    fill={pillarColor}
                    fillOpacity="0.7"
                    stroke={pillarColor}
                    strokeWidth="2"
                  />
                );
              })}
              
              {/* Labels */}
              {pillarOrder.map((pillar, index) => {
                const labelRadius = maxRadius + 20;
                const angle = (index * Math.PI) / 3 - Math.PI / 2;
                const x = centerX + labelRadius * Math.cos(angle);
                const y = centerY + labelRadius * Math.sin(angle);
                
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
                  </g>
                );
              })}
              
              {/* Center logo */}
              <circle cx={centerX} cy={centerY} r="20" fill="hsl(var(--primary))" opacity="0.1"/>
              <text x={centerX} y={centerY + 4} textAnchor="middle" className="text-xs font-bold fill-primary">
                CORTEX
              </text>
            </svg>
            
            {/* Legend - Domain Colors */}
            <div className="flex flex-col items-center mt-4 space-y-2">
              <div className="flex flex-wrap gap-4 text-sm justify-center">
                {pillarOrder.map((pillar) => {
                  const pillarInfo = CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS];
                  return (
                    <div key={pillar} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: pillarInfo.color }}
                      />
                      <span className="text-muted-foreground">{pillar} - {pillarInfo.name}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground/70 italic">
                Small dots near center indicate zero scores (domain assessed with no capabilities in place)
              </p>
            </div>
          </div>
        </>
      ) : (
        <Table data-testid="radar-table">
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pillarOrder.map((pillar) => {
              const score = pillarScores[pillar as keyof PillarScores];
              
              // Handle missing scores (not answered yet)
              if (score === undefined || score === null) {
                return (
                  <TableRow key={pillar}>
                    <TableCell>{CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS].name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">Not assessed</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">—</span>
                    </TableCell>
                  </TableRow>
                );
              }
              
              const stageIndex = Math.floor(score);
              const stage = MATURITY_STAGES[stageIndex];
              
              const pillarInfo = CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS];
              
              return (
                <TableRow key={pillar}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: pillarInfo.color }}
                      />
                      {pillarInfo.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{score.toFixed(2)}/3</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {stage.name}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
