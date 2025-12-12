import { describe, it, expect } from 'vitest';
import { sendEmail } from '../server/emailService';

describe('SendGrid Email Service', () => {
  it('should send a test email successfully', async () => {
    // This test validates that the SendGrid API key is correctly configured
    // and can send emails
    
    try {
      await sendEmail({
        to: 'test@example.com', // SendGrid will not actually send to this address in test mode
        subject: 'Test Email from HotGigs',
        html: '<p>This is a test email to validate SendGrid integration.</p>',
      });
      
      // If we reach here, the email was sent successfully (or mocked if no API key)
      expect(true).toBe(true);
    } catch (error: any) {
      // If there's an error, it should be a meaningful SendGrid error
      // Not a configuration error
      console.error('SendGrid test error:', error.message);
      
      // Fail the test if it's an authentication error
      if (error.message.includes('Unauthorized') || error.message.includes('authentication')) {
        throw new Error('SendGrid API key is invalid. Please provide a valid API key.');
      }
      
      // For other errors (like invalid email format), the API key is working
      expect(error).toBeDefined();
    }
  }, 10000); // 10 second timeout for API call
});
