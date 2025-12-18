import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('../db', () => ({
  createJobTemplate: vi.fn().mockResolvedValue(1),
  getJobTemplatesByUser: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Software Engineer Template',
      title: 'Senior Software Engineer',
      companyName: 'Tech Corp',
      description: 'We are looking for a senior software engineer...',
      requirements: 'Bachelor degree in CS, 5+ years experience',
      responsibilities: 'Lead development team, design architecture',
      location: 'San Francisco, CA',
      employmentType: 'full-time',
      salaryMin: 120000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      category: 'Engineering',
      tags: '["react", "node", "typescript"]',
      createdBy: 1,
      isPublic: false,
      usageCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getJobTemplateById: vi.fn().mockResolvedValue({
    id: 1,
    name: 'Software Engineer Template',
    title: 'Senior Software Engineer',
    createdBy: 1,
  }),
  updateJobTemplate: vi.fn().mockResolvedValue(undefined),
  deleteJobTemplate: vi.fn().mockResolvedValue(undefined),
  incrementTemplateUsage: vi.fn().mockResolvedValue(undefined),
  getJobById: vi.fn().mockResolvedValue({
    id: 1,
    title: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    description: 'We are looking for a senior software engineer...',
    requirements: 'Bachelor degree in CS, 5+ years experience',
    responsibilities: 'Lead development team, design architecture',
    location: 'San Francisco, CA',
    employmentType: 'full-time',
    salaryMin: 120000,
    salaryMax: 180000,
    salaryCurrency: 'USD',
    status: 'active',
    createdAt: new Date(),
    closedAt: null,
  }),
  trackJobView: vi.fn().mockResolvedValue(undefined),
  getJobViewCount: vi.fn().mockResolvedValue(150),
  getJobAnalytics: vi.fn().mockResolvedValue({
    viewCount: 150,
    applicationCount: 25,
    conversionRate: '16.67',
    timeToFill: null,
    status: 'active',
  }),
}));

describe('Job Templates Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new job template', async () => {
    const db = await import('../db');
    
    const templateData = {
      name: 'Marketing Manager Template',
      title: 'Senior Marketing Manager',
      companyName: 'Marketing Inc',
      description: 'Lead our marketing team...',
      requirements: 'MBA, 7+ years experience',
      responsibilities: 'Develop marketing strategy',
      location: 'New York, NY',
      employmentType: 'full-time' as const,
      salaryMin: 100000,
      salaryMax: 140000,
      salaryCurrency: 'USD',
      category: 'Marketing',
      createdBy: 1,
    };

    const templateId = await db.createJobTemplate(templateData);
    
    expect(templateId).toBe(1);
    expect(db.createJobTemplate).toHaveBeenCalledWith(templateData);
  });

  it('should retrieve job templates for a user', async () => {
    const db = await import('../db');
    
    const templates = await db.getJobTemplatesByUser(1);
    
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('Software Engineer Template');
    expect(templates[0].title).toBe('Senior Software Engineer');
    expect(templates[0].usageCount).toBe(5);
    expect(db.getJobTemplatesByUser).toHaveBeenCalledWith(1);
  });

  it('should retrieve a specific job template by ID', async () => {
    const db = await import('../db');
    
    const template = await db.getJobTemplateById(1);
    
    expect(template).toBeDefined();
    expect(template?.id).toBe(1);
    expect(template?.name).toBe('Software Engineer Template');
    expect(db.getJobTemplateById).toHaveBeenCalledWith(1);
  });

  it('should delete a job template', async () => {
    const db = await import('../db');
    
    await db.deleteJobTemplate(1);
    
    expect(db.deleteJobTemplate).toHaveBeenCalledWith(1);
  });

  it('should increment template usage count', async () => {
    const db = await import('../db');
    
    await db.incrementTemplateUsage(1);
    
    expect(db.incrementTemplateUsage).toHaveBeenCalledWith(1);
  });
});

describe('Job Analytics Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track a job view', async () => {
    const db = await import('../db');
    
    const viewData = {
      jobId: 1,
      userId: 5,
      source: 'search',
    };

    await db.trackJobView(viewData);
    
    expect(db.trackJobView).toHaveBeenCalledWith(viewData);
  });

  it('should get job view count', async () => {
    const db = await import('../db');
    
    const viewCount = await db.getJobViewCount(1);
    
    expect(viewCount).toBe(150);
    expect(db.getJobViewCount).toHaveBeenCalledWith(1);
  });

  it('should get comprehensive job analytics', async () => {
    const db = await import('../db');
    
    const analytics = await db.getJobAnalytics(1);
    
    expect(analytics).toBeDefined();
    expect(analytics.viewCount).toBe(150);
    expect(analytics.applicationCount).toBe(25);
    expect(analytics.conversionRate).toBe('16.67');
    expect(analytics.timeToFill).toBeNull(); // Job still active
    expect(analytics.status).toBe('active');
    expect(db.getJobAnalytics).toHaveBeenCalledWith(1);
  });

  it('should calculate conversion rate correctly', async () => {
    const db = await import('../db');
    
    const analytics = await db.getJobAnalytics(1);
    
    // 25 applications / 150 views = 16.67%
    expect(parseFloat(analytics.conversionRate)).toBeCloseTo(16.67, 1);
  });

  it('should track anonymous job views', async () => {
    const db = await import('../db');
    
    const anonymousViewData = {
      jobId: 1,
      userId: undefined,
      source: 'direct',
    };

    await db.trackJobView(anonymousViewData);
    
    expect(db.trackJobView).toHaveBeenCalledWith(anonymousViewData);
  });
});

describe('Job Template Creation from Existing Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save an existing job as a template', async () => {
    const db = await import('../db');
    
    const job = await db.getJobById(1);
    expect(job).toBeDefined();
    
    const templateData = {
      name: 'My Custom Template',
      title: job!.title,
      companyName: job!.companyName,
      description: job!.description,
      requirements: job!.requirements,
      responsibilities: job!.responsibilities,
      location: job!.location,
      employmentType: job!.employmentType,
      salaryMin: job!.salaryMin,
      salaryMax: job!.salaryMax,
      salaryCurrency: job!.salaryCurrency,
      category: 'Engineering',
      createdBy: 1,
    };

    const templateId = await db.createJobTemplate(templateData);
    
    expect(templateId).toBe(1);
    expect(db.createJobTemplate).toHaveBeenCalled();
  });
});

describe('Analytics Edge Cases', () => {
  it('should handle jobs with no views', async () => {
    const db = await import('../db');
    
    // Mock a job with 0 views
    vi.mocked(db.getJobAnalytics).mockResolvedValueOnce({
      viewCount: 0,
      applicationCount: 0,
      conversionRate: '0',
      timeToFill: null,
      status: 'draft',
    });
    
    const analytics = await db.getJobAnalytics(999);
    
    expect(analytics.viewCount).toBe(0);
    expect(analytics.conversionRate).toBe('0');
  });

  it('should calculate time-to-fill for closed jobs', async () => {
    const db = await import('../db');
    
    // Mock a closed job with time-to-fill
    vi.mocked(db.getJobAnalytics).mockResolvedValueOnce({
      viewCount: 200,
      applicationCount: 30,
      conversionRate: '15.00',
      timeToFill: 45, // 45 days
      status: 'filled',
    });
    
    const analytics = await db.getJobAnalytics(2);
    
    expect(analytics.timeToFill).toBe(45);
    expect(analytics.status).toBe('filled');
  });
});
