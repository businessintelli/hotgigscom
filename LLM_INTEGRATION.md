# LLM Integration Guide

This document explains how the HotGigs platform integrates with Large Language Models (LLMs) for AI-powered features.

## Overview

HotGigs uses LLMs for multiple AI-powered features:
- **Resume Parsing**: Extract skills, experience, and education from resumes
- **Job Description Generation**: Create compelling job descriptions
- **Candidate Matching**: Intelligent matching between candidates and jobs
- **Interview Question Generation**: Create relevant interview questions
- **Interview Evaluation**: Analyze and score candidate responses
- **Career Coaching**: Provide personalized career advice
- **Recruiting Assistant**: Data-driven insights for recruiters

## LLM Providers

The platform supports two LLM providers:

### 1. Manus Forge API (Built-in)

**Advantages**:
- Pre-configured in Manus environment
- No manual setup required
- Automatic API key injection
- Includes LLM, storage, and notification services

**Configuration**:
```env
# Automatically injected in Manus environment
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

### 2. OpenAI API (Optional)

**Advantages**:
- Access to latest GPT models
- Advanced features (function calling, structured outputs)
- Higher rate limits with paid plans

**Configuration**:
```env
OPENAI_API_KEY=sk-your-openai-api-key
```

**Getting an API Key**:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Add to `.env` file

## Usage Examples

### Basic LLM Call

```typescript
import { invokeLLM } from './server/_core/llm';

const response = await invokeLLM({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, world!' }
  ]
});

console.log(response.choices[0].message.content);
```

### Resume Parsing

```typescript
import { invokeLLM } from './server/_core/llm';

async function parseResume(resumeText: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are an expert resume parser. Extract structured information from resumes.'
      },
      {
        role: 'user',
        content: `Parse this resume and extract skills, experience, and education:\n\n${resumeText}`
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
            skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of skills mentioned in the resume'
            },
            experience: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company: { type: 'string' },
                  title: { type: 'string' },
                  duration: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['company', 'title']
              }
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  institution: { type: 'string' },
                  degree: { type: 'string' },
                  field: { type: 'string' },
                  year: { type: 'string' }
                },
                required: ['institution', 'degree']
              }
            }
          },
          required: ['skills', 'experience', 'education']
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Job Description Generation

```typescript
async function generateJobDescription(jobTitle: string, requirements: string[]) {
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are an expert recruiter. Write compelling job descriptions.'
      },
      {
        role: 'user',
        content: `Create a job description for: ${jobTitle}\n\nRequirements:\n${requirements.join('\n')}`
      }
    ]
  });

  return response.choices[0].message.content;
}
```

### Candidate Matching

```typescript
async function calculateMatchScore(
  candidateSkills: string[],
  jobRequirements: string[]
) {
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are an expert at matching candidates to jobs based on skills.'
      },
      {
        role: 'user',
        content: `Rate the match between candidate skills and job requirements on a scale of 0-100.\n\nCandidate Skills: ${candidateSkills.join(', ')}\n\nJob Requirements: ${jobRequirements.join(', ')}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'match_score',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            score: {
              type: 'number',
              description: 'Match score from 0-100'
            },
            reasoning: {
              type: 'string',
              description: 'Explanation of the score'
            },
            missing_skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Skills the candidate is missing'
            }
          },
          required: ['score', 'reasoning', 'missing_skills']
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Interview Question Generation

```typescript
async function generateInterviewQuestions(
  jobTitle: string,
  skills: string[],
  count: number = 5
) {
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are an expert interviewer. Generate relevant interview questions.'
      },
      {
        role: 'user',
        content: `Generate ${count} interview questions for a ${jobTitle} position requiring: ${skills.join(', ')}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'interview_questions',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  category: { type: 'string' },
                  difficulty: { type: 'string' }
                },
                required: ['question', 'category', 'difficulty']
              }
            }
          },
          required: ['questions']
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Interview Response Evaluation

```typescript
async function evaluateInterviewResponse(
  question: string,
  response: string,
  jobTitle: string
) {
  const llmResponse = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `You are an expert interviewer evaluating candidates for a ${jobTitle} position.`
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nCandidate Response: ${response}\n\nEvaluate this response.`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'evaluation',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            score: {
              type: 'number',
              description: 'Score from 0-100'
            },
            strengths: {
              type: 'array',
              items: { type: 'string' }
            },
            weaknesses: {
              type: 'array',
              items: { type: 'string' }
            },
            feedback: {
              type: 'string',
              description: 'Detailed feedback'
            }
          },
          required: ['score', 'strengths', 'weaknesses', 'feedback']
        }
      }
    }
  });

  return JSON.parse(llmResponse.choices[0].message.content);
}
```

## Advanced Features

### Structured Outputs (JSON Schema)

Use `response_format` to get structured JSON responses:

```typescript
const response = await invokeLLM({
  messages: [...],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'output_schema',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          // Define your schema here
        },
        required: ['field1', 'field2']
      }
    }
  }
});
```

### Function Calling

Use tools for function calling:

```typescript
const response = await invokeLLM({
  messages: [...],
  tools: [
    {
      type: 'function',
      function: {
        name: 'search_candidates',
        description: 'Search for candidates matching criteria',
        parameters: {
          type: 'object',
          properties: {
            skills: {
              type: 'array',
              items: { type: 'string' }
            },
            experience_years: {
              type: 'number'
            }
          },
          required: ['skills']
        }
      }
    }
  ],
  tool_choice: 'auto'
});
```

### Multimodal Inputs (Images)

Analyze images (resumes, screenshots):

```typescript
const response = await invokeLLM({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extract text from this resume image'
        },
        {
          type: 'image_url',
          image_url: {
            url: 'https://example.com/resume.jpg',
            detail: 'high'
          }
        }
      ]
    }
  ]
});
```

## Best Practices

### Error Handling

Always wrap LLM calls in try-catch:

```typescript
try {
  const response = await invokeLLM({
    messages: [...]
  });
  return response.choices[0].message.content;
} catch (error) {
  console.error('LLM error:', error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to process AI request'
  });
}
```

### Rate Limiting

Implement rate limiting for LLM calls:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m')
});

async function rateLimitedLLMCall(userId: string, messages: Message[]) {
  const { success } = await ratelimit.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  return await invokeLLM({ messages });
}
```

### Caching

Cache LLM responses for identical requests:

```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

async function cachedLLMCall(cacheKey: string, messages: Message[]) {
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Call LLM
  const response = await invokeLLM({ messages });
  const result = response.choices[0].message.content;

  // Cache result (24 hours)
  await redis.set(cacheKey, result, { ex: 86400 });

  return result;
}
```

### Cost Optimization

**Tips to reduce costs**:
1. Use caching for repeated requests
2. Implement rate limiting
3. Use shorter prompts when possible
4. Use structured outputs to reduce parsing needs
5. Batch similar requests
6. Use appropriate model sizes (don't always use GPT-4)

### Security

**Never expose API keys**:
- Keep keys in environment variables
- Never commit keys to version control
- Use server-side calls only
- Implement proper authentication

**Sanitize inputs**:
```typescript
function sanitizeInput(input: string): string {
  // Remove potentially harmful content
  return input
    .replace(/[<>]/g, '')
    .substring(0, 10000); // Limit length
}
```

## Monitoring & Debugging

### Logging

Log LLM calls for debugging:

```typescript
async function loggedLLMCall(messages: Message[]) {
  console.log('LLM Request:', {
    timestamp: new Date().toISOString(),
    messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 100) }))
  });

  const start = Date.now();
  const response = await invokeLLM({ messages });
  const duration = Date.now() - start;

  console.log('LLM Response:', {
    duration,
    tokens: response.usage?.total_tokens
  });

  return response;
}
```

### Error Tracking

Use Sentry or similar for error tracking:

```typescript
import * as Sentry from '@sentry/node';

try {
  const response = await invokeLLM({ messages });
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'llm' },
    extra: { messages }
  });
  throw error;
}
```

## Testing

### Mock LLM Responses

For testing, mock LLM calls:

```typescript
// test/mocks/llm.ts
export const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [{
    message: {
      content: JSON.stringify({
        skills: ['JavaScript', 'TypeScript'],
        experience: [],
        education: []
      })
    }
  }]
});

// In tests
vi.mock('./server/_core/llm', () => ({
  invokeLLM: mockInvokeLLM
}));
```

## Troubleshooting

### Common Issues

**API Key Invalid**:
- Verify key in `.env` file
- Check key hasn't expired
- Ensure no extra spaces or quotes

**Rate Limit Exceeded**:
- Implement rate limiting
- Use caching
- Upgrade API plan

**Timeout Errors**:
- Increase timeout setting
- Reduce prompt length
- Use streaming for long responses

**Unexpected Responses**:
- Improve prompt clarity
- Use structured outputs
- Add examples in prompts

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Manus Forge API Documentation](https://docs.manus.im)
- [Best Practices for Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)

## Support

For LLM integration issues:
- Check API status pages
- Review error logs
- Test with simple prompts
- Contact support: ai@hotgigs.com
