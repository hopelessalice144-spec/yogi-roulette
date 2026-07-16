import { describe, expect, it } from 'vitest';
import { assertPlainText, sanitizeText } from './domSanitize.js';

describe('domSanitize', () => {
  describe('sanitizeText', () => {
    it('returns empty string for null and undefined', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });

    it('passes through safe plain text', () => {
      expect(sanitizeText('Yogi Roulette')).toBe('Yogi Roulette');
      expect(sanitizeText('balance: 1000')).toBe('balance: 1000');
    });

    it('coerces non-string inputs', () => {
      expect(sanitizeText(42)).toBe('42');
      expect(sanitizeText(0)).toBe('0');
    });

    it('escapes HTML-sensitive characters', () => {
      expect(sanitizeText('&')).toBe('&amp;');
      expect(sanitizeText('<')).toBe('&lt;');
      expect(sanitizeText('>')).toBe('&gt;');
      expect(sanitizeText('"')).toBe('&quot;');
      expect(sanitizeText("'")).toBe('&#39;');
      expect(sanitizeText('`')).toBe('&#96;');
      expect(sanitizeText('/')).toBe('&#47;');
      expect(sanitizeText('=')).toBe('&#61;');
    });

    it('escapes script injection payloads', () => {
      const payload = '<script>alert("xss")</script>';
      expect(sanitizeText(payload)).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#47;script&gt;',
      );
      expect(assertPlainText(sanitizeText(payload))).toBe(true);
    });
  });

  describe('assertPlainText', () => {
    it('accepts strings without angle brackets', () => {
      expect(assertPlainText('hello')).toBe(true);
      expect(assertPlainText('  spaced  ')).toBe(true);
      expect(assertPlainText('')).toBe(true);
    });

    it('rejects strings containing angle brackets', () => {
      expect(assertPlainText('<img src=x>')).toBe(false);
      expect(assertPlainText('safe>unsafe')).toBe(false);
      expect(assertPlainText('before<after')).toBe(false);
    });

    it('treats nullish input as empty plain text', () => {
      expect(assertPlainText(null)).toBe(true);
      expect(assertPlainText(undefined)).toBe(true);
    });
  });
});
