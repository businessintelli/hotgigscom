import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../server/db';

describe('Bot Interview System', () => {
  let testApplicationId: number;
  let testCandidateId: number;
  let testJobId: number;
  let testSessionId: number;

  beforeAll(async () => {
    // Create test data
    const userId = await db.createUser({
      email: 'test-candidate-bot@example.com',
      role: 'candidate',
    });

    testCandidateId = await db.createCandidate({
      userId,
      firstName: 'Test',
      lastName: 'Candidate',
      email: 'test-candidate-bot@example.com',
    });

    testJobId = await db.createJob({
      title: 'Test Software Engineer',
      description: 'Test job for bot interview',
      company: 'Test Company',
      location: 'Remote',
      type: 'full-time',
      status: 'active',
      isPublished: true,
      requiredSkills: 'JavaScript, React, Node.js',
      experienceLevel: 'mid',
    });

    testApplicationId = await db.createApplication({
      jobId: testJobId,
      candidateId: testCandidateId,
      status: 'screening',
    });
  });

  afterAll(async () => {
    // Cleanup test data
    // Note: In a real test environment, you'd want to clean up all created records
  });

  describe('Bot Interview Session Management', () => {
    it('should create a new bot interview session', async () => {
      testSessionId = await db.createBotInterviewSession({
        applicationId: testApplicationId,
        candidateId: testCandidateId,
        jobId: testJobId,
        sessionStatus: 'not-started',
        currentQuestionIndex: 0,
        totalQuestions: 5,
        questionsAnswered: 0,
      });

      expect(testSessionId).toBeTypeOf('number');
      expect(testSessionId).toBeGreaterThan(0);
    });

    it('should retrieve bot interview session by ID', async () => {
      const session = await db.getBotInterviewSessionById(testSessionId);

      expect(session).toBeDefined();
      expect(session?.applicationId).toBe(testApplicationId);
      expect(session?.candidateId).toBe(testCandidateId);
      expect(session?.jobId).toBe(testJobId);
      expect(session?.sessionStatus).toBe('not-started');
      expect(session?.totalQuestions).toBe(5);
    });

    it('should retrieve bot interview session by application ID', async () => {
      const session = await db.getBotInterviewSessionByApplicationId(testApplicationId);

      expect(session).toBeDefined();
      expect(session?.id).toBe(testSessionId);
      expect(session?.applicationId).toBe(testApplicationId);
    });

    it('should update bot interview session status', async () => {
      await db.updateBotInterviewSession(testSessionId, {
        sessionStatus: 'in-progress',
        startedAt: new Date(),
      });

      const session = await db.getBotInterviewSessionById(testSessionId);
      expect(session?.sessionStatus).toBe('in-progress');
      expect(session?.startedAt).toBeDefined();
    });
  });

  describe('Bot Interview Questions', () => {
    const testQuestions = [
      {
        sessionId: 0, // Will be set in the test
        questionText: 'Tell me about your experience with React',
        questionType: 'technical' as const,
        orderIndex: 0,
        expectedDuration: 120,
        difficulty: 'medium' as const,
        category: 'technical-skills',
      },
      {
        sessionId: 0,
        questionText: 'Describe a challenging project you worked on',
        questionType: 'behavioral' as const,
        orderIndex: 1,
        expectedDuration: 180,
        difficulty: 'medium' as const,
        category: 'experience',
      },
    ];

    it('should create bot interview questions', async () => {
      const questionsWithSessionId = testQuestions.map(q => ({
        ...q,
        sessionId: testSessionId,
      }));

      await db.createBotInterviewQuestions(questionsWithSessionId);

      const questions = await db.getBotInterviewQuestionsBySessionId(testSessionId);
      expect(questions).toHaveLength(2);
      expect(questions[0].questionText).toBe('Tell me about your experience with React');
      expect(questions[1].questionText).toBe('Describe a challenging project you worked on');
    });

    it('should retrieve questions in correct order', async () => {
      const questions = await db.getBotInterviewQuestionsBySessionId(testSessionId);

      expect(questions[0].orderIndex).toBe(0);
      expect(questions[1].orderIndex).toBe(1);
    });
  });

  describe('Bot Interview Responses', () => {
    let testQuestionId: number;
    let testResponseId: number;

    beforeAll(async () => {
      const questions = await db.getBotInterviewQuestionsBySessionId(testSessionId);
      testQuestionId = questions[0].id;
    });

    it('should create a bot interview response', async () => {
      testResponseId = await db.createBotInterviewResponse({
        sessionId: testSessionId,
        questionId: testQuestionId,
        candidateId: testCandidateId,
        responseType: 'text',
        textResponse: 'I have 3 years of experience with React, building scalable web applications...',
      });

      expect(testResponseId).toBeTypeOf('number');
      expect(testResponseId).toBeGreaterThan(0);
    });

    it('should retrieve responses by session ID', async () => {
      const responses = await db.getBotInterviewResponsesBySessionId(testSessionId);

      expect(responses).toHaveLength(1);
      expect(responses[0].textResponse).toContain('React');
      expect(responses[0].responseType).toBe('text');
    });

    it('should update response with AI evaluation', async () => {
      await db.updateBotInterviewResponse(testResponseId, {
        aiScore: 85,
        relevanceScore: 90,
        clarityScore: 80,
        depthScore: 85,
        aiEvaluation: 'Strong technical response with good examples',
        strengths: JSON.stringify(['Clear communication', 'Relevant experience']),
        weaknesses: JSON.stringify(['Could provide more specific metrics']),
      });

      const responses = await db.getBotInterviewResponsesBySessionId(testSessionId);
      const response = responses[0];

      expect(response.aiScore).toBe(85);
      expect(response.relevanceScore).toBe(90);
      expect(response.clarityScore).toBe(80);
      expect(response.depthScore).toBe(85);
      expect(response.aiEvaluation).toContain('Strong technical response');
    });
  });

  describe('Interview Analysis', () => {
    let testAnalysisId: number;

    it('should create interview analysis', async () => {
      testAnalysisId = await db.createInterviewAnalysis({
        sessionId: testSessionId,
        candidateId: testCandidateId,
        jobId: testJobId,
        applicationId: testApplicationId,
        overallScore: 82,
        technicalScore: 85,
        behavioralScore: 80,
        communicationScore: 83,
        problemSolvingScore: 81,
        cultureFitScore: null,
        strengths: JSON.stringify(['Strong technical skills', 'Good communication', 'Relevant experience']),
        weaknesses: JSON.stringify(['Limited leadership experience']),
        skillsAssessed: JSON.stringify(['React', 'JavaScript', 'Problem Solving']),
        skillGaps: JSON.stringify(['Team Leadership']),
        recommendations: 'Strong candidate for mid-level position',
        detailedReport: 'Comprehensive analysis of interview performance...',
        hiringRecommendation: 'yes',
        confidenceLevel: 85,
        riskFactors: JSON.stringify([]),
      });

      expect(testAnalysisId).toBeTypeOf('number');
      expect(testAnalysisId).toBeGreaterThan(0);
    });

    it('should retrieve analysis by session ID', async () => {
      const analysis = await db.getInterviewAnalysisBySessionId(testSessionId);

      expect(analysis).toBeDefined();
      expect(analysis?.overallScore).toBe(82);
      expect(analysis?.technicalScore).toBe(85);
      expect(analysis?.hiringRecommendation).toBe('yes');
    });

    it('should retrieve analysis by application ID', async () => {
      const analysis = await db.getInterviewAnalysisByApplicationId(testApplicationId);

      expect(analysis).toBeDefined();
      expect(analysis?.id).toBe(testAnalysisId);
      expect(analysis?.applicationId).toBe(testApplicationId);
    });
  });

  describe('Session Completion', () => {
    it('should mark session as completed', async () => {
      await db.updateBotInterviewSession(testSessionId, {
        sessionStatus: 'completed',
        questionsAnswered: 5,
        completedAt: new Date(),
      });

      const session = await db.getBotInterviewSessionById(testSessionId);
      expect(session?.sessionStatus).toBe('completed');
      expect(session?.questionsAnswered).toBe(5);
      expect(session?.completedAt).toBeDefined();
    });
  });
});

describe('Selection and Onboarding System', () => {
  let testSelectionId: number;
  let testChecklistId: number;
  let testApplicationId: number;
  let testCandidateId: number;
  let testJobId: number;
  let testRecruiterId: number;

  beforeAll(async () => {
    // Create test data
    const recruiterUserId = await db.createUser({
      email: 'test-recruiter-selection@example.com',
      role: 'recruiter',
    });

    testRecruiterId = await db.createRecruiter({
      userId: recruiterUserId,
      firstName: 'Test',
      lastName: 'Recruiter',
      email: 'test-recruiter-selection@example.com',
      company: 'Test Company',
    });

    const candidateUserId = await db.createUser({
      email: 'test-candidate-selection@example.com',
      role: 'candidate',
    });

    testCandidateId = await db.createCandidate({
      userId: candidateUserId,
      firstName: 'Selected',
      lastName: 'Candidate',
      email: 'test-candidate-selection@example.com',
    });

    testJobId = await db.createJob({
      title: 'Test Position for Selection',
      description: 'Test job',
      company: 'Test Company',
      location: 'Remote',
      type: 'full-time',
      status: 'active',
      isPublished: true,
    });

    testApplicationId = await db.createApplication({
      jobId: testJobId,
      candidateId: testCandidateId,
      status: 'interview-completed',
    });
  });

  describe('Candidate Selection', () => {
    it('should create a selection decision', async () => {
      testSelectionId = await db.createCandidateSelection({
        applicationId: testApplicationId,
        candidateId: testCandidateId,
        jobId: testJobId,
        decision: 'selected',
        decisionType: 'manual',
        decisionMaker: testRecruiterId,
        selectionReason: 'Excellent interview performance and strong technical skills',
        candidateNotified: false,
      });

      expect(testSelectionId).toBeTypeOf('number');
      expect(testSelectionId).toBeGreaterThan(0);
    });

    it('should retrieve selection by application ID', async () => {
      const selection = await db.getCandidateSelectionByApplicationId(testApplicationId);

      expect(selection).toBeDefined();
      expect(selection?.decision).toBe('selected');
      expect(selection?.decisionType).toBe('manual');
      expect(selection?.selectionReason).toContain('Excellent interview performance');
    });

    it('should retrieve all selections for a job', async () => {
      const selections = await db.getCandidateSelectionsByJobId(testJobId);

      expect(selections).toHaveLength(1);
      expect(selections[0].decision).toBe('selected');
    });

    it('should update selection notification status', async () => {
      await db.updateCandidateSelection(testSelectionId, {
        candidateNotified: true,
        notifiedAt: new Date(),
        notificationMethod: 'email',
      });

      const selection = await db.getCandidateSelectionByApplicationId(testApplicationId);
      expect(selection?.candidateNotified).toBe(true);
      expect(selection?.notifiedAt).toBeDefined();
    });
  });

  describe('Onboarding Checklist', () => {
    it('should create onboarding checklist', async () => {
      testChecklistId = await db.createOnboardingChecklist({
        candidateId: testCandidateId,
        jobId: testJobId,
        selectionId: testSelectionId,
        recruiterId: testRecruiterId,
        status: 'not-started',
        totalTasks: 5,
        completedTasks: 0,
        progressPercentage: 0,
      });

      expect(testChecklistId).toBeTypeOf('number');
      expect(testChecklistId).toBeGreaterThan(0);
    });

    it('should retrieve checklist by selection ID', async () => {
      const checklist = await db.getOnboardingChecklistBySelectionId(testSelectionId);

      expect(checklist).toBeDefined();
      expect(checklist?.candidateId).toBe(testCandidateId);
      expect(checklist?.status).toBe('not-started');
    });

    it('should retrieve checklist by candidate ID', async () => {
      const checklist = await db.getOnboardingChecklistByCandidateId(testCandidateId);

      expect(checklist).toBeDefined();
      expect(checklist?.id).toBe(testChecklistId);
    });
  });

  describe('Onboarding Checklist Items', () => {
    const testItems = [
      {
        checklistId: 0, // Will be set in test
        title: 'Complete Personal Information Form',
        description: 'Fill out all required personal details',
        category: 'documentation',
        taskType: 'form-completion' as const,
        priority: 'high' as const,
        orderIndex: 0,
        status: 'pending' as const,
      },
      {
        checklistId: 0,
        title: 'Upload ID Documents',
        description: 'Upload government-issued ID',
        category: 'documentation',
        taskType: 'document-upload' as const,
        priority: 'high' as const,
        orderIndex: 1,
        status: 'pending' as const,
      },
    ];

    it('should create checklist items', async () => {
      const itemsWithChecklistId = testItems.map(item => ({
        ...item,
        checklistId: testChecklistId,
      }));

      await db.createOnboardingChecklistItems(itemsWithChecklistId);

      const items = await db.getOnboardingChecklistItemsByChecklistId(testChecklistId);
      expect(items).toHaveLength(2);
      expect(items[0].title).toBe('Complete Personal Information Form');
      expect(items[1].title).toBe('Upload ID Documents');
    });

    it('should retrieve items in correct order', async () => {
      const items = await db.getOnboardingChecklistItemsByChecklistId(testChecklistId);

      expect(items[0].orderIndex).toBe(0);
      expect(items[1].orderIndex).toBe(1);
    });

    it('should update item status', async () => {
      const items = await db.getOnboardingChecklistItemsByChecklistId(testChecklistId);
      const firstItemId = items[0].id;

      await db.updateOnboardingChecklistItem(firstItemId, {
        status: 'completed',
        completedAt: new Date(),
        completedBy: 'candidate',
        completionNotes: 'Form completed successfully',
      });

      const updatedItems = await db.getOnboardingChecklistItemsByChecklistId(testChecklistId);
      const updatedItem = updatedItems.find(item => item.id === firstItemId);

      expect(updatedItem?.status).toBe('completed');
      expect(updatedItem?.completedAt).toBeDefined();
      expect(updatedItem?.completionNotes).toBe('Form completed successfully');
    });

    it('should update checklist progress', async () => {
      await db.updateOnboardingChecklist(testChecklistId, {
        completedTasks: 1,
        progressPercentage: 50,
        status: 'in-progress',
      });

      const checklist = await db.getOnboardingChecklistBySelectionId(testSelectionId);
      expect(checklist?.completedTasks).toBe(1);
      expect(checklist?.progressPercentage).toBe(50);
      expect(checklist?.status).toBe('in-progress');
    });
  });

  describe('Recruiter Onboarding Management', () => {
    it('should retrieve all checklists for recruiter', async () => {
      const checklists = await db.getOnboardingChecklistsByRecruiterId(testRecruiterId);

      expect(checklists.length).toBeGreaterThan(0);
      expect(checklists[0].recruiterId).toBe(testRecruiterId);
    });
  });
});
