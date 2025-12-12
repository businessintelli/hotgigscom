import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

// TODO: Complete onboarding/offboarding system implementation
// Database schema and helpers are ready in onboardingDb.ts
// Full router implementation is in onboardingRouter.ts.backup
export const onboardingRouter = router({
  placeholder: protectedProcedure.query(() => ({ 
    message: "Onboarding system foundation complete - UI implementation pending" 
  })),
});
