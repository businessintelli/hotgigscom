import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { biasDetectionLogs, diversityMetrics } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Bias Detection Service
 * 
 * Analyzes resumes, job descriptions, and match scores for potential bias
 * and provides recommendations to mitigate discrimination.
 */

export interface BiasDetectionResult {
  hasBias: boolean;
  biasType: string[];
  severity: "low" | "medium" | "high";
  detectedIssues: Array<{
    type: string;
    text: string;
    recommendation: string;
  }>;
  overallScore: number; // 0-100, lower is better (less bias)
}

/**
 * Detect bias in resume text
 */
export async function detectResumeBias(
  resumeText: string,
  candidateId: number
): Promise<BiasDetectionResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a bias detection expert. Analyze the resume for potential indicators that could lead to discrimination in hiring. Look for:
- Gender indicators (pronouns, gendered names, gender-specific organizations)
- Age indicators (graduation years, decades of experience)
- Ethnicity/nationality indicators (foreign names, international education)
- Disability indicators (medical conditions, accommodations)
- Socioeconomic indicators (prestigious vs. community colleges)
- Language proficiency mentions that aren't job-relevant

Return a JSON analysis with detected issues and recommendations.`
        },
        {
          role: "user",
          content: `Analyze this resume for bias indicators:\n\n${resumeText}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bias_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hasBias: { type: "boolean" },
              detectedIssues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    biasType: {
                      type: "string",
                      enum: ["gender", "age", "ethnicity", "disability", "language", "education", "location"]
                    },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high"]
                    },
                    detectedText: { type: "string" },
                    recommendation: { type: "string" }
                  },
                  required: ["biasType", "severity", "detectedText", "recommendation"],
                  additionalProperties: false
                }
              },
              overallScore: {
                type: "number",
                description: "Bias score from 0-100, lower is better"
              }
            },
            required: ["hasBias", "detectedIssues", "overallScore"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from bias detection AI");
    }

    const result = JSON.parse(content);

    // Log detected biases to database
    if (result.hasBias && result.detectedIssues.length > 0) {
      const db = getDb();
      for (const issue of result.detectedIssues) {
        await db.insert(biasDetectionLogs).values({
          entityType: "resume",
          entityId: candidateId,
          biasType: issue.biasType,
          severity: issue.severity,
          detectedText: issue.detectedText,
          recommendation: issue.recommendation,
          flaggedBy: "ai_system",
          resolved: false
        });
      }
    }

    return {
      hasBias: result.hasBias,
      biasType: result.detectedIssues.map((i: any) => i.biasType),
      severity: result.detectedIssues.length > 0 
        ? result.detectedIssues.reduce((max: string, issue: any) => 
            issue.severity === "high" ? "high" : (max === "high" || issue.severity === "medium" ? "medium" : "low"), "low")
        : "low",
      detectedIssues: result.detectedIssues,
      overallScore: result.overallScore
    };
  } catch (error) {
    console.error("Error detecting resume bias:", error);
    return {
      hasBias: false,
      biasType: [],
      severity: "low",
      detectedIssues: [],
      overallScore: 0
    };
  }
}

/**
 * Detect bias in job description
 */
export async function detectJobDescriptionBias(
  jobDescription: string,
  jobRequirements: string,
  jobId: number
): Promise<BiasDetectionResult> {
  try {
    const fullText = `${jobDescription}\n\nRequirements:\n${jobRequirements}`;
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a bias detection expert for job postings. Analyze the job description for language that could discourage diverse candidates. Look for:
- Gendered language ("rockstar", "ninja", "dominant", "aggressive")
- Age bias ("recent graduate", "digital native", "energetic")
- Cultural bias (requiring "culture fit" without definition, "native English speaker")
- Unnecessary requirements that exclude qualified candidates
- Lack of inclusive language or benefits
- Overly aggressive or competitive language

Return a JSON analysis with detected issues and recommendations for more inclusive language.`
        },
        {
          role: "user",
          content: `Analyze this job posting for bias:\n\n${fullText}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_bias_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hasBias: { type: "boolean" },
              detectedIssues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    biasType: {
                      type: "string",
                      enum: ["gender", "age", "ethnicity", "disability", "language", "education", "location"]
                    },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high"]
                    },
                    detectedText: { type: "string" },
                    recommendation: { type: "string" }
                  },
                  required: ["biasType", "severity", "detectedText", "recommendation"],
                  additionalProperties: false
                }
              },
              overallScore: {
                type: "number",
                description: "Bias score from 0-100, lower is better"
              }
            },
            required: ["hasBias", "detectedIssues", "overallScore"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from bias detection AI");
    }

    const result = JSON.parse(content);

    // Log detected biases
    if (result.hasBias && result.detectedIssues.length > 0) {
      const db = getDb();
      for (const issue of result.detectedIssues) {
        await db.insert(biasDetectionLogs).values({
          entityType: "job_description",
          entityId: jobId,
          biasType: issue.biasType,
          severity: issue.severity,
          detectedText: issue.detectedText,
          recommendation: issue.recommendation,
          flaggedBy: "ai_system",
          resolved: false
        });
      }
    }

    return {
      hasBias: result.hasBias,
      biasType: result.detectedIssues.map((i: any) => i.biasType),
      severity: result.detectedIssues.length > 0 
        ? result.detectedIssues.reduce((max: string, issue: any) => 
            issue.severity === "high" ? "high" : (max === "high" || issue.severity === "medium" ? "medium" : "low"), "low")
        : "low",
      detectedIssues: result.detectedIssues,
      overallScore: result.overallScore
    };
  } catch (error) {
    console.error("Error detecting job description bias:", error);
    return {
      hasBias: false,
      biasType: [],
      severity: "low",
      detectedIssues: [],
      overallScore: 0
    };
  }
}

/**
 * Analyze match score for potential bias
 */
export async function analyzeMatchScoreBias(
  candidateData: any,
  jobData: any,
  matchScore: number,
  applicationId: number
): Promise<BiasDetectionResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a fairness auditor for AI matching systems. Analyze whether the match score could be influenced by protected characteristics rather than job-relevant factors. Consider:
- Is the score penalizing non-traditional education paths?
- Is location being over-weighted when remote work is possible?
- Are "culture fit" assessments based on objective criteria?
- Could the scoring favor certain demographic groups?

Return analysis of potential bias in the matching algorithm.`
        },
        {
          role: "user",
          content: `Candidate: ${JSON.stringify(candidateData, null, 2)}\n\nJob: ${JSON.stringify(jobData, null, 2)}\n\nMatch Score: ${matchScore}\n\nAnalyze for potential bias.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "match_bias_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hasBias: { type: "boolean" },
              detectedIssues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    biasType: {
                      type: "string",
                      enum: ["gender", "age", "ethnicity", "disability", "language", "education", "location"]
                    },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high"]
                    },
                    detectedText: { type: "string" },
                    recommendation: { type: "string" }
                  },
                  required: ["biasType", "severity", "detectedText", "recommendation"],
                  additionalProperties: false
                }
              },
              overallScore: { type: "number" }
            },
            required: ["hasBias", "detectedIssues", "overallScore"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from bias detection AI");
    }

    const result = JSON.parse(content);

    // Log detected biases
    if (result.hasBias && result.detectedIssues.length > 0) {
      const db = getDb();
      for (const issue of result.detectedIssues) {
        await db.insert(biasDetectionLogs).values({
          entityType: "match_score",
          entityId: applicationId,
          biasType: issue.biasType,
          severity: issue.severity,
          detectedText: issue.detectedText,
          recommendation: issue.recommendation,
          flaggedBy: "ai_system",
          resolved: false
        });
      }
    }

    return {
      hasBias: result.hasBias,
      biasType: result.detectedIssues.map((i: any) => i.biasType),
      severity: result.detectedIssues.length > 0 
        ? result.detectedIssues.reduce((max: string, issue: any) => 
            issue.severity === "high" ? "high" : (max === "high" || issue.severity === "medium" ? "medium" : "low"), "low")
        : "low",
      detectedIssues: result.detectedIssues,
      overallScore: result.overallScore
    };
  } catch (error) {
    console.error("Error analyzing match score bias:", error);
    return {
      hasBias: false,
      biasType: [],
      severity: "low",
      detectedIssues: [],
      overallScore: 0
    };
  }
}

/**
 * Get bias detection logs for an entity
 */
export async function getBiasLogs(
  entityType: "resume" | "job_description" | "match_score" | "interview_evaluation",
  entityId: number
) {
  return await db
    .select()
    .from(biasDetectionLogs)
    .where(
      and(
        eq(biasDetectionLogs.entityType, entityType),
        eq(biasDetectionLogs.entityId, entityId)
      )
    )
    .orderBy(desc(biasDetectionLogs.createdAt));
}

/**
 * Generate diversity report for a recruiter
 */
export async function generateDiversityReport(
  recruiterId: number,
  jobId: number | null,
  startDate: Date,
  endDate: Date
) {
  // This would aggregate data from applications, interviews, and hires
  // to calculate diversity metrics. Implementation depends on having
  // demographic data (which should be optional and anonymized).
  
  // For now, return a placeholder structure
  return {
    totalApplications: 0,
    diversityBreakdown: {
      gender: {},
      ethnicity: {},
      age: {},
      education: {},
      location: {}
    },
    biasScore: 0,
    recommendations: []
  };
}

/**
 * Resolve a bias detection log
 */
export async function resolveBiasLog(logId: number, resolvedBy: number) {
  await db
    .update(biasDetectionLogs)
    .set({
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy
    })
    .where(eq(biasDetectionLogs.id, logId));
}
