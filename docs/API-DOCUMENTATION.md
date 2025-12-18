# HotGigs Platform - API Documentation

This document provides comprehensive documentation for the HotGigs tRPC API endpoints, including authentication, request/response formats, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Router](#auth-router)
   - [Jobs Router](#jobs-router)
   - [Applications Router](#applications-router)
   - [Candidates Router](#candidates-router)
   - [Recruiters Router](#recruiters-router)
   - [Interviews Router](#interviews-router)
   - [Notifications Router](#notifications-router)
   - [AI Router](#ai-router)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)

---

## Overview

### Base URL

```
Production: https://your-domain.com/api/trpc
Development: http://localhost:3000/api/trpc
```

### Protocol

HotGigs uses tRPC (TypeScript Remote Procedure Call) for type-safe API communication. All endpoints are accessed via HTTP POST requests with JSON payloads.

### Request Format

```typescript
// Query (GET-like operations)
POST /api/trpc/router.procedure
Content-Type: application/json

{
  "input": { /* procedure input */ }
}

// Mutation (POST/PUT/DELETE-like operations)
POST /api/trpc/router.procedure
Content-Type: application/json

{
  "input": { /* procedure input */ }
}
```

### Response Format

```typescript
// Success Response
{
  "result": {
    "data": { /* response data */ }
  }
}

// Error Response
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "data": { /* additional error data */ }
  }
}
```

---

## Authentication

### Session-Based Authentication

HotGigs uses HTTP-only cookies for session management. Authentication is handled automatically after login.

### Login Flow

1. User navigates to login page
2. OAuth authentication with Manus or email/password
3. Server sets session cookie
4. Subsequent requests include cookie automatically

### Protected vs Public Procedures

| Type | Description | Cookie Required |
|------|-------------|-----------------|
| `publicProcedure` | Accessible without authentication | No |
| `protectedProcedure` | Requires authenticated user | Yes |

---

## API Endpoints

### Auth Router

#### Get Current User

Returns the currently authenticated user's information.

```typescript
// Endpoint
trpc.auth.me.useQuery()

// Response
{
  id: number,
  openId: string,
  name: string,
  email: string,
  role: "admin" | "user",
  emailVerified: boolean,
  createdAt: Date,
  lastSignedIn: Date
}
```

#### Logout

Logs out the current user and clears the session.

```typescript
// Endpoint
trpc.auth.logout.useMutation()

// Response
{ success: true }
```

---

### Jobs Router

#### List Jobs

Returns a paginated list of active job postings.

```typescript
// Endpoint
trpc.jobs.list.useQuery({
  page?: number,        // Default: 1
  limit?: number,       // Default: 10
  search?: string,      // Search in title, description
  location?: string,    // Filter by location
  type?: string,        // "full-time" | "part-time" | "contract" | "internship"
  experienceLevel?: string  // "entry" | "mid" | "senior" | "executive"
})

// Response
{
  jobs: Array<{
    id: number,
    title: string,
    company: string,
    location: string,
    type: string,
    salaryMin: number,
    salaryMax: number,
    description: string,
    requirements: string[],
    benefits: string[],
    status: "draft" | "active" | "paused" | "closed",
    createdAt: Date,
    applicationCount: number
  }>,
  total: number,
  page: number,
  totalPages: number
}
```

#### Get Job by ID

Returns detailed information about a specific job.

```typescript
// Endpoint
trpc.jobs.getById.useQuery({ id: number })

// Response
{
  id: number,
  title: string,
  company: string,
  location: string,
  type: string,
  experienceLevel: string,
  salaryMin: number,
  salaryMax: number,
  description: string,
  requirements: string[],
  benefits: string[],
  skills: string[],
  status: string,
  recruiter: {
    id: number,
    companyName: string,
    companyLogo: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Create Job (Protected - Recruiter)

Creates a new job posting.

```typescript
// Endpoint
trpc.jobs.create.useMutation({
  title: string,
  company: string,
  location: string,
  type: "full-time" | "part-time" | "contract" | "internship",
  experienceLevel: "entry" | "mid" | "senior" | "executive",
  salaryMin?: number,
  salaryMax?: number,
  description: string,
  requirements: string[],
  benefits?: string[],
  skills?: string[]
})

// Response
{
  id: number,
  title: string,
  status: "draft",
  createdAt: Date
}
```

#### Update Job (Protected - Recruiter)

Updates an existing job posting.

```typescript
// Endpoint
trpc.jobs.update.useMutation({
  id: number,
  title?: string,
  description?: string,
  requirements?: string[],
  status?: "draft" | "active" | "paused" | "closed",
  // ... other fields
})

// Response
{
  id: number,
  updatedAt: Date
}
```

#### Delete Job (Protected - Recruiter)

Deletes a job posting.

```typescript
// Endpoint
trpc.jobs.delete.useMutation({ id: number })

// Response
{ success: true }
```

---

### Applications Router

#### Submit Application (Protected - Candidate)

Submits a job application.

```typescript
// Endpoint
trpc.applications.submit.useMutation({
  jobId: number,
  coverLetter?: string,
  resumeUrl?: string,
  answers?: Array<{
    questionId: number,
    answer: string
  }>
})

// Response
{
  id: number,
  status: "submitted",
  createdAt: Date
}
```

#### Get Applications by Candidate (Protected)

Returns all applications for the current candidate.

```typescript
// Endpoint
trpc.applications.getByCandidate.useQuery()

// Response
Array<{
  id: number,
  job: {
    id: number,
    title: string,
    company: string,
    location: string
  },
  status: "submitted" | "reviewing" | "shortlisted" | "interviewing" | "offered" | "rejected" | "withdrawn",
  appliedAt: Date,
  updatedAt: Date
}>
```

#### Get Applications by Job (Protected - Recruiter)

Returns all applications for a specific job.

```typescript
// Endpoint
trpc.applications.getByJob.useQuery({ jobId: number })

// Response
Array<{
  id: number,
  candidate: {
    id: number,
    name: string,
    email: string,
    resumeUrl: string,
    skills: string[]
  },
  status: string,
  coverLetter: string,
  appliedAt: Date,
  aiScore?: number,
  aiAnalysis?: string
}>
```

#### Update Application Status (Protected - Recruiter)

Updates the status of an application.

```typescript
// Endpoint
trpc.applications.updateStatus.useMutation({
  id: number,
  status: "reviewing" | "shortlisted" | "interviewing" | "offered" | "rejected"
})

// Response
{
  id: number,
  status: string,
  updatedAt: Date
}
```

---

### Candidates Router

#### Get Candidate Profile (Protected)

Returns the current candidate's profile.

```typescript
// Endpoint
trpc.candidates.getProfile.useQuery()

// Response
{
  id: number,
  userId: number,
  headline: string,
  summary: string,
  location: string,
  phoneNumber: string,
  linkedinUrl: string,
  portfolioUrl: string,
  resumeUrl: string,
  skills: string[],
  experience: Array<{
    title: string,
    company: string,
    startDate: Date,
    endDate?: Date,
    description: string
  }>,
  education: Array<{
    degree: string,
    institution: string,
    graduationYear: number
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

#### Update Candidate Profile (Protected)

Updates the candidate's profile.

```typescript
// Endpoint
trpc.candidates.updateProfile.useMutation({
  headline?: string,
  summary?: string,
  location?: string,
  phoneNumber?: string,
  linkedinUrl?: string,
  portfolioUrl?: string,
  skills?: string[],
  experience?: Array<{...}>,
  education?: Array<{...}>
})

// Response
{
  id: number,
  updatedAt: Date
}
```

#### Upload Resume (Protected)

Uploads a resume file.

```typescript
// Endpoint
trpc.candidates.uploadResume.useMutation({
  fileUrl: string,
  fileName: string,
  fileType: string
})

// Response
{
  resumeUrl: string,
  parsedData?: {
    skills: string[],
    experience: Array<{...}>,
    education: Array<{...}>
  }
}
```

---

### Recruiters Router

#### Get Recruiter Profile (Protected)

Returns the current recruiter's profile.

```typescript
// Endpoint
trpc.recruiters.getProfile.useQuery()

// Response
{
  id: number,
  userId: number,
  companyName: string,
  companyLogo: string,
  companyDescription: string,
  companyWebsite: string,
  companySize: string,
  industry: string,
  location: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### Update Recruiter Profile (Protected)

Updates the recruiter's company profile.

```typescript
// Endpoint
trpc.recruiters.updateProfile.useMutation({
  companyName?: string,
  companyLogo?: string,
  companyDescription?: string,
  companyWebsite?: string,
  companySize?: string,
  industry?: string,
  location?: string
})

// Response
{
  id: number,
  updatedAt: Date
}
```

#### Get Dashboard Stats (Protected)

Returns dashboard statistics for the recruiter.

```typescript
// Endpoint
trpc.recruiters.getDashboardStats.useQuery()

// Response
{
  activeJobs: number,
  totalApplications: number,
  pendingReviews: number,
  scheduledInterviews: number,
  recentApplications: Array<{...}>,
  applicationsByStatus: {
    submitted: number,
    reviewing: number,
    shortlisted: number,
    interviewing: number,
    offered: number,
    rejected: number
  }
}
```

---

### Interviews Router

#### Schedule Interview (Protected - Recruiter)

Schedules an interview with a candidate.

```typescript
// Endpoint
trpc.interviews.create.useMutation({
  applicationId: number,
  candidateId: number,
  jobId: number,
  scheduledAt: string,  // ISO date string
  duration: number,     // minutes
  type: "phone" | "video" | "in-person" | "ai-interview",
  meetingLink?: string,
  location?: string,
  notes?: string
})

// Response
{
  id: number,
  scheduledAt: Date,
  meetingLink: string,
  createdAt: Date
}
```

#### Get Interviews by Candidate (Protected)

Returns all interviews for the current candidate.

```typescript
// Endpoint
trpc.interviews.getByCandidate.useQuery()

// Response
Array<{
  id: number,
  job: {
    id: number,
    title: string,
    company: string
  },
  scheduledAt: Date,
  duration: number,
  type: string,
  meetingLink: string,
  status: "scheduled" | "completed" | "cancelled" | "no-show",
  feedback?: string
}>
```

#### Request Reschedule (Protected - Candidate)

Requests to reschedule an interview.

```typescript
// Endpoint
trpc.interviews.requestRescheduleByCandidate.useMutation({
  interviewId: number,
  reason: string,
  preferredDates: string[]  // ISO date strings
})

// Response
{
  success: true,
  message: string
}
```

#### Update Interview (Protected - Recruiter)

Updates interview details or status.

```typescript
// Endpoint
trpc.interviews.update.useMutation({
  id: number,
  scheduledAt?: string,
  status?: "scheduled" | "completed" | "cancelled",
  feedback?: string,
  rating?: number
})

// Response
{
  id: number,
  updatedAt: Date
}
```

---

### Notifications Router

#### Get Notifications (Protected)

Returns notifications for the current user.

```typescript
// Endpoint
trpc.notifications.getAll.useQuery({
  page?: number,
  limit?: number,
  unreadOnly?: boolean
})

// Response
{
  notifications: Array<{
    id: number,
    type: string,
    title: string,
    message: string,
    read: boolean,
    createdAt: Date,
    data?: object
  }>,
  total: number,
  unreadCount: number
}
```

#### Mark as Read (Protected)

Marks notifications as read.

```typescript
// Endpoint
trpc.notifications.markAsRead.useMutation({
  ids: number[]  // or "all" to mark all as read
})

// Response
{ success: true }
```

---

### AI Router

#### Analyze Resume (Protected)

Analyzes a resume using AI.

```typescript
// Endpoint
trpc.ai.analyzeResume.useMutation({
  resumeUrl: string,
  jobId?: number  // Optional: for job-specific analysis
})

// Response
{
  skills: string[],
  experience: Array<{
    title: string,
    company: string,
    duration: string,
    highlights: string[]
  }>,
  education: Array<{...}>,
  summary: string,
  matchScore?: number,  // If jobId provided
  recommendations?: string[]
}
```

#### Generate Interview Questions (Protected - Recruiter)

Generates AI-powered interview questions.

```typescript
// Endpoint
trpc.ai.generateInterviewQuestions.useMutation({
  jobId: number,
  candidateId: number,
  questionCount?: number,
  focusAreas?: string[]
})

// Response
{
  questions: Array<{
    question: string,
    category: string,
    difficulty: "easy" | "medium" | "hard",
    expectedAnswer?: string
  }>
}
```

#### Generate Interview Preparation Tips (Protected - Candidate)

Generates AI-powered interview preparation tips.

```typescript
// Endpoint
trpc.ai.generateInterviewPreparationTips.useMutation({
  interviewId: number
})

// Response
{
  tips: Array<{
    category: string,
    tip: string,
    importance: "high" | "medium" | "low"
  }>,
  suggestedQuestions: string[],
  companyInsights: string
}
```

#### Score Application (Protected - Recruiter)

AI-scores an application against job requirements.

```typescript
// Endpoint
trpc.ai.scoreApplication.useMutation({
  applicationId: number
})

// Response
{
  overallScore: number,  // 0-100
  breakdown: {
    skillsMatch: number,
    experienceMatch: number,
    educationMatch: number,
    cultureFit: number
  },
  strengths: string[],
  gaps: string[],
  recommendation: "strong" | "good" | "moderate" | "weak"
}
```

---

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `BAD_REQUEST` | Invalid input data |
| `INTERNAL_SERVER_ERROR` | Server error |
| `CONFLICT` | Resource conflict (e.g., duplicate) |
| `TOO_MANY_REQUESTS` | Rate limit exceeded |

### Error Response Format

```typescript
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "data": {
      "path": "router.procedure",
      "httpStatus": 400
    }
  }
}
```

### Client-Side Error Handling

```typescript
const mutation = trpc.jobs.create.useMutation({
  onError: (error) => {
    if (error.data?.code === 'UNAUTHORIZED') {
      // Redirect to login
    } else if (error.data?.code === 'BAD_REQUEST') {
      // Show validation errors
    } else {
      // Show generic error
    }
  }
});
```

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public queries | 100 requests | 1 minute |
| Protected queries | 200 requests | 1 minute |
| Mutations | 50 requests | 1 minute |
| AI endpoints | 20 requests | 1 minute |
| File uploads | 10 requests | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

```typescript
if (error.data?.code === 'TOO_MANY_REQUESTS') {
  const retryAfter = error.data?.retryAfter || 60;
  // Wait and retry after retryAfter seconds
}
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Manus AI
