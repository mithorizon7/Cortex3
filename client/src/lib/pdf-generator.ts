import { formatScaleValue } from "@shared/scale-utils";
import type { ContextProfile } from "@shared/schema";

export interface AssessmentResults {
  contextProfile: ContextProfile;
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
  contextProfile: ContextProfile;
  assessmentId: string;
}


export async function generateContextBrief(data: ContextMirrorData): Promise<void> {
  try {
    // Validate required data first
    if (!data || !data.contextProfile || !data.assessmentId) {
      throw new Error('Missing required data for PDF generation');
    }
    
    if (!data.strengths?.length || !data.fragilities?.length || !data.whatWorks?.length) {
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
  
  // Brand Colors
  const primaryColor = '#1a1a1a';
  const accentColor = '#6366f1';
  const lightGray = '#f3f4f6';
  
  // Header with CORTEX™ branding
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CORTEX™', margin, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Executive AI Readiness Context Brief', margin, 28);
  
  // Date and Assessment ID
  doc.setFontSize(10);
  const dateText = `Generated: ${new Date().toLocaleDateString()}`;
  const idText = `Assessment ID: ${data.assessmentId}`;
  doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), 20);
  doc.text(idText, pageWidth - margin - doc.getTextWidth(idText), 28);
  
  currentY = 50;
  
  // Reset text color for content
  doc.setTextColor(primaryColor);
  
  // Main Content - Two Column Layout
  const leftColumnX = margin;
  const rightColumnX = margin + columnWidth + 10;
  
  // Left Column: Context Insights
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentColor);
  doc.text('WHAT YOUR PROFILE SIGNALS', leftColumnX, currentY);
  currentY += 10;
  
    // Helper function to check if content fits on current page
    const checkPageOverflow = (additionalHeight: number) => {
      if (currentY + additionalHeight > maxY) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Strengths
    checkPageOverflow(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('Strengths', leftColumnX, currentY);
    currentY += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.strengths.forEach(strength => {
      const lines = doc.splitTextToSize(`• ${strength}`, columnWidth - 5);
      const requiredHeight = lines.length * 4;
      checkPageOverflow(requiredHeight + 2);
      doc.text(lines, leftColumnX + 3, currentY);
      currentY += requiredHeight;
    });
    
    currentY += 5;
  
    // Fragilities
    checkPageOverflow(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Fragilities', leftColumnX, currentY);
    currentY += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.fragilities.forEach(fragility => {
      const lines = doc.splitTextToSize(`• ${fragility}`, columnWidth - 5);
      const requiredHeight = lines.length * 4;
      checkPageOverflow(requiredHeight + 2);
      doc.text(lines, leftColumnX + 3, currentY);
      currentY += requiredHeight;
    });
    
    currentY += 5;
  
    // What Works
    checkPageOverflow(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('What usually works first', leftColumnX, currentY);
    currentY += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.whatWorks.forEach(work => {
      const lines = doc.splitTextToSize(`• ${work}`, columnWidth - 5);
      const requiredHeight = lines.length * 4;
      checkPageOverflow(requiredHeight + 2);
      doc.text(lines, leftColumnX + 3, currentY);
      currentY += requiredHeight;
    });
  
  // Right Column: Context Profile
  let rightColumnY = 60;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentColor);
  doc.text('ORGANIZATIONAL CONTEXT', rightColumnX, rightColumnY);
  rightColumnY += 10;
  
  doc.setTextColor(primaryColor);
  
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
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Constraints', rightColumnX, rightColumnY);
  rightColumnY += 6;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Procurement Constraints: ${data.contextProfile.procurement_constraints ? 'Yes' : 'No'}`, rightColumnX + 3, rightColumnY);
  rightColumnY += 4;
  doc.text(`Edge Operations: ${data.contextProfile.edge_operations ? 'Yes' : 'No'}`, rightColumnX + 3, rightColumnY);
  
  // Discussion Notes Section (Full Width)
  currentY = Math.max(currentY + 20, rightColumnY + 20);
  
  // Background for discussion section
  doc.setFillColor(lightGray);
  doc.rect(margin, currentY - 5, contentWidth, 35, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentColor);
  doc.text('NOTES FOR YOUR DISCUSSION', margin + 5, currentY + 5);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(primaryColor);
  
  const discussionNotes = [
    '• Underline one strength and one fragility that surprised you.',
    '• Which item would most affect customers or reputation if mishandled?',
    '• What\'s the smallest next step to de-risk a fragility?'
  ];
  
  let noteY = currentY + 12;
  discussionNotes.forEach(note => {
    const lines = doc.splitTextToSize(note, contentWidth - 10);
    doc.text(lines, margin + 5, noteY);
    noteY += lines.length * 4 + 2;
  });
  
  currentY = noteY + 15;
  
  // Disclaimer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor('#666666');
  
  const disclaimerText = `DISCLAIMER: ${data.disclaimer}\n\nThis brief provides a contextual reflection based on your organizational profile. It is educational content designed to facilitate strategic discussion, not prescriptive recommendations or compliance guidance.`;
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(disclaimerLines, margin, currentY);
  
  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#888888');
  doc.text('© 2024 CORTEX™ Executive AI Readiness Program', margin, footerY);
  
    // Generate and download PDF
    const pdfBlob = doc.output('blob');
    
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('Failed to generate PDF: Empty or invalid PDF blob');
    }
    
    const url = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cortex-context-brief-${data.assessmentId}.pdf`;
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
