import { describe, it, expect } from 'vitest';
import {
  validatePhoneNumber,
  validateEmail,
  validateUrl,
  validateJobForm,
  validateRecruiterProfile,
  validateCandidateProfile,
  validateApplicationForm,
  formatPhoneNumber,
} from '../client/src/lib/validation';

describe('validatePhoneNumber', () => {
  it('should return null for valid phone numbers', () => {
    expect(validatePhoneNumber('1234567890')).toBeNull();
    expect(validatePhoneNumber('+11234567890')).toBeNull();
    expect(validatePhoneNumber('(123) 456-7890')).toBeNull();
    expect(validatePhoneNumber('+1 (123) 456-7890')).toBeNull();
  });

  it('should return error for invalid phone numbers', () => {
    expect(validatePhoneNumber('123')).toBe('Phone number must be between 10 and 15 digits');
    expect(validatePhoneNumber('12345678901234567890')).toBe('Phone number must be between 10 and 15 digits');
  });

  it('should return null for empty phone number', () => {
    expect(validatePhoneNumber('')).toBeNull();
  });
});

describe('validateEmail', () => {
  it('should return null for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('user.name+tag@example.co.uk')).toBeNull();
    expect(validateEmail('test123@test-domain.com')).toBeNull();
  });

  it('should return error for invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe('Please enter a valid email address');
    expect(validateEmail('test@')).toBe('Please enter a valid email address');
    expect(validateEmail('@example.com')).toBe('Please enter a valid email address');
    expect(validateEmail('test@example')).toBe('Please enter a valid email address');
  });

  it('should return null for empty email', () => {
    expect(validateEmail('')).toBeNull();
  });
});

describe('validateUrl', () => {
  it('should return null for valid URLs', () => {
    expect(validateUrl('https://example.com')).toBeNull();
    expect(validateUrl('http://example.com')).toBeNull();
    expect(validateUrl('https://www.example.com/path?query=value')).toBeNull();
  });

  it('should return error for invalid URLs', () => {
    expect(validateUrl('invalid')).toBe('Please enter a valid URL (e.g., https://example.com)');
    expect(validateUrl('example.com')).toBe('Please enter a valid URL (e.g., https://example.com)');
    expect(validateUrl('ftp://example.com')).toBeNull(); // FTP is valid URL
  });

  it('should return null for empty URL', () => {
    expect(validateUrl('')).toBeNull();
  });
});

describe('validateJobForm', () => {
  it('should return no errors for valid job form', () => {
    const errors = validateJobForm({
      title: 'Software Engineer',
      description: 'This is a detailed job description that is long enough to pass validation requirements.',
      employmentType: 'full-time',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return error for missing title', () => {
    const errors = validateJobForm({
      title: '',
      description: 'This is a detailed job description that is long enough to pass validation requirements.',
      employmentType: 'full-time',
    });
    expect(errors.title).toBe('Job title is required');
  });

  it('should return error for short title', () => {
    const errors = validateJobForm({
      title: 'SE',
      description: 'This is a detailed job description that is long enough to pass validation requirements.',
      employmentType: 'full-time',
    });
    expect(errors.title).toBe('Job title must be at least 3 characters');
  });

  it('should return error for missing description', () => {
    const errors = validateJobForm({
      title: 'Software Engineer',
      description: '',
      employmentType: 'full-time',
    });
    expect(errors.description).toBe('Job description is required');
  });

  it('should return error for short description', () => {
    const errors = validateJobForm({
      title: 'Software Engineer',
      description: 'Too short',
      employmentType: 'full-time',
    });
    expect(errors.description).toBe('Job description must be at least 50 characters');
  });

  it('should return error for invalid salary range', () => {
    const errors = validateJobForm({
      title: 'Software Engineer',
      description: 'This is a detailed job description that is long enough to pass validation requirements.',
      employmentType: 'full-time',
      salaryMin: '100000',
      salaryMax: '80000',
    });
    expect(errors.salaryMin).toBe('Minimum salary cannot be greater than maximum salary');
  });

  it('should return error for negative salary', () => {
    const errors = validateJobForm({
      title: 'Software Engineer',
      description: 'This is a detailed job description that is long enough to pass validation requirements.',
      employmentType: 'full-time',
      salaryMin: '-1000',
    });
    expect(errors.salaryMin).toBe('Minimum salary must be a positive number');
  });
});

describe('validateRecruiterProfile', () => {
  it('should return no errors for valid recruiter profile', () => {
    const errors = validateRecruiterProfile({
      companyName: 'Acme Corp',
      phoneNumber: '1234567890',
      companyWebsite: 'https://acme.com',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return error for missing company name', () => {
    const errors = validateRecruiterProfile({
      companyName: '',
    });
    expect(errors.companyName).toBe('Company name is required');
  });

  it('should return error for short company name', () => {
    const errors = validateRecruiterProfile({
      companyName: 'A',
    });
    expect(errors.companyName).toBe('Company name must be at least 2 characters');
  });

  it('should return error for invalid phone number', () => {
    const errors = validateRecruiterProfile({
      companyName: 'Acme Corp',
      phoneNumber: '123',
    });
    expect(errors.phoneNumber).toBe('Phone number must be between 10 and 15 digits');
  });

  it('should return error for invalid website URL', () => {
    const errors = validateRecruiterProfile({
      companyName: 'Acme Corp',
      companyWebsite: 'invalid-url',
    });
    expect(errors.companyWebsite).toBe('Please enter a valid URL (e.g., https://example.com)');
  });
});

describe('validateCandidateProfile', () => {
  it('should return no errors for valid candidate profile', () => {
    const errors = validateCandidateProfile({
      fullName: 'John Doe',
      phoneNumber: '1234567890',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return error for missing full name', () => {
    const errors = validateCandidateProfile({
      fullName: '',
    });
    expect(errors.fullName).toBe('Full name is required');
  });

  it('should return error for short full name', () => {
    const errors = validateCandidateProfile({
      fullName: 'J',
    });
    expect(errors.fullName).toBe('Full name must be at least 2 characters');
  });

  it('should return error for invalid phone number', () => {
    const errors = validateCandidateProfile({
      fullName: 'John Doe',
      phoneNumber: '123',
    });
    expect(errors.phoneNumber).toBe('Phone number must be between 10 and 15 digits');
  });

  it('should return error for bio too long', () => {
    const errors = validateCandidateProfile({
      fullName: 'John Doe',
      bio: 'a'.repeat(1001),
    });
    expect(errors.bio).toBe('Bio must be less than 1000 characters');
  });
});

describe('validateApplicationForm', () => {
  it('should return no errors for valid application form', () => {
    const errors = validateApplicationForm({
      email: 'test@example.com',
      phoneNumber: '1234567890',
      fullName: 'John Doe',
      coverLetter: 'I am interested in this position.',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should return error for invalid email', () => {
    const errors = validateApplicationForm({
      email: 'invalid-email',
    });
    expect(errors.email).toBe('Please enter a valid email address');
  });

  it('should return error for invalid phone number', () => {
    const errors = validateApplicationForm({
      phoneNumber: '123',
    });
    expect(errors.phoneNumber).toBe('Phone number must be between 10 and 15 digits');
  });

  it('should return error for short full name', () => {
    const errors = validateApplicationForm({
      fullName: 'J',
    });
    expect(errors.fullName).toBe('Full name must be at least 2 characters');
  });

  it('should return error for cover letter too long', () => {
    const errors = validateApplicationForm({
      coverLetter: 'a'.repeat(2001),
    });
    expect(errors.coverLetter).toBe('Cover letter must be less than 2000 characters');
  });
});

describe('formatPhoneNumber', () => {
  it('should format 10-digit US phone number', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
  });

  it('should format 11-digit US phone number with country code', () => {
    expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890');
  });

  it('should format international phone numbers with spaces', () => {
    expect(formatPhoneNumber('123456789012')).toBe('123 456 789 012');
  });

  it('should handle phone numbers with non-digit characters', () => {
    expect(formatPhoneNumber('+1 (123) 456-7890')).toBe('+1 (123) 456-7890');
  });
});
