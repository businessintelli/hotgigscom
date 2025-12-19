import { invokeLLM } from './_core/llm';

/**
 * Industry domains that candidates and jobs can belong to
 */
export const INDUSTRY_DOMAINS = [
  'Technology',
  'Software Development',
  'Data Science & Analytics',
  'Artificial Intelligence & Machine Learning',
  'Cybersecurity',
  'Cloud Computing',
  'DevOps',
  'Healthcare',
  'Health Insurance',
  'Pharmaceuticals',
  'Medical Devices',
  'Biotechnology',
  'Finance & Banking',
  'Insurance',
  'Investment Management',
  'Accounting',
  'Automotive',
  'Auto Insurance',
  'Manufacturing',
  'Aerospace',
  'Electronics',
  'Government & Public Sector',
  'Defense',
  'Education',
  'Retail & E-commerce',
  'Telecommunications',
  'Energy & Utilities',
  'Real Estate',
  'Hospitality & Tourism',
  'Media & Entertainment',
  'Legal Services',
  'Consulting',
  'Human Resources',
  'Marketing & Advertising',
  'Sales',
  'Supply Chain & Logistics',
  'Construction',
  'Agriculture',
  'Non-Profit',
] as const;

/**
 * Common technical and professional skills
 */
export const COMMON_SKILLS = [
  // Programming Languages
  'Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  // Web Technologies
  'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'ASP.NET',
  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'SQL Server', 'Redis', 'Cassandra', 'DynamoDB',
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD', 'Terraform', 'Ansible',
  // AI/ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision', 'LLM', 'GenAI', 'AI/ML',
  // Data
  'Data Analysis', 'Data Visualization', 'Tableau', 'Power BI', 'Apache Spark', 'Hadoop', 'ETL', 'Data Warehousing',
  // Mobile
  'iOS Development', 'Android Development', 'React Native', 'Flutter',
  // Other Technical
  'Git', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'JIRA', 'Linux', 'Shell Scripting',
  // Business & Soft Skills
  'Project Management', 'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Critical Thinking',
  'Business Analysis', 'Strategic Planning', 'Stakeholder Management', 'Presentation Skills',
] as const;

export interface SkillsDomainsSeparationResult {
  skills: string[];
  domains: string[];
  confidence: number; // 0-100
  reasoning?: string;
}

/**
 * Separate skills and domains from raw text using LLM
 * @param rawText - Combined text containing both skills and domains
 * @param context - Additional context (e.g., 'resume', 'job_description')
 * @returns Separated skills and domains with confidence score
 */
export async function separateSkillsAndDomains(
  rawText: string,
  context: 'resume' | 'job_description' | 'candidate_profile' = 'resume'
): Promise<SkillsDomainsSeparationResult> {
  if (!rawText || rawText.trim().length === 0) {
    return {
      skills: [],
      domains: [],
      confidence: 100,
      reasoning: 'Empty input text',
    };
  }

  const systemPrompt = `You are an expert HR analyst specializing in categorizing professional information.

Your task is to separate SKILLS from INDUSTRY DOMAINS in the provided text.

**SKILLS** are specific technical or professional competencies, such as:
- Programming languages (Java, Python, JavaScript, etc.)
- Frameworks and libraries (React, Django, TensorFlow, etc.)
- Tools and technologies (Docker, AWS, Git, etc.)
- Methodologies (Agile, Scrum, DevOps, etc.)
- Soft skills (Leadership, Communication, Problem Solving, etc.)

**INDUSTRY DOMAINS** are broad industry sectors or business areas, such as:
- Technology, Software Development, Data Science
- Healthcare, Health Insurance, Pharmaceuticals
- Finance, Banking, Insurance, Investment
- Automotive, Auto Insurance, Manufacturing
- Government, Public Sector, Defense
- Education, Retail, Telecommunications, etc.

**Important Guidelines:**
1. Extract ONLY the items that are clearly present in the text
2. Normalize similar terms (e.g., "AI/ML" and "Machine Learning" → "Machine Learning", "Artificial Intelligence")
3. Remove duplicates and very similar items
4. For domains, prefer broader categories over very specific ones
5. If something could be both (e.g., "Healthcare Technology"), categorize it as a domain
6. Return empty arrays if no clear skills or domains are found

**Output Format:**
Return a JSON object with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "domains": ["domain1", "domain2", ...],
  "confidence": 85,
  "reasoning": "Brief explanation of categorization decisions"
}`;

  const userPrompt = `Context: ${context}

Text to analyze:
"""
${rawText}
"""

Please separate the skills and domains from this text.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'skills_domains_separation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              skills: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of technical and professional skills',
              },
              domains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of industry domains',
              },
              confidence: {
                type: 'integer',
                description: 'Confidence score from 0-100',
              },
              reasoning: {
                type: 'string',
                description: 'Brief explanation of categorization decisions',
              },
            },
            required: ['skills', 'domains', 'confidence'],
            additionalProperties: false,
          },
        },
      },
    });

    const message = response.choices[0]?.message;
    if (!message || !message.content) {
      throw new Error('No response from LLM');
    }

    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    const result = JSON.parse(content) as SkillsDomainsSeparationResult;
    
    // Validate and clean the result
    result.skills = result.skills.filter(s => s && s.trim().length > 0).map(s => s.trim());
    result.domains = result.domains.filter(d => d && d.trim().length > 0).map(d => d.trim());
    
    return result;
  } catch (error) {
    console.error('[SkillsDomainsSeparation] Error:', error);
    
    // Fallback: simple keyword-based separation
    return fallbackSeparation(rawText);
  }
}

/**
 * Fallback separation using simple keyword matching
 * Used when LLM call fails
 */
function fallbackSeparation(rawText: string): SkillsDomainsSeparationResult {
  const text = rawText.toLowerCase();
  const skills: string[] = [];
  const domains: string[] = [];

  // Check for common skills
  for (const skill of COMMON_SKILLS) {
    if (text.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }

  // Check for industry domains
  for (const domain of INDUSTRY_DOMAINS) {
    if (text.includes(domain.toLowerCase())) {
      domains.push(domain);
    }
  }

  return {
    skills: Array.from(new Set(skills)), // Remove duplicates
    domains: Array.from(new Set(domains)),
    confidence: 50, // Lower confidence for fallback
    reasoning: 'Fallback keyword-based separation (LLM unavailable)',
  };
}

/**
 * Separate skills and domains from parsed resume data
 * Combines information from multiple resume sections
 */
export async function separateSkillsAndDomainsFromResume(parsedResume: any): Promise<SkillsDomainsSeparationResult> {
  // Combine relevant text from resume
  const textParts: string[] = [];

  // Add skills section
  if (parsedResume.skills && Array.isArray(parsedResume.skills)) {
    textParts.push(parsedResume.skills.join(', '));
  }

  // Add experience titles and descriptions
  if (parsedResume.experience && Array.isArray(parsedResume.experience)) {
    for (const exp of parsedResume.experience) {
      if (exp.title) textParts.push(exp.title);
      if (exp.description) textParts.push(exp.description);
      if (exp.company) textParts.push(exp.company);
    }
  }

  // Add education specialization
  if (parsedResume.education && Array.isArray(parsedResume.education)) {
    for (const edu of parsedResume.education) {
      if (edu.degree) textParts.push(edu.degree);
      if (edu.field) textParts.push(edu.field);
    }
  }

  // Add certifications
  if (parsedResume.certifications && Array.isArray(parsedResume.certifications)) {
    textParts.push(parsedResume.certifications.join(', '));
  }

  // Add summary
  if (parsedResume.summary) {
    textParts.push(parsedResume.summary);
  }

  const combinedText = textParts.join('\n');
  return separateSkillsAndDomains(combinedText, 'resume');
}

/**
 * Separate skills and domains from job description
 */
export async function separateSkillsAndDomainsFromJob(jobData: {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
}): Promise<SkillsDomainsSeparationResult> {
  const textParts: string[] = [];

  if (jobData.title) textParts.push(jobData.title);
  if (jobData.description) textParts.push(jobData.description);
  if (jobData.requirements) textParts.push(jobData.requirements);
  if (jobData.responsibilities) textParts.push(jobData.responsibilities);

  const combinedText = textParts.join('\n');
  return separateSkillsAndDomains(combinedText, 'job_description');
}
