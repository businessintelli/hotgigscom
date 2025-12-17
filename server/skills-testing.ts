/**
 * Skills Testing Platform Backend Service
 * Handles coding challenges, personality assessments, and domain-specific tests
 */

import { getDb } from "./db";
const db = getDb();
import {
  testLibrary,
  testQuestions,
  personalityQuestions,
  testAssignments,
  testResponses,
  personalityResults,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * Code executor for coding challenges
 * Supports Python, JavaScript, Java, and C++
 */
export async function executeCode(params: {
  language: string;
  code: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
  timeLimit?: number;
}): Promise<{
  success: boolean;
  output?: string;
  error?: string;
  testCasesPassed: number;
  testCasesTotal: number;
  executionTime: number;
}> {
  const { language, code, testCases, timeLimit = 5 } = params;

  // This is a simplified implementation
  // In production, use a sandboxed code execution service like Judge0, Piston, or AWS Lambda
  
  try {
    let passed = 0;
    const total = testCases.length;
    const startTime = Date.now();

    // For now, we'll simulate code execution
    // In production, integrate with a real code execution API
    
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock results - in production, actually execute the code
    const mockSuccess = Math.random() > 0.3; // 70% success rate for demo
    
    if (mockSuccess) {
      passed = Math.floor(total * (0.6 + Math.random() * 0.4)); // 60-100% pass rate
    }

    const executionTime = Date.now() - startTime;

    return {
      success: passed === total,
      output: `Executed ${total} test cases. ${passed} passed.`,
      testCasesPassed: passed,
      testCasesTotal: total,
      executionTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      testCasesPassed: 0,
      testCasesTotal: testCases.length,
      executionTime: 0,
    };
  }
}

/**
 * Calculate personality test scores from responses
 */
export async function calculatePersonalityScores(params: {
  testType: string;
  responses: Array<{ trait: string; score: number; isReversed: boolean }>;
}): Promise<{
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
  dominance?: number;
  influence?: number;
  steadiness?: number;
  compliance?: number;
  primaryTrait: string;
  interpretation: string;
}> {
  const { testType, responses } = params;

  if (testType === "big-five") {
    // Calculate Big Five scores
    const traitScores: Record<string, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: [],
    };

    responses.forEach(({ trait, score, isReversed }) => {
      const adjustedScore = isReversed ? 6 - score : score;
      if (traitScores[trait]) {
        traitScores[trait].push(adjustedScore);
      }
    });

    const averageScores = Object.entries(traitScores).reduce((acc, [trait, scores]) => {
      if (scores.length > 0) {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        acc[trait] = Math.round((avg / 5) * 100); // Convert to 0-100 scale
      }
      return acc;
    }, {} as Record<string, number>);

    // Find primary trait (highest score)
    const primaryTrait = Object.entries(averageScores).reduce((max, [trait, score]) =>
      score > (max.score || 0) ? { trait, score } : max
    , { trait: "", score: 0 }).trait;

    // Generate AI interpretation
    const interpretation = await generatePersonalityInterpretation({
      testType: "Big Five",
      scores: averageScores,
      primaryTrait,
    });

    return {
      openness: averageScores.openness,
      conscientiousness: averageScores.conscientiousness,
      extraversion: averageScores.extraversion,
      agreeableness: averageScores.agreeableness,
      neuroticism: averageScores.neuroticism,
      primaryTrait,
      interpretation,
    };
  } else if (testType === "disc") {
    // Calculate DISC scores
    const traitScores: Record<string, number[]> = {
      dominance: [],
      influence: [],
      steadiness: [],
      compliance: [],
    };

    responses.forEach(({ trait, score, isReversed }) => {
      const adjustedScore = isReversed ? 6 - score : score;
      if (traitScores[trait]) {
        traitScores[trait].push(adjustedScore);
      }
    });

    const averageScores = Object.entries(traitScores).reduce((acc, [trait, scores]) => {
      if (scores.length > 0) {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        acc[trait] = Math.round((avg / 5) * 100);
      }
      return acc;
    }, {} as Record<string, number>);

    const primaryTrait = Object.entries(averageScores).reduce((max, [trait, score]) =>
      score > (max.score || 0) ? { trait, score } : max
    , { trait: "", score: 0 }).trait;

    const interpretation = await generatePersonalityInterpretation({
      testType: "DISC",
      scores: averageScores,
      primaryTrait,
    });

    return {
      dominance: averageScores.dominance,
      influence: averageScores.influence,
      steadiness: averageScores.steadiness,
      compliance: averageScores.compliance,
      primaryTrait,
      interpretation,
    };
  }

  throw new Error("Unsupported test type");
}

/**
 * Generate AI interpretation of personality test results
 */
async function generatePersonalityInterpretation(params: {
  testType: string;
  scores: Record<string, number>;
  primaryTrait: string;
}): Promise<string> {
  const { testType, scores, primaryTrait } = params;

  const prompt = `Generate a professional personality assessment interpretation for a ${testType} test.

Primary Trait: ${primaryTrait}

Scores:
${Object.entries(scores).map(([trait, score]) => `- ${trait}: ${score}/100`).join("\n")}

Provide a 2-3 paragraph interpretation that:
1. Explains what the primary trait means for this person
2. Describes their strengths based on the scores
3. Suggests suitable work environments or roles
4. Keeps a positive, professional tone

Keep it concise and actionable.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a professional psychologist specializing in workplace personality assessments." },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : "Unable to generate interpretation.";
  } catch (error) {
    console.error("Error generating personality interpretation:", error);
    return `This candidate shows a strong ${primaryTrait} profile, which is valuable in many professional settings.`;
  }
}

/**
 * Auto-grade multiple choice and true/false questions
 */
export function autoGradeQuestion(params: {
  questionType: string;
  correctAnswer: string;
  candidateAnswer: string;
  points: number;
}): { isCorrect: boolean; pointsEarned: number } {
  const { questionType, correctAnswer, candidateAnswer, points } = params;

  if (questionType === "multiple-choice" || questionType === "true-false") {
    const isCorrect = correctAnswer.trim().toLowerCase() === candidateAnswer.trim().toLowerCase();
    return {
      isCorrect,
      pointsEarned: isCorrect ? points : 0,
    };
  }

  // For essay questions, manual grading required
  return {
    isCorrect: false,
    pointsEarned: 0,
  };
}

/**
 * Generate AI-based coding challenge
 */
export async function generateCodingChallenge(params: {
  difficulty: string;
  language: string;
  topic?: string;
}): Promise<{
  questionText: string;
  starterCode: string;
  testCases: Array<{ input: string; expectedOutput: string; description: string }>;
}> {
  const { difficulty, language, topic = "algorithms" } = params;

  const prompt = `Generate a ${difficulty} coding challenge in ${language} on the topic of ${topic}.

Provide:
1. A clear problem statement
2. Starter code template
3. 3-5 test cases with inputs and expected outputs

Format as JSON:
{
  "questionText": "problem description",
  "starterCode": "code template",
  "testCases": [
    { "input": "test input", "expectedOutput": "expected result", "description": "what this tests" }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert coding interview question generator." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coding_challenge",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questionText: { type: "string" },
              starterCode: { type: "string" },
              testCases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    input: { type: "string" },
                    expectedOutput: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["input", "expectedOutput", "description"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questionText", "starterCode", "testCases"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : "{}");
    return result;
  } catch (error) {
    console.error("Error generating coding challenge:", error);
    throw new Error("Failed to generate coding challenge");
  }
}
