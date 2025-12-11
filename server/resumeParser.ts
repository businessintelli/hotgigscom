import mammoth from 'mammoth';
import { invokeLLM } from './_core/llm';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

/**
 * Parse resume text using AI to extract structured information
 */
export async function parseResumeWithAI(resumeText: string): Promise<{
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

  const content = response.choices[0].message.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Failed to parse resume: No response from AI');
  }

  return JSON.parse(content);
}
