import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import * as authService from "../authService";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  
  // Try to get token from Authorization header first (for localStorage-based auth)
  const authHeader = opts.req.headers.authorization;
  let sessionToken: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[Auth] Using token from Authorization header');
  } else {
    // Fallback to cookie-based auth
    sessionToken = opts.req.cookies?.[COOKIE_NAME];
    if (sessionToken) {
      console.log('[Auth] Using token from cookie');
    }
  }

  if (sessionToken) {
    // Try email/password session first using new authService
    try {
      const sessionData = authService.decodeSession(sessionToken);
      if (sessionData) {
        // Validate session and get user
        const authUser = await authService.getUserFromSession(sessionData);
        if (authUser) {
          // Get full user object from database
          const dbUser = await db.getUserById(authUser.id);
          if (dbUser) {
            user = dbUser;
            console.log('[Auth] Email/password session authenticated successfully');
          }
        } else {
          console.log('[Auth] Session expired or invalid');
          opts.res.clearCookie(COOKIE_NAME);
        }
      } else {
        // Not a valid email/password session, try OAuth
        try {
          user = await sdk.authenticateRequest(opts.req);
          console.log('[Auth] OAuth session authenticated successfully');
        } catch (oauthError) {
          console.log('[Auth] Invalid session cookie, clearing');
          opts.res.clearCookie(COOKIE_NAME);
        }
      }
    } catch (error) {
      console.log('[Auth] Error processing session:', error);
      opts.res.clearCookie(COOKIE_NAME);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
