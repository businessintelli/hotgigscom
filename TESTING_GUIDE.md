# HotGigs Platform - Comprehensive Testing Guide

## Overview

The HotGigs platform is now fully populated with realistic sample data and includes AI-powered resume parsing. This guide will help you test the complete end-to-end recruitment workflow.

## Database Summary

The platform now contains:
- **15 Users** (2 mock users + 13 realistic profiles)
- **14 Candidates** with diverse skills and experience levels
- **1 Recruiter** (mock recruiter for testing)
- **5 Customer Companies** across different industries
- **15 Job Postings** covering various roles (Full-Stack, DevOps, Data Science, UX, etc.)
- **35 Applications** with varied statuses (submitted, reviewing, shortlisted, interviewing, offered, rejected)
- **12 Interviews** (some completed, some scheduled)

## Authentication Bypass (Testing Mode)

**Important**: Authentication is currently disabled for testing purposes. The system automatically provides the appropriate mock user based on the route:

- **Recruiter routes** (`/recruiter/*`) → Mock Recruiter (ID: 1, email: test@recruiter.com)
- **Candidate routes** (`/candidate-dashboard`, `/jobs`, `/apply`) → Mock Candidate (ID: 2, email: test@candidate.com)

You can access both dashboards directly from the home page header links.

## New Feature: Resume Upload with AI Parsing

### How It Works

1. **Upload Resume**: Candidates can upload PDF or DOCX files
2. **Text Extraction**: System automatically extracts text from the document
3. **AI Parsing**: OpenAI analyzes the resume and extracts:
   - Name, email, phone, location
   - Job title
   - Skills (comma-separated list)
   - Years of experience
   - Education
   - Professional summary
4. **Auto-Fill Profile**: Extracted data automatically populates the candidate profile

### API Endpoint

```typescript
trpc.candidate.uploadResume.useMutation({
  candidateId: number,
  fileData: string, // base64 data URL
  fileName: string,
  autoFill?: boolean // default: true
})
```

### Response

```typescript
{
  success: boolean,
  url: string, // S3 URL of uploaded resume
  parsedData: {
    name?: string,
    email?: string,
    phone?: string,
    location?: string,
    title?: string,
    skills: string,
    experience: string,
    education?: string,
    summary?: string
  }
}
```

## End-to-End Workflow Testing

### 1. Recruiter Workflow

#### A. Create a New Job Posting

1. Navigate to **Recruiter Dashboard** (click "Recruiter Dashboard" in header)
2. Click **"Create New Job"** button
3. Fill in job details:
   - Select a customer company
   - Enter job title (e.g., "Senior React Developer")
   - Location, employment type, salary range
   - Job description and requirements
4. Click **"Post Job"**
5. Verify job appears in "Recent Jobs" section

#### B. View Applications

1. Click **"Applications"** in the quick actions or sidebar
2. Browse applications by job
3. Filter by status (pending, reviewing, shortlisted, etc.)
4. View candidate details and AI match scores

#### C. Review AI Matching

1. Click **"AI Matching"** button
2. Select a job from the dropdown
3. View matched candidates with:
   - Overall match score (%)
   - Skill match analysis
   - Experience match
   - Missing skills
4. Click **"Contact"**, **"Shortlist"**, or **"Schedule Interview"**

#### D. Schedule Interview

1. From applications or AI matching, click **"Schedule Interview"**
2. Select interview type (phone, video, in-person, AI interview)
3. Choose date and time
4. Add meeting link (for video) or location (for in-person)
5. Click **"Schedule"**

#### E. View Interview Results

1. Navigate to **"AI Interviews"** or **"Interviews"**
2. Click **"Review Interview"** on a completed interview
3. View:
   - AI evaluation score
   - Transcription of responses
   - Strengths and weaknesses
   - Final recommendation
4. Update application status based on results

### 2. Candidate Workflow

#### A. Browse Jobs

1. Navigate to **Candidate Dashboard** (click "Candidate Dashboard" in header)
2. Click **"Search Jobs"** button
3. Browse available positions
4. Use filters:
   - Search by keyword
   - Filter by location
   - Filter by job type (full-time, contract, etc.)

#### B. Upload Resume (NEW FEATURE)

1. Go to **Candidate Dashboard**
2. Scroll to **"Resume"** section
3. Click **"Click to upload"** or drag and drop a PDF/DOCX file
4. Wait for upload and AI parsing (5-10 seconds)
5. **Verify**: Profile fields automatically populate with extracted data:
   - Job title
   - Skills
   - Experience
   - Education
   - Location
   - Phone number

#### C. Apply for a Job

1. From job browsing page, click **"Apply Now"** on a job
2. Review your profile information
3. Write a cover letter (optional)
4. Click **"Submit Application"**
5. Receive confirmation

#### D. Track Application Status

1. Go to **Candidate Dashboard**
2. Click **"My Applications"**
3. View all submitted applications with:
   - Job title and company
   - Application date
   - Current status (submitted, reviewing, shortlisted, interviewing, offered, rejected)
   - Next steps

#### E. Complete AI Interview

1. When invited, click **"Start Interview"** from applications page
2. Answer questions via:
   - Text input
   - Voice recording (with transcription)
3. Submit responses
4. Wait for AI evaluation

#### F. View Interview Feedback

1. Navigate to **"My Applications"**
2. Click on application with completed interview
3. View interview feedback and scores
4. Check application status updates

## Testing Scenarios

### Scenario 1: New Candidate Onboarding

1. **Start**: Candidate Dashboard
2. **Upload Resume**: Use a sample PDF/DOCX resume
3. **Verify Auto-Fill**: Check that profile fields are populated
4. **Edit Profile**: Make any necessary corrections
5. **Browse Jobs**: Find relevant positions
6. **Apply**: Submit application with cover letter
7. **Track Status**: Monitor application progress

### Scenario 2: Recruiter Hiring Process

1. **Start**: Recruiter Dashboard
2. **Create Job**: Post a new position
3. **Review Applications**: Check new submissions
4. **AI Matching**: View candidate match scores
5. **Shortlist**: Select top candidates
6. **Schedule Interviews**: Set up interviews
7. **Review Results**: Evaluate interview performance
8. **Make Offer**: Update status to "offered"

### Scenario 3: End-to-End Recruitment Cycle

1. **Recruiter**: Create job posting
2. **Candidate**: Upload resume and apply
3. **Recruiter**: Review application and AI match score
4. **Recruiter**: Schedule AI interview
5. **Candidate**: Complete AI interview
6. **Recruiter**: Review interview playback and evaluation
7. **Recruiter**: Update application status (offered/rejected)
8. **Candidate**: View updated status

## Sample Data Details

### Job Postings

- Senior Full-Stack Engineer (TechCorp Solutions) - $150k-$200k
- Data Scientist (DataDriven Inc) - $130k-$180k
- DevOps Engineer (CloudScale Systems) - $140k-$190k
- Product Manager - B2B SaaS (TechCorp Solutions) - $120k-$160k
- Machine Learning Engineer (DataDriven Inc) - $145k-$195k
- Senior UX Designer (FinTech Innovations) - $110k-$150k
- Backend Engineer - Java (CloudScale Systems) - $130k-$170k
- Frontend Developer - React (HealthTech Partners) - $100k-$140k
- Security Engineer (FinTech Innovations) - $140k-$180k
- Mobile Developer - iOS (TechCorp Solutions) - $120k-$160k
- QA Engineer - Automation (DataDriven Inc) - $90k-$130k
- Solutions Architect (HealthTech Partners) - $160k-$210k
- Technical Writer (CloudScale Systems) - $70k-$100k
- Engineering Manager (TechCorp Solutions) - $180k-$240k
- Junior Full-Stack Developer (FinTech Innovations) - $80k-$110k

### Candidate Profiles

- Sarah Johnson - Senior Full-Stack Developer (8 years)
- Michael Chen - DevOps Engineer (6 years)
- Emily Rodriguez - UX/UI Designer (5 years)
- David Kim - Data Scientist (7 years, PhD)
- Jessica Patel - Product Manager (6 years)
- Robert Williams - Backend Engineer (5 years)
- Amanda Brown - Frontend Developer (4 years)
- James Garcia - Machine Learning Engineer (5 years)
- Lisa Martinez - QA Engineer (4 years)
- Chris Anderson - Security Engineer (6 years)
- Maria Lopez - Mobile Developer (5 years)
- Kevin Taylor - Solutions Architect (9 years)
- Rachel White - Technical Writer (3 years)

## Known Limitations

1. **Authentication Bypass**: Currently in testing mode with mock users. Real OAuth authentication is disabled.
2. **Resume Parsing**: AI parsing accuracy depends on resume format and content quality. May require manual corrections.
3. **File Size Limit**: Resume uploads limited to 5MB.
4. **Supported Formats**: Only PDF and DOCX files are supported for resume upload.

## Troubleshooting

### Resume Upload Issues

- **Error: "Unsupported file type"**: Ensure file is PDF or DOCX format
- **Parsing Failed**: Resume URL is still saved; manually enter profile information
- **Slow Upload**: Large files (>2MB) may take 10-15 seconds to process

### Application Issues

- **Can't Apply**: Ensure candidate profile is complete
- **Application Not Showing**: Check "My Applications" page, not dashboard stats

### Interview Issues

- **No Interview Link**: Check if interview type is "video" and meeting link was provided
- **AI Evaluation Missing**: Only available for completed "ai-interview" type interviews

## Next Steps

After testing, you can:

1. **Re-enable Authentication**: Revert changes in `server/_core/context.ts`
2. **Clear Test Data**: Run database seeding script with fresh data
3. **Add More Features**: Email notifications, advanced search, analytics dashboard
4. **Deploy**: Create checkpoint and publish to production

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review `todo.md` for known issues and planned features
- Test with different browsers and devices
