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

export interface SituationAssessmentData {
  // Legacy format (backward compatibility)
  insight?: string; // Two paragraphs separated by \n\n
  disclaimer?: string;
  
  // Situation Assessment 2.0 format
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

export async function generateSituationAssessmentBrief(data: SituationAssessmentData): Promise<void> {
  try {
    // Validate required data first
    if (!data || !data.contextProfile || !data.assessmentId) {
      throw new Error('Missing required data for PDF generation');
    }
    
    // Validate that we have either legacy format OR Situation Assessment 2.0 format
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
    const margin = 24; // Increased margin for premium feel
    const contentWidth = pageWidth - (margin * 2);
    const columnWidth = (contentWidth - 12) / 2; // 12mm gap between columns
    const maxY = pageHeight - 40; // Reserve space for footer and padding
    
    let currentY = margin;
    
    // Premium Color Palette (RGB tuples for jsPDF compatibility)
    const colors = {
      primary: [15, 23, 42],      // slate-900 - Deep charcoal
      secondary: [51, 65, 85],    // slate-700 - Medium gray
      accent: [99, 102, 241],     // indigo-500 - Professional blue
      accentLight: [129, 140, 248], // indigo-400 - Lighter blue
      surface: [248, 250, 252],   // slate-50 - Light surface
      border: [226, 232, 240],    // slate-200 - Subtle border
      success: [34, 197, 94],     // emerald-500 - Success green
      warning: [245, 158, 11],    // amber-500 - Warning amber
      error: [239, 68, 68],       // red-500 - Error red
      white: [255, 255, 255],     // Pure white
      gradient: {
        start: [79, 70, 229],     // indigo-600
        end: [139, 92, 246]       // violet-500
      }
    } as const;
    
    // Premium Typography System
    const typography = {
      hero: { size: 28, weight: 'bold' as const },
      h1: { size: 20, weight: 'bold' as const },
      h2: { size: 16, weight: 'bold' as const },
      h3: { size: 14, weight: 'bold' as const },
      body: { size: 11, weight: 'normal' as const },
      small: { size: 9, weight: 'normal' as const },
      caption: { size: 8, weight: 'normal' as const }
    } as const;
    
    // Helper functions for premium design
    const addPageFooter = () => {
      const footerY = pageHeight - 25; // Match reserved space with padding
      doc.setFontSize(typography.caption.size);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.secondary);
      doc.text('CORTEX™ Executive AI Readiness Assessment', margin, footerY);
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 15, footerY);
    };
    
    const drawGradientHeader = () => {
      // Simulate gradient with multiple rectangles
      const headerHeight = 60;
      const steps = 20;
      const stepHeight = headerHeight / steps;
      
      for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        const r = Math.round(colors.gradient.start[0] + (colors.gradient.end[0] - colors.gradient.start[0]) * ratio);
        const g = Math.round(colors.gradient.start[1] + (colors.gradient.end[1] - colors.gradient.start[1]) * ratio);
        const b = Math.round(colors.gradient.start[2] + (colors.gradient.end[2] - colors.gradient.start[2]) * ratio);
        
        doc.setFillColor(r, g, b);
        doc.rect(0, i * stepHeight, pageWidth, stepHeight, 'F');
      }
    };
    
    const drawCard = (x: number, y: number, width: number, height: number, elevated = false) => {
      if (elevated) {
        // Draw shadow
        doc.setFillColor(0, 0, 0, 0.1);
        doc.rect(x + 1, y + 1, width, height, 'F');
      }
      
      // Draw card background
      doc.setFillColor(...colors.white);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.rect(x, y, width, height, 'FD');
    };
    
    const addDivider = (y: number, style: 'full' | 'accent' = 'full') => {
      if (style === 'accent') {
        doc.setDrawColor(...colors.accent);
        doc.setLineWidth(1);
        doc.line(margin, y, margin + 60, y);
      } else {
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
      }
    };
    
    // Enhanced page overflow check
    const checkPageOverflow = (additionalHeight: number): boolean => {
      if (currentY + additionalHeight > maxY) {
        addPageFooter();
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };
    
    // Premium Header Design
    drawGradientHeader();
    
    // Header content with enhanced typography
    doc.setTextColor(...colors.white);
    doc.setFontSize(typography.hero.size);
    doc.setFont('helvetica', typography.hero.weight);
    doc.text('CORTEX™', margin, 25);
    
    doc.setFontSize(typography.body.size);
    doc.setFont('helvetica', 'normal');
    doc.text('EXECUTIVE AI READINESS ASSESSMENT', margin, 35);
    
    // Header metadata with better positioning
    doc.setFontSize(typography.small.size);
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dateText = `Generated: ${currentDate}`;
    const idText = `ID: ${data.assessmentId.slice(0, 8).toUpperCase()}`;
    
    doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 25);
    doc.text(idText, pageWidth - margin - doc.getTextWidth(idText), 33);
    
    // Premium status indicator
    doc.setFillColor(...colors.success);
    doc.circle(pageWidth - margin - 8, 45, 2, 'F');
    doc.setFontSize(typography.caption.size);
    doc.text('COMPLETED', pageWidth - margin - 25, 47);
    
    currentY = 75;
    
    // Reset text color for content
    doc.setTextColor(...colors.primary);
    
    // Determine which format to use
    const mirror = data.mirror;
    const isLegacyFormat = !mirror && data.insight && data.disclaimer;
    const insight = mirror?.insight || data.insight || '';
    const disclaimer = mirror?.disclaimer || data.disclaimer || '';
    
    // Premium Executive Summary Section
    if (mirror?.headline) {
      checkPageOverflow(50);
      
      // Executive Summary Card
      drawCard(margin, currentY, contentWidth, 45, true);
      
      // Section header with accent line
      addDivider(currentY + 8, 'accent');
      doc.setFontSize(typography.h2.size);
      doc.setFont('helvetica', typography.h2.weight);
      doc.setTextColor(...colors.accent);
      doc.text('EXECUTIVE SUMMARY', margin + 8, currentY + 15);
      
      // Headline content
      doc.setFontSize(typography.h3.size);
      doc.setFont('helvetica', typography.h3.weight);
      doc.setTextColor(...colors.primary);
      const headlineLines = safeSplitTextToSize(doc, mirror.headline, contentWidth - 16);
      let headlineY = currentY + 25;
      headlineLines.forEach((line: string) => {
        doc.text(line, margin + 8, headlineY);
        headlineY += 5;
      });
      
      currentY += 55;
    }

    // Premium Two-Column Layout with Enhanced Design
    const leftColumnX = margin;
    const rightColumnX = margin + columnWidth + 12;
    
    // Track Y positions for both columns
    let leftColumnY = currentY + 10;
    let rightColumnY = currentY + 10;
    
    // Premium Left Column: Strategic Context
    // First calculate content height, then draw card
    const leftColumnStartY = currentY;
    let contentEndY = currentY + 20; // Start after header
    
    if (insight) {
      // Split insight into paragraphs and calculate total height needed
      const paragraphs = insight.split(/\n{2,}/).filter(p => p.trim().length > 0);
      
      paragraphs.forEach((paragraph, index) => {
        const lines = safeSplitTextToSize(doc, paragraph.trim(), columnWidth - 16);
        contentEndY += lines.length * 5; // 5 units per line
        if (index < paragraphs.length - 1) contentEndY += 6; // paragraph spacing
      });
    }
    
    // Calculate proper card height based on actual content
    const leftColumnHeight = Math.max(150, contentEndY - leftColumnStartY + 10);
    
    // Now draw the card with correct height
    drawCard(leftColumnX, leftColumnStartY, columnWidth, leftColumnHeight, false);
    
    // Add header
    doc.setFontSize(typography.h2.size);
    doc.setFont('helvetica', typography.h2.weight);
    doc.setTextColor(...colors.accent);
    doc.text(isLegacyFormat ? 'CONTEXT REFLECTION' : 'STRATEGIC CONTEXT', leftColumnX + 8, leftColumnStartY + 12);
    
    if (insight) {
      // Now render the actual content
      const paragraphs = insight.split(/\n{2,}/).filter(p => p.trim().length > 0);
      
      doc.setFontSize(typography.body.size);
      doc.setFont('helvetica', typography.body.weight);
      doc.setTextColor(...colors.primary);
      
      let contentY = leftColumnStartY + 20;
      paragraphs.forEach((paragraph, index) => {
        const lines = safeSplitTextToSize(doc, paragraph.trim(), columnWidth - 16);
        
        lines.forEach((line: string) => {
          doc.text(line, leftColumnX + 8, contentY);
          contentY += 5;
        });
        
        if (index < paragraphs.length - 1) contentY += 6;
      });
      
      leftColumnY = contentY + 10;
    } else {
      leftColumnY = leftColumnStartY + leftColumnHeight;
    }
    
    // Define profile sections first
    const profileSections = [
      {
        title: 'Risk & Compliance',
        color: colors.error,
        items: [
          { key: 'regulatory_intensity', label: 'Regulatory Intensity', value: data.contextProfile.regulatory_intensity },
          { key: 'data_sensitivity', label: 'Data Sensitivity', value: data.contextProfile.data_sensitivity },
          { key: 'safety_criticality', label: 'Safety Criticality', value: data.contextProfile.safety_criticality },
          { key: 'brand_exposure', label: 'Brand Exposure', value: data.contextProfile.brand_exposure }
        ]
      },
      {
        title: 'Operations & Performance',
        color: colors.accent,
        items: [
          { key: 'clock_speed', label: 'Clock Speed', value: data.contextProfile.clock_speed },
          { key: 'latency_edge', label: 'Latency Edge', value: data.contextProfile.latency_edge },
          { key: 'scale_throughput', label: 'Scale & Throughput', value: data.contextProfile.scale_throughput }
        ]
      },
      {
        title: 'Strategic Assets',
        color: colors.success,
        items: [
          { key: 'data_advantage', label: 'Data Advantage', value: data.contextProfile.data_advantage },
          { key: 'build_readiness', label: 'Build Readiness', value: data.contextProfile.build_readiness },
          { key: 'finops_priority', label: 'FinOps Priority', value: data.contextProfile.finops_priority }
        ]
      }
    ];
    
    // Calculate actual content height for Organizational Context
    let estimatedContextHeight = 20; // Header space
    profileSections.forEach(section => {
      estimatedContextHeight += 12; // Section header
      estimatedContextHeight += section.items.length * 4; // Items
      estimatedContextHeight += 6; // Section spacing
    });
    estimatedContextHeight += 20; // Constraints section space
    
    // Check if entire context section will fit on current page
    if (currentY + estimatedContextHeight > maxY - 20) {
      addPageFooter();
      doc.addPage();
      currentY = margin;
      
      // Re-add assessment header on new page
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.accent);
      doc.text('ASSESSMENT RESULTS (continued)', margin, currentY);
      currentY += 15;
    }
    
    // Premium Right Column: Organizational Context with dynamic height
    drawCard(rightColumnX, currentY, columnWidth, estimatedContextHeight, false);
    
    doc.setFontSize(typography.h2.size);
    doc.setFont('helvetica', typography.h2.weight);
    doc.setTextColor(...colors.accent);
    doc.text('ORGANIZATIONAL CONTEXT', rightColumnX + 8, currentY + 12);
    
    doc.setTextColor(...colors.primary);
    
    // Premium Context Profile with Visual Indicators
    let rightContentY = currentY + 20;
    
    profileSections.forEach((section, sectionIndex) => {
      // Pagination check for section header
      if (rightContentY + 12 + (section.items.length * 4) + 6 > maxY - 20) {
        // Add footer before page break
        addPageFooter();
        doc.addPage();
        rightContentY = margin + 15;
        
        // Calculate remaining content height for new page card
        let remainingHeight = 20; // Base height
        for (let i = sectionIndex; i < profileSections.length; i++) {
          remainingHeight += 12; // Section header
          remainingHeight += profileSections[i].items.length * 4; // Items
          remainingHeight += 6; // Section spacing
        }
        
        // Redraw premium card on new page
        drawCard(rightColumnX, rightContentY, columnWidth, remainingHeight, false);
        
        // Re-add context header on new page
        doc.setFontSize(typography.h2.size);
        doc.setFont('helvetica', typography.h2.weight);
        doc.setTextColor(...colors.accent);
        doc.text('ORGANIZATIONAL CONTEXT (continued)', rightColumnX + 8, rightContentY + 12);
        rightContentY += 25;
      }
      
      // Section header with color indicator
      doc.setFillColor(...section.color);
      doc.circle(rightColumnX + 10, rightContentY + 2, 2, 'F');
      
      doc.setFontSize(typography.h3.size);
      doc.setFont('helvetica', typography.h3.weight);
      doc.setTextColor(...colors.primary);
      doc.text(section.title, rightColumnX + 18, rightContentY + 4);
      rightContentY += 12;
      
      // Items with enhanced typography
      doc.setFontSize(typography.small.size);
      doc.setFont('helvetica', typography.small.weight);
      section.items.forEach((item, itemIndex) => {
        // Pagination check for each item
        if (rightContentY + 4 > maxY - 20) {
          // Add footer before page break
          addPageFooter();
          doc.addPage();
          rightContentY = margin + 15;
          
          // Calculate remaining content height for new page card
          let remainingHeight = 20; // Base height
          // Add remaining items in current section
          remainingHeight += (section.items.length - itemIndex) * 4;
          // Add remaining sections
          for (let i = sectionIndex + 1; i < profileSections.length; i++) {
            remainingHeight += 12; // Section header
            remainingHeight += profileSections[i].items.length * 4; // Items
            remainingHeight += 6; // Section spacing
          }
          
          // Redraw premium card on new page
          drawCard(rightColumnX, rightContentY, columnWidth, remainingHeight, false);
          
          // Re-add context header on new page
          doc.setFontSize(typography.h2.size);
          doc.setFont('helvetica', typography.h2.weight);
          doc.setTextColor(...colors.accent);
          doc.text('ORGANIZATIONAL CONTEXT (continued)', rightColumnX + 8, rightContentY + 12);
          rightContentY += 25;
          
          // Reset font for items
          doc.setFontSize(typography.small.size);
          doc.setFont('helvetica', typography.small.weight);
        }
        
        const valueText = formatScaleValue(item.key || '', item.value);
        const highValue = item.value >= 3;
        
        // Color code high values
        doc.setTextColor(...(highValue ? section.color : colors.secondary));
        doc.text(`${item.label}:`, rightColumnX + 12, rightContentY);
        doc.setTextColor(...colors.primary);
        doc.text(valueText, rightColumnX + 50, rightContentY);
        rightContentY += 4;
      });
      rightContentY += 6;
    });
    
    // Premium Constraints Section
    addDivider(rightContentY, 'accent');
    rightContentY += 8;
    
    doc.setFontSize(typography.h3.size);
    doc.setFont('helvetica', typography.h3.weight);
    doc.setTextColor(...colors.primary);
    doc.text('Operational Constraints', rightColumnX + 8, rightContentY);
    rightContentY += 8;
    
    const constraints = [
      { label: 'Procurement Constraints', value: data.contextProfile.procurement_constraints },
      { label: 'Edge Operations', value: data.contextProfile.edge_operations }
    ];
    
    constraints.forEach(constraint => {
      doc.setFillColor(...(constraint.value ? colors.warning : colors.success));
      doc.circle(rightColumnX + 12, rightContentY - 1, 1.5, 'F');
      
      doc.setFontSize(typography.small.size);
      doc.setFont('helvetica', typography.small.weight);
      doc.setTextColor(...colors.primary);
      doc.text(`${constraint.label}: ${constraint.value ? 'Yes' : 'No'}`, rightColumnX + 18, rightContentY);
      rightContentY += 5;
    });
    
    // Move to next section using the maximum Y position from both columns  
    currentY = Math.max(leftColumnY + 10, rightContentY + 20);
    
    // Premium Leadership Guidance Section
    if (mirror && (mirror.actions?.length || mirror.watchouts?.length)) {
      checkPageOverflow(60);
      
      // Section header with premium styling
      addDivider(currentY, 'accent');
      currentY += 8;
      
      doc.setFontSize(typography.h1.size);
      doc.setFont('helvetica', typography.h1.weight);
      doc.setTextColor(...colors.accent);
      doc.text('LEADERSHIP GUIDANCE', margin, currentY);
      currentY += 18;
      
      // Actions & Watchouts Grid Layout
      const gridLeftX = leftColumnX;
      const gridRightX = rightColumnX;
      let gridLeftY = currentY;
      let gridRightY = currentY;
      
      // Premium Actions (Left Column)
      if (mirror.actions?.length) {
        // Calculate dynamic height for actions
        let estimatedActionsHeight = 22; // Header space
        mirror.actions.forEach(action => {
          const actionLines = safeSplitTextToSize(doc, action, columnWidth - 16);
          estimatedActionsHeight += actionLines.length * 4 + 8; // Content + spacing
        });
        estimatedActionsHeight += 10; // Bottom padding
        
        // Check if entire actions section will fit on current page
        if (gridLeftY + estimatedActionsHeight > maxY - 20) {
          addPageFooter();
          doc.addPage();
          gridLeftY = margin + 15;
          gridRightY = margin + 15;
          currentY = margin;
          
          // Re-add section header on new page
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.accent);
          doc.text('LEADERSHIP GUIDANCE (continued)', margin, gridLeftY);
          gridLeftY += 15;
        }
        
        // Premium Actions Card with dynamic height
        drawCard(gridLeftX, gridLeftY, columnWidth, estimatedActionsHeight, true);
        
        // Actions header with icon
        doc.setFillColor(...colors.success);
        doc.circle(gridLeftX + 10, gridLeftY + 8, 3, 'F');
        
        doc.setFontSize(typography.h3.size);
        doc.setFont('helvetica', typography.h3.weight);
        doc.setTextColor(...colors.primary);
        doc.text('Leadership Actions', gridLeftX + 18, gridLeftY + 12);
        
        // Premium action items with enhanced styling
        let actionContentY = gridLeftY + 22;
        doc.setFontSize(typography.small.size);
        doc.setFont('helvetica', typography.small.weight);
        doc.setTextColor(...colors.primary);
        
        mirror.actions.forEach((action, actionIndex) => {
          // Handle text overflow with proper wrapping
          const actionLines = safeSplitTextToSize(doc, action, columnWidth - 16);
          const chipHeight = actionLines.length * 4 + 4;
          
          // Pagination check for each action
          if (actionContentY + chipHeight > maxY - 20) {
            // Add footer before page break
            addPageFooter();
            doc.addPage();
            actionContentY = margin + 15;
            gridLeftY = margin + 15;
            gridRightY = margin + 15;
            
            // Calculate remaining actions height for new page card
            let remainingActionsHeight = 22; // Header space
            for (let i = actionIndex; i < mirror.actions.length; i++) {
              const remainingActionLines = safeSplitTextToSize(doc, mirror.actions[i], columnWidth - 16);
              remainingActionsHeight += remainingActionLines.length * 4 + 8; // Content + spacing
            }
            remainingActionsHeight += 10; // Bottom padding
            
            // Redraw premium actions card on new page
            drawCard(gridLeftX, actionContentY, columnWidth, remainingActionsHeight, true);
            
            // Actions header with icon on new page
            doc.setFillColor(...colors.success);
            doc.circle(gridLeftX + 10, actionContentY + 8, 3, 'F');
            
            // Re-add actions header on new page
            doc.setFontSize(typography.h3.size);
            doc.setFont('helvetica', typography.h3.weight);
            doc.setTextColor(...colors.primary);
            doc.text('Leadership Actions (continued)', gridLeftX + 18, actionContentY + 12);
            actionContentY += 25;
            
            // Reset font for actions
            doc.setFontSize(typography.small.size);
            doc.setFont('helvetica', typography.small.weight);
          }
          
          // Premium action chip with elevated design
          doc.setFillColor(...colors.surface);
          doc.setDrawColor(...colors.accent);
          doc.setLineWidth(0.5);
          doc.rect(gridLeftX + 8, actionContentY, columnWidth - 16, chipHeight, 'FD');
          
          // Action text
          actionLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, gridLeftX + 12, actionContentY + 4 + (lineIndex * 4));
          });
          
          actionContentY += chipHeight + 4;
        });
        
        gridLeftY = actionContentY + 10;
      }
      
      // Premium Watchouts (Right Column)  
      if (mirror.watchouts?.length) {
        // Calculate dynamic height for watchouts
        let estimatedWatchoutsHeight = 22; // Header space
        mirror.watchouts.forEach(watchout => {
          const watchoutLines = safeSplitTextToSize(doc, watchout, columnWidth - 16);
          estimatedWatchoutsHeight += watchoutLines.length * 4 + 8; // Content + spacing
        });
        estimatedWatchoutsHeight += 10; // Bottom padding
        
        // Check if entire watchouts section will fit on current page
        if (gridRightY + estimatedWatchoutsHeight > maxY - 20) {
          addPageFooter();
          doc.addPage();
          gridLeftY = margin + 15;
          gridRightY = margin + 15;
          currentY = margin;
          
          // Re-add section header on new page
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.accent);
          doc.text('LEADERSHIP GUIDANCE (continued)', margin, gridRightY);
          gridRightY += 15;
        }
        
        // Premium Watchouts Card with dynamic height
        drawCard(gridRightX, gridRightY, columnWidth, estimatedWatchoutsHeight, true);
        
        // Watchouts header with icon
        doc.setFillColor(...colors.warning);
        doc.circle(gridRightX + 10, gridRightY + 8, 3, 'F');
        
        doc.setFontSize(typography.h3.size);
        doc.setFont('helvetica', typography.h3.weight);
        doc.setTextColor(...colors.primary);
        doc.text('Watch-outs', gridRightX + 18, gridRightY + 12);
        
        // Premium watchout items with enhanced styling
        let watchoutContentY = gridRightY + 22;
        doc.setFontSize(typography.small.size);
        doc.setFont('helvetica', typography.small.weight);
        doc.setTextColor(...colors.primary);
        
        mirror.watchouts.forEach((watchout, watchoutIndex) => {
          // Handle text overflow with proper wrapping
          const watchoutLines = safeSplitTextToSize(doc, watchout, columnWidth - 16);
          const chipHeight = watchoutLines.length * 4 + 4;
          
          // Pagination check for each watchout
          if (watchoutContentY + chipHeight > maxY - 20) {
            // Add footer before page break
            addPageFooter();
            doc.addPage();
            watchoutContentY = margin + 15;
            gridLeftY = margin + 15;
            gridRightY = margin + 15;
            
            // Calculate remaining watchouts height for new page card
            let remainingWatchoutsHeight = 22; // Header space
            for (let i = watchoutIndex; i < mirror.watchouts.length; i++) {
              const remainingWatchoutLines = safeSplitTextToSize(doc, mirror.watchouts[i], columnWidth - 16);
              remainingWatchoutsHeight += remainingWatchoutLines.length * 4 + 8; // Content + spacing
            }
            remainingWatchoutsHeight += 10; // Bottom padding
            
            // Redraw premium watchouts card on new page
            drawCard(gridRightX, watchoutContentY, columnWidth, remainingWatchoutsHeight, true);
            
            // Watchouts header with icon on new page
            doc.setFillColor(...colors.warning);
            doc.circle(gridRightX + 10, watchoutContentY + 8, 3, 'F');
            
            // Re-add watchouts header on new page
            doc.setFontSize(typography.h3.size);
            doc.setFont('helvetica', typography.h3.weight);
            doc.setTextColor(...colors.primary);
            doc.text('Watch-outs (continued)', gridRightX + 18, watchoutContentY + 12);
            watchoutContentY += 25;
            
            // Reset font for watchouts
            doc.setFontSize(typography.small.size);
            doc.setFont('helvetica', typography.small.weight);
          }
          
          // Premium watchout chip with elevated design
          doc.setFillColor(...colors.surface);
          doc.setDrawColor(...colors.warning);
          doc.setLineWidth(0.5);
          doc.rect(gridRightX + 8, watchoutContentY, columnWidth - 16, chipHeight, 'FD');
          
          // Watchout text
          watchoutLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, gridRightX + 12, watchoutContentY + 4 + (lineIndex * 4));
          });
          
          watchoutContentY += chipHeight + 4;
        });
        
        gridRightY = watchoutContentY + 10;
      }
      
      currentY = Math.max(gridLeftY, gridRightY) + 5;
    }
    
    // Situation Assessment 2.0: Scenario Lens Section with dynamic height calculation
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
      doc.setTextColor(...colors.accent);
      doc.text('SCENARIO LENS', margin, currentY);
      currentY += 12;
      
      // Scenario background with dynamic height
      doc.setFillColor(...hexToRgb('#f8fafc'));
      doc.setDrawColor(...hexToRgb('#e2e8f0'));
      doc.rect(margin, currentY - 3, contentWidth, scenarioContentHeight, 'FD');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.primary);
      
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
      doc.setFillColor(...colors.surface);
      doc.rect(margin, currentY - 5, contentWidth, 35, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.accent);
      doc.text('NOTES FOR YOUR DISCUSSION', margin + 5, currentY + 5);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.primary);
      
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
    
    // Final page footer (only add if not already added by page break)
    if (currentY < maxY) {
      addPageFooter();
    }
    
    // Generate and download PDF
    const pdfBlob = doc.output('blob');
    
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('Failed to generate PDF: Empty or invalid PDF blob');
    }
    
    const url = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    const filename = mirror ? 
      `cortex-situation-assessment-2.0-${data.assessmentId}.pdf` : 
      `cortex-situation-assessment-${data.assessmentId}.pdf`;
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

    // Colors object for consistency with situation assessment
    const colors = {
      primary: primaryColor,
      secondary: hexToRgb('#666666'),
      accent: accentColor,
      muted: lightGray
    };

    // Add page footer function for options studio
    const addPageFooter = () => {
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.secondary);
      doc.text('CORTEX™ Options Studio Report', margin, footerY);
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 15, footerY);
    };

    // Enhanced page overflow check
    const checkPageOverflow = (additionalHeight: number): boolean => {
      if (currentY + additionalHeight > maxY) {
        addPageFooter();
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
      doc.setTextColor(...colors.primary);
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
      doc.setTextColor(...colors.primary);
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