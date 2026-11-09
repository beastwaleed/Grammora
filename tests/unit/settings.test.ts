import { describe, it, expect } from 'vitest';
import {
  isDomainExcluded,
  getHostnameFromUrl,
  DEFAULT_SETTINGS,
} from '../../extension/lib/settings';

describe('Grammora Settings Unit Tests', () => {
  it('should have valid default settings', () => {
    expect(DEFAULT_SETTINGS.enabled).toBe(true);
    expect(DEFAULT_SETTINGS.autocompleteEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.rewriteEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.completionLength).toBe('short');
    expect(DEFAULT_SETTINGS.excludedDomains).toEqual([]);
    expect(DEFAULT_SETTINGS.hasConsented).toBe(false);
    expect(DEFAULT_SETTINGS.debounceMs).toBe(350);
  });

  describe('isDomainExcluded', () => {
    const excluded = ['bank.com', 'secure.work.org'];

    it('should return true for exact domain match', () => {
      expect(isDomainExcluded('bank.com', excluded)).toBe(true);
      expect(isDomainExcluded('secure.work.org', excluded)).toBe(true);
    });

    it('should return true for subdomains of excluded domains', () => {
      expect(isDomainExcluded('app.bank.com', excluded)).toBe(true);
      expect(isDomainExcluded('portal.secure.work.org', excluded)).toBe(true);
    });

    it('should return false for unlisted domains', () => {
      expect(isDomainExcluded('github.com', excluded)).toBe(false);
      expect(isDomainExcluded('notbank.com', excluded)).toBe(false);
      expect(isDomainExcluded('google.com', excluded)).toBe(false);
    });

    it('should be case-insensitive and handle whitespace', () => {
      expect(isDomainExcluded('BANK.COM', excluded)).toBe(true);
      expect(isDomainExcluded(' Bank.com ', excluded)).toBe(true);
    });
  });

  describe('getHostnameFromUrl', () => {
    it('should extract hostname from standard HTTP/HTTPS URLs', () => {
      expect(getHostnameFromUrl('https://github.com/trending')).toBe('github.com');
      expect(getHostnameFromUrl('http://localhost:3000/app')).toBe('localhost');
      expect(getHostnameFromUrl('https://mail.google.com/mail/u/0/')).toBe('mail.google.com');
    });

    it('should fallback gracefully for malformed URLs', () => {
      expect(getHostnameFromUrl('invalid-url-string')).toBe('invalid-url-string');
    });
  });
});

