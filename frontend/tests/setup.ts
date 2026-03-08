/**
 * Test setup file for Vitest
 * This file runs before all tests to set up the testing environment
 */
import '@testing-library/jest-dom';

// Mock btoa (base64 encoding) if not available in jsdom
if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}
