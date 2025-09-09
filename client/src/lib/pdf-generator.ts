export interface AssessmentResults {
  contextProfile: any;
  pillarScores: any;
  triggeredGates: any[];
  priorityMoves?: any;
  valueOverlay?: any;
  completedAt: string;
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
