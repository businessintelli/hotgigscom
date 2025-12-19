/**
 * Form validation utilities
 */

export interface JobFormData {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  location?: string;
  employmentType: string;
  salaryMin?: string;
  salaryMax?: string;
  customerId?: string;
  status?: string;
  isPublic?: boolean;
}

export interface RecruiterProfileData {
  companyName: string;
  companyWebsite?: string;
  companyDescription?: string;
  industry?: string;
  companySize?: string;
  phoneNumber?: string;
}

export interface CandidateProfileData {
  fullName: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  skills?: string;
  experience?: string;
  education?: string;
}

export interface ApplicationFormData {
  coverLetter?: string;
  phoneNumber?: string;
  email?: string;
  fullName?: string;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return 'Phone number must be between 10 and 15 digits';
  }
  
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL (e.g., https://example.com)';
  }
}

/**
 * Validate job form
 */
export function validateJobForm(data: JobFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Job title is required';
  } else if (data.title.length < 3) {
    errors.title = 'Job title must be at least 3 characters';
  } else if (data.title.length > 200) {
    errors.title = 'Job title must be less than 200 characters';
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'Job description is required';
  } else if (data.description.length < 50) {
    errors.description = 'Job description must be at least 50 characters';
  }
  
  // Salary validation
  if (data.salaryMin) {
    const min = parseFloat(data.salaryMin);
    if (isNaN(min) || min < 0) {
      errors.salaryMin = 'Minimum salary must be a positive number';
    }
  }
  
  if (data.salaryMax) {
    const max = parseFloat(data.salaryMax);
    if (isNaN(max) || max < 0) {
      errors.salaryMax = 'Maximum salary must be a positive number';
    }
  }
  
  if (data.salaryMin && data.salaryMax) {
    const min = parseFloat(data.salaryMin);
    const max = parseFloat(data.salaryMax);
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.salaryMin = 'Minimum salary cannot be greater than maximum salary';
    }
  }
  
  return errors;
}

/**
 * Validate recruiter profile form
 */
export function validateRecruiterProfile(data: RecruiterProfileData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!data.companyName || data.companyName.trim().length === 0) {
    errors.companyName = 'Company name is required';
  } else if (data.companyName.length < 2) {
    errors.companyName = 'Company name must be at least 2 characters';
  }
  
  // Optional field validation
  if (data.companyWebsite) {
    const urlError = validateUrl(data.companyWebsite);
    if (urlError) {
      errors.companyWebsite = urlError;
    }
  }
  
  if (data.phoneNumber) {
    const phoneError = validatePhoneNumber(data.phoneNumber);
    if (phoneError) {
      errors.phoneNumber = phoneError;
    }
  }
  
  if (data.companyDescription && data.companyDescription.length > 2000) {
    errors.companyDescription = 'Company description must be less than 2000 characters';
  }
  
  return errors;
}

/**
 * Validate candidate profile form
 */
export function validateCandidateProfile(data: CandidateProfileData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.fullName = 'Full name is required';
  } else if (data.fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  
  // Optional field validation
  if (data.phoneNumber) {
    const phoneError = validatePhoneNumber(data.phoneNumber);
    if (phoneError) {
      errors.phoneNumber = phoneError;
    }
  }
  
  if (data.bio && data.bio.length > 1000) {
    errors.bio = 'Bio must be less than 1000 characters';
  }
  
  return errors;
}

/**
 * Validate guest application form
 */
export function validateApplicationForm(data: ApplicationFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Email validation
  if (data.email) {
    const emailError = validateEmail(data.email);
    if (emailError) {
      errors.email = emailError;
    }
  }
  
  // Phone validation
  if (data.phoneNumber) {
    const phoneError = validatePhoneNumber(data.phoneNumber);
    if (phoneError) {
      errors.phoneNumber = phoneError;
    }
  }
  
  // Name validation
  if (data.fullName && data.fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  
  // Cover letter validation
  if (data.coverLetter && data.coverLetter.length > 2000) {
    errors.coverLetter = 'Cover letter must be less than 2000 characters';
  }
  
  return errors;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    // US format: (123) 456-7890
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US format with country code: +1 (123) 456-7890
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // International format: just add spaces
  return cleaned.replace(/(\d{3})(?=\d)/g, '$1 ');
}
