import { describe, it, expect } from 'vitest'
import { 
  formatScaleValue, 
  formatScaleLabelOnly,
  formatGenericScale,
  percentageToScale,
  getScaleColorClass,
  CONTEXT_FIELD_LABELS,
  GENERIC_SCALE_LABELS
} from '../../shared/scale-utils'

describe('Scale Utilities', () => {
  describe('formatScaleValue', () => {
    it('should format scale value with numeric indicator by default', () => {
      const result = formatScaleValue('regulatory_intensity', 2)
      expect(result).toBe('Some Rules (2/4)')
    })

    it('should format scale value without numeric indicator when requested', () => {
      const result = formatScaleValue('regulatory_intensity', 2, false)
      expect(result).toBe('Some Rules')
    })

    it('should handle all scale values for a field', () => {
      const field = 'data_sensitivity'
      const expectedResults = [
        'Public (0/4)',
        'Internal (1/4)',
        'Confidential (2/4)',
        'PII/Trade Secrets (3/4)',
        'PHI/PCI + Regional (4/4)'
      ]

      for (let i = 0; i <= 4; i++) {
        expect(formatScaleValue(field, i)).toBe(expectedResults[i])
      }
    })

    it('should clamp values outside 0-4 range', () => {
      expect(formatScaleValue('regulatory_intensity', -1)).toBe('None (0/4)')
      expect(formatScaleValue('regulatory_intensity', 10)).toBe('Heavily Regulated (4/4)')
      expect(formatScaleValue('regulatory_intensity', 2.7)).toBe('Audited (3/4)')
    })

    it('should use generic labels for unknown fields', () => {
      const result = formatScaleValue('unknown_field', 2)
      expect(result).toBe('Medium (2/4)')
    })

    it('should handle all context profile fields', () => {
      const fields = [
        'regulatory_intensity',
        'data_sensitivity', 
        'safety_criticality',
        'brand_exposure',
        'clock_speed',
        'latency_edge',
        'scale_throughput',
        'data_advantage',
        'build_readiness',
        'finops_priority'
      ]

      fields.forEach(field => {
        const result = formatScaleValue(field, 2)
        expect(result).toContain('(2/4)')
        expect(result.length).toBeGreaterThan(5) // Should have meaningful label
      })
    })
  })

  describe('formatScaleLabelOnly', () => {
    it('should return label without numeric indicator', () => {
      const result = formatScaleLabelOnly('regulatory_intensity', 3)
      expect(result).toBe('Audited')
      expect(result).not.toContain('(3/4)')
    })

    it('should handle edge cases', () => {
      expect(formatScaleLabelOnly('safety_criticality', 0)).toBe('Low Harm')
      expect(formatScaleLabelOnly('safety_criticality', 4)).toBe('Physical Safety')
    })
  })

  describe('formatGenericScale', () => {
    it('should format generic scale values correctly', () => {
      expect(formatGenericScale(0)).toBe('Very Low (0/4)')
      expect(formatGenericScale(1)).toBe('Low (1/4)')
      expect(formatGenericScale(2)).toBe('Medium (2/4)')
      expect(formatGenericScale(3)).toBe('High (3/4)')
      expect(formatGenericScale(4)).toBe('Very High (4/4)')
    })

    it('should handle showNumeric parameter', () => {
      expect(formatGenericScale(2, false)).toBe('Medium')
      expect(formatGenericScale(2, true)).toBe('Medium (2/4)')
    })

    it('should clamp values to valid range', () => {
      expect(formatGenericScale(-5)).toBe('Very Low (0/4)')
      expect(formatGenericScale(10)).toBe('Very High (4/4)')
      expect(formatGenericScale(2.8)).toBe('High (3/4)')
    })
  })

  describe('percentageToScale', () => {
    it('should convert percentage to scale correctly', () => {
      expect(percentageToScale(0)).toBe(0)
      expect(percentageToScale(25)).toBe(1)
      expect(percentageToScale(50)).toBe(2)
      expect(percentageToScale(75)).toBe(3)
      expect(percentageToScale(100)).toBe(4)
    })

    it('should handle intermediate percentages', () => {
      expect(percentageToScale(12.5)).toBe(1) // 12.5 rounds to 1
      expect(percentageToScale(37.5)).toBe(2) // 37.5 rounds to 2
      expect(percentageToScale(62.5)).toBe(3) // 62.5 rounds to 3
      expect(percentageToScale(87.5)).toBe(4) // 87.5 rounds to 4
    })

    it('should clamp percentages to valid range', () => {
      expect(percentageToScale(-10)).toBe(0)
      expect(percentageToScale(150)).toBe(4)
    })

    it('should handle edge cases', () => {
      expect(percentageToScale(0.1)).toBe(0)
      expect(percentageToScale(99.9)).toBe(4)
    })
  })

  describe('getScaleColorClass', () => {
    it('should return correct color classes for each scale value', () => {
      expect(getScaleColorClass(0)).toBe('text-muted-foreground')
      expect(getScaleColorClass(1)).toBe('text-yellow-600 dark:text-yellow-500')
      expect(getScaleColorClass(2)).toBe('text-orange-600 dark:text-orange-500')
      expect(getScaleColorClass(3)).toBe('text-blue-600 dark:text-blue-500')
      expect(getScaleColorClass(4)).toBe('text-green-600 dark:text-green-500')
    })

    it('should handle out-of-range values by clamping', () => {
      expect(getScaleColorClass(-1)).toBe('text-muted-foreground') // Clamped to 0
      expect(getScaleColorClass(10)).toBe('text-green-600 dark:text-green-500') // Clamped to 4
    })

    it('should handle decimal values by rounding', () => {
      expect(getScaleColorClass(2.3)).toBe('text-orange-600 dark:text-orange-500')
      expect(getScaleColorClass(3.7)).toBe('text-green-600 dark:text-green-500')
    })
  })

  describe('Constants', () => {
    describe('CONTEXT_FIELD_LABELS', () => {
      it('should have labels for all context profile fields', () => {
        const expectedFields = [
          'regulatory_intensity',
          'data_sensitivity',
          'safety_criticality', 
          'brand_exposure',
          'clock_speed',
          'latency_edge',
          'scale_throughput',
          'data_advantage',
          'build_readiness',
          'finops_priority'
        ]

        expectedFields.forEach(field => {
          expect(CONTEXT_FIELD_LABELS[field]).toBeDefined()
          expect(CONTEXT_FIELD_LABELS[field]).toHaveLength(5) // Should have 5 labels (0-4)
        })
      })

      it('should have meaningful labels for each scale value', () => {
        Object.entries(CONTEXT_FIELD_LABELS).forEach(([field, labels]) => {
          labels.forEach((label, index) => {
            expect(label).toBeTruthy()
            expect(typeof label).toBe('string')
            expect(label.trim()).toBe(label) // No leading/trailing whitespace
            expect(label.length).toBeGreaterThan(0)
          })
        })
      })

      it('should have specific expected labels for regulatory intensity', () => {
        const labels = CONTEXT_FIELD_LABELS.regulatory_intensity
        expect(labels[0]).toBe('None')
        expect(labels[1]).toBe('Guidance')
        expect(labels[2]).toBe('Some Rules')
        expect(labels[3]).toBe('Audited')
        expect(labels[4]).toBe('Heavily Regulated')
      })
    })

    describe('GENERIC_SCALE_LABELS', () => {
      it('should have labels for all scale values', () => {
        for (let i = 0; i <= 4; i++) {
          expect(GENERIC_SCALE_LABELS[i as 0 | 1 | 2 | 3 | 4]).toBeDefined()
          expect(typeof GENERIC_SCALE_LABELS[i as 0 | 1 | 2 | 3 | 4]).toBe('string')
        }
      })

      it('should have progressive intensity labels', () => {
        expect(GENERIC_SCALE_LABELS[0]).toBe('Very Low')
        expect(GENERIC_SCALE_LABELS[1]).toBe('Low')
        expect(GENERIC_SCALE_LABELS[2]).toBe('Medium')
        expect(GENERIC_SCALE_LABELS[3]).toBe('High')
        expect(GENERIC_SCALE_LABELS[4]).toBe('Very High')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should work correctly for complete context profile formatting', () => {
      const contextProfile = {
        regulatory_intensity: 3,
        data_sensitivity: 2,
        safety_criticality: 1,
        brand_exposure: 4,
        clock_speed: 0,
        latency_edge: 2,
        scale_throughput: 3,
        data_advantage: 1,
        build_readiness: 2,
        finops_priority: 3
      }

      // Test that all fields can be formatted
      Object.entries(contextProfile).forEach(([field, value]) => {
        const formatted = formatScaleValue(field, value)
        const labelOnly = formatScaleLabelOnly(field, value)
        const colorClass = getScaleColorClass(value)

        expect(formatted).toContain(`(${value}/4)`)
        expect(labelOnly).not.toContain('(')
        expect(colorClass).toContain('text-')
        expect(formatted.startsWith(labelOnly)).toBe(true)
      })
    })

    it('should maintain consistency between different formatting functions', () => {
      for (let value = 0; value <= 4; value++) {
        const withNumeric = formatScaleValue('regulatory_intensity', value, true)
        const withoutNumeric = formatScaleValue('regulatory_intensity', value, false)
        const labelOnly = formatScaleLabelOnly('regulatory_intensity', value)

        expect(withNumeric).toContain(withoutNumeric)
        expect(withoutNumeric).toBe(labelOnly)
      }
    })
  })
})