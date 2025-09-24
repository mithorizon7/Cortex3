import { describe, it, expect } from 'vitest'
import { 
  violatesPolicy, 
  isValidWordCount, 
  getWordCount,
  BANNED_PHRASES_REGEX,
  WORD_COUNT_LIMITS
} from '../../shared/context-validation'

describe('Context Validation Utilities', () => {
  describe('violatesPolicy', () => {
    it('should detect banned phrase "strength"', () => {
      const textsWithStrength = [
        'The strength of our approach',
        'Key strengths include performance',
        'Building on organizational strengths',
        'STRENGTH in AI capabilities'
      ]

      textsWithStrength.forEach(text => {
        expect(violatesPolicy(text)).toBe(true)
      })
    })

    it('should detect banned phrase "fragility"', () => {
      const textsWithFragility = [
        'System fragility concerns',
        'Addressing fragilities in the process',
        'The fragility of current systems',
        'FRAGILITY is a concern'
      ]

      textsWithFragility.forEach(text => {
        expect(violatesPolicy(text)).toBe(true)
      })
    })

    it('should detect "No Vendor Names" phrase', () => {
      const textsWithNoVendorNames = [
        'No Vendor Names should be mentioned',
        'Remember: No Vendor Names in the analysis',
        'no vendor names policy'
      ]

      textsWithNoVendorNames.forEach(text => {
        expect(violatesPolicy(text)).toBe(true)
      })
    })

    it('should detect "No Benchmarks" phrase', () => {
      const textsWithNoBenchmarks = [
        'No Benchmarks should be included',
        'Policy: No Benchmarks allowed',
        'no benchmarks in analysis'
      ]

      textsWithNoBenchmarks.forEach(text => {
        expect(violatesPolicy(text)).toBe(true)
      })
    })

    it('should detect "Probability-Based" or "Probability Based" phrases', () => {
      const textsWithProbability = [
        'Using Probability-Based analysis',
        'Probability Based approach',
        'probability-based reasoning',
        'Probability Based decisions'
      ]

      textsWithProbability.forEach(text => {
        expect(violatesPolicy(text)).toBe(true)
      })
    })

    it('should detect "Under X Words" pattern', () => {
      const textsWithWordLimits = [
        'Keep it Under 100 Words',
        'Analysis should be Under 50 Words',
        'under 200 words maximum',
        'Under 150Words limit'
      ]

      textsWithWordLimits.forEach(text => {
        expect(violatesPolicy(text)).toBe(true)
      })
    })

    it('should be case insensitive', () => {
      const variations = [
        'STRENGTH analysis',
        'strength analysis',
        'Strength Analysis',
        'StReNgTh analysis'
      ]

      variations.forEach(text => {
        expect(violatesPolicy(text)).toBe(true)
      })
    })

    it('should allow valid content without banned phrases', () => {
      const validTexts = [
        'This AI assessment provides strategic guidance for executive leadership teams.',
        'Organizations should focus on building capability maturity across all domains.',
        'The analysis reveals opportunities for improvement in data operations.',
        'Strategic recommendations include investing in talent development.',
        'Implementation requires careful change management and stakeholder alignment.',
        'Success metrics should align with business objectives and organizational goals.'
      ]

      validTexts.forEach(text => {
        expect(violatesPolicy(text)).toBe(false)
      })
    })

    it('should handle edge cases', () => {
      expect(violatesPolicy('')).toBe(false)
      expect(violatesPolicy('   ')).toBe(false)
      expect(violatesPolicy('strength of character')).toBe(true) // Should still catch
      expect(violatesPolicy('strengthening relationships')).toBe(false) // Different word
    })

    it('should detect plural forms', () => {
      expect(violatesPolicy('organizational strengths')).toBe(true)
      expect(violatesPolicy('system fragilities')).toBe(true)
    })
  })

  describe('getWordCount', () => {
    it('should count words correctly in normal text', () => {
      expect(getWordCount('Hello world')).toBe(2)
      expect(getWordCount('This is a test sentence')).toBe(5)
      expect(getWordCount('AI assessment strategic guidance')).toBe(4)
    })

    it('should handle text with extra whitespace', () => {
      expect(getWordCount('  Hello   world  ')).toBe(2)
      expect(getWordCount('Multiple    spaces    between    words')).toBe(4)
      expect(getWordCount('\t\nHello\n\tworld\n')).toBe(2)
    })

    it('should handle empty and whitespace-only strings', () => {
      expect(getWordCount('')).toBe(0)
      expect(getWordCount('   ')).toBe(0)
      expect(getWordCount('\t\n')).toBe(0)
    })

    it('should handle single words', () => {
      expect(getWordCount('Hello')).toBe(1)
      expect(getWordCount('AI')).toBe(1)
    })

    it('should handle punctuation correctly', () => {
      expect(getWordCount('Hello, world!')).toBe(2)
      expect(getWordCount('AI-driven assessment; strategic guidance.')).toBe(4)
      expect(getWordCount("Don't count contractions as multiple words")).toBe(6)
    })

    it('should handle realistic assessment text', () => {
      const assessmentText = `
        Your organization demonstrates strong foundational readiness for AI adoption with mature 
        centers of excellence and established governance frameworks. The quarterly decision-making 
        cadence provides adequate responsiveness for most AI initiatives, though frontier-pace 
        opportunities may require more agile processes.
      `
      const wordCount = getWordCount(assessmentText)
      expect(wordCount).toBe(37) // Manual count verification
    })
  })

  describe('isValidWordCount', () => {
    it('should accept word counts within valid range', () => {
      // Generate text with valid word count
      const validWords = new Array(180).fill('word').join(' ')
      expect(getWordCount(validWords)).toBe(180)
      expect(isValidWordCount(validWords)).toBe(true)
    })

    it('should reject word counts below minimum', () => {
      const shortText = new Array(100).fill('word').join(' ') // Below 150 minimum
      expect(getWordCount(shortText)).toBe(100)
      expect(isValidWordCount(shortText)).toBe(false)
    })

    it('should reject word counts above maximum', () => {
      const longText = new Array(250).fill('word').join(' ') // Above 220 maximum
      expect(getWordCount(longText)).toBe(250)
      expect(isValidWordCount(longText)).toBe(false)
    })

    it('should accept text at boundary values', () => {
      const minText = new Array(WORD_COUNT_LIMITS.min).fill('word').join(' ') // Exactly 150
      const maxText = new Array(WORD_COUNT_LIMITS.max).fill('word').join(' ') // Exactly 220
      
      expect(isValidWordCount(minText)).toBe(true)
      expect(isValidWordCount(maxText)).toBe(true)
    })

    it('should reject text just outside boundaries', () => {
      const belowMin = new Array(WORD_COUNT_LIMITS.min - 1).fill('word').join(' ') // 149
      const aboveMax = new Array(WORD_COUNT_LIMITS.max + 1).fill('word').join(' ') // 221
      
      expect(isValidWordCount(belowMin)).toBe(false)
      expect(isValidWordCount(aboveMax)).toBe(false)
    })

    it('should handle realistic assessment content', () => {
      const validAssessment = `
        Your organization demonstrates mature foundational readiness for comprehensive AI adoption with well-established 
        centers of excellence and robust governance frameworks. The quarterly decision-making cadence provides adequate 
        responsiveness for most strategic AI initiatives, though frontier-pace opportunities may require more agile processes 
        and accelerated approval mechanisms for competitive advantage.

        Data sensitivity requirements indicate immediate need for enhanced privacy controls and comprehensive compliance 
        monitoring systems. Consider implementing advanced data classification systems and sophisticated anonymization 
        techniques before processing confidential information through AI systems to ensure regulatory compliance and data protection.

        The moderate scale throughput suggests current infrastructure can effectively support department-level AI 
        deployments with minimal additional investment. For enterprise-wide initiatives, evaluate cloud-native architectures that can scale elastically 
        with demand while maintaining cost efficiency and security requirements throughout all operational phases.

        Priority actions include establishing clear AI governance policies, investing in comprehensive talent development 
        programs, and creating cross-functional teams to drive organizational transformation successfully. Success requires executive 
        sponsorship and consistent communication of AI strategy throughout the organization to build confidence and adoption momentum 
        across all business units and operational domains.
      `
      
      const wordCount = getWordCount(validAssessment)
      expect(wordCount).toBeGreaterThanOrEqual(WORD_COUNT_LIMITS.min)
      expect(wordCount).toBeLessThanOrEqual(WORD_COUNT_LIMITS.max)
      expect(isValidWordCount(validAssessment)).toBe(true)
    })
  })

  describe('Constants', () => {
    it('should have appropriate word count limits', () => {
      expect(WORD_COUNT_LIMITS.min).toBe(150)
      expect(WORD_COUNT_LIMITS.max).toBe(220)
      expect(WORD_COUNT_LIMITS.min).toBeLessThan(WORD_COUNT_LIMITS.max)
    })

    it('should have functional banned phrases regex', () => {
      expect(BANNED_PHRASES_REGEX).toBeInstanceOf(RegExp)
      expect(BANNED_PHRASES_REGEX.flags).toContain('i') // Case insensitive
      
      // Test the regex directly
      expect(BANNED_PHRASES_REGEX.test('strength')).toBe(true)
      expect(BANNED_PHRASES_REGEX.test('fragility')).toBe(true)
      expect(BANNED_PHRASES_REGEX.test('No Vendor Names')).toBe(true)
      expect(BANNED_PHRASES_REGEX.test('valid content')).toBe(false)
    })
  })

  describe('Integration Tests', () => {
    it('should validate complete context reflection content', () => {
      const validContent = `
        Your organization exhibits mature AI readiness across operational domains with established governance 
        frameworks and dedicated centers of excellence. The quarterly decision-making cadence supports most 
        strategic AI initiatives while maintaining appropriate oversight and comprehensive risk management protocols 
        for sustainable AI implementation.

        Data sensitivity levels require enhanced privacy controls and comprehensive compliance monitoring before 
        processing confidential information through AI systems. Consider implementing advanced anonymization 
        techniques and sophisticated data classification systems to protect sensitive organizational assets 
        and maintain regulatory compliance across all jurisdictions and industry standards.

        Current infrastructure can support department-level AI deployments effectively without major upgrades or investments. 
        For enterprise-wide initiatives, evaluate cloud-native architectures that scale elastically with demand 
        while maintaining cost efficiency and security requirements throughout the entire deployment lifecycle 
        and operational maintenance phases.

        Priority recommendations include establishing clear AI governance policies, investing in comprehensive 
        talent development programs, and creating cross-functional teams to drive organizational transformation 
        and successful AI adoption across all business units and operational domains while maintaining 
        competitive advantage and operational excellence.
      `

      expect(violatesPolicy(validContent)).toBe(false)
      expect(isValidWordCount(validContent)).toBe(true)
      expect(getWordCount(validContent)).toBeGreaterThan(0)
    })

    it('should catch policy violations in otherwise valid content', () => {
      const invalidContent = `
        Your organization demonstrates strong strengths in AI readiness with mature centers of 
        excellence and established governance frameworks. The quarterly decision-making cadence 
        provides adequate responsiveness for most AI initiatives, though some fragilites remain 
        in the operational processes that should be addressed.
      `

      expect(violatesPolicy(invalidContent)).toBe(true) // Should catch both "strengths" and "fragilites"
      expect(isValidWordCount(invalidContent)).toBe(false) // Too short
    })

    it('should validate word count and policy together', () => {
      // Valid length, valid content
      const validLongContent = new Array(200).fill('valid').join(' ')
      expect(isValidWordCount(validLongContent)).toBe(true)
      expect(violatesPolicy(validLongContent)).toBe(false)

      // Valid length, invalid content
      const invalidLongContent = new Array(180).fill('word').join(' ') + ' strength analysis'
      expect(isValidWordCount(invalidLongContent)).toBe(true)
      expect(violatesPolicy(invalidLongContent)).toBe(true)
    })
  })
})