// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getWebhookUrl', () => {
  let getWebhookUrl;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('import', { meta: { env: { DEV: true } } });
    const mockData = await import('./mockData');
    getWebhookUrl = mockData.getWebhookUrl;
  });

  it('should replace the base URL with the proxy path in development', () => {
    const originalUrl = 'https://example.com/webhook/test';
    const expectedUrl = '/api/n8n/webhook/test';
    expect(getWebhookUrl(originalUrl)).toBe(expectedUrl);
  });

  it('should handle URLs with different protocols in development', () => {
    const originalUrl = 'http://localhost:5678/webhook/local-test';
    const expectedUrl = '/api/n8n/webhook/local-test';
    expect(getWebhookUrl(originalUrl)).toBe(expectedUrl);
  });

  it('should return the original URL if it is invalid in development', () => {
    const originalUrl = 'invalid-url';
    expect(getWebhookUrl(originalUrl)).toBe(originalUrl);
  });
});