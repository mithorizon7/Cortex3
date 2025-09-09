import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock crypto.randomUUID for Node.js environment
if (!globalThis.crypto) {
  const crypto = require('crypto')
  globalThis.crypto = {
    randomUUID: () => crypto.randomUUID(),
    subtle: {} as SubtleCrypto,
    getRandomValues: (array: Uint8Array) => crypto.getRandomValues(array),
  }
}

// Mock fetch for browser environment
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn()
}

// Mock navigator for offline/online testing
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true
})

// Setup console spy to avoid test noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Suppress logs in tests unless debugging
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as Console