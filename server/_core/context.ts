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

  if (sessionCookie) {
    // Try email/password session first (base64-encoded JSON)
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
      if (sessionData.userId) {
        // This is an email/password session
        const dbUser = await db.getUserById(sessionData.userId);
        if (dbUser) {
          user = dbUser;
          console.log('[Auth] Email/password session authenticated successfully');
        }
      }
    } catch (decodeError) {
      // Not a valid email/password session, try OAuth
      try {
        user = await sdk.authenticateRequest(opts.req);
        console.log('[Auth] OAuth session authenticated successfully');
      } catch (oauthError) {
        // Invalid session cookie - clear it
        console.log('[Auth] Invalid session cookie (neither email/password nor OAuth), clearing');
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
