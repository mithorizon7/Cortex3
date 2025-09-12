export interface AssessmentResults {
  contextProfile: any;
  pillarScores: any;
  triggeredGates: any[];
  priorityMoves?: any;
  valueOverlay?: any;
  completedAt: string;
}

export interface ContextMirrorData {
  strengths: string[];
  fragilities: string[];
  whatWorks: string[];
  disclaimer: string;
  contextProfile: any;
  assessmentId: string;
}

export async function generatePDFReport(results: AssessmentResults): Promise<Blob> {
  // For MVP, we'll use a simple approach to generate PDF
  // In production, consider using libraries like jsPDF or Puppeteer
  
  const content = `
CORTEX™ Executive AI Readiness Assessment Results
Generated: ${new Date(results.completedAt).toLocaleDateString()}

MATURITY SCORES
===============
Clarity & Command: Stage ${results.pillarScores.C}/3
Operations & Data: Stage ${results.pillarScores.O}/3  
Risk, Trust & Security: Stage ${results.pillarScores.R}/3
Talent & Culture: Stage ${results.pillarScores.T}/3
Ecosystem & Infrastructure: Stage ${results.pillarScores.E}/3
Experimentation & Evolution: Stage ${results.pillarScores.X}/3

CONTEXT GATES
=============
${results.triggeredGates.map((gate: any) => `
${gate.title}
Reason: ${gate.reason}
`).join('\n')}

PRIORITY MOVES
==============
${results.priorityMoves?.moves ? results.priorityMoves.moves.map((move: any) => `
#${move.rank} - ${move.title} (${move.pillar} Domain)
Priority Score: ${move.priority.toFixed(3)}
${move.explain ? `Gap Impact: +${(move.explain.gapBoost * 100).toFixed(0)}%, Context Fit: +${(move.explain.profileBoost * 100).toFixed(0)}%` : ''}
`).join('\n') : 'No priority moves available'}

VALUE METRICS
=============
${results.valueOverlay ? Object.entries(results.valueOverlay).map(([pillar, data]: [string, any]) => `
${pillar} Domain: ${data.name}
Unit: ${data.unit}
Cadence: ${data.cadence}
${data.baseline !== null ? `Baseline: ${data.baseline}` : 'Baseline: Not set'}
${data.target !== null ? `Target: ${data.target}` : 'Target: Not set'}
`).join('') : 'No value metrics selected'}

CONTEXT PROFILE
===============
Regulatory Intensity: ${results.contextProfile.regulatory_intensity}/4
Data Sensitivity: ${results.contextProfile.data_sensitivity}/4
Safety Criticality: ${results.contextProfile.safety_criticality}/4
Brand Exposure: ${results.contextProfile.brand_exposure}/4
Market Clock Speed: ${results.contextProfile.clock_speed}/4
Latency/Edge Needs: ${results.contextProfile.latency_edge}/4
Scale/Throughput: ${results.contextProfile.scale_throughput}/4
Data Advantage: ${results.contextProfile.data_advantage}/4
Build Readiness: ${results.contextProfile.build_readiness}/4
FinOps Priority: ${results.contextProfile.finops_priority}/4
Procurement Constraints: ${results.contextProfile.procurement_constraints ? 'Yes' : 'No'}
Edge Operations: ${results.contextProfile.edge_operations ? 'Yes' : 'No'}

© 2024 CORTEX™ Executive AI Readiness Program
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  return blob;
}

export async function generateContextBrief(data: ContextMirrorData): Promise<void> {
  const formatSliderValue = (value: number) => {
    const labels = ["Very Low", "Low", "Medium", "High", "Very High"];
    return `${labels[value]} (${value}/4)`;
  };

  const content = `
CORTEX™ Executive AI Readiness Context Brief
Generated: ${new Date().toLocaleDateString()}
Assessment ID: ${data.assessmentId}

═══════════════════════════════════════════════════════════════

WHAT YOUR PROFILE SIGNALS

Strengths
${data.strengths.map(s => `• ${s}`).join('\n')}

Fragilities
${data.fragilities.map(f => `• ${f}`).join('\n')}

What usually works first
${data.whatWorks.map(w => `• ${w}`).join('\n')}

═══════════════════════════════════════════════════════════════

NOTES FOR YOUR DISCUSSION

• Underline one strength and one fragility that surprised you.

• Which item would most affect customers or reputation if 
  mishandled?

• What's the smallest next step to de-risk a fragility?

═══════════════════════════════════════════════════════════════

ORGANIZATIONAL CONTEXT PROFILE

Risk & Compliance
  Regulatory Intensity: ${formatSliderValue(data.contextProfile.regulatory_intensity)}
  Data Sensitivity: ${formatSliderValue(data.contextProfile.data_sensitivity)}
  Safety Criticality: ${formatSliderValue(data.contextProfile.safety_criticality)}
  Brand Exposure: ${formatSliderValue(data.contextProfile.brand_exposure)}

Operations & Performance
  Clock Speed (pace of change): ${formatSliderValue(data.contextProfile.clock_speed)}
  Latency Edge (real-time needs): ${formatSliderValue(data.contextProfile.latency_edge)}
  Scale & Throughput: ${formatSliderValue(data.contextProfile.scale_throughput)}

Strategic Assets
  Data Advantage: ${formatSliderValue(data.contextProfile.data_advantage)}
  Build Readiness: ${formatSliderValue(data.contextProfile.build_readiness)}
  FinOps Priority: ${formatSliderValue(data.contextProfile.finops_priority)}

Constraints
  Procurement Constraints: ${data.contextProfile.procurement_constraints ? 'Yes' : 'No'}
  Edge Operations: ${data.contextProfile.edge_operations ? 'Yes' : 'No'}

═══════════════════════════════════════════════════════════════

DISCLAIMER

${data.disclaimer}

This brief provides a contextual reflection based on your organizational 
profile. It is educational content designed to facilitate strategic 
discussion, not prescriptive recommendations or compliance guidance.

═══════════════════════════════════════════════════════════════

© 2024 CORTEX™ Executive AI Readiness Program
  `.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `cortex-context-brief-${data.assessmentId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportJSONResults(results: AssessmentResults): void {
  const dataStr = JSON.stringify(results, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `cortex-assessment-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
