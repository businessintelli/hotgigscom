# Database Validation Audit

## Executive Summary

This document audits database schema constraints and ensures frontend forms enforce the same validation rules.

## Key Findings

### Candidates Table
**Currently ALL fields are optional** (no `.notNull()` except userId and auto-generated fields)

Critical fields that should be required:
- `phoneNumber` - Currently optional, should be required for contact
- `location` - Currently optional, should be required for job matching
- `title` - Currently optional, should be required for profile completeness

### Jobs Table
Required fields (have `.notNull()`):
- `title` ✓
- `description` ✓
- `postedBy` ✓

Optional fields that might need validation:
- `location` - Optional (allows remote jobs)
- `salaryMin`, `salaryMax` - Optional
- `experienceLevel` - Optional

### Applications Table
Required fields:
- `jobId` ✓
- `candidateId` ✓

All other fields are optional (resumeUrl, coverLetter, etc.)

### Guest Applications Table
Required fields:
- `jobId` ✓
- `email` ✓
- `name` ✓
- `resumeUrl` ✓
- `resumeFilename` ✓

## Recommendations

### 1. Make Critical Candidate Fields Required

**Database Changes Needed:**
```typescript
// In drizzle/schema.ts - candidates table
phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
location: varchar("location", { length: 255 }).notNull(),
```

**Frontend Forms to Update:**
- `/recruiter/apply-on-behalf/:jobId` - ApplyOnBehalf.tsx
- Candidate profile editing forms
- Candidate onboarding flow

### 2. Frontend Validation Rules

**Apply on Behalf Form:**
- Name: Required
- Email: Required + email format validation
- Phone: Required + phone format validation
- Location: Required
- Resume: Required file upload

**Candidate Profile Form:**
- Title/Position: Required
- Phone: Required
- Location: Required
- Skills: At least 1 skill required
- Experience: At least 1 entry recommended

**Job Creation Form:**
- Title: Required (already enforced)
- Description: Required (already enforced)
- Location OR Remote flag: At least one required
- Salary range: Both min and max if provided

### 3. Backend tRPC Schema Updates

All `submitOnBehalf`, `updateProfile`, `createCandidate` procedures need:
```typescript
z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  location: z.string().min(1, "Location is required"),
  // ... other fields
})
```

## Implementation Priority

### High Priority (Immediate)
1. ✅ Fix Apply on Behalf form - location field
2. Add frontend validation for phone and location in Apply on Behalf
3. Update tRPC schemas to match

### Medium Priority
4. Update candidate profile editing forms
5. Add database migrations to make fields `.notNull()`
6. Update onboarding flows

### Low Priority
7. Add comprehensive form validation library (e.g., react-hook-form with zod)
8. Create reusable validation schemas shared between frontend and backend
