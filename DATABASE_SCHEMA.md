# HotGigs Database Schema Documentation

## Overview
The HotGigs platform uses a comprehensive MySQL database with **95 tables** organized into functional domains. No tables have been deleted from the initial schema - the platform has grown from 1 table to 95 tables.

## Table Categories & Dependencies

### 1. Core Identity & Multi-tenancy (5 tables)
- **companies** - Root entity for multi-tenant architecture
- **users** - Authentication and authorization (references: companies)
- **recruiters** - Recruiter profiles (references: users)
- **candidates** - Candidate profiles (references: users, recruiters)
- **associates** - Associate/contractor profiles (references: users, recruiters)

**Dependencies:**
```
companies
  └─> users (companyId)
       ├─> recruiters (userId)
       ├─> candidates (userId, addedBy->recruiters.id)
       └─> associates (userId, recruiterId)
```

### 2. Resume & Profile Management (3 tables)
- **resumeProfiles** - Multiple resume versions per candidate (max 5)
- **videoIntroductions** - Self-introduction videos (max 15 min)
- **candidateProfileShares** - Shareable profile links

**Dependencies:**
```
candidates
  ├─> resumeProfiles (candidateId)
  ├─> videoIntroductions (candidateId)
  └─> candidateProfileShares (candidateId, sharedBy->users.id)
```

### 3. Customer/Client Management (2 tables)
- **customers** - Client companies
- **customerContacts** - Contact persons at client companies

**Dependencies:**
```
customers (createdBy->users.id)
  └─> customerContacts (customerId)
```

### 4. Job Management (9 tables)
- **jobs** - Job postings
- **jobTemplates** - Reusable job templates
- **templateShares** - Shared job templates
- **jobDrafts** - Auto-saved draft jobs
- **bulkUploadJobs** - Bulk job upload tracking
- **jobSkillRequirements** - Required skills per job
- **jobViewAnalytics** - Job view metrics
- **jobViewSessions** - Individual view sessions
- **jobApplicationSources** - Application source tracking

**Dependencies:**
```
jobs (postedBy->users.id, customerId->customers.id)
  ├─> jobSkillRequirements (jobId)
  ├─> jobViewAnalytics (jobId)
  ├─> jobViewSessions (jobId, userId)
  └─> jobApplicationSources (jobId)

jobTemplates (createdBy->users.id)
  └─> templateShares (templateId, sharedBy->users.id)

jobDrafts (userId, customerId->customers.id)
bulkUploadJobs (uploadedBy->users.id)
```

### 5. Application & Interview Process (11 tables)
- **applications** - Job applications
- **applicationHistory** - Application status changes
- **applicationFeedback** - Feedback on applications
- **guestApplications** - Applications from non-registered users
- **interviews** - Scheduled interviews
- **interviewQuestions** - Interview question bank
- **interviewResponses** - Candidate responses
- **interviewFeedback** - Overall interview feedback
- **interviewPanelists** - Panel members
- **panelistFeedback** - Individual panelist feedback
- **panelActionTokens** - Secure tokens for panel actions

**Dependencies:**
```
applications (jobId->jobs.id, candidateId->candidates.id, recruiterId->recruiters.id)
  ├─> applicationHistory (applicationId)
  ├─> applicationFeedback (applicationId, providedBy->users.id)
  └─> interviews (applicationId)
       ├─> interviewResponses (interviewId, questionId->interviewQuestions.id)
       ├─> interviewFeedback (interviewId, providedBy->users.id)
       └─> interviewPanelists (interviewId, userId)
            └─> panelistFeedback (panelistId, interviewId)

guestApplications (jobId->jobs.id)
panelActionTokens (panelistId->interviewPanelists.id)
rescheduleRequests (interviewId, requestedBy->users.id)
```

### 6. Assessments & Challenges (8 tables)
- **codingChallenges** - Coding challenge definitions
- **codingSubmissions** - Candidate submissions
- **skillAssessments** - Assessment definitions
- **assessmentQuestions** - Question bank
- **assessmentAttempts** - Candidate attempts
- **assessmentAnswers** - Individual answers
- **candidateSkillRatings** - Skill proficiency ratings
- **jobViews** - Job view tracking

**Dependencies:**
```
codingChallenges (createdBy->users.id)
  └─> codingSubmissions (challengeId, candidateId->candidates.id)

skillAssessments (createdBy->users.id)
  ├─> assessmentQuestions (assessmentId)
  └─> assessmentAttempts (assessmentId, candidateId->candidates.id)
       └─> assessmentAnswers (attemptId, questionId->assessmentQuestions.id)

candidateSkillRatings (candidateId->candidates.id, ratedBy->users.id)
jobViews (jobId->jobs.id, candidateId->candidates.id)
```

### 7. Candidate Organization (4 tables)
- **candidateTags** - Tag definitions
- **candidateTagAssignments** - Tag assignments
- **savedSearches** - Saved search criteria
- **savedJobs** - Bookmarked jobs
- **recentlyViewedJobs** - Recently viewed jobs

**Dependencies:**
```
candidateTags (createdBy->users.id)
  └─> candidateTagAssignments (tagId, candidateId->candidates.id, assignedBy->users.id)

savedSearches (userId)
savedJobs (userId, jobId->jobs.id)
recentlyViewedJobs (userId, jobId->jobs.id)
```

### 8. Email & Communication (10 tables)
- **emailTemplates** - Email template library
- **emailCampaigns** - Campaign definitions
- **campaignRecipients** - Campaign recipients
- **followUpSequences** - Automated follow-up sequences
- **sequenceSteps** - Steps in sequences
- **sequenceEnrollments** - Candidate enrollments
- **emailUnsubscribes** - Unsubscribe tracking
- **emailDeliveryEvents** - Delivery status tracking
- **emailWebhookLogs** - Webhook event logs
- **inmailTemplates** - LinkedIn InMail templates

**Dependencies:**
```
emailTemplates (createdBy->users.id)
  └─> emailCampaigns (templateId, createdBy->users.id)
       └─> campaignRecipients (campaignId, candidateId->candidates.id)

followUpSequences (createdBy->users.id)
  ├─> sequenceSteps (sequenceId)
  └─> sequenceEnrollments (sequenceId, candidateId->candidates.id)

emailUnsubscribes (userId, candidateId->candidates.id)
emailDeliveryEvents (recipientId->campaignRecipients.id)
emailWebhookLogs (eventId->emailDeliveryEvents.id)
inmailTemplates (createdBy->users.id)
```

### 9. Notifications (5 tables)
- **notifications** - User notifications
- **notificationDeliveryLogs** - Delivery tracking
- **recruiterNotificationPreferences** - Recruiter preferences
- **aiNotificationPreferences** - AI notification settings
- **aiNotificationQueue** - Queued AI notifications

**Dependencies:**
```
notifications (userId, triggeredBy->users.id)
  └─> notificationDeliveryLogs (notificationId)

recruiterNotificationPreferences (recruiterId->recruiters.id)
aiNotificationPreferences (userId)
aiNotificationQueue (userId)
```

### 10. LinkedIn Integration (5 tables)
- **linkedinProfiles** - Cached LinkedIn profiles
- **linkedinInmails** - InMail tracking
- **linkedinCreditUsage** - Credit consumption
- **sourcingCampaigns** - Sourcing campaign tracking
- **sourcedCandidates** - Candidates from campaigns

**Dependencies:**
```
linkedinProfiles (candidateId->candidates.id)
linkedinInmails (profileId->linkedinProfiles.id, sentBy->users.id)
linkedinCreditUsage (userId, inmailId->linkedinInmails.id)

sourcingCampaigns (createdBy->users.id)
  └─> sourcedCandidates (campaignId, candidateId->candidates.id)

candidateInteractions (candidateId->candidates.id, userId)
```

### 11. Calendar & Scheduling (3 tables)
- **calendarIntegrations** - Calendar service connections
- **calendarEvents** - Synced calendar events
- **schedulingLinks** - Shareable scheduling links

**Dependencies:**
```
calendarIntegrations (userId)
  └─> calendarEvents (integrationId, interviewId->interviews.id)

schedulingLinks (userId, jobId->jobs.id)
```

### 12. Onboarding (6 tables)
- **onboardingProcesses** - Onboarding workflow definitions
- **onboardingTasks** - Task definitions
- **taskAssignments** - Assigned tasks
- **taskReminders** - Reminder schedule
- **taskTemplates** - Reusable task templates

**Dependencies:**
```
onboardingProcesses (associateId->associates.id, createdBy->users.id)
  └─> taskAssignments (processId, taskId->onboardingTasks.id, assignedTo->users.id)
       └─> taskReminders (taskAssignmentId)

taskTemplates (createdBy->users.id)
onboardingTasks (createdBy->users.id)
```

### 13. Analytics & AI (8 tables)
- **biasDetectionLogs** - Bias detection events
- **diversityMetrics** - Diversity tracking
- **matchOutcomes** - Matching algorithm results
- **algorithmPerformance** - Algorithm metrics
- **candidateSuccessPredictions** - AI success predictions
- **profileCompletionAnalytics** - Profile completion tracking
- **userActivityLogs** - User activity tracking
- **systemHealthMetrics** - System health monitoring

**Dependencies:**
```
biasDetectionLogs (userId, candidateId->candidates.id, jobId->jobs.id)
diversityMetrics (companyId->companies.id)
matchOutcomes (candidateId->candidates.id, jobId->jobs.id)
algorithmPerformance (no foreign keys - aggregate metrics)
candidateSuccessPredictions (candidateId->candidates.id)
profileCompletionAnalytics (userId)
userActivityLogs (userId)
systemHealthMetrics (no foreign keys - system metrics)
```

### 14. Gamification (4 tables)
- **profileBadges** - Badge definitions
- **userBadges** - Earned badges
- **userPoints** - Point tracking
- **profileReminders** - Profile completion reminders

**Dependencies:**
```
profileBadges (no foreign keys - badge definitions)
  └─> userBadges (userId, badgeId->profileBadges.id)

userPoints (userId)
profileReminders (userId)
```

### 15. Reporting & Configuration (9 tables)
- **customReports** - Custom report definitions
- **reportSchedules** - Report scheduling
- **reportExecutions** - Execution history
- **systemSettings** - Global settings
- **companySettings** - Company-specific settings
- **integrationSettings** - Third-party integrations
- **environmentVariables** - Environment configuration
- **applicationLogs** - Application logs
- **teamMembers** - Team member management

**Dependencies:**
```
customReports (createdBy->users.id, companyId->companies.id)
  ├─> reportSchedules (reportId)
  └─> reportExecutions (reportId, scheduleId->reportSchedules.id)

systemSettings (no foreign keys - global config)
companySettings (companyId->companies.id)
integrationSettings (companyId->companies.id)
environmentVariables (no foreign keys - env config)
applicationLogs (userId)
teamMembers (companyId->companies.id, userId)
```

### 16. Security (1 table)
- **fraudDetectionEvents** - Fraud detection tracking

**Dependencies:**
```
fraudDetectionEvents (userId, candidateId->candidates.id)
```

## Key Relationships Summary

### Primary Entity Chains:
1. **Company → User → Recruiter/Candidate/Associate**
2. **Customer → Jobs → Applications → Interviews**
3. **Candidate → Resume Profiles → Applications**
4. **Jobs → Assessments → Attempts → Answers**
5. **Email Templates → Campaigns → Recipients**
6. **LinkedIn Profiles → InMails → Credit Usage**

### Cascade Delete Considerations:
- Deleting a **company** affects all users and downstream entities
- Deleting a **user** affects all role-specific data (recruiter/candidate)
- Deleting a **job** affects applications, interviews, and analytics
- Deleting a **candidate** affects applications, assessments, and profiles
- Most foreign keys use `onDelete: "cascade"` or `onDelete: "set null"`

## Schema Evolution
- **Initial state (785ba9d7)**: 1 table (users)
- **Current state (60af264f)**: 95 tables
- **Deleted tables**: None
- **Growth**: 94 new tables added across 20+ feature releases

## Database Size Estimates
- **High-volume tables**: applications, notifications, emailDeliveryEvents, userActivityLogs, jobViews
- **Medium-volume tables**: candidates, jobs, interviews, assessments
- **Low-volume tables**: companies, systemSettings, profileBadges

## Indexing Strategy
- Primary keys: Auto-increment integers on all tables
- Unique indexes: email, openId, domain fields
- Foreign key indexes: Automatically created on all reference fields
- Custom indexes: Added on frequently queried fields (status, createdAt, etc.)

---
*Last updated: Current checkpoint (60af264f)*
*Total tables: 95*
*No deleted tables*
