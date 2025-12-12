import mammoth from 'mammoth';
import { invokeLLM } from './_core/llm';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.PDFParse || pdfParseModule;

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Extract text from DOCX buffer
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from resume file based on mime type
 */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDOCX(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

export interface ParsedResume {
  rawText: string;
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  skills: string[];
  experience: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    duration?: string;
  }>;
  education: Array<{
    degree?: string;
    institution?: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
    fieldOfStudy?: string;
  }>;
  certifications: string[];
  languages: string[];
  projects: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  metadata: {
    totalExperienceYears?: number;
    seniorityLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    primaryDomain?: string;
    skillCategories?: Record<string, string[]>;
  };
}

export interface SkillMatch {
  skill: string;
  strength: number; // 0-100
  category: string;
  relevance: number; // 0-1
}

export interface ResumeRanking {
  candidateId: number;
  overallScore: number; // 0-100
  skillMatches: SkillMatch[];
  experienceScore: number;
  educationScore: number;
  matchedSkillsCount: number;
  totalSkillsCount: number;
  matchPercentage: number;
}

/**
 * Parse resume text using AI to extract structured information (Legacy format for backward compatibility)
 */
export async function parseResumeSimple(resumeText: string): Promise<{
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  skills: string;
  experience: string;
  education?: string;
  summary?: string;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are a resume parsing assistant. Extract structured information from resumes accurately.'
      },
      {
        role: 'user',
        content: `Parse the following resume and extract key information. Return ONLY valid JSON without any markdown formatting or code blocks.

Resume text:
${resumeText}

Extract and return JSON with these fields:
- name: Full name (string or null)
- email: Email address (string or null)
- phone: Phone number (string or null)
- location: City, State or location (string or null)
- title: Current or desired job title (string or null)
- skills: Comma-separated list of technical skills (string, required - if none found, return empty string)
- experience: Years of experience or brief summary (string, required - if none found, return "Not specified")
- education: Highest degree and institution (string or null)
- summary: Brief professional summary (string or null, max 200 chars)

Return ONLY the JSON object, no other text.`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'resume_data',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: ['string', 'null'] },
            email: { type: ['string', 'null'] },
            phone: { type: ['string', 'null'] },
            location: { type: ['string', 'null'] },
            title: { type: ['string', 'null'] },
            skills: { type: 'string' },
            experience: { type: 'string' },
            education: { type: ['string', 'null'] },
            summary: { type: ['string', 'null'] }
          },
          required: ['skills', 'experience'],
          additionalProperties: false
        }
      }
    }
  });

  // Check if response has choices
  if (!response.choices || response.choices.length === 0) {
    throw new Error('Failed to parse resume: No response from AI');
  }
  
  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Failed to parse resume: Invalid response from AI');
  }

  return JSON.parse(content);
}

/**
 * Parse resume text using AI for advanced structured extraction
 */
export async function parseResumeWithAI(resumeText: string): Promise<ParsedResume> {
  const prompt = `You are an expert resume parser. Extract structured information from the following resume text.

Resume Text:
${resumeText}

Extract and return a JSON object with comprehensive structured data including personal info, skills, experience, education, certifications, languages, and projects.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert resume parser that extracts structured data from resumes. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              personalInfo: {
                type: "object",
                properties: {
                  name: { type: ["string", "null"] },
                  email: { type: ["string", "null"] },
                  phone: { type: ["string", "null"] },
                  location: { type: ["string", "null"] },
                  linkedin: { type: ["string", "null"] },
                  github: { type: ["string", "null"] }
                },
                required: [],
                additionalProperties: false
              },
              summary: { type: ["string", "null"] },
              skills: {
                type: "array",
                items: { type: "string" }
              },
              experience: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: ["string", "null"] },
                    company: { type: ["string", "null"] },
                    location: { type: ["string", "null"] },
                    startDate: { type: ["string", "null"] },
                    endDate: { type: ["string", "null"] },
                    description: { type: ["string", "null"] },
                    duration: { type: ["string", "null"] }
                  },
                  required: [],
                  additionalProperties: false
                }
              },
              education: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    degree: { type: ["string", "null"] },
                    institution: { type: ["string", "null"] },
                    location: { type: ["string", "null"] },
                    graduationDate: { type: ["string", "null"] },
                    gpa: { type: ["string", "null"] },
                    fieldOfStudy: { type: ["string", "null"] }
                  },
                  required: [],
                  additionalProperties: false
                }
              },
              certifications: {
                type: "array",
                items: { type: "string" }
              },
              languages: {
                type: "array",
                items: { type: "string" }
              },
              projects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: ["string", "null"] },
                    description: { type: ["string", "null"] },
                    technologies: {
                      type: "array",
                      items: { type: "string" }
                    },
                    url: { type: ["string", "null"] }
                  },
                  required: [],
                  additionalProperties: false
                }
              }
            },
            required: ["personalInfo", "skills", "experience", "education", "certifications", "languages", "projects"],
            additionalProperties: false
          }
        }
      }
    });

    // Check if response has choices
    if (!response.choices || response.choices.length === 0) {
      throw new Error('Failed to parse resume: No response from AI');
    }
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    // Ensure content is a string
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const parsedData = JSON.parse(contentString);
    
    // Calculate metadata
    const metadata = calculateMetadata(parsedData);

    return {
      rawText: resumeText,
      ...parsedData,
      metadata
    };
  } catch (error) {
    console.error("Error parsing resume with AI:", error);
    throw new Error("Failed to parse resume");
  }
}

/**
 * Calculate resume metadata (experience years, seniority, domain)
 */
function calculateMetadata(parsedData: any): ParsedResume['metadata'] {
  // Calculate total experience years
  let totalExperienceYears = 0;
  if (parsedData.experience && Array.isArray(parsedData.experience)) {
    for (const exp of parsedData.experience) {
      if (exp.duration) {
        const years = extractYearsFromDuration(exp.duration);
        totalExperienceYears += years;
      }
    }
  }

  // Determine seniority level
  let seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' = 'entry';
  if (totalExperienceYears >= 10) seniorityLevel = 'executive';
  else if (totalExperienceYears >= 7) seniorityLevel = 'lead';
  else if (totalExperienceYears >= 4) seniorityLevel = 'senior';
  else if (totalExperienceYears >= 2) seniorityLevel = 'mid';

  // Categorize skills
  const skillCategories = categorizeSkills(parsedData.skills || []);

  // Determine primary domain
  const primaryDomain = determinePrimaryDomain(parsedData);

  return {
    totalExperienceYears,
    seniorityLevel,
    primaryDomain,
    skillCategories
  };
}

function extractYearsFromDuration(duration: string): number {
  const yearMatch = duration.match(/(\d+)\s*year/i);
  const monthMatch = duration.match(/(\d+)\s*month/i);
  
  let years = yearMatch ? parseInt(yearMatch[1]) : 0;
  const months = monthMatch ? parseInt(monthMatch[1]) : 0;
  
  years += months / 12;
  return years;
}

function categorizeSkills(skills: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    'Programming Languages': [],
    'Frameworks & Libraries': [],
    'Databases': [],
    'Cloud & DevOps': [],
    'Tools & Platforms': [],
    'Soft Skills': [],
    'Other': []
  };

  const programmingLanguages = ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab'];
  const frameworks = ['react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel', '.net', 'rails', 'nextjs', 'nestjs'];
  const databases = ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'oracle', 'sql server', 'sqlite'];
  const cloudDevOps = ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible', 'ci/cd'];
  const softSkills = ['leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking', 'project management', 'agile', 'scrum'];

  for (const skill of skills) {
    const lowerSkill = skill.toLowerCase();
    
    if (programmingLanguages.some(lang => lowerSkill.includes(lang))) {
      categories['Programming Languages'].push(skill);
    } else if (frameworks.some(fw => lowerSkill.includes(fw))) {
      categories['Frameworks & Libraries'].push(skill);
    } else if (databases.some(db => lowerSkill.includes(db))) {
      categories['Databases'].push(skill);
    } else if (cloudDevOps.some(cd => lowerSkill.includes(cd))) {
      categories['Cloud & DevOps'].push(skill);
    } else if (softSkills.some(ss => lowerSkill.includes(ss))) {
      categories['Soft Skills'].push(skill);
    } else {
      categories['Other'].push(skill);
    }
  }

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

function determinePrimaryDomain(parsedData: any): string {
  const skills = (parsedData.skills || []).map((s: string) => s.toLowerCase());
  const experience = parsedData.experience || [];
  
  const domains = {
    'Software Engineering': ['software', 'developer', 'engineer', 'programming', 'coding'],
    'Data Science': ['data scientist', 'machine learning', 'ai', 'analytics', 'data analysis'],
    'DevOps': ['devops', 'sre', 'infrastructure', 'cloud engineer', 'platform engineer'],
    'Product Management': ['product manager', 'product owner', 'product strategy'],
    'Design': ['designer', 'ux', 'ui', 'user experience', 'user interface'],
    'Marketing': ['marketing', 'seo', 'content', 'social media', 'digital marketing'],
    'Sales': ['sales', 'business development', 'account manager'],
    'Finance': ['finance', 'accounting', 'financial analyst', 'controller'],
    'Healthcare': ['healthcare', 'medical', 'nurse', 'doctor', 'clinical']
  };

  let maxScore = 0;
  let primaryDomain = 'General';

  for (const [domain, keywords] of Object.entries(domains)) {
    let score = 0;
    
    for (const skill of skills) {
      if (keywords.some(kw => skill.includes(kw))) {
        score += 1;
      }
    }
    
    for (const exp of experience) {
      const title = (exp.title || '').toLowerCase();
      if (keywords.some(kw => title.includes(kw))) {
        score += 2;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      primaryDomain = domain;
    }
  }

  return primaryDomain;
}

/**
 * Rank resumes by skill match strength
 */
export async function rankResumesBySkills(
  resumes: Array<{ candidateId: number; parsedResume: ParsedResume }>,
  requiredSkills: string[]
): Promise<ResumeRanking[]> {
  const rankings: ResumeRanking[] = [];

  for (const { candidateId, parsedResume } of resumes) {
    const ranking = calculateResumeRanking(candidateId, parsedResume, requiredSkills);
    rankings.push(ranking);
  }

  rankings.sort((a, b) => b.overallScore - a.overallScore);
  return rankings;
}

function calculateResumeRanking(
  candidateId: number,
  parsedResume: ParsedResume,
  requiredSkills: string[]
): ResumeRanking {
  const candidateSkills = parsedResume.skills.map(s => s.toLowerCase());
  const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());

  const skillMatches: SkillMatch[] = [];
  let matchedCount = 0;

  for (const reqSkill of requiredSkillsLower) {
    const match = candidateSkills.find(cs => 
      cs.includes(reqSkill) || reqSkill.includes(cs) || calculateSimilarity(cs, reqSkill) > 0.8
    );

    if (match) {
      matchedCount++;
      const strength = calculateSkillStrength(match, parsedResume);
      const category = getSkillCategory(match, parsedResume.metadata.skillCategories || {});
      
      skillMatches.push({
        skill: match,
        strength,
        category,
        relevance: 1.0
      });
    }
  }

  const matchPercentage = (matchedCount / requiredSkillsLower.length) * 100;
  const experienceScore = calculateExperienceScore(parsedResume);
  const educationScore = calculateEducationScore(parsedResume);

  const overallScore = (
    matchPercentage * 0.5 +
    experienceScore * 0.3 +
    educationScore * 0.2
  );

  return {
    candidateId,
    overallScore: Math.round(overallScore),
    skillMatches,
    experienceScore: Math.round(experienceScore),
    educationScore: Math.round(educationScore),
    matchedSkillsCount: matchedCount,
    totalSkillsCount: requiredSkillsLower.length,
    matchPercentage: Math.round(matchPercentage)
  };
}

function calculateSkillStrength(skill: string, parsedResume: ParsedResume): number {
  let strength = 50;

  const experienceDescriptions = parsedResume.experience
    .map(exp => (exp.description || '').toLowerCase())
    .join(' ');

  const skillMentions = (experienceDescriptions.match(new RegExp(skill, 'gi')) || []).length;
  strength += Math.min(skillMentions * 5, 30);

  const recentExperience = parsedResume.experience.slice(0, 2);
  const inRecentExp = recentExperience.some(exp => 
    (exp.description || '').toLowerCase().includes(skill)
  );
  if (inRecentExp) strength += 20;

  return Math.min(strength, 100);
}

function calculateExperienceScore(parsedResume: ParsedResume): number {
  const years = parsedResume.metadata.totalExperienceYears || 0;
  
  if (years >= 10) return 100;
  if (years >= 7) return 90;
  if (years >= 5) return 80;
  if (years >= 3) return 70;
  if (years >= 1) return 60;
  return 50;
}

function calculateEducationScore(parsedResume: ParsedResume): number {
  if (!parsedResume.education || parsedResume.education.length === 0) return 50;

  const degrees = parsedResume.education.map(edu => (edu.degree || '').toLowerCase());
  
  if (degrees.some(d => d.includes('phd') || d.includes('doctorate'))) return 100;
  if (degrees.some(d => d.includes('master') || d.includes('mba') || d.includes('ms'))) return 90;
  if (degrees.some(d => d.includes('bachelor') || d.includes('bs') || d.includes('ba'))) return 80;
  if (degrees.some(d => d.includes('associate'))) return 70;
  
  return 60;
}

function getSkillCategory(skill: string, skillCategories: Record<string, string[]>): string {
  for (const [category, skills] of Object.entries(skillCategories)) {
    if (skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      return category;
    }
  }
  return 'Other';
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
