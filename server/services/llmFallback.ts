import { getDb } from "../db";
import type { LLMProvider, InvokeParams, InvokeResult } from "../_core/llm";

interface FallbackConfig {
  id: number;
  priority: number;
  provider: string;
  enabled: boolean;
  maxRetries: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
  lastHealthCheck: Date | null;
  isHealthy: boolean;
  failureCount: number;
  lastFailureAt: Date | null;
}

/**
 * Get fallback chain configuration ordered by priority
 */
export async function getFallbackChain(): Promise<FallbackConfig[]> {
  const db = await getDb();
  
  const configs = await db
    .select("*")
    .from("llm_fallback_config")
    .where("enabled", true)
    .orderBy("priority", "asc");

  return configs as FallbackConfig[];
}

/**
 * Initialize default fallback configuration if not exists
 */
export async function initializeFallbackConfig(): Promise<void> {
  const db = await getDb();
  
  // Check if configuration already exists
  const existing = await db
    .select("*")
    .from("llm_fallback_config")
    .first();

  if (existing) {
    console.log("[LLM Fallback] Configuration already exists");
    return;
  }

  // Create default fallback chain: Manus → Gemini → OpenAI → Ollama
  const defaultConfigs = [
    { priority: 1, provider: "manus", enabled: true },
    { priority: 2, provider: "gemini", enabled: true },
    { priority: 3, provider: "openai", enabled: true },
    { priority: 4, provider: "ollama", enabled: false }, // Disabled by default (self-hosted)
  ];

  for (const config of defaultConfigs) {
    await db.insert({
      ...config,
      maxRetries: 3,
      retryDelayMs: 1000,
      healthCheckIntervalMs: 60000,
      isHealthy: true,
      failureCount: 0,
    }).into("llm_fallback_config");
  }

  console.log("[LLM Fallback] Initialized default configuration");
}

/**
 * Log fallback event
 */
async function logFallbackEvent(
  fromProvider: string,
  toProvider: string,
  reason: string,
  feature: string | undefined,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  
  await db.insert({
    fromProvider,
    toProvider,
    reason,
    feature: feature || null,
    success,
    errorMessage: errorMessage || null,
  }).into("llm_fallback_events");
}

/**
 * Update provider health status
 */
async function updateProviderHealth(
  provider: string,
  isHealthy: boolean,
  error?: string
): Promise<void> {
  const db = await getDb();
  
  const updateData: any = {
    isHealthy,
    lastHealthCheck: new Date(),
  };

  if (!isHealthy) {
    updateData.failureCount = db.raw("failureCount + 1");
    updateData.lastFailureAt = new Date();
  } else {
    updateData.failureCount = 0;
  }

  await db
    .update(updateData)
    .table("llm_fallback_config")
    .where("provider", provider);

  console.log(`[LLM Fallback] Updated ${provider} health: ${isHealthy ? "healthy" : "unhealthy"}`);
}

/**
 * Invoke LLM with automatic fallback on failure
 */
export async function invokeWithFallback(
  params: InvokeParams,
  feature?: string,
  preferredProvider?: LLMProvider
): Promise<InvokeResult> {
  // Import LLM providers dynamically to avoid circular dependencies
  const { invokeLLM } = await import("../_core/llm");
  
  // Get fallback chain
  const fallbackChain = await getFallbackChain();
  
  if (fallbackChain.length === 0) {
    throw new Error("No LLM providers configured in fallback chain");
  }

  // If preferred provider is specified, try it first
  if (preferredProvider) {
    const preferredConfig = fallbackChain.find(c => c.provider === preferredProvider);
    if (preferredConfig && preferredConfig.isHealthy) {
      try {
        console.log(`[LLM Fallback] Trying preferred provider: ${preferredProvider}`);
        const result = await invokeLLM(params);
        await updateProviderHealth(preferredProvider, true);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[LLM Fallback] Preferred provider ${preferredProvider} failed:`, errorMessage);
        await updateProviderHealth(preferredProvider, false, errorMessage);
        
        // Continue to fallback chain
      }
    }
  }

  // Try each provider in fallback chain
  let lastError: Error | null = null;
  
  for (const config of fallbackChain) {
    // Skip if provider is not healthy
    if (!config.isHealthy) {
      console.log(`[LLM Fallback] Skipping unhealthy provider: ${config.provider}`);
      continue;
    }

    // Attempt with retries
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(`[LLM Fallback] Attempting ${config.provider} (attempt ${attempt}/${config.maxRetries})`);
        
        // Set provider in environment temporarily
        const originalProvider = process.env.LLM_PROVIDER;
        process.env.LLM_PROVIDER = config.provider;
        
        const result = await invokeLLM(params);
        
        // Restore original provider
        if (originalProvider) {
          process.env.LLM_PROVIDER = originalProvider;
        } else {
          delete process.env.LLM_PROVIDER;
        }

        // Success - update health and log event
        await updateProviderHealth(config.provider, true);
        
        if (preferredProvider && config.provider !== preferredProvider) {
          await logFallbackEvent(
            preferredProvider,
            config.provider,
            "Primary provider failed, fallback successful",
            feature,
            true
          );
        }

        console.log(`[LLM Fallback] Successfully used ${config.provider}`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;
        
        console.error(`[LLM Fallback] ${config.provider} attempt ${attempt} failed:`, errorMessage);
        
        // If not the last attempt, wait before retrying
        if (attempt < config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelayMs));
        } else {
          // All retries exhausted for this provider
          await updateProviderHealth(config.provider, false, errorMessage);
          
          // Log failed fallback attempt
          const nextProvider = fallbackChain[fallbackChain.indexOf(config) + 1];
          if (nextProvider) {
            await logFallbackEvent(
              config.provider,
              nextProvider.provider,
              `Provider failed after ${config.maxRetries} retries`,
              feature,
              false,
              errorMessage
            );
          }
        }
      }
    }
  }

  // All providers failed
  throw new Error(
    `All LLM providers in fallback chain failed. Last error: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Perform health check on all providers
 */
export async function performHealthChecks(): Promise<void> {
  const db = await getDb();
  const configs = await db
    .select("*")
    .from("llm_fallback_config")
    .where("enabled", true);

  for (const config of configs as FallbackConfig[]) {
    // Check if health check is due
    const now = Date.now();
    const lastCheck = config.lastHealthCheck ? new Date(config.lastHealthCheck).getTime() : 0;
    const timeSinceCheck = now - lastCheck;

    if (timeSinceCheck < config.healthCheckIntervalMs) {
      continue; // Skip, not due yet
    }

    // Perform health check with simple prompt
    try {
      console.log(`[LLM Fallback] Health check for ${config.provider}`);
      
      const { invokeLLM } = await import("../_core/llm");
      
      // Set provider temporarily
      const originalProvider = process.env.LLM_PROVIDER;
      process.env.LLM_PROVIDER = config.provider;
      
      await invokeLLM({
        messages: [
          { role: "user", content: "Hello" }
        ],
      });
      
      // Restore original provider
      if (originalProvider) {
        process.env.LLM_PROVIDER = originalProvider;
      } else {
        delete process.env.LLM_PROVIDER;
      }

      await updateProviderHealth(config.provider, true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[LLM Fallback] Health check failed for ${config.provider}:`, errorMessage);
      await updateProviderHealth(config.provider, false, errorMessage);
    }
  }
}

/**
 * Get fallback statistics
 */
export async function getFallbackStats(
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  
  const stats = await db
    .select({
      fromProvider: "fromProvider",
      toProvider: "toProvider",
      totalEvents: db.raw("COUNT(*) as totalEvents"),
      successfulFallbacks: db.raw("SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successfulFallbacks"),
      failedFallbacks: db.raw("SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failedFallbacks"),
    })
    .from("llm_fallback_events")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .groupBy("fromProvider", "toProvider");

  return stats;
}

/**
 * Get provider health status
 */
export async function getProviderHealthStatus() {
  const db = await getDb();
  
  const providers = await db
    .select("*")
    .from("llm_fallback_config")
    .orderBy("priority", "asc");

  return providers as FallbackConfig[];
}
