# HotGigs Platform - Role Hierarchy Documentation

## Overview

The HotGigs platform has a clear role hierarchy with distinct access levels and responsibilities. This document clarifies the differences between various user roles.

---

## Role Types

### 1. **Application Admin** (`admin`)
- **Example User**: info@hotgigs.com
- **Access Level**: Platform-wide (highest level)
- **Purpose**: Manages the entire HotGigs platform

**Responsibilities:**
- Platform configuration and settings
- System-wide user management
- Database administration
- Platform analytics and monitoring
- Global feature configuration
- Security and compliance oversight
- Billing and subscription management
- Technical support and troubleshooting

**Access Rights:**
- Full access to all platform features
- Can view and manage all companies
- Can view and manage all users across all companies
- Can access system-level settings
- Can view platform-wide analytics

**UI Access:**
- Application Admin Dashboard (if implemented)
- System-level configuration panels
- Platform-wide reports and analytics

---

### 2. **Company Admin** (`company_admin`)
- **Example User**: pratap@businessintelli.com
- **Access Level**: Company-level
- **Purpose**: Manages a specific company's recruitment operations

**Responsibilities:**
- Company profile and settings management
- Team member management (add/remove recruiters)
- LinkedIn integration settings
- InMail template management
- Company-level analytics and reports
- Billing and subscription for their company
- Company-specific compliance settings

**Access Rights:**
- Full access to their company's data only
- Can manage recruiters within their company
- Can view all jobs posted by their company
- Can view all candidates and applications for their company
- Can configure company-specific integrations
- Cannot access other companies' data
- Cannot access platform-wide settings

**UI Access:**
- Company Admin Dashboard (`/company-admin/dashboard`)
- Team Members Management (`/company-admin/team-members`)
- LinkedIn Settings (`/company-admin/linkedin-settings`)
- InMail Templates (`/company-admin/inmail-templates`)
- Company Settings (`/company-admin/company-settings`)
- Company Reports (to be implemented)

---

### 3. **Recruiter** (`recruiter`)
- **Access Level**: Company-level (operational)
- **Purpose**: Manages recruitment activities for their company

**Responsibilities:**
- Post and manage job listings
- Review and manage applications
- Schedule and conduct interviews
- Use AI matching and screening tools
- Manage candidate relationships
- Track recruitment metrics
- Communicate with candidates

**Access Rights:**
- Can create and manage jobs for their company
- Can view and manage applications for their company's jobs
- Can schedule interviews
- Can use AI tools for candidate screening
- Cannot manage company settings
- Cannot add/remove team members
- Cannot access company billing

**UI Access:**
- Recruiter Dashboard (`/recruiter/dashboard`)
- Jobs, Applications, Interviews, AI Matching, etc.

---

### 4. **Candidate** (`candidate`)
- **Access Level**: Personal
- **Purpose**: Job seekers using the platform

**Responsibilities:**
- Create and maintain profile
- Upload resume and portfolio
- Browse and apply for jobs
- Complete interviews
- Track application status

**Access Rights:**
- Can view public job listings
- Can apply for jobs
- Can view their own applications
- Can manage their own profile
- Cannot access company or recruiter features

**UI Access:**
- Candidate Dashboard (`/candidate-dashboard`)
- Job browsing, applications, profile management

---

## Role Assignment

### How Roles Are Assigned

1. **Application Admin**: Manually assigned in database (typically platform owner)
2. **Company Admin**: 
   - First user from a company domain becomes company admin
   - Or manually promoted by application admin
3. **Recruiter**: 
   - Invited by company admin
   - Or signs up and gets approved by company admin
4. **Candidate**: 
   - Self-registration during sign-up
   - Default role for job seekers

### Checking Your Role

When logged in, your role determines:
- Which dashboard you see after login
- Which menu items are available
- What data you can access
- What actions you can perform

**To check your role:**
- Look at the URL after login:
  - `/company-admin/*` = Company Admin
  - `/recruiter/*` = Recruiter
  - `/candidate-dashboard` = Candidate
- Check the user profile dropdown (shows role badge)

---

## Common Questions

### Q: Why don't I see a role when logged in as info@hotgigs.com?
**A**: The `admin` role is a platform-level role. When you log in as an application admin, you have access to all features but may need to access specific admin panels. The role exists in the database but may not be displayed in the regular user interface.

### Q: Why do I see "company_admin" role when logged in as pratap@businessintelli.com?
**A**: This is correct! The `company_admin` role is displayed to show you have company-level administrative privileges. This is different from the platform-level `admin` role.

### Q: Can a company admin also be a recruiter?
**A**: Yes, a company admin has all recruiter permissions plus additional company management capabilities. They can perform all recruiter functions while also managing company settings and team members.

### Q: How do I promote a recruiter to company admin?
**A**: Currently, this requires a database update. Application admins can update the `role` field in the `users` table from `recruiter` to `company_admin`.

---

## Visual Distinction

Each role has a unique logo gradient color in the sidebar:

- **Recruiter**: Blue to Purple gradient (`from-blue-600 to-purple-600`)
- **Candidate**: Emerald to Teal gradient (`from-emerald-500 to-teal-500`)
- **Company Admin**: Purple to Pink gradient (`from-purple-600 to-pink-600`)

This helps users quickly identify which interface they're using.

---

## Security Considerations

- Roles are enforced at the backend level through tRPC procedures
- Frontend UI is role-aware but backend validation is the source of truth
- Session tokens contain role information
- All API calls validate user role before executing actions
- Cross-company data access is prevented at the database query level

---

*Last Updated: December 17, 2025*
