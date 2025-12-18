import { getDb } from "../db";

/**
 * Provider Pricing Configuration (per 1000 tokens)
 * Updated as of December 2024
 */
export const PROVIDER_PRICING = {
  manus: {
    input: 0.0001,  // $0.0001 per 1K tokens
    output: 0.0002, // $0.0002 per 1K tokens
  },
  gemini: {
    input: 0.00015,  // $0.00015 per 1K tokens (Gemini 1.5 Flash)
    output: 0.0006,  // $0.0006 per 1K tokens
  },
  openai: {
    input: 0.0015,  // $0.0015 per 1K tokens (GPT-3.5 Turbo)
    output: 0.002,  // $0.002 per 1K tokens
  },
  ollama: {
    input: 0,  // Self-hosted, no per-token cost
    output: 0,
  },
};

/**
 * Calculate cost for LLM usage
 */
export async function calculateCost(
  provider: string,
  inputTokens: number,
  outputTokens: number,
  feature: string,
  usageLogId: number,
  companyId?: number,
  userId?: number
): Promise<number> {
  const pricing = PROVIDER_PRICING[provider as keyof typeof PROVIDER_PRICING];
  
  if (!pricing) {
    console.warn(`[LLM Cost] Unknown provider: ${provider}, defaulting to $0`);
    return 0;
  }

  // Calculate cost per token type
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;
  const totalTokens = inputTokens + outputTokens;

  // Calculate average cost per token for this request
  const costPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;

  // Store cost tracking record
  const db = await getDb();
  await db.insert({
    usageLogId,
    provider,
    feature,
    tokensUsed: totalTokens,
    costPerToken,
    totalCost,
    companyId: companyId || null,
    userId: userId || null,
  }).into("llm_cost_tracking");

  return totalCost;
}

/**
 * Get cost statistics for a time period
 */
export async function getCostStats(
  startDate: Date,
  endDate: Date,
  companyId?: number,
  userId?: number
) {
  const db = await getDb();
  
  let query = db
    .select({
      provider: "provider",
      feature: "feature",
      totalCost: db.raw("SUM(totalCost) as totalCost"),
      totalTokens: db.raw("SUM(tokensUsed) as totalTokens"),
      requestCount: db.raw("COUNT(*) as requestCount"),
    })
    .from("llm_cost_tracking")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .groupBy("provider", "feature");

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  if (userId) {
    query = query.where("userId", userId);
  }

  const results = await query;
  return results;
}

/**
 * Get total cost for a specific period
 */
export async function getTotalCost(
  startDate: Date,
  endDate: Date,
  companyId?: number
): Promise<number> {
  const db = await getDb();
  
  let query = db
    .select(db.raw("SUM(totalCost) as total"))
    .from("llm_cost_tracking")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate);

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  const result = await query.first();
  return result?.total || 0;
}

/**
 * Get cost breakdown by provider
 */
export async function getCostByProvider(
  startDate: Date,
  endDate: Date,
  companyId?: number
) {
  const db = await getDb();
  
  let query = db
    .select({
      provider: "provider",
      totalCost: db.raw("SUM(totalCost) as totalCost"),
      totalTokens: db.raw("SUM(tokensUsed) as totalTokens"),
      requestCount: db.raw("COUNT(*) as requestCount"),
      avgCostPerRequest: db.raw("AVG(totalCost) as avgCostPerRequest"),
    })
    .from("llm_cost_tracking")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .groupBy("provider")
    .orderBy("totalCost", "desc");

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  return await query;
}

/**
 * Get cost breakdown by feature
 */
export async function getCostByFeature(
  startDate: Date,
  endDate: Date,
  companyId?: number
) {
  const db = await getDb();
  
  let query = db
    .select({
      feature: "feature",
      totalCost: db.raw("SUM(totalCost) as totalCost"),
      totalTokens: db.raw("SUM(tokensUsed) as totalTokens"),
      requestCount: db.raw("COUNT(*) as requestCount"),
    })
    .from("llm_cost_tracking")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .groupBy("feature")
    .orderBy("totalCost", "desc");

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  return await query;
}

/**
 * Get daily cost trend for chart visualization
 */
export async function getDailyCostTrend(
  startDate: Date,
  endDate: Date,
  companyId?: number
) {
  const db = await getDb();
  
  let query = db
    .select({
      date: db.raw("DATE(createdAt) as date"),
      totalCost: db.raw("SUM(totalCost) as totalCost"),
      totalTokens: db.raw("SUM(tokensUsed) as totalTokens"),
    })
    .from("llm_cost_tracking")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .groupBy(db.raw("DATE(createdAt)"))
    .orderBy("date", "asc");

  if (companyId) {
    query = query.where("companyId", companyId);
  }

  return await query;
}

/**
 * Project monthly cost based on current usage
 */
export async function projectMonthlyCost(companyId?: number): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();

  // Get cost so far this month
  const costSoFar = await getTotalCost(startOfMonth, now, companyId);

  // Project for full month
  const projectedCost = (costSoFar / daysPassed) * daysInMonth;

  return projectedCost;
}
