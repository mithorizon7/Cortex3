import { formatScaleValue } from "@shared/scale-utils";
import type { ContextProfile, ExtendedOptionCard, OptionsStudioSession } from "@shared/schema";
import { MISCONCEPTION_QUESTIONS } from "@shared/options-studio-data";

export interface AssessmentResults {
  contextProfile: ContextProfile;
  pillarScores: any;
  triggeredGates: any[];
  priorityMoves?: any;
  valueOverlay?: any;
  completedAt: string;
}

export interface ContextMirrorData {
  // Legacy format (backward compatibility)
  insight?: string; // Two paragraphs separated by \n\n
  disclaimer?: string;
  
  // Context Mirror 2.0 format
  mirror?: {
    headline?: string;
    insight?: string;
    actions?: string[];
    watchouts?: string[];
    scenarios?: {
      if_regulation_tightens?: string;
      if_budgets_tighten?: string;
    };
    disclaimer?: string;
  };
  
  contextProfile: ContextProfile;
  assessmentId: string;
}

// Helper function to convert hex colors to RGB arrays for jsPDF
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Helper function to safely split text and fix character spacing issues
function safeSplitTextToSize(doc: any, text: string, maxWidth: number): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Preprocess text to avoid jsPDF spacing issues
  const cleanText = text
    .replace(/\s{2,}/g, ' ')          // Remove multiple spaces
    .replace(/\u00A0/g, ' ')         // Replace non-breaking spaces
    .replace(/[\u2000-\u206F]/g, ' ') // Replace unicode spaces
    .trim();
  
  if (!cleanText) {
    return [];
  }
  
  try {
    const lines = doc.splitTextToSize(cleanText, maxWidth);
    
    // Validate and fix any lines with character spacing issues
    return (Array.isArray(lines) ? lines : [lines]).map((line: string) => {
      if (typeof line !== 'string') {
        return '';
      }
      
      // Detect if line has character spacing issue (characters separated by spaces)
      // Pattern: single characters followed by spaces, especially at end of lines
      const hasSpacingIssue = /\b[a-zA-Z]\s+[a-zA-Z]\s+[a-zA-Z]/.test(line) || 
                             /[a-zA-Z]\s+[a-zA-Z]\s*\.\s*\d*$/.test(line);
      
      if (hasSpacingIssue) {
        // Fix by removing extra spaces between single characters
        return line
          .replace(/\b([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])/g, '$1$2$3')
          .replace(/([a-zA-Z])\s+([a-zA-Z])\s*\.\s*(\d*)$/g, '$1$2.$3')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
      
      return line;
    }).filter(line => line.length > 0);
  } catch (error) {
    console.warn('PDF text splitting error:', error);
    // Fallback: manual text wrapping
    return manualTextWrap(cleanText, maxWidth, doc);
  }
}

// Fallback manual text wrapping when jsPDF fails
function manualTextWrap(text: string, maxWidth: number, doc: any): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    try {
      const testWidth = doc.getTextWidth(testLine);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    } catch (error) {
      // If getTextWidth fails, use character-based estimation
      if (testLine.length * 2.5 <= maxWidth) { // Rough estimation
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export async function generateContextBrief(data: ContextMirrorData): Promise<void> {
  try {
    // Validate required data first
    if (!data || !data.contextProfile || !data.assessmentId) {
      throw new Error('Missing required data for PDF generation');
    }
    
    // Validate that we have either legacy format OR Context Mirror 2.0 format
    const hasLegacyData = data.insight && data.disclaimer;
    const hasMirrorData = data.mirror && (data.mirror.headline || data.mirror.insight);
    
    if (!hasLegacyData && !hasMirrorData) {
      throw new Error('Missing context insight data for PDF generation');
    }

    // Attempt to load jsPDF with better error handling
    let jsPDF;
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.jsPDF;
      
      if (!jsPDF) {
        throw new Error('jsPDF not available');
      }
    } catch (importError) {
      console.error('Failed to import jsPDF:', importError);
      throw new Error('PDF library failed to load. Please try refreshing the page or contact support if this persists.');
    }

    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const columnWidth = (contentWidth - 10) / 2; // 10mm gap between columns
    const maxY = pageHeight - 30; // Reserve space for footer
    
    let currentY = margin;
    
    // Brand Colors (RGB tuples for jsPDF compatibility)
    const primaryColor = hexToRgb('#1a1a1a');
    const accentColor = hexToRgb('#6366f1');
    const lightGray = hexToRgb('#f3f4f6');
    const whiteColor = [255, 255, 255] as [number, number, number];
    
    // Enhanced page overflow check with column awareness
    const checkPageOverflow = (additionalHeight: number, isColumnContent = false): boolean => {
      const safeMaxY = isColumnContent ? maxY - 20 : maxY; // More conservative for column content
      if (currentY + additionalHeight > safeMaxY) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };
    
    // Header with CORTEX™ branding
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CORTEX™', margin, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Strategic Maturity Context Brief', margin, 28);
    
    // Date and Assessment ID
    doc.setFontSize(10);
    const dateText = `Generated: ${new Date().toLocaleDateString()}`;
    const idText = `Assessment ID: ${data.assessmentId}`;
    doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 20);
    doc.text(idText, pageWidth - margin - doc.getTextWidth(idText), 28);
    
    currentY = 50;
    
    // Reset text color for content
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    
    // Determine which format to use
    const mirror = data.mirror;
    const isLegacyFormat = !mirror && data.insight && data.disclaimer;
    const insight = mirror?.insight || data.insight || '';
    const disclaimer = mirror?.disclaimer || data.disclaimer || '';
    
    // Context Mirror 2.0: Executive Headline (if available)
    if (mirror?.headline) {
      checkPageOverflow(15);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('EXECUTIVE BRIEF', margin, currentY);
      currentY += 8;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      const headlineLines = safeSplitTextToSize(doc, mirror.headline, contentWidth);
      headlineLines.forEach((line: string) => {
        checkPageOverflow(6);
        doc.text(line, margin, currentY);
        currentY += 6;
      });
      currentY += 8;
    }

    // Main Content Section - Two Column Layout
    const leftColumnX = margin;
    const rightColumnX = margin + columnWidth + 10;
    
    // Track Y positions for both columns
    let leftColumnY = currentY + 10;
    let rightColumnY = currentY + 10;
    
    // Left Column: Context Insight
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(isLegacyFormat ? 'CONTEXT REFLECTION' : 'STRATEGIC CONTEXT', leftColumnX, currentY);
    
    if (insight) {
      // Split insight into paragraphs
      const paragraphs = insight.split(/\n{2,}/).filter(p => p.trim().length > 0);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      
      paragraphs.forEach((paragraph, index) => {
        const lines = safeSplitTextToSize(doc, paragraph.trim(), columnWidth);
        const requiredHeight = lines.length * 4;
        
        // Check if this paragraph will fit on current page
        if (leftColumnY + requiredHeight > maxY - 20) {
          doc.addPage();
          leftColumnY = margin;
          rightColumnY = margin;
          
          // Re-add column header after page break
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text('STRATEGIC CONTEXT (continued)', leftColumnX, leftColumnY);
          leftColumnY += 10;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        }
        
        doc.text(lines, leftColumnX, leftColumnY);
        leftColumnY += requiredHeight + (index < paragraphs.length - 1 ? 6 : 0);
      });
      
      leftColumnY += 8;
    }
    
    // Right Column: Context Profile
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('ORGANIZATIONAL CONTEXT', rightColumnX, currentY);
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    
    // Context Profile Sections
    const profileSections = [
      {
        title: 'Risk & Compliance',
        items: [
          { key: 'regulatory_intensity', label: 'Regulatory Intensity', value: data.contextProfile.regulatory_intensity },
          { key: 'data_sensitivity', label: 'Data Sensitivity', value: data.contextProfile.data_sensitivity },
          { key: 'safety_criticality', label: 'Safety Criticality', value: data.contextProfile.safety_criticality },
          { key: 'brand_exposure', label: 'Brand Exposure', value: data.contextProfile.brand_exposure }
        ]
      },
      {
        title: 'Operations & Performance',
        items: [
          { key: 'clock_speed', label: 'Clock Speed', value: data.contextProfile.clock_speed },
          { key: 'latency_edge', label: 'Latency Edge', value: data.contextProfile.latency_edge },
          { key: 'scale_throughput', label: 'Scale & Throughput', value: data.contextProfile.scale_throughput }
        ]
      },
      {
        title: 'Strategic Assets',
        items: [
          { key: 'data_advantage', label: 'Data Advantage', value: data.contextProfile.data_advantage },
          { key: 'build_readiness', label: 'Build Readiness', value: data.contextProfile.build_readiness },
          { key: 'finops_priority', label: 'FinOps Priority', value: data.contextProfile.finops_priority }
        ]
      }
    ];
    
    profileSections.forEach(section => {
      // Check if section will fit
      const sectionHeight = 6 + (section.items.length * 4) + 3;
      if (rightColumnY + sectionHeight > maxY - 20) {
        doc.addPage();
        leftColumnY = margin;
        rightColumnY = margin;
        
        // Re-add column header after page break
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text('ORGANIZATIONAL CONTEXT (continued)', rightColumnX, rightColumnY);
        rightColumnY += 10;
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, rightColumnX, rightColumnY);
      rightColumnY += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      section.items.forEach(item => {
        const valueText = formatScaleValue(item.key || '', item.value);
        doc.text(`${item.label}: ${valueText}`, rightColumnX + 3, rightColumnY);
        rightColumnY += 4;
      });
      rightColumnY += 3;
    });
    
    // Constraints
    const constraintsHeight = 6 + 8; // Title + 2 constraint items
    if (rightColumnY + constraintsHeight > maxY - 20) {
      doc.addPage();
      leftColumnY = margin;
      rightColumnY = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Constraints', rightColumnX, rightColumnY);
    rightColumnY += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Procurement Constraints: ${data.contextProfile.procurement_constraints ? 'Yes' : 'No'}`, rightColumnX + 3, rightColumnY);
    rightColumnY += 4;
    doc.text(`Edge Operations: ${data.contextProfile.edge_operations ? 'Yes' : 'No'}`, rightColumnX + 3, rightColumnY);
    rightColumnY += 4;
    
    // Move to next section using the maximum Y position from both columns
    currentY = Math.max(leftColumnY + 10, rightColumnY + 10);
    
    // Context Mirror 2.0: Actions & Watchouts Section
    if (mirror && (mirror.actions?.length || mirror.watchouts?.length)) {
      checkPageOverflow(40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('LEADERSHIP GUIDANCE', margin, currentY);
      currentY += 12;
      
      // Actions & Watchouts Grid Layout
      const gridLeftX = leftColumnX;
      const gridRightX = rightColumnX;
      let gridLeftY = currentY;
      let gridRightY = currentY;
      
      // Actions (Left Column)
      if (mirror.actions?.length) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Leadership Actions', gridLeftX, gridLeftY);
        gridLeftY += 8;
        
        // Calculate dynamic height based on content for page-fit check
        let totalActionHeight = 10; // Base padding
        mirror.actions.forEach(action => {
          const actionLines = safeSplitTextToSize(doc, action, columnWidth - 20);
          totalActionHeight += actionLines.length * 5 + 3; // Line height + spacing
        });
        
        const actionsHeight = Math.max(totalActionHeight, 25);
        const totalActionsContainerHeight = actionsHeight + 8; // Include title space
        
        // Check if entire actions container will fit on current page
        if (gridLeftY + totalActionsContainerHeight > maxY - 20) {
          doc.addPage();
          gridLeftY = margin;
          gridRightY = margin;
          currentY = margin;
          
          // Re-add section header after page break
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text('LEADERSHIP GUIDANCE (continued)', margin, gridLeftY);
          gridLeftY += 12;
          gridRightY += 12;
          
          // Re-add actions title
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text('Leadership Actions', gridLeftX, gridLeftY);
          gridLeftY += 8;
        }
        
        // Create bordered container for actions
        doc.setDrawColor(...hexToRgb('#e5e7eb'));
        doc.setFillColor(...hexToRgb('#f9fafb'));
        doc.rect(gridLeftX, gridLeftY - 3, columnWidth, actionsHeight, 'FD');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        
        let actionY = gridLeftY + 2;
        mirror.actions.forEach((action, actionIndex) => {
          // Handle text overflow with proper wrapping
          const actionLines = safeSplitTextToSize(doc, action, columnWidth - 20);
          const chipHeight = actionLines.length * 4 + 2;
          
          // Per-item pagination check - if individual action won't fit, break to new page
          if (actionY + chipHeight > maxY - 25) {
            doc.addPage();
            actionY = margin + 15; // Leave space for potential header
            gridLeftY = margin + 15;
            gridRightY = margin + 15;
            
            // Re-create container background on new page
            doc.setDrawColor(...hexToRgb('#e5e7eb'));
            doc.setFillColor(...hexToRgb('#f9fafb'));
            const remainingHeight = (mirror.actions!.length - actionIndex) * 20; // Estimate
            doc.rect(gridLeftX, actionY - 3, columnWidth, Math.min(remainingHeight, maxY - actionY - 20), 'FD');
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          }
          
          // Action chip styling with overflow handling
          doc.setFillColor(...hexToRgb('#dbeafe'));
          doc.setDrawColor(...hexToRgb('#3b82f6'));
          
          if (doc.roundedRect) {
            doc.roundedRect(gridLeftX + 3, actionY - 1, columnWidth - 10, chipHeight, 1, 1, 'FD');
          } else {
            doc.rect(gridLeftX + 3, actionY - 1, columnWidth - 10, chipHeight, 'FD');
          }
          
          doc.setTextColor(...hexToRgb('#1e40af'));
          actionLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, gridLeftX + 5, actionY + 2 + (lineIndex * 4));
          });
          
          actionY += chipHeight + 3;
        });
        
        gridLeftY += actionsHeight + 5;
      }
      
      // Watchouts (Right Column)  
      if (mirror.watchouts?.length) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Watch-outs', gridRightX, gridRightY);
        gridRightY += 8;
        
        // Calculate dynamic height based on content for page-fit check
        let totalWatchoutHeight = 10; // Base padding
        mirror.watchouts.forEach(watchout => {
          const watchoutLines = safeSplitTextToSize(doc, watchout, columnWidth - 20);
          totalWatchoutHeight += watchoutLines.length * 5 + 3; // Line height + spacing
        });
        
        const watchoutsHeight = Math.max(totalWatchoutHeight, 25);
        const totalWatchoutsContainerHeight = watchoutsHeight + 8; // Include title space
        
        // Check if entire watchouts container will fit on current page
        if (gridRightY + totalWatchoutsContainerHeight > maxY - 20) {
          doc.addPage();
          gridLeftY = margin;
          gridRightY = margin;
          currentY = margin;
          
          // Re-add section header after page break
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text('LEADERSHIP GUIDANCE (continued)', margin, gridRightY);
          gridLeftY += 12;
          gridRightY += 12;
          
          // Re-add watchouts title
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text('Watch-outs', gridRightX, gridRightY);
          gridRightY += 8;
        }
        
        // Create bordered container for watchouts
        doc.setDrawColor(...hexToRgb('#e5e7eb'));
        doc.setFillColor(...hexToRgb('#fef3c7'));
        doc.rect(gridRightX, gridRightY - 3, columnWidth, watchoutsHeight, 'FD');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        
        let watchoutY = gridRightY + 2;
        mirror.watchouts.forEach((watchout, watchoutIndex) => {
          // Handle text overflow with proper wrapping
          const watchoutLines = safeSplitTextToSize(doc, watchout, columnWidth - 20);
          const chipHeight = watchoutLines.length * 4 + 2;
          
          // Per-item pagination check - if individual watchout won't fit, break to new page
          if (watchoutY + chipHeight > maxY - 25) {
            doc.addPage();
            watchoutY = margin + 15; // Leave space for potential header
            gridLeftY = margin + 15;
            gridRightY = margin + 15;
            
            // Re-create container background on new page
            doc.setDrawColor(...hexToRgb('#e5e7eb'));
            doc.setFillColor(...hexToRgb('#fef3c7'));
            const remainingHeight = (mirror.watchouts!.length - watchoutIndex) * 20; // Estimate
            doc.rect(gridRightX, watchoutY - 3, columnWidth, Math.min(remainingHeight, maxY - watchoutY - 20), 'FD');
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          }
          
          // Watchout chip styling with overflow handling
          doc.setFillColor(...hexToRgb('#fed7aa'));
          doc.setDrawColor(...hexToRgb('#f59e0b'));
          
          if (doc.roundedRect) {
            doc.roundedRect(gridRightX + 3, watchoutY - 1, columnWidth - 10, chipHeight, 1, 1, 'FD');
          } else {
            doc.rect(gridRightX + 3, watchoutY - 1, columnWidth - 10, chipHeight, 'FD');
          }
          
          doc.setTextColor(...hexToRgb('#92400e'));
          watchoutLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, gridRightX + 5, watchoutY + 2 + (lineIndex * 4));
          });
          
          watchoutY += chipHeight + 3;
        });
        
        gridRightY += watchoutsHeight + 5;
      }
      
      currentY = Math.max(gridLeftY, gridRightY) + 5;
    }
    
    // Context Mirror 2.0: Scenario Lens Section with dynamic height calculation
    if (mirror?.scenarios && (mirror.scenarios.if_regulation_tightens || mirror.scenarios.if_budgets_tighten)) {
      // Calculate dynamic height based on actual content
      let scenarioContentHeight = 10; // Base padding
      
      doc.setFontSize(10);
      if (mirror.scenarios.if_regulation_tightens) {
        const regLines = safeSplitTextToSize(doc, mirror.scenarios.if_regulation_tightens, contentWidth - 20);
        scenarioContentHeight += 4 + (regLines.length * 4) + 2; // Title + content + spacing
      }
      
      if (mirror.scenarios.if_budgets_tighten) {
        const budgetLines = safeSplitTextToSize(doc, mirror.scenarios.if_budgets_tighten, contentWidth - 20);
        scenarioContentHeight += 4 + (budgetLines.length * 4) + 2; // Title + content + spacing
      }
      
      const totalScenarioHeight = scenarioContentHeight + 15; // Include section title
      
      checkPageOverflow(totalScenarioHeight);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('SCENARIO LENS', margin, currentY);
      currentY += 12;
      
      // Scenario background with dynamic height
      doc.setFillColor(...hexToRgb('#f8fafc'));
      doc.setDrawColor(...hexToRgb('#e2e8f0'));
      doc.rect(margin, currentY - 3, contentWidth, scenarioContentHeight, 'FD');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      
      let scenarioY = currentY + 2;
      if (mirror.scenarios.if_regulation_tightens) {
        doc.text('• If regulation tightens:', margin + 5, scenarioY);
        scenarioY += 4;
        const regLines = safeSplitTextToSize(doc, mirror.scenarios.if_regulation_tightens, contentWidth - 20);
        regLines.forEach((line: string) => {
          doc.text(line, margin + 12, scenarioY);
          scenarioY += 4;
        });
        scenarioY += 2;
      }
      
      if (mirror.scenarios.if_budgets_tighten) {
        doc.text('• If budgets tighten:', margin + 5, scenarioY);
        scenarioY += 4;
        const budgetLines = safeSplitTextToSize(doc, mirror.scenarios.if_budgets_tighten, contentWidth - 20);
        budgetLines.forEach((line: string) => {
          doc.text(line, margin + 12, scenarioY);
          scenarioY += 4;
        });
      }
      
      currentY += scenarioContentHeight + 10;
    }
    
    // Discussion Notes Section (Full Width) - only for legacy format
    if (isLegacyFormat) {
      checkPageOverflow(40);
      // Background for discussion section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, currentY - 5, contentWidth, 35, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('NOTES FOR YOUR DISCUSSION', margin + 5, currentY + 5);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      
      const discussionNotes = [
        '• Underline one advantage and one constraint that surprised you.',
        '• Which item would most affect customers or reputation if mishandled?',
        '• What\'s the smallest next step to address a key constraint?'
      ];
      
      let noteY = currentY + 12;
      discussionNotes.forEach(note => {
        const lines = safeSplitTextToSize(doc, note, contentWidth - 10);
        doc.text(lines, margin + 5, noteY);
        noteY += lines.length * 4 + 2;
      });
      
      currentY = noteY + 15;
    }
    
    // Disclaimer with proper overflow protection
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...hexToRgb('#666666'));
    
    const disclaimerText = disclaimer ? 
      `DISCLAIMER: ${disclaimer}\n\nThis brief provides a contextual reflection based on your organizational profile. It is educational content designed to facilitate strategic discussion, not prescriptive recommendations or compliance guidance.` :
      'This brief provides a contextual reflection based on your organizational profile. It is educational content designed to facilitate strategic discussion, not prescriptive recommendations or compliance guidance.';
    
    const disclaimerLines = safeSplitTextToSize(doc, disclaimerText, contentWidth);
    const disclaimerHeight = disclaimerLines.length * 3;
    
    // Use actual computed height for overflow check
    checkPageOverflow(disclaimerHeight + 5); // Add small buffer
    
    doc.text(disclaimerLines, margin, currentY);
    currentY += disclaimerHeight;
    
    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb('#888888'));
    doc.text('© 2024 CORTEX™ AI Strategic Maturity Program', margin, footerY);
    
    // Generate and download PDF
    const pdfBlob = doc.output('blob');
    
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('Failed to generate PDF: Empty or invalid PDF blob');
    }
    
    const url = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    const filename = mirror ? 
      `cortex-context-mirror-2.0-${data.assessmentId}.pdf` : 
      `cortex-context-brief-${data.assessmentId}.pdf`;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    // Enhanced error handling with more specific error types
    if (error instanceof Error) {
      // Check for specific error types to provide better user guidance
      if (error.message.includes('jsPDF') || error.message.includes('PDF library')) {
        throw new Error(`${error.message} Please check your internet connection and try again.`);
      } else if (error.message.includes('Missing required data') || error.message.includes('Missing context insight')) {
        throw new Error(`${error.message} Please refresh the page and complete the assessment again.`);
      } else {
        throw new Error(`PDF generation failed: ${error.message}. If this problem persists, please contact support.`);
      }
    } else {
      throw new Error('PDF generation failed: An unexpected error occurred. Please try again or contact support if this persists.');
    }
  }
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

// Options Studio Export Functions
export interface OptionsStudioData extends OptionsStudioSession {
  contextProfile: ContextProfile;
  selectedOptions: ExtendedOptionCard[];
  emphasizedLenses: string[];
  reflectionAnswers: Record<string, string>;
  exportedAt: string;
  cautionFlags?: string[];
  cautionMessages?: string[];
}

export async function handleExportPDF(sessionData: OptionsStudioData, assessmentId: string): Promise<void> {
  try {
    // Validate required data
    if (!sessionData || !sessionData.contextProfile || !assessmentId) {
      throw new Error('Missing required data for PDF generation');
    }

    // Attempt to load jsPDF
    let jsPDF;
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.jsPDF;
      
      if (!jsPDF) {
        throw new Error('jsPDF not available');
      }
    } catch (importError) {
      console.error('Failed to import jsPDF:', importError);
      throw new Error('PDF library failed to load. Please try refreshing the page or contact support if this persists.');
    }

    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const maxY = pageHeight - 30;
    
    let currentY = margin;

    // Brand Colors (RGB tuples for jsPDF compatibility)
    const primaryColor = hexToRgb('#1a1a1a');
    const accentColor = hexToRgb('#6366f1');
    const lightGray = hexToRgb('#f3f4f6');
    const whiteColor = [255, 255, 255] as [number, number, number];

    // Enhanced page overflow check
    const checkPageOverflow = (additionalHeight: number): boolean => {
      if (currentY + additionalHeight > maxY) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CORTEX™', margin, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Options Studio Report', margin, 28);
    
    // Date and Assessment ID
    doc.setFontSize(10);
    const dateText = `Generated: ${new Date().toLocaleDateString()}`;
    const idText = `Assessment ID: ${assessmentId}`;
    doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 20);
    doc.text(idText, pageWidth - margin - doc.getTextWidth(idText), 28);
    
    currentY = 50;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    // Use Case Section
    if (sessionData.useCase) {
      checkPageOverflow(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('USE CASE', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      const useCaseLines = safeSplitTextToSize(doc, sessionData.useCase, contentWidth);
      useCaseLines.forEach((line: string) => {
        checkPageOverflow(6);
        doc.text(line, margin, currentY);
        currentY += 5;
      });
      currentY += 10;
    }

    // Goals Section
    if (sessionData.goals && sessionData.goals.length > 0) {
      checkPageOverflow(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('SELECTED GOALS', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      sessionData.goals.forEach(goal => {
        checkPageOverflow(6);
        doc.text(`• ${goal}`, margin + 5, currentY);
        currentY += 5;
      });
      currentY += 10;
    }

    // Selected Options Section
    if (sessionData.selectedOptions && sessionData.selectedOptions.length > 0) {
      checkPageOverflow(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('COMPARED OPTIONS', margin, currentY);
      currentY += 10;
      
      sessionData.selectedOptions.forEach((option, index) => {
        checkPageOverflow(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`${index + 1}. ${option.title || option.id}`, margin, currentY);
        currentY += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const descLines = safeSplitTextToSize(doc, option.shortDescription || '', contentWidth - 10);
        descLines.forEach((line: string) => {
          checkPageOverflow(5);
          doc.text(line, margin + 5, currentY);
          currentY += 4;
        });
        currentY += 8;
      });
    }

    // Emphasized Lenses
    if (sessionData.emphasizedLenses && sessionData.emphasizedLenses.length > 0) {
      checkPageOverflow(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('EMPHASIZED LENSES FOR YOUR CONTEXT', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      sessionData.emphasizedLenses.forEach(lens => {
        checkPageOverflow(6);
        doc.text(`• ${lens}`, margin + 5, currentY);
        currentY += 5;
      });
      currentY += 10;
    }

    // Misconception Results Section
    if (sessionData.misconceptionResponses && Object.keys(sessionData.misconceptionResponses).length > 0) {
      checkPageOverflow(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('MISCONCEPTION CHECK RESULTS', margin, currentY);
      currentY += 10;
      
      // Use shared source of truth for misconception questions
      const misconceptionData = MISCONCEPTION_QUESTIONS.reduce((acc, q) => {
        acc[q.id] = q;
        return acc;
      }, {} as Record<string, typeof MISCONCEPTION_QUESTIONS[0]>);
      
      Object.entries(sessionData.misconceptionResponses).forEach(([questionId, userAnswer]) => {
        const questionData = misconceptionData[questionId as keyof typeof misconceptionData];
        if (questionData) {
          checkPageOverflow(20);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          const questionLines = safeSplitTextToSize(doc, questionData.question, contentWidth - 10);
          questionLines.forEach((line: string) => {
            checkPageOverflow(5);
            doc.text(line, margin + 5, currentY);
            currentY += 4;
          });
          currentY += 2;
          
          // Show user's answer and correctness
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const isCorrect = userAnswer === questionData.correctAnswer;
          const resultText = `Your answer: ${userAnswer ? 'True' : 'False'} • ${isCorrect ? '[CORRECT]' : '[INCORRECT]'}`;
          doc.setTextColor(...(isCorrect ? hexToRgb('#16a34a') : hexToRgb('#dc2626')));
          doc.text(resultText, margin + 10, currentY);
          currentY += 5;
          
          // Show explanation
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont('helvetica', 'italic');
          const explanationLines = safeSplitTextToSize(doc, questionData.explanation, contentWidth - 20);
          explanationLines.forEach((line: string) => {
            checkPageOverflow(4);
            doc.text(line, margin + 10, currentY);
            currentY += 3.5;
          });
          currentY += 6;
        }
      });
      currentY += 5;
    }

    // Seven Lenses Comparison Table
    if (sessionData.selectedOptions && sessionData.selectedOptions.length > 0) {
      checkPageOverflow(40);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('SEVEN LENSES COMPARISON', margin, currentY);
      currentY += 15;
      
      const lensLabels = ['Speed-to-Value', 'Customization & Control', 'Data Leverage', 'Risk & Compliance Load', 'Operational Burden', 'Portability & Lock-in', 'Cost Shape'];
      const cellWidth = contentWidth / (lensLabels.length + 1);
      const cellHeight = 8;
      
      // Table header
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, currentY, cellWidth, cellHeight, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Option', margin + 2, currentY + 5.5);
      
      lensLabels.forEach((label, index) => {
        const x = margin + cellWidth + (index * cellWidth);
        const isEmphasized = sessionData.emphasizedLenses && sessionData.emphasizedLenses.includes(label);
        doc.setFillColor(...(isEmphasized ? hexToRgb('#dbeafe') : lightGray));
        doc.rect(x, currentY, cellWidth, cellHeight, 'F');
        
        // Split long labels across lines
        const words = label.split(' ');
        if (words.length > 1) {
          doc.setFontSize(7);
          doc.text(words[0], x + 2, currentY + 3.5);
          doc.text(words.slice(1).join(' '), x + 2, currentY + 6);
        } else {
          doc.setFontSize(8);
          doc.text(label, x + 2, currentY + 5.5);
        }
      });
      
      currentY += cellHeight;
      
      // Table rows for each option
      sessionData.selectedOptions.forEach((option) => {
        checkPageOverflow(cellHeight + 2);
        
        // Option name
        doc.setFillColor(whiteColor[0], whiteColor[1], whiteColor[2]);
        doc.rect(margin, currentY, cellWidth, cellHeight, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, currentY, cellWidth, cellHeight, 'S');
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        const optionTitleLines = safeSplitTextToSize(doc, option.title || option.id || '', cellWidth - 4);
        optionTitleLines.slice(0, 2).forEach((line: string, lineIndex: number) => {
          doc.text(line, margin + 2, currentY + 3 + (lineIndex * 2.5));
        });
        
        // Lens values
        const lensValues = option.lensValues || option.axes || {};
        const lensKeyMap = {
          'Speed-to-Value': 'speed',
          'Customization & Control': 'control',
          'Data Leverage': 'dataLeverage',
          'Risk & Compliance Load': 'riskLoad',
          'Operational Burden': 'opsBurden',
          'Portability & Lock-in': 'portability',
          'Cost Shape': 'costShape'
        };
        
        lensLabels.forEach((label, index) => {
          const x = margin + cellWidth + (index * cellWidth);
          const lensKey = lensKeyMap[label as keyof typeof lensKeyMap];
          const value = (lensValues as any)[lensKey] || 0;
          
          const isEmphasized = sessionData.emphasizedLenses && sessionData.emphasizedLenses.includes(label);
          doc.setFillColor(...(isEmphasized ? hexToRgb('#dbeafe') : whiteColor));
          doc.rect(x, currentY, cellWidth, cellHeight, 'F');
          doc.rect(x, currentY, cellWidth, cellHeight, 'S');
          
          // Value and dots
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...(isEmphasized ? hexToRgb('#1e40af') : primaryColor));
          doc.text(value.toString(), x + cellWidth/2 - 3, currentY + 4);
          
          // Small dots to represent value (fixed the corrupted loop)
          for (let i = 0; i < 4; i++) {
            const dotX = x + 4 + (i * 3);
            const dotY = currentY + 6;
            doc.setFillColor(...(i < value ? (isEmphasized ? hexToRgb('#1e40af') : primaryColor) : hexToRgb('#d1d5db')));
            doc.circle(dotX, dotY, 0.8, 'F');
          }
        });
        
        currentY += cellHeight;
      });
      
      currentY += 10;
    }
    
    // Caution Messages
    if (sessionData.cautionMessages && sessionData.cautionMessages.length > 0) {
      checkPageOverflow(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('CONTEXT-BASED CAUTIONS', margin, currentY);
      currentY += 10;
      
      doc.setFillColor(...hexToRgb('#fef3c7'));
      doc.rect(margin, currentY - 5, contentWidth, sessionData.cautionMessages.length * 8 + 10, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...hexToRgb('#92400e'));
      sessionData.cautionMessages.forEach(message => {
        const messageLines = safeSplitTextToSize(doc, `⚠ ${message}`, contentWidth - 10);
        messageLines.forEach((line: string) => {
          checkPageOverflow(5);
          doc.text(line, margin + 5, currentY);
          currentY += 4;
        });
        currentY += 2;
      });
      currentY += 8;
    }

    // Strategic Reflections
    if (sessionData.reflectionAnswers && Object.keys(sessionData.reflectionAnswers).length > 0) {
      checkPageOverflow(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('STRATEGIC REFLECTIONS', margin, currentY);
      currentY += 10;
      
      Object.entries(sessionData.reflectionAnswers).forEach(([prompt, answer], index) => {
        if (answer && answer.trim()) {
          checkPageOverflow(20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          const promptLines = safeSplitTextToSize(doc, `${index + 1}. ${prompt}`, contentWidth - 10);
          promptLines.forEach((line: string) => {
            checkPageOverflow(5);
            doc.text(line, margin, currentY);
            currentY += 5;
          });
          currentY += 2;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const answerLines = safeSplitTextToSize(doc, answer, contentWidth - 10);
          answerLines.forEach((line: string) => {
            checkPageOverflow(4);
            doc.text(line, margin + 5, currentY);
            currentY += 4;
          });
          currentY += 8;
        }
      });
    }

    // Session Summary Box
    checkPageOverflow(30);
    doc.setFillColor(...hexToRgb('#f8fafc'));
    doc.rect(margin, currentY, contentWidth, 25, 'F');
    doc.setDrawColor(...hexToRgb('#e2e8f0'));
    doc.rect(margin, currentY, contentWidth, 25, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('SESSION SUMMARY', margin + 5, currentY + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const summaryText = `Options explored: ${sessionData.selectedOptions?.length || 0} • Misconceptions tested: ${Object.keys(sessionData.misconceptionResponses || {}).length} • Emphasized lenses: ${sessionData.emphasizedLenses?.length || 0} • Completed: ${sessionData.completed ? 'Yes' : 'No'}`;
    const summaryLines = safeSplitTextToSize(doc, summaryText, contentWidth - 10);
    summaryLines.forEach((line: string, index: number) => {
      doc.text(line, margin + 5, currentY + 14 + (index * 4));
    });
    
    currentY += 35;

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb('#888888'));
    doc.text('© 2024 CORTEX™ AI Strategic Maturity Program - Options Studio', margin, footerY);
    const exportedText = `Exported: ${new Date(sessionData.exportedAt).toLocaleString()}`;
    doc.text(exportedText, pageWidth - margin - doc.getTextWidth(exportedText), footerY);

    // Generate and download PDF
    const pdfBlob = doc.output('blob');
    
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('Failed to generate PDF: Empty or invalid PDF blob');
    }
    
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cortex-options-studio-${assessmentId}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('jsPDF') || error.message.includes('PDF library')) {
        throw new Error(`${error.message} Please check your internet connection and try again.`);
      } else if (error.message.includes('Missing required data')) {
        throw new Error(`${error.message} Please complete the Options Studio session and try again.`);
      } else {
        throw new Error(`PDF generation failed: ${error.message}. If this problem persists, please contact support.`);
      }
    } else {
      throw new Error('PDF generation failed: An unexpected error occurred. Please try again or contact support if this persists.');
    }
  }
}

export function handleExportJSON(sessionData: OptionsStudioData, filename: string): void {
  try {
    const exportData = {
      ...sessionData,
      version: '1.0',
      exportMetadata: {
        exportedAt: sessionData.exportedAt,
        dataStructureVersion: '1.0',
        sourceApplication: 'CORTEX Options Studio'
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    throw new Error('Failed to export JSON data. Please try again.');
  }
}