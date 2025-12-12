import { describe, it, expect } from 'vitest';
import { Resend } from 'resend';
import { ENV } from './_core/env';

describe('Resend API Integration', () => {
  it('should have a valid Resend API key configured', () => {
    expect(ENV.resendApiKey).toBeTruthy();
    expect(ENV.resendApiKey.length).toBeGreaterThan(0);
  });

  it('should successfully initialize Resend client', async () => {
    const resend = new Resend(ENV.resendApiKey);
    expect(resend).toBeDefined();
  });

  it('should send a test email via Resend API', async () => {
    const resend = new Resend(ENV.resendApiKey);
    
    try {
      const result = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: ['delivered@resend.dev'],
        subject: 'HotGigs - Resend API Test',
        html: '<strong>This is a test email from HotGigs platform to validate Resend integration.</strong>',
      });

      console.log('Resend test email sent successfully:', result.data?.id);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeTruthy();
    } catch (error: any) {
      console.error('Resend API error:', error.message);
      throw new Error(`Resend API test failed: ${error.message}`);
    }
  }, 30000); // 30 second timeout for API call
});
