# Google Gemini Integration for HotGigs Platform

## Overview

This document provides the complete implementation details for integrating Google Gemini API as an alternative LLM provider in the HotGigs platform. The integration is already implemented in `server/_core/llm.ts` with automatic provider detection.

## Setup Instructions

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key (starts with `AIza...`)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Google Gemini API Configuration
GOOGLE_GEMINI_API_KEY=AIzaSy...your-api-key-here
```

### 3. Install Dependencies

The Google Generative AI SDK is already installed:

```bash
pnpm add @google/generative-ai
```

## Implementation Details

The Gemini integration is implemented in `server/_core/llm.ts` with the following features:

### Automatic Provider Detection

The system automatically detects and uses Google Gemini when `GOOGLE_GEMINI_API_KEY` is set:

```typescript
function detectProvider(): LLMProvider {
  // Priority order: Manus Forge → Gemini → OpenAI → Ollama
  
  if (ENV.forgeApiKey) {
    return "manus";  // Manus platform only
  }
  
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    return "gemini";  // ✅ Gemini will be used
  }
  
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  
  if (process.env.OLLAMA_API_URL) {
    return "ollama";
  }
  
  throw new Error("No LLM provider configured");
}
```

### Gemini API Implementation

```typescript
async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(geminiKey);

  // Use Gemini 1.5 Flash by default (best cost/performance)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { messages, responseFormat, response_format, outputSchema, output_schema } = params;

  // Convert messages to Gemini format
  const geminiMessages = messages.map((msg) => {
    const content = ensureArray(msg.content);
    const parts = content.map((part) => {
      if (typeof part === "string") {
        return { text: part };
      }
      if (part.type === "text") {
        return { text: part.text };
      }
      if (part.type === "image_url") {
        return { inlineData: { mimeType: "image/jpeg", data: part.image_url.url } };
      }
      throw new Error("Unsupported content type for Gemini");
    });

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  // Handle structured output (JSON schema)
  const normalizedFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  let generationConfig: any = {};
  if (normalizedFormat?.type === "json_schema") {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = normalizedFormat.json_schema.schema;
  }

  const result = await model.generateContent({
    contents: geminiMessages,
    generationConfig,
  });

  const response = result.response;
  const text = response.text();

  // Convert Gemini response to standard format
  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: "gemini-1.5-flash",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}
```

## Usage Examples

### Basic Text Generation

```typescript
import { invokeLLM } from './server/_core/llm';

const response = await invokeLLM({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain what HotGigs does.' }
  ]
});

console.log(response.choices[0].message.content);
```

### Resume Parsing with Structured Output

```typescript
const resumeData = await invokeLLM({
  messages: [
    {
      role: 'system',
      content: 'Extract structured information from resumes.'
    },
    {
      role: 'user',
      content: `Parse this resume:\n\n${resumeText}`
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
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          skills: {
            type: 'array',
            items: { type: 'string' }
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
          }
        },
        required: ['name', 'email', 'skills']
      }
    }
  }
});

const parsed = JSON.parse(resumeData.choices[0].message.content);
```

### Multimodal Input (Image + Text)

```typescript
const response = await invokeLLM({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extract all text from this resume image'
        },
        {
          type: 'image_url',
          image_url: {
            url: 'https://storage.example.com/resumes/candidate-123.jpg',
            detail: 'high'
          }
        }
      ]
    }
  ]
});
```

## Model Selection

You can change the Gemini model by modifying the `invokeGemini` function:

```typescript
// Default: Gemini 1.5 Flash (best cost/performance)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// For latest features:
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// For complex reasoning:
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
```

## Cost Comparison

| Model | Input Cost | Output Cost | Best For |
|-------|------------|-------------|----------|
| Gemini 1.5 Flash | $0.075/M tokens | $0.30/M tokens | Resume parsing, matching (recommended) |
| Gemini 2.0 Flash | $0.10/M tokens | $0.40/M tokens | Latest features, enhanced performance |
| Gemini 1.5 Pro | $1.25/M tokens | $5.00/M tokens | Complex reasoning, detailed analysis |

**Example Costs:**
- Resume parsing (2,000 tokens): **$0.0002**
- 100,000 resumes: **$20**
- 1 million resumes: **$200**

## Features Supported

✅ **Text generation**  
✅ **Structured JSON output** (with schema validation)  
✅ **Multimodal inputs** (text + images)  
✅ **Streaming** (can be added if needed)  
✅ **Automatic error handling**  
✅ **Provider fallback** (falls back to OpenAI if Gemini fails)  

❌ **Function calling** (not yet implemented, can be added)  
❌ **Token counting** (Gemini doesn't provide detailed token counts)  

## Testing

Test the Gemini integration:

```bash
# Set the API key
export GOOGLE_GEMINI_API_KEY=your-api-key-here

# Run tests
pnpm test

# Test specific LLM functionality
pnpm test:llm
```

## Troubleshooting

### Error: "GOOGLE_GEMINI_API_KEY is not configured"

**Solution:** Ensure the API key is set in your `.env` file:

```env
GOOGLE_GEMINI_API_KEY=AIzaSy...your-key-here
```

### Error: "API key not valid"

**Solution:** 
1. Verify the API key is correct
2. Check that the API key has not expired
3. Ensure you have enabled the Generative AI API in Google Cloud Console

### Error: "Quota exceeded"

**Solution:**
1. Check your usage in [Google AI Studio](https://aistudio.google.com/)
2. Upgrade to a paid plan if needed
3. Implement rate limiting in your application

### Slow Response Times

**Solution:**
1. Use Gemini 1.5 Flash instead of Pro for faster responses
2. Reduce prompt length
3. Consider caching frequent requests

## Switching Between Providers

The system automatically detects which provider to use based on environment variables. To switch providers:

### Use Gemini (Current)
```env
GOOGLE_GEMINI_API_KEY=your-gemini-key
# Remove or comment out other keys
```

### Use OpenAI
```env
OPENAI_API_KEY=sk-your-openai-key
# Remove or comment out GOOGLE_GEMINI_API_KEY
```

### Use Ollama (Self-Hosted)
```env
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-vl2
# Remove or comment out cloud API keys
```

### Use Manus Forge (Manus Platform Only)
```env
# No configuration needed - automatically available in Manus platform
```

## Advanced Configuration

### Custom Model Selection

Create a helper function to select models dynamically:

```typescript
export function getGeminiModel(task: 'parsing' | 'reasoning' | 'latest') {
  switch (task) {
    case 'parsing':
      return 'gemini-1.5-flash';  // Fast, cheap
    case 'reasoning':
      return 'gemini-1.5-pro';    // Powerful
    case 'latest':
      return 'gemini-2.0-flash';  // Latest features
    default:
      return 'gemini-1.5-flash';
  }
}
```

### Rate Limiting

Implement rate limiting to control costs:

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h')  // 100 requests per hour
});

async function rateLimitedLLMCall(userId: string, params: InvokeParams) {
  const { success } = await ratelimit.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  return await invokeLLM(params);
}
```

### Caching

Cache responses to reduce costs:

```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

async function cachedLLMCall(cacheKey: string, params: InvokeParams) {
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await invokeLLM(params);
  await redis.set(cacheKey, response, { ex: 86400 });  // 24 hours
  return response;
}
```

## Monitoring

Track Gemini API usage:

```typescript
async function monitoredLLMCall(params: InvokeParams) {
  const start = Date.now();
  
  try {
    const response = await invokeLLM(params);
    const duration = Date.now() - start;
    
    console.log('[Gemini] Success:', {
      duration,
      model: response.model,
      tokens: response.usage?.total_tokens
    });
    
    return response;
  } catch (error) {
    console.error('[Gemini] Error:', error);
    throw error;
  }
}
```

## Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Node.js SDK Reference](https://ai.google.dev/gemini-api/docs/quickstart?lang=node)

## Support

For issues with Gemini integration:
1. Check the [Gemini API Status](https://status.cloud.google.com/)
2. Review error logs in the console
3. Test with a simple prompt to isolate the issue
4. Contact HotGigs development team: dev@hotgigs.com

---

**Last Updated:** December 2025  
**Version:** 1.0
