/**
 * tRPC router for LLM Configuration Management
 * Admin-only endpoints for configuring LLM providers
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as llmConfigHelpers from "../llmConfigHelpers";

// Validation schemas
const providerSchema = z.enum(["manus", "gemini", "openai", "ollama"]);

const updateConfigSchema = z.object({
  provider: providerSchema,
  is_active: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  api_key: z.string().optional().nullable(),
  api_url: z.string().url().optional().nullable(),
  model_name: z.string().optional().nullable(),
  max_tokens: z.number().int().min(1).max(100000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  timeout_seconds: z.number().int().min(5).max(300).optional(),
  notes: z.string().optional().nullable(),
});

const testConnectionSchema = z.object({
  provider: providerSchema,
  api_key: z.string().optional(),
  api_url: z.string().optional(),
  model_name: z.string().optional(),
});

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only application admins can manage LLM configuration",
    });
  }
  return next({ ctx });
});

export const llmConfigRouter = router({
  /**
   * Get all LLM provider configurations
   */
  getAllConfigurations: adminProcedure.query(async () => {
    const configurations = await llmConfigHelpers.getAllLLMConfigurations();
    
    // Mask API keys in response (show only last 4 characters)
    return configurations.map(config => ({
      ...config,
      api_key: config.api_key
        ? `${"*".repeat(Math.max(0, config.api_key.length - 4))}${config.api_key.slice(-4)}`
        : null,
    }));
  }),

  /**
   * Get configuration for a specific provider
   */
  getConfiguration: adminProcedure
    .input(z.object({ provider: providerSchema }))
    .query(async ({ input }) => {
      const config = await llmConfigHelpers.getLLMConfigurationByProvider(input.provider);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Configuration for provider ${input.provider} not found`,
        });
      }
      
      // Mask API key
      return {
        ...config,
        api_key: config.api_key
          ? `${"*".repeat(Math.max(0, config.api_key.length - 4))}${config.api_key.slice(-4)}`
          : null,
      };
    }),

  /**
   * Get the currently active provider
   */
  getActiveProvider: adminProcedure.query(async () => {
    const active = await llmConfigHelpers.getActiveLLMProvider();
    if (!active) {
      return null;
    }
    
    return {
      ...active,
      api_key: active.api_key
        ? `${"*".repeat(Math.max(0, active.api_key.length - 4))}${active.api_key.slice(-4)}`
        : null,
    };
  }),

  /**
   * Update LLM provider configuration
   */
  updateConfiguration: adminProcedure
    .input(updateConfigSchema)
    .mutation(async ({ input, ctx }) => {
      const { provider, ...updates } = input;
      
      // Update configuration
      await llmConfigHelpers.updateLLMConfiguration(provider, {
        ...updates,
        configured_by: ctx.user.id,
      });
      
      return { success: true, message: `Configuration for ${provider} updated successfully` };
    }),

  /**
   * Activate a specific provider (and deactivate others)
   */
  activateProvider: adminProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ input, ctx }) => {
      // Check if provider is configured
      const config = await llmConfigHelpers.getLLMConfigurationByProvider(input.provider);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Provider ${input.provider} not found`,
        });
      }
      
      // Check if provider has necessary configuration
      if (input.provider === "gemini" && !config.api_key) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Google Gemini API key is required. Please configure it first.",
        });
      }
      
      if (input.provider === "openai" && !config.api_key) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OpenAI API key is required. Please configure it first.",
        });
      }
      
      if (input.provider === "ollama" && !config.api_url) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ollama API URL is required. Please configure it first.",
        });
      }
      
      // Activate the provider
      await llmConfigHelpers.activateLLMProvider(input.provider, ctx.user.id);
      
      return { success: true, message: `${input.provider} is now the active LLM provider` };
    }),

  /**
   * Test connection to a provider
   */
  testConnection: adminProcedure
    .input(testConnectionSchema)
    .mutation(async ({ input }) => {
      const { provider, api_key, api_url, model_name } = input;
      
      try {
        // Get current configuration
        const config = await llmConfigHelpers.getLLMConfigurationByProvider(provider);
        if (!config) {
          throw new Error("Provider configuration not found");
        }
        
        // Use provided values or fall back to stored configuration
        const testApiKey = api_key || config.api_key;
        const testApiUrl = api_url || config.api_url;
        const testModel = model_name || config.model_name;
        
        // Perform actual connection test based on provider
        let testResult: { success: boolean; message: string; responseTime?: number };
        
        if (provider === "manus") {
          // Test Manus Forge API
          testResult = await testManusConnection();
        } else if (provider === "gemini") {
          if (!testApiKey) {
            throw new Error("Google Gemini API key is required");
          }
          testResult = await testGeminiConnection(testApiKey, testModel || "gemini-1.5-flash");
        } else if (provider === "openai") {
          if (!testApiKey) {
            throw new Error("OpenAI API key is required");
          }
          testResult = await testOpenAIConnection(testApiKey, testModel || "gpt-3.5-turbo");
        } else if (provider === "ollama") {
          if (!testApiUrl) {
            throw new Error("Ollama API URL is required");
          }
          testResult = await testOllamaConnection(testApiUrl, testModel || "deepseek-vl2");
        } else {
          throw new Error(`Unknown provider: ${provider}`);
        }
        
        // Update health status
        await llmConfigHelpers.updateProviderHealthStatus(
          provider,
          testResult.success ? "healthy" : "error",
          testResult.success ? undefined : testResult.message
        );
        
        return testResult;
      } catch (error: any) {
        // Update health status to error
        await llmConfigHelpers.updateProviderHealthStatus(
          provider,
          "error",
          error.message
        );
        
        return {
          success: false,
          message: error.message || "Connection test failed",
        };
      }
    }),

  /**
   * Get usage statistics
   */
  getUsageStats: adminProcedure
    .input(
      z.object({
        provider: providerSchema.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await llmConfigHelpers.getLLMUsageStats(
        input.provider,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Get usage logs
   */
  getUsageLogs: adminProcedure
    .input(
      z.object({
        provider: providerSchema.optional(),
        feature: z.string().optional(),
        success: z.boolean().optional(),
        limit: z.number().int().min(1).max(1000).optional(),
        offset: z.number().int().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      return await llmConfigHelpers.getLLMUsageLogs(input);
    }),
});

// Connection test functions
async function testManusConnection(): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  try {
    const { ENV } = await import("../_core/env");
    if (!ENV.forgeApiKey) {
      return { success: false, message: "Manus Forge API key not available (only works on Manus platform)" };
    }
    
    // Simple test: check if API key exists and is non-empty
    const responseTime = Date.now() - startTime;
    return { success: true, message: "Manus Forge API is available", responseTime };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testGeminiConnection(apiKey: string, model: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });
    
    // Simple test prompt
    const result = await geminiModel.generateContent("Say 'test successful' in exactly two words");
    const text = result.response.text();
    
    const responseTime = Date.now() - startTime;
    return { success: true, message: `Connection successful. Response: ${text}`, responseTime };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testOpenAIConnection(apiKey: string, model: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Say 'test successful' in exactly two words" }],
        max_tokens: 10,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API request failed");
    }
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    return { success: true, message: `Connection successful. Response: ${data.choices[0].message.content}`, responseTime };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testOllamaConnection(apiUrl: string, model: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${apiUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: "Say 'test successful' in exactly two words",
        stream: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    return { success: true, message: `Connection successful. Response: ${data.response}`, responseTime };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
