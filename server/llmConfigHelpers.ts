/**
 * Database helper functions for LLM Configuration Management
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface LLMConfiguration {
  id: number;
  provider: "manus" | "gemini" | "openai" | "ollama";
  is_active: boolean;
  priority: number;
  api_key?: string | null;
  api_url?: string | null;
  model_name?: string | null;
  max_tokens: number;
  temperature: number;
  timeout_seconds: number;
  total_requests: number;
  total_tokens_used: number;
  last_used_at?: Date | null;
  status: "unconfigured" | "healthy" | "error" | "rate_limited";
  last_error?: string | null;
  last_health_check?: Date | null;
  configured_by?: number | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LLMUsageLog {
  id: number;
  provider: string;
  model_name?: string | null;
  feature?: string | null;
  user_id?: number | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  response_time_ms?: number | null;
  success: boolean;
  error_message?: string | null;
  estimated_cost_usd?: number | null;
  request_timestamp: Date;
}

/**
 * Get all LLM provider configurations
 */
export async function getAllLLMConfigurations(): Promise<LLMConfiguration[]> {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT * FROM llm_configurations
    ORDER BY priority DESC, provider ASC
  `);
  return result[0] as LLMConfiguration[];
}

/**
 * Get configuration for a specific provider
 */
export async function getLLMConfigurationByProvider(
  provider: string
): Promise<LLMConfiguration | null> {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT * FROM llm_configurations
    WHERE provider = ${provider}
    LIMIT 1
  `);
  const rows = result[0] as LLMConfiguration[];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get the active LLM provider (highest priority with is_active = true)
 */
export async function getActiveLLMProvider(): Promise<LLMConfiguration | null> {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT * FROM llm_configurations
    WHERE is_active = true AND status != 'error'
    ORDER BY priority DESC
    LIMIT 1
  `);
  const rows = result[0] as LLMConfiguration[];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Update LLM configuration
 */
export async function updateLLMConfiguration(
  provider: string,
  updates: Partial<Omit<LLMConfiguration, "id" | "provider" | "created_at" | "updated_at">>
): Promise<void> {
  const db = await getDb();
  
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (updates.is_active !== undefined) {
    setClauses.push("is_active = ?");
    values.push(updates.is_active);
  }
  if (updates.priority !== undefined) {
    setClauses.push("priority = ?");
    values.push(updates.priority);
  }
  if (updates.api_key !== undefined) {
    setClauses.push("api_key = ?");
    values.push(updates.api_key);
  }
  if (updates.api_url !== undefined) {
    setClauses.push("api_url = ?");
    values.push(updates.api_url);
  }
  if (updates.model_name !== undefined) {
    setClauses.push("model_name = ?");
    values.push(updates.model_name);
  }
  if (updates.max_tokens !== undefined) {
    setClauses.push("max_tokens = ?");
    values.push(updates.max_tokens);
  }
  if (updates.temperature !== undefined) {
    setClauses.push("temperature = ?");
    values.push(updates.temperature);
  }
  if (updates.timeout_seconds !== undefined) {
    setClauses.push("timeout_seconds = ?");
    values.push(updates.timeout_seconds);
  }
  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }
  if (updates.last_error !== undefined) {
    setClauses.push("last_error = ?");
    values.push(updates.last_error);
  }
  if (updates.configured_by !== undefined) {
    setClauses.push("configured_by = ?");
    values.push(updates.configured_by);
  }
  if (updates.notes !== undefined) {
    setClauses.push("notes = ?");
    values.push(updates.notes);
  }
  
  if (setClauses.length === 0) {
    return; // Nothing to update
  }
  
  values.push(provider);
  
  await db.execute(sql.raw(`
    UPDATE llm_configurations
    SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE provider = ?
  `, values));
}

/**
 * Activate a specific provider (and deactivate others)
 */
export async function activateLLMProvider(provider: string, userId: number): Promise<void> {
  const db = await getDb();
  
  // Deactivate all providers first
  await db.execute(sql`
    UPDATE llm_configurations
    SET is_active = false
  `);
  
  // Activate the specified provider
  await db.execute(sql`
    UPDATE llm_configurations
    SET is_active = true, configured_by = ${userId}, updated_at = CURRENT_TIMESTAMP
    WHERE provider = ${provider}
  `);
}

/**
 * Test connection to a provider (health check)
 */
export async function updateProviderHealthStatus(
  provider: string,
  status: "healthy" | "error" | "rate_limited",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  await db.execute(sql`
    UPDATE llm_configurations
    SET status = ${status},
        last_error = ${errorMessage || null},
        last_health_check = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE provider = ${provider}
  `);
}

/**
 * Log LLM usage for analytics
 */
export async function logLLMUsage(log: Omit<LLMUsageLog, "id" | "request_timestamp">): Promise<void> {
  const db = await getDb();
  
  await db.execute(sql`
    INSERT INTO llm_usage_logs (
      provider, model_name, feature, user_id,
      prompt_tokens, completion_tokens, total_tokens,
      response_time_ms, success, error_message, estimated_cost_usd
    ) VALUES (
      ${log.provider}, ${log.model_name || null}, ${log.feature || null}, ${log.user_id || null},
      ${log.prompt_tokens}, ${log.completion_tokens}, ${log.total_tokens},
      ${log.response_time_ms || null}, ${log.success}, ${log.error_message || null}, ${log.estimated_cost_usd || null}
    )
  `);
  
  // Update total usage in configuration
  await db.execute(sql`
    UPDATE llm_configurations
    SET total_requests = total_requests + 1,
        total_tokens_used = total_tokens_used + ${log.total_tokens},
        last_used_at = CURRENT_TIMESTAMP
    WHERE provider = ${log.provider}
  `);
}

/**
 * Get usage statistics for a provider
 */
export async function getLLMUsageStats(
  provider?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  success_rate: number;
  avg_response_time: number;
}> {
  const db = await getDb();
  
  let whereClause = "WHERE 1=1";
  const params: any[] = [];
  
  if (provider) {
    whereClause += " AND provider = ?";
    params.push(provider);
  }
  if (startDate) {
    whereClause += " AND request_timestamp >= ?";
    params.push(startDate);
  }
  if (endDate) {
    whereClause += " AND request_timestamp <= ?";
    params.push(endDate);
  }
  
  const result = await db.execute(sql.raw(`
    SELECT
      COUNT(*) as total_requests,
      SUM(total_tokens) as total_tokens,
      SUM(estimated_cost_usd) as total_cost,
      AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) * 100 as success_rate,
      AVG(response_time_ms) as avg_response_time
    FROM llm_usage_logs
    ${whereClause}
  `, params));
  
  const row = (result[0] as any[])[0];
  return {
    total_requests: row.total_requests || 0,
    total_tokens: row.total_tokens || 0,
    total_cost: row.total_cost || 0,
    success_rate: row.success_rate || 0,
    avg_response_time: row.avg_response_time || 0,
  };
}

/**
 * Get usage logs with pagination
 */
export async function getLLMUsageLogs(
  options: {
    provider?: string;
    feature?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<LLMUsageLog[]> {
  const db = await getDb();
  
  let whereClause = "WHERE 1=1";
  const params: any[] = [];
  
  if (options.provider) {
    whereClause += " AND provider = ?";
    params.push(options.provider);
  }
  if (options.feature) {
    whereClause += " AND feature = ?";
    params.push(options.feature);
  }
  if (options.success !== undefined) {
    whereClause += " AND success = ?";
    params.push(options.success);
  }
  
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  
  const result = await db.execute(sql.raw(`
    SELECT * FROM llm_usage_logs
    ${whereClause}
    ORDER BY request_timestamp DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]));
  
  return result[0] as LLMUsageLog[];
}
