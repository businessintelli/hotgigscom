import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import logger from "../services/logger";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

// Error logging middleware
const errorLoggingMiddleware = t.middleware(async (opts) => {
  const { ctx, next, path, type } = opts;
  const start = Date.now();
  
  try {
    const result = await next();
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log the error
    if (error instanceof TRPCError) {
      // Don't log UNAUTHORIZED as errors - they're expected
      if (error.code !== 'UNAUTHORIZED') {
        await logger.apiError(
          `${type}:${path}`,
          error,
          ctx.user?.id,
          undefined
        );
      }
    } else if (error instanceof Error) {
      await logger.error(
        'api',
        `Unexpected error in ${type}:${path}`,
        error,
        ctx.user?.id
      );
    }
    
    throw error;
  }
});

export const publicProcedure = t.procedure.use(errorLoggingMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(errorLoggingMiddleware).use(requireUser);

export const adminProcedure = t.procedure.use(errorLoggingMiddleware).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
