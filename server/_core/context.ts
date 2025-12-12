import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const sessionCookie = opts.req.cookies?.[COOKIE_NAME];

  try {
    // First try OAuth authentication
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Log OAuth authentication failure for debugging
    if (sessionCookie) {
      console.log('[Auth] OAuth authentication failed, trying fallback:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // If OAuth fails, try email/password session
    if (sessionCookie) {
      try {
        // Decode session data from cookie
        const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
        if (sessionData.userId) {
          // Fetch user from database
          const dbUser = await db.getUserById(sessionData.userId);
          if (dbUser) {
            user = dbUser;
            console.log('[Auth] Email/password session authenticated successfully');
          }
        }
      } catch (decodeError) {
        // Invalid session cookie - clear it
        console.log('[Auth] Invalid session cookie, clearing');
        opts.res.clearCookie(COOKIE_NAME);
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
