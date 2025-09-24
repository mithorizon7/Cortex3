/**
 * Situation Assessment Constraint Enforcement Utilities
 * Implements critical methodology compliance requirements:
 * - Word limit enforcement (220 words)
 * - Content sanitization (vendor names, benchmarks)
 * - Required 3-3-2 structure validation
 */

// Vendor names and company names to be sanitized
const VENDOR_PATTERNS = [
  // Major cloud providers
  /\b(amazon\s+web\s+services|aws|microsoft\s+azure|azure|google\s+cloud|gcp)\b/gi,
  /\b(salesforce|oracle|ibm|sap|workday)\b/gi,
  
  // AI/ML platforms
  /\b(openai|anthropic|cohere|hugging\s*face|nvidia|deepmind)\b/gi,
  /\b(chatgpt|gpt-\d+|claude|bard|gemini|copilot)\b/gi,
  
  // Major tech companies
  /\b(apple|meta|facebook|tesla|netflix|uber|airbnb)\b/gi,
  /\b(palantir|databricks|snowflake|mongodb|elastic)\b/gi,
  
  // Software tools and platforms
  /\b(kubernetes|docker|jenkins|github|gitlab|bitbucket)\b/gi,
  /\b(tableau|powerbi|looker|qlik|splunk)\b/gi,
  
  // Common benchmarks and metrics
  /\b(gartner|forrester|idc|mckinsey|deloitte|pwc|kpmg|ey)\b/gi,
  /\b(s&p\s*500|fortune\s*500|nasdaq|dow\s*jones)\b/gi,
];

// Generic replacements for different categories
const REPLACEMENTS = {
  cloud: "cloud provider",
  ai: "AI platform", 
  tech: "technology platform",
  tool: "software tool",
  benchmark: "industry analysis",
  company: "major organization",
};

/**
 * Counts words in text content, handling multiple sentences and paragraphs
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Remove extra whitespace and split by whitespace
  const words = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0);
    
  return words.length;
}

/**
 * Counts total words across all narrative sections
 */
export function countNarrativeWords(content: {
  organizationContext: string;
  strategicImplications: string;
  practicalNext: string;
}): number {
  return countWords(content.organizationContext) + 
         countWords(content.strategicImplications) + 
         countWords(content.practicalNext);
}

/**
 * Counts total words across structured Situation Assessment data
 */
export function countStructuredWords(mirror: {
  strengths: string[];
  fragilities: string[];
  whatWorks: string[];
  disclaimer: string;
}): number {
  const allText = [
    ...mirror.strengths,
    ...mirror.fragilities, 
    ...mirror.whatWorks,
    mirror.disclaimer
  ].join(' ');
  
  return countWords(allText);
}

/**
 * Sanitizes content by removing/replacing vendor names, company names, and benchmarks
 */
export function sanitizeContent(text: string): { sanitized: string; redacted: boolean } {
  if (!text || typeof text !== 'string') {
    return { sanitized: text, redacted: false };
  }
  
  let sanitized = text;
  let redacted = false;
  
  // Apply vendor/company name patterns
  for (const pattern of VENDOR_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches && matches.length > 0) {
      redacted = true;
      
      // Determine appropriate replacement based on context
      let replacement = REPLACEMENTS.company;
      const lowerMatch = matches[0].toLowerCase();
      
      if (lowerMatch.includes('aws') || lowerMatch.includes('azure') || lowerMatch.includes('cloud')) {
        replacement = REPLACEMENTS.cloud;
      } else if (lowerMatch.includes('gpt') || lowerMatch.includes('ai') || lowerMatch.includes('openai')) {
        replacement = REPLACEMENTS.ai;
      } else if (lowerMatch.includes('github') || lowerMatch.includes('kubernetes') || lowerMatch.includes('docker')) {
        replacement = REPLACEMENTS.tool;
      } else if (lowerMatch.includes('gartner') || lowerMatch.includes('forrester') || lowerMatch.includes('mckinsey')) {
        replacement = REPLACEMENTS.benchmark;
      }
      
      sanitized = sanitized.replace(pattern, replacement);
    }
  }
  
  return { sanitized, redacted };
}

/**
 * Sanitizes all content in Situation Assessment structure
 */
export function sanitizeSituationAssessment(mirror: {
  strengths: string[];
  fragilities: string[];
  whatWorks: string[];
  disclaimer: string;
}): { 
  sanitized: typeof mirror; 
  redacted: boolean;
} {
  let hasRedactions = false;
  
  const sanitizedStrengths = mirror.strengths.map(strength => {
    const result = sanitizeContent(strength);
    if (result.redacted) hasRedactions = true;
    return result.sanitized;
  });
  
  const sanitizedFragilities = mirror.fragilities.map(fragility => {
    const result = sanitizeContent(fragility);
    if (result.redacted) hasRedactions = true;
    return result.sanitized;
  });
  
  const sanitizedWhatWorks = mirror.whatWorks.map(work => {
    const result = sanitizeContent(work);
    if (result.redacted) hasRedactions = true;
    return result.sanitized;
  });
  
  const disclaimerResult = sanitizeContent(mirror.disclaimer);
  if (disclaimerResult.redacted) hasRedactions = true;
  
  return {
    sanitized: {
      strengths: sanitizedStrengths,
      fragilities: sanitizedFragilities,
      whatWorks: sanitizedWhatWorks,
      disclaimer: disclaimerResult.sanitized,
    },
    redacted: hasRedactions
  };
}

/**
 * Truncates narrative content to fit within word limit while preserving disclaimer
 */
export function truncateNarrativeContent(
  content: {
    organizationContext: string;
    strategicImplications: string;
    practicalNext: string;
  },
  disclaimer: string,
  maxWords: number = 220
): {
  truncated: typeof content;
  wordCount: number;
  wasTruncated: boolean;
} {
  const disclaimerWords = countWords(disclaimer);
  const availableWords = Math.max(0, maxWords - disclaimerWords);
  
  let remainingWords = availableWords;
  let wasTruncated = false;
  
  // Function to truncate a single section
  const truncateSection = (text: string, allowedWords: number): string => {
    const words = text.trim().split(/\s+/);
    if (words.length <= allowedWords) {
      return text;
    }
    
    wasTruncated = true;
    return words.slice(0, allowedWords).join(' ') + '...';
  };
  
  // Allocate words proportionally across sections (roughly equal)
  const wordsPerSection = Math.floor(availableWords / 3);
  
  const truncatedContent = {
    organizationContext: truncateSection(content.organizationContext, wordsPerSection),
    strategicImplications: truncateSection(content.strategicImplications, wordsPerSection),
    practicalNext: truncateSection(content.practicalNext, wordsPerSection),
  };
  
  // Count final words
  const finalWordCount = countNarrativeWords(truncatedContent) + disclaimerWords;
  
  return {
    truncated: truncatedContent,
    wordCount: finalWordCount,
    wasTruncated
  };
}

/**
 * Validates that Situation Assessment meets required 3-3-2 structure
 */
export function validateStructure(mirror: {
  strengths: string[];
  fragilities: string[];
  whatWorks: string[];
  disclaimer: string;
}): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (mirror.strengths.length !== 3) {
    issues.push(`Expected 3 strengths, got ${mirror.strengths.length}`);
  }
  
  if (mirror.fragilities.length !== 3) {
    issues.push(`Expected 3 fragilities, got ${mirror.fragilities.length}`);
  }
  
  if (mirror.whatWorks.length !== 2) {
    issues.push(`Expected 2 what works items, got ${mirror.whatWorks.length}`);
  }
  
  if (!mirror.disclaimer || mirror.disclaimer.trim().length === 0) {
    issues.push("Disclaimer is required");
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Comprehensive constraint enforcement for Situation Assessment
 */
export function enforceConstraints(mirror: {
  strengths: string[];
  fragilities: string[];
  whatWorks: string[];
  disclaimer: string;
}): {
  processed: typeof mirror;
  wordCount: number;
  wasTruncated: boolean;
  wasRedacted: boolean;
  structureValid: boolean;
  issues: string[];
} {
  // Step 1: Validate structure
  const structureValidation = validateStructure(mirror);
  
  // Step 2: Sanitize content
  const sanitizationResult = sanitizeSituationAssessment(mirror);
  
  // Step 3: Check word count and truncate if needed
  const totalWords = countStructuredWords(sanitizationResult.sanitized);
  
  // For structured display, we're less aggressive with truncation since
  // the schema already enforces individual item length limits
  const wordLimit = 220;
  let wasTruncated = false;
  let processed = sanitizationResult.sanitized;
  
  if (totalWords > wordLimit) {
    // If over limit, truncate individual items proportionally
    wasTruncated = true;
    
    // This is a fallback - the backend schema should prevent this
    // But we'll handle it gracefully
    const maxItemWords = 30; // Conservative limit per item
    
    processed = {
      strengths: processed.strengths.map(s => {
        const words = s.split(/\s+/);
        return words.length > maxItemWords 
          ? words.slice(0, maxItemWords).join(' ') + '...'
          : s;
      }),
      fragilities: processed.fragilities.map(f => {
        const words = f.split(/\s+/);
        return words.length > maxItemWords 
          ? words.slice(0, maxItemWords).join(' ') + '...'
          : f;
      }),
      whatWorks: processed.whatWorks.map(w => {
        const words = w.split(/\s+/);
        return words.length > maxItemWords 
          ? words.slice(0, maxItemWords).join(' ') + '...'
          : w;
      }),
      disclaimer: processed.disclaimer // Preserve disclaimer
    };
  }
  
  const finalWordCount = countStructuredWords(processed);
  
  return {
    processed,
    wordCount: finalWordCount,
    wasTruncated,
    wasRedacted: sanitizationResult.redacted,
    structureValid: structureValidation.isValid,
    issues: structureValidation.issues
  };
}