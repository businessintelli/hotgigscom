import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export const documentUploadRouter = router({
  uploadDocument: protectedProcedure
    .input(z.object({
      data: z.string(), // base64
      filename: z.string(),
      mimeType: z.string(),
      documentType: z.enum(['passport', 'dl']),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(input.data, 'base64');
        
        // Generate file key
        const extension = input.filename.split('.').pop();
        const fileKey = `user-${ctx.user.id}/documents/${input.documentType}-${randomSuffix()}.${extension}`;
        
        // Upload to S3
        const { url } = await storagePut(
          fileKey,
          buffer,
          input.mimeType
        );
        
        return {
          success: true,
          url,
        };
      } catch (error: any) {
        console.error('Document upload failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to upload document',
        };
      }
    }),
});
