import { getDb } from "./db";

export interface QuestionBankItem {
  id: number;
  recruiterId: number;
  questionText: string;
  questionType: 'coding' | 'multiple-choice' | 'text' | 'personality' | 'technical';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category?: string;
  tags?: string[];
  correctAnswer?: string;
  codeTemplate?: string;
  testCases?: Array<{ input: string; expectedOutput: string }>;
  timeLimit?: number;
  memoryLimit?: number;
  points: number;
  usageCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuestionInput {
  questionText: string;
  questionType: 'coding' | 'multiple-choice' | 'text' | 'personality' | 'technical';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category?: string;
  tags?: string[];
  correctAnswer?: string;
  codeTemplate?: string;
  testCases?: Array<{ input: string; expectedOutput: string }>;
  timeLimit?: number;
  memoryLimit?: number;
  points?: number;
  isPublic?: boolean;
}

export async function createQuestion(recruiterId: number, input: CreateQuestionInput) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { sql } = await import('drizzle-orm');
  
  const result = await db.execute(sql`
    INSERT INTO question_bank (
      recruiter_id, question_text, question_type, difficulty,
      category, tags, correct_answer, code_template, test_cases,
      time_limit, memory_limit, points, is_public
    ) VALUES (
      ${recruiterId}, ${input.questionText}, ${input.questionType}, ${input.difficulty},
      ${input.category || null}, ${JSON.stringify(input.tags || [])}, 
      ${input.correctAnswer || null}, ${input.codeTemplate || null}, 
      ${JSON.stringify(input.testCases || [])},
      ${input.timeLimit || 300}, ${input.memoryLimit || 256}, 
      ${input.points || 10}, ${input.isPublic || false}
    )
  `);

  return result;
}

export async function getQuestionsByRecruiter(recruiterId: number, filters?: {
  questionType?: string;
  difficulty?: string;
  category?: string;
  searchTerm?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const { sql } = await import('drizzle-orm');
  
  let query = sql`
    SELECT * FROM question_bank 
    WHERE (recruiter_id = ${recruiterId} OR is_public = true)
  `;

  if (filters?.questionType) {
    query = sql`${query} AND question_type = ${filters.questionType}`;
  }
  if (filters?.difficulty) {
    query = sql`${query} AND difficulty = ${filters.difficulty}`;
  }
  if (filters?.category) {
    query = sql`${query} AND category = ${filters.category}`;
  }
  if (filters?.searchTerm) {
    query = sql`${query} AND question_text LIKE ${`%${filters.searchTerm}%`}`;
  }

  query = sql`${query} ORDER BY created_at DESC`;

  const result = await db.execute(query);
  return result.rows;
}

export async function updateQuestion(questionId: number, recruiterId: number, updates: Partial<CreateQuestionInput>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { sql } = await import('drizzle-orm');
  
  const setClauses = [];
  if (updates.questionText) setClauses.push(sql`question_text = ${updates.questionText}`);
  if (updates.difficulty) setClauses.push(sql`difficulty = ${updates.difficulty}`);
  if (updates.category !== undefined) setClauses.push(sql`category = ${updates.category}`);
  if (updates.tags) setClauses.push(sql`tags = ${JSON.stringify(updates.tags)}`);
  if (updates.correctAnswer !== undefined) setClauses.push(sql`correct_answer = ${updates.correctAnswer}`);
  if (updates.codeTemplate !== undefined) setClauses.push(sql`code_template = ${updates.codeTemplate}`);
  if (updates.testCases) setClauses.push(sql`test_cases = ${JSON.stringify(updates.testCases)}`);
  if (updates.points !== undefined) setClauses.push(sql`points = ${updates.points}`);
  if (updates.isPublic !== undefined) setClauses.push(sql`is_public = ${updates.isPublic}`);

  if (setClauses.length === 0) return;

  await db.execute(sql`
    UPDATE question_bank 
    SET ${sql.join(setClauses, sql`, `)}
    WHERE id = ${questionId} AND recruiter_id = ${recruiterId}
  `);
}

export async function deleteQuestion(questionId: number, recruiterId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { sql } = await import('drizzle-orm');
  
  await db.execute(sql`
    DELETE FROM question_bank 
    WHERE id = ${questionId} AND recruiter_id = ${recruiterId}
  `);
}

export async function incrementQuestionUsage(questionId: number) {
  const db = await getDb();
  if (!db) return;

  const { sql } = await import('drizzle-orm');
  
  await db.execute(sql`
    UPDATE question_bank 
    SET usage_count = usage_count + 1 
    WHERE id = ${questionId}
  `);
}
