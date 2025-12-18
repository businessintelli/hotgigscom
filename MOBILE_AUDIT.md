# Mobile Responsiveness Audit - HotGigs Platform

## Pages to Optimize

### ✅ Already Responsive (Tailwind defaults)
- Home page (job listings)
- Job detail pages
- Login/Signup pages

### 🔧 Needs Optimization

#### 1. **Recruiter Dashboard** (`RecruiterDashboard.tsx`)
- Quick action cards should stack vertically on mobile
- Stats grid should be 1-2 columns on mobile instead of 4
- Recent jobs table should have horizontal scroll or card view on mobile

#### 2. **Application Management** (`ApplicationManagement.tsx`)
- Application cards are already responsive
- Filter buttons should wrap on mobile
- Schedule Interview dialog needs mobile optimization

#### 3. **Interview Calendar** (`InterviewCalendar.tsx`)
- react-big-calendar needs mobile view configuration
- Calendar should switch to agenda/list view on mobile
- Touch gestures for drag-and-drop on mobile

#### 4. **Resume Ranking Dashboard** (`ResumeRankingDashboard.tsx`)
- Candidate cards should be full-width on mobile
- Skill progress bars need better mobile spacing
- Export buttons should stack vertically on mobile

#### 5. **Bulk Resume Upload** (`BulkResumeUpload.tsx`)
- Drag-and-drop zone needs touch-friendly alternative
- Results table should have horizontal scroll or card view

#### 6. **Candidate Dashboard** (`CandidateDashboard.tsx`)
- Application cards should stack on mobile
- Interview invitations need mobile-optimized layout

## Mobile Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Implementation Strategy
1. Use Tailwind responsive utilities (`sm:`, `md:`, `lg:`)
2. Stack layouts vertically on mobile (`flex-col` on small screens)
3. Hide less critical info on mobile, show on larger screens
4. Use mobile-friendly touch targets (min 44x44px)
5. Implement hamburger menu for navigation on mobile
6. Test on actual devices or Chrome DevTools mobile emulation
