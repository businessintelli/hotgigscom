import { invokeLLM } from "./_core/llm";

/**
 * Parse a resume and extract structured information
 * @param resumeText - The text content of the resume
 * @returns Parsed resume data including skills, experience, education
 */
export async function parseResume(resumeText: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert resume parser. Extract structured information from resumes and return it in JSON format.",
      },
      {
        role: "user",
        content: `Parse the following resume and extract:
1. Primary skills (programming languages, frameworks, tools)
2. Years of experience (estimate based on work history)
3. Education level and field
4. Job titles and companies
5. Key achievements

Resume:
${resumeText}

Return the data in this JSON format:
{
  "skills": ["skill1", "skill2", ...],
  "experienceYears": number,
  "education": "degree and field",
  "jobTitles": ["title1", "title2", ...],
  "companies": ["company1", "company2", ...],
  "achievements": ["achievement1", "achievement2", ...]
}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: { type: "string" },
              description: "List of technical and professional skills",
            },
            experienceYears: {
              type: "number",
              description: "Total years of professional experience",
            },
            education: {
              type: "string",
              description: "Highest education level and field of study",
            },
            jobTitles: {
              type: "array",
              items: { type: "string" },
              description: "List of previous job titles",
            },
            companies: {
              type: "array",
              items: { type: "string" },
              description: "List of previous companies",
            },
            achievements: {
              type: "array",
              items: { type: "string" },
              description: "Key achievements and accomplishments",
            },
          },
          required: ["skills", "experienceYears", "education", "jobTitles", "companies", "achievements"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to parse resume");
  }

  return JSON.parse(content);
}

/**
 * Calculate match score between a candidate and a job
 * @param candidateSkills - Array of candidate's skills
 * @param candidateExperience - Years of experience
 * @param jobRequirements - Job requirements text
 * @param jobTitle - Job title
 * @returns Match score (0-100) and detailed analysis
 */
export async function calculateMatchScore(
  candidateSkills: string[],
  candidateExperience: number,
  jobRequirements: string,
  jobTitle: string
) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert recruiter. Analyze candidate-job matches and provide detailed scoring.",
      },
      {
        role: "user",
        content: `Analyze the match between this candidate and job:

Candidate:
- Skills: ${candidateSkills.join(", ")}
- Experience: ${candidateExperience} years

Job:
- Title: ${jobTitle}
- Requirements: ${jobRequirements}

Provide a match analysis with:
1. Overall match score (0-100)
2. Skills match score (0-100)
3. Experience match score (0-100)
4. Matching skills (list)
5. Missing skills (list)
6. Recommendation (hire, interview, reject)
7. Reasoning (brief explanation)

Return as JSON.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "match_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallScore: {
              type: "number",
              description: "Overall match score from 0 to 100",
            },
            skillsScore: {
              type: "number",
              description: "Skills match score from 0 to 100",
            },
            experienceScore: {
              type: "number",
              description: "Experience match score from 0 to 100",
            },
            matchingSkills: {
              type: "array",
              items: { type: "string" },
              description: "Skills that match the job requirements",
            },
            missingSkills: {
              type: "array",
              items: { type: "string" },
              description: "Skills required by the job but not possessed by candidate",
            },
            recommendation: {
              type: "string",
              enum: ["hire", "interview", "reject"],
              description: "Hiring recommendation",
            },
            reasoning: {
              type: "string",
              description: "Brief explanation of the recommendation",
            },
          },
          required: [
            "overallScore",
            "skillsScore",
            "experienceScore",
            "matchingSkills",
            "missingSkills",
            "recommendation",
            "reasoning",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to calculate match score");
  }

  return JSON.parse(content);
}

/**
 * Generate interview questions based on job requirements and candidate profile
 * @param jobTitle - Job title
 * @param jobRequirements - Job requirements
 * @param candidateSkills - Candidate's skills
 * @returns Array of interview questions
 */
export async function generateInterviewQuestions(
  jobTitle: string,
  jobRequirements: string,
  candidateSkills: string[]
) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert interviewer. Generate relevant technical and behavioral interview questions.",
      },
      {
        role: "user",
        content: `Generate 10 interview questions for:

Job: ${jobTitle}
Requirements: ${jobRequirements}
Candidate Skills: ${candidateSkills.join(", ")}

Include:
- 5 technical questions (specific to the role and candidate's skills)
- 3 behavioral questions
- 2 situational questions

Return as a JSON array of question objects with: question, type, difficulty`,
      },
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
                  question: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["technical", "behavioral", "situational"],
                  },
                  difficulty: {
                    type: "string",
                    enum: ["easy", "medium", "hard"],
                  },
                },
                required: ["question", "type", "difficulty"],
                additionalProperties: false,
              },
            },
          },
          required: ["questions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to generate interview questions");
  }

  const parsed = JSON.parse(content);
  return parsed.questions;
}

/**
 * Analyze a candidate's resume and provide improvement suggestions
 * @param resumeText - The resume text
 * @returns Analysis with strengths, weaknesses, and suggestions
 */
export async function analyzeResume(resumeText: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an expert career coach. Analyze resumes and provide constructive feedback.",
      },
      {
        role: "user",
        content: `Analyze this resume and provide:
1. Overall score (0-100)
2. Strengths (3-5 points)
3. Weaknesses (3-5 points)
4. Improvement suggestions (5-7 specific actionable items)

Resume:
${resumeText}

Return as JSON.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description: "Overall resume quality score from 0 to 100",
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "List of resume strengths",
            },
            weaknesses: {
              type: "array",
              items: { type: "string" },
              description: "List of areas for improvement",
            },
            suggestions: {
              type: "array",
              items: { type: "string" },
              description: "Specific actionable improvement suggestions",
            },
          },
          required: ["score", "strengths", "weaknesses", "suggestions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error("Failed to analyze resume");
  }

  return JSON.parse(content);
}
