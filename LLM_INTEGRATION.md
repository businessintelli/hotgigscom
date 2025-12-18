# LLM Integration Guide for HotGigs Platform

## Overview

The HotGigs platform leverages Large Language Models (LLMs) for critical recruitment features including resume parsing, candidate matching, interview question generation, career coaching, and AI-powered recruiting assistance. This document provides a comprehensive guide to LLM integration across different deployment environments, with detailed cost analysis and implementation strategies.

## Deployment Options

The platform supports multiple LLM providers with automatic fallback logic, allowing you to choose the most cost-effective solution for your deployment environment.

### Option 1: Manus Forge API (Built-in, Manus Platform Only)

The Manus Forge API is a pre-configured LLM service available exclusively when running within the Manus platform environment. This option provides zero-configuration integration with automatic API key injection.

**Availability:** This service is **only available when deployed on the Manus platform**. When deploying to AWS, local servers, Docker, or other cloud providers, you must use one of the alternative options below.

**Advantages:**
- Pre-configured in Manus environment with no manual setup required
- Automatic API key injection through environment variables
- Includes integrated LLM, storage, and notification services
- No billing management needed

**Configuration:**

The following environment variables are automatically injected in the Manus environment:

```env
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

**Usage:** The application automatically detects these variables and uses the Manus Forge API when available. No code changes required.

---

### Option 2: Google Gemini API (Recommended for Self-Hosted)

Google Gemini provides exceptional value for document understanding tasks, offering performance comparable to GPT-4 at a fraction of the cost. Gemini 1.5 Flash is particularly well-suited for resume parsing and structured data extraction.

**Advantages:**
- **95% cheaper than GPT-4** for similar tasks
- Excellent multimodal capabilities (text + images)
- Strong document understanding and OCR
- Fast inference with low latency
- Free tier available (15 requests/minute)
- No upfront infrastructure costs

**Pricing (2025):**

| Model | Input Cost | Output Cost | Best For |
|-------|------------|-------------|----------|
| Gemini 1.5 Flash | $0.075/M tokens | $0.30/M tokens | Resume parsing, matching (recommended) |
| Gemini 2.0 Flash | $0.10/M tokens | $0.40/M tokens | Latest features, enhanced performance |
| Gemini 1.5 Pro | $1.25/M tokens | $5.00/M tokens | Complex reasoning, detailed analysis |

**Cost Example:**
- Average resume parsing: ~2,000 tokens
- Cost per resume: **$0.0002** (Gemini 1.5 Flash)
- 100,000 resumes: **$20**
- 1 million resumes: **$200**

**Setup:**

1. Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)

2. Add to your `.env` file:

```env
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
```

3. The application will automatically detect and use Gemini when the key is present.

**Implementation:** See the "Multi-Provider Implementation" section below for code details.

---

### Option 3: OpenAI API (Industry Standard)

OpenAI provides the most widely-used LLM APIs with excellent performance and reliability. While more expensive than Gemini, it offers robust performance for complex reasoning tasks.

**Advantages:**
- Industry-leading performance on complex tasks
- Extensive documentation and community support
- Reliable infrastructure with high availability
- Advanced features (function calling, structured outputs)

**Pricing (2025):**

| Model | Input Cost | Output Cost | Use Case |
|-------|------------|-------------|----------|
| GPT-4 Turbo | $10.00/M tokens | $30.00/M tokens | Complex reasoning, edge cases |
| GPT-4o | $2.50/M tokens | $10.00/M tokens | Balanced performance and cost |
| GPT-3.5 Turbo | $0.50/M tokens | $1.50/M tokens | Simple tasks, high volume |

**Cost Example:**
- Average resume parsing: ~2,000 tokens
- Cost per resume: **$0.002** (GPT-3.5 Turbo)
- 100,000 resumes: **$200**
- 1 million resumes: **$2,000**

**Setup:**

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

2. Add to your `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

3. The application will automatically use OpenAI when configured.

---

### Option 4: Self-Hosted LLMs with Ollama (Cost-Optimized for High Volume)

For organizations processing large volumes of resumes (500,000+ per month) or requiring complete data privacy, self-hosting open-source LLMs can significantly reduce operational costs after the initial hardware investment.

**When to Consider Self-Hosting:**
- Processing 500,000+ resumes per month
- Monthly API costs exceed $500
- Data privacy and compliance requirements mandate on-premises processing
- Dedicated DevOps resources available
- Predictable, high-volume workloads

**Recommended Open-Source Models:**

| Model | Parameters | Context | Strengths | API Cost Equivalent |
|-------|-----------|---------|-----------|---------------------|
| DeepSeek-VL2 | 27B (4.5B active) | 4K | Exceptional OCR, document understanding, most efficient | $0.15/M tokens |
| Qwen2.5-VL-72B | 72B | 131K | Structured data extraction, complex documents | $0.59/M tokens |
| GLM-4.5V | 106B (12B active) | 66K | Deep reasoning, long documents | $0.86/M tokens |

**Hardware Requirements:**

**Budget Setup ($800-1,200):**
- CPU: Modern multi-core (Ryzen 5/i5 or better)
- RAM: 16GB minimum (32GB recommended)
- GPU: NVIDIA RTX 3060 12GB
- Storage: 500GB SSD
- **Suitable for:** 7B-13B parameter models, development/testing

**Production Setup ($2,000-3,000):**
- CPU: Ryzen 7/i7 or better
- RAM: 32-64GB
- GPU: NVIDIA RTX 4070 Ti 16GB or RTX 4080
- Storage: 1TB NVMe SSD
- **Suitable for:** 13B-30B parameter models (recommended for HotGigs)

**Enterprise Setup ($5,000+):**
- CPU: Threadripper/Xeon
- RAM: 128GB+
- GPU: NVIDIA RTX 4090 24GB or A6000 48GB
- Storage: 2TB NVMe SSD
- **Suitable for:** 70B+ parameter models, maximum performance

**Total Cost of Ownership (3-Year Analysis):**

**Production Setup Example:**
- Hardware: $2,500 (one-time investment)
- Electricity: $15/month × 36 months = $540
- Maintenance/Upgrades: $500
- **Total: $3,540 over 3 years** = $98/month average

**Break-Even Analysis:**

Comparing to Gemini 1.5 Flash ($0.19/M tokens average):
- Break-even point: ~18.6M tokens/month
- Equivalent to: ~560,000 resumes/month
- If processing fewer resumes: Cloud API is more cost-effective
- If processing more resumes: Self-hosting saves money

**Ollama Setup:**

1. Install Ollama on your server:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. Pull the recommended model:

```bash
# For resume parsing (most efficient)
ollama pull deepseek-vl2

# For complex document analysis
ollama pull qwen2.5-vl:72b
```

3. Configure environment variables:

```env
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-vl2
```

4. The application will automatically detect and use Ollama when configured.

**Advantages:**
- Zero per-request costs after initial investment
- Complete data privacy (no external API calls)
- No rate limits or usage quotas
- Customizable models and fine-tuning
- Works offline

**Disadvantages:**
- High upfront hardware cost ($2,500-5,000)
- Requires technical expertise for setup and maintenance
- Slower inference than cloud GPUs
- Ongoing electricity and maintenance costs
- Need to manage model updates manually

---

## Cost Comparison Summary

The following table compares the total cost of processing 1 million resumes across different providers:

| Provider | Model | Cost per Resume | Total Cost (1M resumes) | Break-Even Volume |
|----------|-------|-----------------|-------------------------|-------------------|
| **Gemini** | 1.5 Flash | $0.0002 | $200 | Best for 0-500K/month |
| **Gemini** | 2.0 Flash | $0.00025 | $250 | - |
| **OpenAI** | GPT-3.5 Turbo | $0.002 | $2,000 | Not recommended |
| **OpenAI** | GPT-4 Turbo | $0.02 | $20,000 | Edge cases only |
| **Self-Hosted** | DeepSeek-VL2 | $0.00035* | $350* | Best for 500K+/month |

*Self-hosted costs include amortized hardware, electricity, and maintenance over 3 years at 500K resumes/month.

---

## Multi-Provider Implementation

The platform implements automatic provider detection and fallback logic in `server/_core/llm.ts`. The system checks for available API keys in the following priority order:

1. **Manus Forge API** (if `BUILT_IN_FORGE_API_KEY` exists)
2. **Google Gemini** (if `GOOGLE_GEMINI_API_KEY` exists)
3. **OpenAI** (if `OPENAI_API_KEY` exists)
4. **Ollama** (if `OLLAMA_API_URL` is configured)

### Complete Implementation

See the `server/_core/llm.ts` file for the full multi-provider implementation with automatic fallback logic. The implementation supports:

- Automatic provider detection based on environment variables
- Consistent API interface across all providers
- Structured JSON output with schema validation
- Error handling and fallback mechanisms
- Support for multimodal inputs (text + images)

---

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

### Resume Parsing with Structured Output

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

### Multimodal Inputs (Resume Images)

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

---

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

Implement rate limiting for LLM calls to prevent abuse and control costs.

### Caching

Cache LLM responses for identical requests to reduce costs and improve performance.

### Cost Optimization

**Tips to reduce costs:**
1. Use caching for repeated requests
2. Implement rate limiting
3. Use shorter prompts when possible
4. Use structured outputs to reduce parsing needs
5. Batch similar requests
6. Choose appropriate models (don't always use GPT-4)

### Security

**Never expose API keys:**
- Keep keys in environment variables
- Never commit keys to version control
- Use server-side calls only
- Implement proper authentication

---

## Recommended Deployment Strategy

### Phase 1: Start with Cloud API (Months 1-6)

**Recommended:** Google Gemini 1.5 Flash

**Why:**
- Zero upfront cost enables fast time to market
- Scales automatically with demand
- No infrastructure management overhead
- Predictable per-resume pricing
- Easy to switch providers if needed

**Expected Cost:**
- 10,000 resumes/month: $2/month
- 100,000 resumes/month: $20/month
- 500,000 resumes/month: $100/month

### Phase 2: Evaluate Self-Hosting (After 6 months)

**Consider self-hosting when:**
- Consistently processing 500,000+ resumes per month
- Monthly API costs exceed $500
- Data privacy becomes a compliance requirement
- Have dedicated DevOps resources available

**Hybrid Approach (Optimal):**
- **Gemini Flash:** Real-time candidate matching, interactive queries
- **Self-hosted Ollama:** Batch processing, overnight resume parsing
- **OpenAI GPT-4:** Complex edge cases requiring advanced reasoning

This hybrid strategy minimizes costs while maintaining reliability and performance across different use cases.

---

## Environment Variables Reference

The following environment variables control LLM provider selection:

```env
# Manus Forge API (Manus platform only)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key

# Google Gemini (recommended for self-hosted)
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here

# OpenAI (industry standard)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Ollama (self-hosted)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-vl2
```

**Important:** Do not commit these values to version control. Always use environment variables or secure secret management systems.

---

## Testing and Validation

After configuring your LLM provider, test the integration:

```bash
# Run the test suite
pnpm test

# Test resume parsing specifically
pnpm test:resume-parser
```

Monitor performance and costs in production:
- Track token usage per request
- Monitor response times
- Set up alerts for cost thresholds
- Log provider fallback events

---

## Support and Resources

- **Manus Forge API:** Available only within Manus platform
- **Google Gemini:** [Documentation](https://ai.google.dev/gemini-api/docs) | [Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **OpenAI:** [Documentation](https://platform.openai.com/docs) | [Pricing](https://openai.com/api/pricing/)
- **Ollama:** [Documentation](https://ollama.com/docs) | [Models](https://ollama.com/library)

For questions or issues, refer to the respective provider documentation or contact the HotGigs development team.

---

**Last Updated:** December 2025  
**Version:** 2.0
