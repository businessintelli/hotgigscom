import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createDatabaseBackup,
  restoreDatabaseBackup,
  listDatabaseBackups,
  deleteDatabaseBackup,
  getBackupStatistics,
  cleanupOldBackups,
} from "../services/databaseBackup";
import {
  createEnvironmentBackup,
  restoreEnvironmentBackup,
  listEnvironmentBackups,
  deleteEnvironmentBackup,
} from "../services/environmentBackup";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can access backup operations",
    });
  }
  return next({ ctx });
});

export const backupRouter = router({
  // Database backup operations
  createDatabaseBackup: adminProcedure
    .input(
      z.object({
        type: z.enum(["full", "incremental", "manual"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const backup = await createDatabaseBackup({
          userId: ctx.user.id,
          type: input.type || "manual",
        });
        return backup;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create database backup: ${error.message}`,
        });
      }
    }),

  restoreDatabaseBackup: adminProcedure
    .input(
      z.object({
        backupId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await restoreDatabaseBackup(input.backupId, ctx.user.id);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to restore database backup: ${error.message}`,
        });
      }
    }),

  listDatabaseBackups: adminProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        const backups = await listDatabaseBackups(
          input?.limit || 50,
          input?.offset || 0
        );
        return backups;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list database backups: ${error.message}`,
        });
      }
    }),

  deleteDatabaseBackup: adminProcedure
    .input(
      z.object({
        backupId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await deleteDatabaseBackup(input.backupId);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete database backup: ${error.message}`,
        });
      }
    }),

  getDatabaseBackupStats: adminProcedure.query(async () => {
    try {
      const stats = await getBackupStatistics();
      return stats;
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get backup statistics: ${error.message}`,
      });
    }
  }),

  cleanupOldBackups: adminProcedure
    .input(
      z.object({
        retentionDays: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const deletedCount = await cleanupOldBackups(input.retentionDays || 30);
        return { deletedCount };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to cleanup old backups: ${error.message}`,
        });
      }
    }),

  // Environment backup operations
  createEnvironmentBackup: adminProcedure
    .input(
      z.object({
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const backup = await createEnvironmentBackup({
          userId: ctx.user.id,
          description: input.description,
        });
        return backup;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create environment backup: ${error.message}`,
        });
      }
    }),

  restoreEnvironmentBackup: adminProcedure
    .input(
      z.object({
        backupId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await restoreEnvironmentBackup(input.backupId, ctx.user.id);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to restore environment backup: ${error.message}`,
        });
      }
    }),

  listEnvironmentBackups: adminProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        const backups = await listEnvironmentBackups(
          input?.limit || 50,
          input?.offset || 0
        );
        return backups;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list environment backups: ${error.message}`,
        });
      }
    }),

  deleteEnvironmentBackup: adminProcedure
    .input(
      z.object({
        backupId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await deleteEnvironmentBackup(input.backupId);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete environment backup: ${error.message}`,
        });
      }
    }),
});
