import { getDb } from "./db";
import { candidates, users, candidateTags, candidateTagAssignments } from "../drizzle/schema";
import { eq, and, or, like, gte, lte, sql, SQL, inArray } from "drizzle-orm";

/**
 * Advanced candidate search parameters with boolean operators
 */
export interface AdvancedSearchParams {
  // Text search with boolean operators
  keywords?: string; // Supports AND, OR, NOT operators
  
  // Smart filters
  skills?: string[]; // Array of required skills
  experienceYears?: { min?: number; max?: number };
  location?: string;
  availability?: string[]; // 'immediate', '2-weeks', '1-month', '2-months', 'not-looking'
  visaStatus?: string[]; // 'citizen', 'permanent-resident', 'work-visa', 'requires-sponsorship'
  salaryRange?: { min?: number; max?: number };
  noticePeriod?: string[]; // 'immediate', '2-weeks', '1-month', '2-months', '3-months'
  willingToRelocate?: boolean;
  seniorityLevel?: string[]; // 'entry', 'mid', 'senior', 'lead'
  
  // Tag filters
  tags?: number[]; // Array of tag IDs
  
  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Parse boolean search query into SQL conditions
 * Supports: AND, OR, NOT operators
 * Example: "javascript AND (react OR vue) NOT angular"
 */
function parseBooleanSearch(keywords: string): SQL | undefined {
  if (!keywords || keywords.trim() === "") return undefined;

  // Simple implementation: split by AND, OR, NOT
  const terms: SQL[] = [];
  
  // Split by AND
  const andParts = keywords.split(/\s+AND\s+/i);
  
  for (const part of andParts) {
    // Handle OR within AND groups
    if (part.includes(" OR ")) {
      const orParts = part.split(/\s+OR\s+/i);
      const orConditions = orParts
        .filter(term => !term.trim().startsWith("NOT"))
        .map(term => {
          const cleanTerm = term.trim().replace(/[()]/g, "");
          return or(
            like(candidates.skills, `%${cleanTerm}%`),
            like(candidates.title, `%${cleanTerm}%`),
            like(candidates.bio, `%${cleanTerm}%`),
            like(candidates.experience, `%${cleanTerm}%`)
          );
        });
      
      if (orConditions.length > 0) {
        terms.push(or(...orConditions)!);
      }
    } else if (part.trim().startsWith("NOT")) {
      // Handle NOT operator
      const notTerm = part.replace(/^NOT\s+/i, "").trim().replace(/[()]/g, "");
      terms.push(
        and(
          sql`NOT ${like(candidates.skills, `%${notTerm}%`)}`,
          sql`NOT ${like(candidates.title, `%${notTerm}%`)}`,
          sql`NOT ${like(candidates.bio, `%${notTerm}%`)}`
        )!
      );
    } else {
      // Simple term
      const cleanTerm = part.trim().replace(/[()]/g, "");
      if (cleanTerm) {
        terms.push(
          or(
            like(candidates.skills, `%${cleanTerm}%`),
            like(candidates.title, `%${cleanTerm}%`),
            like(candidates.bio, `%${cleanTerm}%`),
            like(candidates.experience, `%${cleanTerm}%`)
          )!
        );
      }
    }
  }

  return terms.length > 0 ? and(...terms) : undefined;
}

/**
 * Advanced candidate search with boolean operators and smart filters
 */
export async function advancedCandidateSearch(params: AdvancedSearchParams) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions: SQL[] = [];

  // Boolean keyword search
  if (params.keywords) {
    const keywordCondition = parseBooleanSearch(params.keywords);
    if (keywordCondition) {
      conditions.push(keywordCondition);
    }
  }

  // Skills filter (AND logic - candidate must have all specified skills)
  if (params.skills && params.skills.length > 0) {
    for (const skill of params.skills) {
      conditions.push(like(candidates.skills, `%${skill}%`));
    }
  }

  // Experience years filter
  if (params.experienceYears) {
    if (params.experienceYears.min !== undefined) {
      conditions.push(gte(candidates.totalExperienceYears, params.experienceYears.min));
    }
    if (params.experienceYears.max !== undefined) {
      conditions.push(lte(candidates.totalExperienceYears, params.experienceYears.max));
    }
  }

  // Location filter
  if (params.location) {
    conditions.push(like(candidates.location, `%${params.location}%`));
  }

  // Availability filter
  if (params.availability && params.availability.length > 0) {
    conditions.push(inArray(candidates.availability, params.availability));
  }

  // Visa status filter
  if (params.visaStatus && params.visaStatus.length > 0) {
    conditions.push(inArray(candidates.visaStatus, params.visaStatus));
  }

  // Salary range filter
  if (params.salaryRange) {
    if (params.salaryRange.min !== undefined) {
      conditions.push(gte(candidates.expectedSalaryMin, params.salaryRange.min));
    }
    if (params.salaryRange.max !== undefined) {
      conditions.push(lte(candidates.expectedSalaryMax, params.salaryRange.max));
    }
  }

  // Notice period filter
  if (params.noticePeriod && params.noticePeriod.length > 0) {
    conditions.push(inArray(candidates.noticePeriod, params.noticePeriod));
  }

  // Willing to relocate filter
  if (params.willingToRelocate !== undefined) {
    conditions.push(eq(candidates.willingToRelocate, params.willingToRelocate));
  }

  // Seniority level filter
  if (params.seniorityLevel && params.seniorityLevel.length > 0) {
    conditions.push(inArray(candidates.seniorityLevel, params.seniorityLevel));
  }

  // Build query
  let query = db!
    .select({
      candidate: candidates,
      user: users,
    })
    .from(candidates)
    .leftJoin(users, eq(candidates.userId, users.id))
    .$dynamic();

  // Add WHERE conditions
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Add pagination
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.offset(params.offset);
  }

  const results = await query;

  // If tag filter is specified, filter by tags
  if (params.tags && params.tags.length > 0) {
    const candidateIds = results.map((r: any) => r.candidate.id);
    if (candidateIds.length === 0) return [];

    const taggedCandidates = await db
      .select({ candidateId: candidateTagAssignments.candidateId })
      .from(candidateTagAssignments)
      .where(
        and(
          inArray(candidateTagAssignments.candidateId, candidateIds),
          inArray(candidateTagAssignments.tagId, params.tags)
        )
      );

    const taggedIds = new Set(taggedCandidates.map((tc: any) => tc.candidateId));
    return results.filter((r: any) => taggedIds.has(r.candidate.id));
  }

  return results;
}

/**
 * Get all tags for a recruiter
 */
export async function getCandidateTagsByRecruiter(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(candidateTags)
    .where(eq(candidateTags.userId, userId));
}

/**
 * Create a new candidate tag
 */
export async function createCandidateTag(userId: number, name: string, color: string = "blue") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(candidateTags)
    .values({ userId, name, color });
  
  return result;
}

/**
 * Assign tags to candidates (bulk operation)
 */
export async function bulkAssignTags(candidateIds: number[], tagIds: number[], assignedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const assignments = candidateIds.flatMap(candidateId =>
    tagIds.map(tagId => ({
      candidateId,
      tagId,
      assignedBy,
    }))
  );

  if (assignments.length === 0) return;

  await db.insert(candidateTagAssignments).values(assignments);
}

/**
 * Remove tag from candidates
 */
export async function removeTagFromCandidates(candidateIds: number[], tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(candidateTagAssignments)
    .where(
      and(
        inArray(candidateTagAssignments.candidateId, candidateIds),
        eq(candidateTagAssignments.tagId, tagId)
      )
    );
}

/**
 * Get tags for specific candidates
 */
export async function getTagsForCandidates(candidateIds: number[]) {
  if (candidateIds.length === 0) return [];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select({
      assignment: candidateTagAssignments,
      tag: candidateTags,
    })
    .from(candidateTagAssignments)
    .leftJoin(candidateTags, eq(candidateTagAssignments.tagId, candidateTags.id))
    .where(inArray(candidateTagAssignments.candidateId, candidateIds));
}
