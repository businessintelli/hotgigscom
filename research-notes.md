# Company Admin Dashboard Research - Key Metrics

## Essential Recruitment Metrics for Company Admin Dashboard

Based on research from leading recruitment platforms and ATS systems, here are the critical metrics to display:

### Primary Dashboard Metrics (Top-Level KPIs)

1. **Time to Fill** - Average days from job requisition approval to offer acceptance
2. **Time to Hire** - Average days from candidate application to offer acceptance
3. **Active Jobs** - Total number of open positions currently being recruited for
4. **Total Applications** - Total applications received across all jobs
5. **Interviews Scheduled** - Total interviews scheduled/completed
6. **Offer Acceptance Rate** - Percentage of offers accepted vs. offers made
7. **Cost per Hire** - Average cost to hire one candidate
8. **Quality of Hire** - Performance ratings of new hires in first year

### Team Performance Metrics

1. **Active Recruiters** - Number of active team members
2. **Jobs per Recruiter** - Average workload distribution
3. **Applications per Recruiter** - Individual productivity tracking
4. **Top Performers** - Recruiters with highest placement rates

### Pipeline & Funnel Metrics

1. **Application Completion Rate** - Percentage who complete application vs. start
2. **Screening Pass Rate** - Candidates moving from application to screening
3. **Interview-to-Offer Ratio** - Conversion rate from interview to offer
4. **Candidate Pipeline Health** - Distribution across recruitment stages

### Source & Channel Metrics

1. **Source of Hire** - Which channels bring successful hires (LinkedIn, job boards, referrals)
2. **Channel Effectiveness** - Conversion rates by source
3. **Channel Cost** - Cost per hire by channel

### Business Impact Metrics

1. **First-Year Attrition** - Turnover rate of new hires in first year
2. **Hiring Manager Satisfaction** - Satisfaction scores from hiring managers
3. **Recruitment ROI** - Return on investment for recruitment activities
4. **Fill Rate** - Percentage of positions filled vs. open positions

## Dashboard Design Principles

### Layout Structure
- **Hero Stats Section** - 4-6 large metric cards at top (Total Jobs, Applications, Interviews, Placements)
- **Performance Charts** - Time-series graphs showing trends
- **Team Leaderboard** - Top performing recruiters
- **Recent Activity Feed** - Latest applications, interviews, hires
- **Quick Actions** - Common tasks (Add Job, Invite Recruiter, View Reports)

### Drill-Down Navigation
- Each metric card should be clickable
- Clicking opens detailed list view with filters
- Example: Click "Total Applications" → Shows all applications with filters by status, date, recruiter, job

### Color Coding
- Green: Positive metrics (high acceptance rate, fast time to hire)
- Red: Warning metrics (high attrition, low fill rate)
- Blue: Neutral/informational metrics
- Yellow: Needs attention

## LinkedIn Integration Features

Based on modern ATS platforms with LinkedIn integration:

1. **Account Connection** - OAuth connection to LinkedIn Recruiter account
2. **InMail Templates** - Pre-written message templates for outreach
3. **Automated Sourcing** - Search criteria saved for automatic candidate discovery
4. **Campaign Tracking** - Track InMail response rates and engagement
5. **Profile Import** - Import candidate profiles directly from LinkedIn
6. **Connection Status** - Show LinkedIn connection health and usage limits

## Team Member Roles & Permissions

### Role Hierarchy
1. **Company Admin** - Full access, manage team, settings, billing
2. **Team Lead** - Manage recruiters, view all data, assign jobs
3. **Senior Recruiter** - Full recruiting access, can create jobs
4. **Recruiter** - Can view assigned jobs, manage applications
5. **Hiring Manager** - View-only access to specific jobs

### Permission Matrix
- Create/Edit Jobs: Admin, Team Lead, Senior Recruiter
- Delete Jobs: Admin, Team Lead only
- Manage Team: Admin only
- View All Data: Admin, Team Lead
- Manage Applications: All recruiters
- LinkedIn Access: Based on individual LinkedIn accounts

## UI/UX Best Practices

1. **Collapsible Sidebar** - Save screen space, remember user preference
2. **Responsive Design** - Mobile-friendly for on-the-go access
3. **Real-time Updates** - Show live data, not cached
4. **Export Functionality** - Download reports as CSV/PDF
5. **Date Range Filters** - All metrics should support custom date ranges
6. **Comparison Views** - Compare current period vs. previous period
