import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// LLM Provider Types
export type LLMProvider = "manus" | "gemini" | "openai" | "ollama";

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

/**
 * Detect which LLM provider to use based on environment variables
 * Priority order: Manus Forge → Google Gemini → OpenAI → Ollama
 */
function detectProvider(): LLMProvider {
  // Check for Manus Forge API (only available in Manus platform)
  if (ENV.forgeApiKey && ENV.forgeApiKey.trim().length > 0) {
    console.log("[LLM] Using Manus Forge API");
    return "manus";
  }

  // Check for Google Gemini API
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim().length > 0) {
    console.log("[LLM] Using Google Gemini API");
    return "gemini";
  }

  // Check for OpenAI API
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim().length > 0) {
    console.log("[LLM] Using OpenAI API");
    return "openai";
  }

  // Check for Ollama (self-hosted)
  const ollamaUrl = process.env.OLLAMA_API_URL;
  if (ollamaUrl && ollamaUrl.trim().length > 0) {
    console.log("[LLM] Using Ollama (self-hosted)");
    return "ollama";
  }

  throw new Error(
    "No LLM provider configured. Please set one of: BUILT_IN_FORGE_API_KEY, GOOGLE_GEMINI_API_KEY, OPENAI_API_KEY, or OLLAMA_API_URL"
  );
}

/**
 * Invoke Manus Forge API
 */
async function invokeManusForge(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  const resolveApiUrl = () =>
    ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
      ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
      : "https://forge.manus.im/v1/chat/completions";

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 32768;
  payload.thinking = {
    budget_tokens: 128,
  };

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Manus Forge API failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}

/**
 * Invoke Google Gemini API
 */
async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(geminiKey);

  // Use Gemini 1.5 Flash by default (best cost/performance for resume parsing)
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

  // Handle structured output
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
      prompt_tokens: 0, // Gemini doesn't provide token counts in the same way
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

/**
 * Invoke OpenAI API
 */
async function invokeOpenAI(params: InvokeParams): Promise<InvokeResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gpt-3.5-turbo", // Default to GPT-3.5 for cost efficiency
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  if (maxTokens || max_tokens) {
    payload.max_tokens = maxTokens || max_tokens;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI API failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}

/**
 * Invoke Ollama (self-hosted)
 */
async function invokeOllama(params: InvokeParams): Promise<InvokeResult> {
  const ollamaUrl = process.env.OLLAMA_API_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "deepseek-vl2";

  const {
    messages,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: ollamaModel,
    messages: messages.map(normalizeMessage),
    stream: false,
  };

  // Handle structured output for Ollama
  const normalizedFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedFormat?.type === "json_schema") {
    payload.format = "json";
  }

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama API failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = await response.json();

  // Convert Ollama response to standard format
  return {
    id: `ollama-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: ollamaModel,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: result.message.content,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: result.prompt_eval_count || 0,
      completion_tokens: result.eval_count || 0,
      total_tokens: (result.prompt_eval_count || 0) + (result.eval_count || 0),
    },
  };
}

/**
 * Main LLM invocation function with automatic provider detection
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const provider = detectProvider();

  try {
    switch (provider) {
      case "manus":
        return await invokeManusForge(params);
      case "gemini":
        return await invokeGemini(params);
      case "openai":
        return await invokeOpenAI(params);
      case "ollama":
        return await invokeOllama(params);
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[LLM] Error with provider ${provider}:`, error);
    throw error;
  }
}

/**
 * Get the current active LLM provider
 */
export function getCurrentProvider(): LLMProvider {
  return detectProvider();
}
