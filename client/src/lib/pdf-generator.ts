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
  insight: string; // Two paragraphs separated by \n\n
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
    
    if (!data.insight || typeof data.insight !== 'string' || data.insight.trim().length === 0) {
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
  doc.text('AI Strategic Maturity Context Brief', margin, 28);
  
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
  
  // Left Column: Context Reflection
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentColor);
  doc.text('CONTEXT REFLECTION', leftColumnX, currentY);
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

    // Split insight into paragraphs
    const paragraphs = data.insight.split(/\n{2,}/).filter(p => p.trim().length > 0);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor);
    
    paragraphs.forEach((paragraph, index) => {
      const lines = doc.splitTextToSize(paragraph.trim(), columnWidth);
      const requiredHeight = lines.length * 4;
      checkPageOverflow(requiredHeight + 6);
      
      doc.text(lines, leftColumnX, currentY);
      currentY += requiredHeight + (index < paragraphs.length - 1 ? 6 : 0); // Add space between paragraphs
    });
    
    currentY += 5;
  
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
  doc.text('© 2024 CORTEX™ AI Strategic Maturity Program', margin, footerY);
  
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

    // Brand Colors
    const primaryColor = '#1a1a1a';
    const accentColor = '#6366f1';
    const lightGray = '#f3f4f6';

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
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
    doc.setTextColor(primaryColor);

    // Helper function for page breaks
    const checkPageOverflow = (additionalHeight: number) => {
      if (currentY + additionalHeight > maxY) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Use Case Section
    if (sessionData.useCase) {
      checkPageOverflow(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor);
      doc.text('USE CASE', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor);
      const useCaseLines = doc.splitTextToSize(sessionData.useCase, contentWidth);
      useCaseLines.forEach((line: string) => {
        checkPageOverflow(6);
        doc.text(line, margin, currentY);
        currentY += 5;
      });
      currentY += 10;
    }

    // Goals Section
    if (sessionData.goals.length > 0) {
      checkPageOverflow(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor);
      doc.text('SELECTED GOALS', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor);
      sessionData.goals.forEach(goal => {
        checkPageOverflow(6);
        doc.text(`• ${goal}`, margin + 5, currentY);
        currentY += 5;
      });
      currentY += 10;
    }

    // Selected Options Section
    if (sessionData.selectedOptions.length > 0) {
      checkPageOverflow(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor);
      doc.text('COMPARED OPTIONS', margin, currentY);
      currentY += 10;
      
      sessionData.selectedOptions.forEach((option, index) => {
        checkPageOverflow(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text(`${index + 1}. ${option.title}`, margin, currentY);
        currentY += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(option.shortDescription, contentWidth - 10);
        descLines.forEach((line: string) => {
          checkPageOverflow(5);
          doc.text(line, margin + 5, currentY);
          currentY += 4;
        });
        currentY += 8;
      });
    }

    // Emphasized Lenses
    if (sessionData.emphasizedLenses.length > 0) {
      checkPageOverflow(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor);
      doc.text('EMPHASIZED LENSES FOR YOUR CONTEXT', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor);
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
      doc.setTextColor(accentColor);
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
          doc.setTextColor(primaryColor);
          const questionLines = doc.splitTextToSize(questionData.question, contentWidth - 10);
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
          doc.setTextColor(isCorrect ? '#16a34a' : '#dc2626');
          doc.text(resultText, margin + 10, currentY);
          currentY += 5;
          
          // Show explanation
          doc.setTextColor(primaryColor);
          doc.setFont('helvetica', 'italic');
          const explanationLines = doc.splitTextToSize(questionData.explanation, contentWidth - 20);
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
      doc.setTextColor(accentColor);
      doc.text('SEVEN LENSES COMPARISON', margin, currentY);
      currentY += 15;
      
      const lensLabels = ['Speed-to-Value', 'Customization & Control', 'Data Leverage', 'Risk & Compliance Load', 'Operational Burden', 'Portability & Lock-in', 'Cost Shape'];
      const cellWidth = contentWidth / (lensLabels.length + 1);
      const cellHeight = 8;
      
      // Table header
      doc.setFillColor(lightGray);
      doc.rect(margin, currentY, cellWidth, cellHeight, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('Option', margin + 2, currentY + 5.5);
      
      lensLabels.forEach((label, index) => {
        const x = margin + cellWidth + (index * cellWidth);
        doc.setFillColor(sessionData.emphasizedLenses.includes(label) ? '#dbeafe' : lightGray);
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
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, currentY, cellWidth, cellHeight, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(margin, currentY, cellWidth, cellHeight, 'S');
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(primaryColor);
        const optionTitleLines = doc.splitTextToSize(option.title || option.id, cellWidth - 4);
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
          
          const isEmphasized = sessionData.emphasizedLenses.includes(label);
          doc.setFillColor(isEmphasized ? '#dbeafe' : '#ffffff');
          doc.rect(x, currentY, cellWidth, cellHeight, 'F');
          doc.rect(x, currentY, cellWidth, cellHeight, 'S');
          
          // Value and dots
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(isEmphasized ? '#1e40af' : primaryColor);
          doc.text(value.toString(), x + cellWidth/2 - 3, currentY + 4);
          
          // Small dots to represent value
          for (let i = 0; i < 4; i++) {
            const dotX = x + 4 + (i * 3);
            const dotY = currentY + 6;
            doc.setFillColor(i < value ? (isEmphasized ? '#1e40af' : primaryColor) : '#d1d5db');
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
      doc.setTextColor(accentColor);
      doc.text('CONTEXT-BASED CAUTIONS', margin, currentY);
      currentY += 10;
      
      doc.setFillColor('#fef3c7');
      doc.rect(margin, currentY - 5, contentWidth, sessionData.cautionMessages.length * 8 + 10, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#92400e');
      sessionData.cautionMessages.forEach(message => {
        const messageLines = doc.splitTextToSize(`⚠ ${message}`, contentWidth - 10);
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
      doc.setTextColor(accentColor);
      doc.text('STRATEGIC REFLECTIONS', margin, currentY);
      currentY += 10;
      
      Object.entries(sessionData.reflectionAnswers).forEach(([prompt, answer], index) => {
        if (answer && answer.trim()) {
          checkPageOverflow(20);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor);
          const promptLines = doc.splitTextToSize(`${index + 1}. ${prompt}`, contentWidth - 10);
          promptLines.forEach((line: string) => {
            checkPageOverflow(5);
            doc.text(line, margin, currentY);
            currentY += 5;
          });
          currentY += 2;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const answerLines = doc.splitTextToSize(answer, contentWidth - 10);
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
    doc.setFillColor('#f8fafc');
    doc.rect(margin, currentY, contentWidth, 25, 'F');
    doc.setDrawColor('#e2e8f0');
    doc.rect(margin, currentY, contentWidth, 25, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor);
    doc.text('SESSION SUMMARY', margin + 5, currentY + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor);
    const summaryText = `Options explored: ${sessionData.selectedOptions?.length || 0} • Misconceptions tested: ${Object.keys(sessionData.misconceptionResponses || {}).length} • Emphasized lenses: ${sessionData.emphasizedLenses?.length || 0} • Completed: ${sessionData.completed ? 'Yes' : 'No'}`;
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 10);
    summaryLines.forEach((line: string, index: number) => {
      doc.text(line, margin + 5, currentY + 14 + (index * 4));
    });
    
    currentY += 35;

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#888888');
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
