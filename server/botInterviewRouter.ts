import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

/**
 * Bot Interview Router
 * Handles AI-powered interview sessions, question generation, and response evaluation
 */
export const botInterviewRouter = router({
  // Start a new bot interview session
  startSession: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      scheduledAt: z.string().optional(),
      duration: z.number().optional(),
      notes: z.string().optional(),
      totalQuestions: z.number().default(5),
    }))
    .mutation(async ({ input }) => {
      // Get application details
      const application = await db.getApplicationById(input.applicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      // Check if session already exists
      const existingSession = await db.getBotInterviewSessionByApplicationId(input.applicationId);
      if (existingSession) {
        return { sessionId: existingSession.id, existing: true };
      }

      // Create new session
      const sessionId = await db.createBotInterviewSession({
        applicationId: input.applicationId,
        candidateId: input.candidateId,
        jobId: input.jobId,
        sessionStatus: 'not-started',
        currentQuestionIndex: 0,
        totalQuestions: input.totalQuestions,
        questionsAnswered: 0,
      });

      // Get job details to generate relevant questions
      const job = await db.getJobById(input.jobId);
      if (!job) {
        throw new Error("Job not found");
      }

      // Generate interview questions using AI
      const questionsPrompt = `Generate ${input.totalQuestions} interview questions for the following job position:

Job Title: ${job.title}
Job Description: ${job.description}
Required Skills: ${job.requiredSkills || 'Not specified'}
Experience Level: ${job.experienceLevel || 'Not specified'}

Generate a mix of:
- Technical questions (40%)
- Behavioral questions (30%)
- Situational questions (20%)
- Experience-based questions (10%)

Return ONLY a JSON array of questions in this exact format:
[
  {
    "questionText": "question here",
    "questionType": "technical|behavioral|situational|experience",
    "difficulty": "easy|medium|hard",
    "category": "problem-solving|communication|technical-skills|etc"
  }
]`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert technical recruiter. Generate relevant interview questions based on job requirements." },
          { role: "user", content: questionsPrompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interview_questions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      questionText: { type: "string" },
                      questionType: { type: "string", enum: ["technical", "behavioral", "situational", "experience"] },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      category: { type: "string" }
                    },
                    required: ["questionText", "questionType", "difficulty", "category"],
                    additionalProperties: false
                  }
                }
              },
              required: ["questions"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const { questions } = JSON.parse(content);

      // Save questions to database
      const questionData = questions.map((q: any, index: number) => ({
        sessionId,
        questionText: q.questionText,
        questionType: q.questionType,
        orderIndex: index,
        expectedDuration: 120, // 2 minutes default
        difficulty: q.difficulty,
        category: q.category,
      }));

      await db.createBotInterviewQuestions(questionData);

      // Update session to not-started (will be in-progress when candidate starts)
      await db.updateBotInterviewSession(sessionId, {
        sessionStatus: 'not-started',
      });

      // Send email notification to candidate
      const candidate = await db.getCandidateById(application.candidateId);
      
      if (candidate?.email && job) {
        const interviewLink = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/candidate/bot-interview/${input.applicationId}`;
        
        await db.sendEmail({
          to: candidate.email,
          subject: `Bot Interview Scheduled - ${job.title}`,
          html: `
            <h2>Your AI Interview is Ready!</h2>
            <p>Hi ${candidate.firstName || 'there'},</p>
            <p>Great news! You've been invited to complete an AI-powered interview for the <strong>${job.title}</strong> position.</p>
            
            <h3>Interview Details:</h3>
            <ul>
              <li><strong>Position:</strong> ${job.title}</li>
              <li><strong>Company:</strong> ${job.company || 'Not specified'}</li>
              <li><strong>Estimated Duration:</strong> ${input.duration || 30} minutes</li>
              <li><strong>Questions:</strong> ${input.totalQuestions} questions</li>
            </ul>
            
            ${input.notes ? `<p><strong>Additional Notes:</strong> ${input.notes}</p>` : ''}
            
            <h3>What to Expect:</h3>
            <ul>
              <li>AI-generated questions tailored to the job requirements</li>
              <li>You can respond via text, audio, or video</li>
              <li>Your responses will be automatically evaluated</li>
              <li>Take your time - you can pause between questions</li>
            </ul>
            
            <p><strong>Ready to start?</strong></p>
            <p><a href="${interviewLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Interview</a></p>
            
            <p>Good luck!</p>
            <p>Best regards,<br>The HotGigs Team</p>
          `,
        });
      }

      // Update application status
      await db.updateApplicationStatus(input.applicationId, 'interviewing');

      return { sessionId, existing: false };
    }),

  // Get current session details
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input }) => {
      const session = await db.getBotInterviewSessionById(input.sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const questions = await db.getBotInterviewQuestionsBySessionId(input.sessionId);
      const responses = await db.getBotInterviewResponsesBySessionId(input.sessionId);

      return {
        session,
        questions,
        responses,
      };
    }),

  // Get session by application ID
  getSessionByApplication: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
    }))
    .query(async ({ input }) => {
      const session = await db.getBotInterviewSessionByApplicationId(input.applicationId);
      if (!session) {
        return null;
      }

      const questions = await db.getBotInterviewQuestionsBySessionId(session.id);
      const responses = await db.getBotInterviewResponsesBySessionId(session.id);

      return {
        session,
        questions,
        responses,
      };
    }),

  // Submit a response to a question
  submitResponse: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      questionId: z.number(),
      candidateId: z.number(),
      responseType: z.enum(['text', 'audio', 'video']),
      textResponse: z.string().optional(),
      audioUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Create response record
      const responseId = await db.createBotInterviewResponse({
        sessionId: input.sessionId,
        questionId: input.questionId,
        candidateId: input.candidateId,
        responseType: input.responseType,
        textResponse: input.textResponse,
        audioUrl: input.audioUrl,
        videoUrl: input.videoUrl,
        duration: input.duration,
      });

      // Get session and update progress
      const session = await db.getBotInterviewSessionById(input.sessionId);
      if (session) {
        const newQuestionsAnswered = session.questionsAnswered + 1;
        const isComplete = newQuestionsAnswered >= session.totalQuestions;

        await db.updateBotInterviewSession(input.sessionId, {
          questionsAnswered: newQuestionsAnswered,
          currentQuestionIndex: session.currentQuestionIndex + 1,
          sessionStatus: isComplete ? 'completed' : 'in-progress',
          completedAt: isComplete ? new Date() : undefined,
          lastActivityAt: new Date(),
        });

        // Send notification when interview is completed
        if (isComplete) {
          try {
            const { createNotification } = await import('./notificationHelpers');
            const application = await db.getApplicationById(session.applicationId);
            const job = await db.getJobById(session.jobId);
            const candidate = await db.getCandidateById(session.candidateId);
            
            if (application && job && candidate) {
              // Notify recruiter
              const recruiter = await db.getRecruiterById(job.recruiterId);
              if (recruiter) {
                await createNotification({
                  userId: recruiter.userId,
                  type: 'interview_completed',
                  title: 'Bot Interview Completed',
                  message: `${candidate.fullName} has completed the AI interview for ${job.title}`,
                  relatedEntityType: 'bot_interview',
                  relatedEntityId: session.id,
                  actionUrl: `/recruiter/bot-interview-playback?sessionId=${session.id}`,
                });
              }
            }
          } catch (error) {
            console.error('Failed to send interview completion notification:', error);
          }
        }

        // If audio/video response, transcribe it
        if (input.audioUrl) {
          try {
            const transcription = await transcribeAudio({
              audioUrl: input.audioUrl,
            });

            await db.updateBotInterviewResponse(responseId, {
              transcription: transcription.text,
            });
          } catch (error) {
            console.error("Transcription error:", error);
          }
        }
      }

      return { responseId, success: true };
    }),

  // Evaluate a single response with AI
  evaluateResponse: protectedProcedure
    .input(z.object({
      responseId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const responses = await db.getBotInterviewResponsesBySessionId(0); // We'll get the specific response differently
      const response = responses.find(r => r.id === input.responseId);
      
      if (!response || !response.question) {
        throw new Error("Response or question not found");
      }

      const answerText = response.transcription || response.textResponse || "";
      if (!answerText) {
        throw new Error("No answer text available for evaluation");
      }

      const evaluationPrompt = `Evaluate the following interview response:

Question: ${response.question.questionText}
Question Type: ${response.question.questionType}
Candidate's Answer: ${answerText}

Provide a detailed evaluation including:
1. Overall score (0-100)
2. Relevance score (0-100)
3. Clarity score (0-100)
4. Depth score (0-100)
5. Key strengths (array of strings)
6. Areas for improvement (array of strings)
7. Specific recommendations

Return ONLY JSON in this format:
{
  "overallScore": number,
  "relevanceScore": number,
  "clarityScore": number,
  "depthScore": number,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "evaluation": "detailed evaluation text",
  "recommendations": "specific recommendations"
}`;

      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert interview evaluator. Provide fair, constructive, and detailed feedback." },
          { role: "user", content: evaluationPrompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "response_evaluation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                relevanceScore: { type: "number" },
                clarityScore: { type: "number" },
                depthScore: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                evaluation: { type: "string" },
                recommendations: { type: "string" }
              },
              required: ["overallScore", "relevanceScore", "clarityScore", "depthScore", "strengths", "weaknesses", "evaluation", "recommendations"],
              additionalProperties: false
            }
          }
        }
      });

      const evaluation = JSON.parse(aiResponse.choices[0].message.content);

      // Update response with evaluation
      await db.updateBotInterviewResponse(input.responseId, {
        aiScore: evaluation.overallScore,
        relevanceScore: evaluation.relevanceScore,
        clarityScore: evaluation.clarityScore,
        depthScore: evaluation.depthScore,
        aiEvaluation: evaluation.evaluation,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        recommendations: evaluation.recommendations,
      });

      return { success: true, evaluation };
    }),

  // Generate comprehensive analysis for completed session
  generateAnalysis: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.getBotInterviewSessionById(input.sessionId);
      if (!session || session.sessionStatus !== 'completed') {
        throw new Error("Session not completed");
      }

      // Get all responses with evaluations
      const responses = await db.getBotInterviewResponsesBySessionId(input.sessionId);
      
      // Evaluate any responses that haven't been evaluated yet
      for (const response of responses) {
        if (!response.aiScore) {
          // Trigger evaluation (this would ideally be done asynchronously)
          // For now, we'll skip unevaluated responses
          continue;
        }
      }

      // Calculate aggregate scores
      const evaluatedResponses = responses.filter(r => r.aiScore);
      if (evaluatedResponses.length === 0) {
        throw new Error("No evaluated responses found");
      }

      const overallScore = Math.round(
        evaluatedResponses.reduce((sum, r) => sum + (r.aiScore || 0), 0) / evaluatedResponses.length
      );

      const technicalResponses = evaluatedResponses.filter(r => r.question?.questionType === 'technical');
      const behavioralResponses = evaluatedResponses.filter(r => r.question?.questionType === 'behavioral');

      const technicalScore = technicalResponses.length > 0
        ? Math.round(technicalResponses.reduce((sum, r) => sum + (r.aiScore || 0), 0) / technicalResponses.length)
        : null;

      const behavioralScore = behavioralResponses.length > 0
        ? Math.round(behavioralResponses.reduce((sum, r) => sum + (r.aiScore || 0), 0) / behavioralResponses.length)
        : null;

      const communicationScore = Math.round(
        evaluatedResponses.reduce((sum, r) => sum + (r.clarityScore || 0), 0) / evaluatedResponses.length
      );

      const problemSolvingScore = Math.round(
        evaluatedResponses.reduce((sum, r) => sum + (r.depthScore || 0), 0) / evaluatedResponses.length
      );

      // Collect all strengths and weaknesses
      const allStrengths: string[] = [];
      const allWeaknesses: string[] = [];

      for (const response of evaluatedResponses) {
        if (response.strengths) {
          try {
            const strengths = JSON.parse(response.strengths);
            allStrengths.push(...strengths);
          } catch (e) {
            // Skip invalid JSON
          }
        }
        if (response.weaknesses) {
          try {
            const weaknesses = JSON.parse(response.weaknesses);
            allWeaknesses.push(...weaknesses);
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      // Determine hiring recommendation
      let hiringRecommendation: 'strong-yes' | 'yes' | 'maybe' | 'no' | 'strong-no';
      if (overallScore >= 85) hiringRecommendation = 'strong-yes';
      else if (overallScore >= 70) hiringRecommendation = 'yes';
      else if (overallScore >= 55) hiringRecommendation = 'maybe';
      else if (overallScore >= 40) hiringRecommendation = 'no';
      else hiringRecommendation = 'strong-no';

      const confidenceLevel = evaluatedResponses.length >= session.totalQuestions ? 90 : 70;

      // Create analysis record
      const analysisId = await db.createInterviewAnalysis({
        sessionId: input.sessionId,
        candidateId: session.candidateId,
        jobId: session.jobId,
        applicationId: session.applicationId,
        overallScore,
        technicalScore,
        behavioralScore,
        communicationScore,
        problemSolvingScore,
        cultureFitScore: null, // Would need additional assessment
        strengths: JSON.stringify(allStrengths),
        weaknesses: JSON.stringify(allWeaknesses),
        skillsAssessed: JSON.stringify([]), // Would be populated from question categories
        skillGaps: JSON.stringify([]),
        recommendations: "Based on interview performance",
        detailedReport: `Interview completed with ${evaluatedResponses.length} evaluated responses.`,
        hiringRecommendation,
        confidenceLevel,
        riskFactors: JSON.stringify([]),
      });

      // Send notification when analysis is ready
      try {
        const { createNotification } = await import('./notificationHelpers');
        const job = await db.getJobById(session.jobId);
        const candidate = await db.getCandidateById(session.candidateId);
        
        if (job && candidate) {
          // Notify recruiter
          const recruiter = await db.getRecruiterById(job.recruiterId);
          if (recruiter) {
            const recommendationText = hiringRecommendation === 'strong-yes' ? 'Highly Recommended' : 
                                      hiringRecommendation === 'yes' ? 'Recommended' :
                                      hiringRecommendation === 'maybe' ? 'Consider' :
                                      hiringRecommendation === 'no' ? 'Not Recommended' : 'Strongly Not Recommended';
            
            await createNotification({
              userId: recruiter.userId,
              type: 'analysis_ready',
              title: 'Interview Analysis Ready',
              message: `AI analysis for ${candidate.fullName}'s interview is complete. Score: ${overallScore}/100 (${recommendationText})`,
              relatedEntityType: 'interview_analysis',
              relatedEntityId: analysisId,
              actionUrl: `/recruiter/bot-interview-playback?sessionId=${session.id}`,
            });
          }
        }
      } catch (error) {
        console.error('Failed to send analysis ready notification:', error);
      }

      return { analysisId, overallScore, hiringRecommendation };
    }),

  // Get analysis for a session
  getAnalysis: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input }) => {
      const analysis = await db.getInterviewAnalysisBySessionId(input.sessionId);
      return analysis;
    }),
});
