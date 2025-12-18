import { eq, and, desc, sql, or, like, gte, lte, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  associates, InsertAssociate,
  onboardingProcesses, InsertOnboardingProcess,
  onboardingTasks, InsertOnboardingTask,
  taskAssignments, InsertTaskAssignment,
  taskReminders, InsertTaskReminder,
  taskTemplates, InsertTaskTemplate,
  candidates,
  recruiters,
  users
} from "../drizzle/schema";

// ============= Associates =============

export async function createAssociate(data: InsertAssociate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(associates).values(data);
  return result.insertId;
}

export async function getAssociateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [associate] = await db
    .select()
    .from(associates)
    .leftJoin(candidates, eq(associates.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(recruiters, eq(associates.managerId, recruiters.id))
    .where(eq(associates.id, id));
  
  return associate;
}

export async function getAllAssociates(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const baseQuery = db
    .select()
    .from(associates)
    .leftJoin(candidates, eq(associates.candidateId, candidates.id))
    .leftJoin(users, eq(candidates.userId, users.id))
    .leftJoin(recruiters, eq(associates.managerId, recruiters.id));
  
  if (status) {
    return await baseQuery
      .where(eq(associates.status, status as any))
      .orderBy(desc(associates.createdAt));
  }
  
  return await baseQuery.orderBy(desc(associates.createdAt));
}

export async function updateAssociateStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(associates)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(associates.id, id));
}

export async function updateAssociate(id: number, data: Partial<InsertAssociate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(associates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(associates.id, id));
}

// ============= Onboarding Processes =============

export async function createOnboardingProcess(data: InsertOnboardingProcess) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(onboardingProcesses).values(data);
  return result.insertId;
}

export async function getOnboardingProcessById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [process] = await db
    .select()
    .from(onboardingProcesses)
    .leftJoin(associates, eq(onboardingProcesses.associateId, associates.id))
    .leftJoin(candidates, eq(associates.candidateId, candidates.id))
    .where(eq(onboardingProcesses.id, id));
  
  return process;
}

export async function getOnboardingProcessesByAssociate(associateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(onboardingProcesses)
    .where(eq(onboardingProcesses.associateId, associateId))
    .orderBy(desc(onboardingProcesses.createdAt));
}

export async function getAllOnboardingProcesses(filters?: {
  processType?: string;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const baseQuery = db
    .select()
    .from(onboardingProcesses)
    .leftJoin(associates, eq(onboardingProcesses.associateId, associates.id))
    .leftJoin(candidates, eq(associates.candidateId, candidates.id));
  
  const conditions = [];
  if (filters?.processType) {
    conditions.push(eq(onboardingProcesses.processType, filters.processType as any));
  }
  if (filters?.status) {
    conditions.push(eq(onboardingProcesses.status, filters.status as any));
  }
  
  if (conditions.length > 0) {
    return await baseQuery
      .where(and(...conditions))
      .orderBy(desc(onboardingProcesses.createdAt));
  }
  
  return await baseQuery.orderBy(desc(onboardingProcesses.createdAt));
}

export async function updateOnboardingProcess(id: number, data: Partial<InsertOnboardingProcess>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(onboardingProcesses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(onboardingProcesses.id, id));
}

// ============= Onboarding Tasks =============

export async function createOnboardingTask(data: InsertOnboardingTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(onboardingTasks).values(data);
  return result.insertId;
}

export async function getOnboardingTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [task] = await db
    .select()
    .from(onboardingTasks)
    .where(eq(onboardingTasks.id, id));
  
  return task;
}

export async function getTasksByProcess(processId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(onboardingTasks)
    .where(eq(onboardingTasks.processId, processId))
    .orderBy(onboardingTasks.orderIndex);
}

export async function updateOnboardingTask(id: number, data: Partial<InsertOnboardingTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(onboardingTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(onboardingTasks.id, id));
}

export async function completeTask(taskId: number, recruiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(onboardingTasks)
    .set({
      status: "completed",
      completedAt: new Date(),
      completedBy: recruiterId,
      updatedAt: new Date()
    })
    .where(eq(onboardingTasks.id, taskId));
}

export async function deleteOnboardingTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(onboardingTasks).where(eq(onboardingTasks.id, id));
}

// ============= Task Assignments =============

export async function assignTaskToRecruiter(data: InsertTaskAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(taskAssignments).values(data);
  return result.insertId;
}

export async function getTaskAssignments(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(taskAssignments)
    .leftJoin(recruiters, eq(taskAssignments.recruiterId, recruiters.id))
    .leftJoin(users, eq(recruiters.userId, users.id))
    .where(eq(taskAssignments.taskId, taskId));
}

export async function getRecruiterTasks(recruiterId: number, filters?: {
  status?: string;
  processType?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(taskAssignments.recruiterId, recruiterId)];
  if (filters?.status) {
    conditions.push(eq(onboardingTasks.status, filters.status as any));
  }
  if (filters?.processType) {
    conditions.push(eq(onboardingProcesses.processType, filters.processType as any));
  }
  
  return await db
    .select()
    .from(taskAssignments)
    .leftJoin(onboardingTasks, eq(taskAssignments.taskId, onboardingTasks.id))
    .leftJoin(onboardingProcesses, eq(onboardingTasks.processId, onboardingProcesses.id))
    .leftJoin(associates, eq(onboardingProcesses.associateId, associates.id))
    .leftJoin(candidates, eq(associates.candidateId, candidates.id))
    .where(and(...conditions))
    .orderBy(onboardingTasks.dueDate);
}

export async function removeTaskAssignment(taskId: number, recruiterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(taskAssignments)
    .where(
      and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.recruiterId, recruiterId)
      )
    );
}

// ============= Task Reminders =============

export async function createTaskReminder(data: InsertTaskReminder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(taskReminders).values(data);
  return result.insertId;
}

export async function getTaskReminders(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(taskReminders)
    .where(eq(taskReminders.taskId, taskId))
    .orderBy(desc(taskReminders.sentAt));
}

export async function getPendingTasksForReminders() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  return await db
    .select()
    .from(onboardingTasks)
    .leftJoin(taskAssignments, eq(onboardingTasks.id, taskAssignments.taskId))
    .leftJoin(recruiters, eq(taskAssignments.recruiterId, recruiters.id))
    .where(
      and(
        or(
          eq(onboardingTasks.status, "pending"),
          eq(onboardingTasks.status, "in_progress")
        ),
        lte(onboardingTasks.dueDate, threeDaysFromNow)
      )
    );
}

// ============= Task Templates =============

export async function createTaskTemplate(data: InsertTaskTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(taskTemplates).values(data);
  return result.insertId;
}

export async function getTaskTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [template] = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.id, id));
  
  return template;
}

export async function getAllTaskTemplates(processType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (processType) {
    return await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.processType, processType as any))
      .orderBy(desc(taskTemplates.isDefault), desc(taskTemplates.createdAt));
  }
  
  return await db
    .select()
    .from(taskTemplates)
    .orderBy(desc(taskTemplates.isDefault), desc(taskTemplates.createdAt));
}

export async function updateTaskTemplate(id: number, data: Partial<InsertTaskTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(taskTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(taskTemplates.id, id));
}

export async function deleteTaskTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
}

// Missing helper functions for onboardingRouter

export async function getTasksByProcessId(processId: number) {
  return await getTasksByProcess(processId);
}

export async function createTask(data: InsertOnboardingTask) {
  return await createOnboardingTask(data);
}

export async function updateTask(id: number, data: Partial<InsertOnboardingTask>) {
  return await updateOnboardingTask(id, data);
}

export async function getTaskById(id: number) {
  return await getOnboardingTaskById(id);
}

export async function getAssignmentsByTaskId(taskId: number) {
  return await getTaskAssignments(taskId);
}

export async function getAssignmentsByRecruiterId(recruiterId: number) {
  return await getRecruiterTasks(recruiterId);
}

export async function createTaskAssignment(data: InsertTaskAssignment) {
  return await assignTaskToRecruiter(data);
}

export async function updateTaskAssignment(id: number, data: Partial<InsertTaskAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(taskAssignments)
    .set(data)
    .where(eq(taskAssignments.id, id));
}

export async function getRecruiterById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [recruiter] = await db
    .select()
    .from(recruiters)
    .leftJoin(users, eq(recruiters.userId, users.id))
    .where(eq(recruiters.id, id));
  
  return recruiter;
}

export async function getAllRecruiters() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(recruiters)
    .leftJoin(users, eq(recruiters.userId, users.id))
    .orderBy(users.name);
}
