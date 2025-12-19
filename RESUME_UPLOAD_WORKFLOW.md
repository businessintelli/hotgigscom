# Resume Upload & Review Workflow Documentation

## Overview
This document describes the complete resume upload, parsing, review, and save workflow.

## Workflow Steps

### 1. Upload Resume
URL: /candidate/resume-upload
- User enters profile name
- User selects PDF/DOCX file
- Clicks "Upload & Parse with AI"

### 2. Backend Processing
- Upload file to S3
- Extract text from PDF/DOCX
- Parse with AI (skills, experience, education)
- Calculate scores
- Save to database
- Return resume ID

### 3. Redirect to Edit
- Frontend redirects to /candidate/resume-edit/:id

### 4. Review & Edit (Wizard)
- Step 1: Basic Info (name, email, phone, location, summary)
- Step 2: Work Experience (view/edit)
- Step 3: Education (view/edit)
- Step 4: Additional (skills, certifications, languages)

### 5. Save
- Update database with edited data
- Redirect to /candidate/my-resumes

## Implementation Status
✅ Backend upload and parsing complete
✅ Database schema complete
✅ Upload page complete
✅ Edit wizard complete
✅ Save functionality complete
⏳ Testing pending (browser cache issue in dev)

## Testing
1. Go to /candidate/resume-upload
2. Enter profile name
3. Upload resume file
4. Should redirect to edit page
5. Review and edit data
6. Click Save
7. Should see resume in My Resumes list
