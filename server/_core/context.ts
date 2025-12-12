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

  try {
    // First try OAuth authentication
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // If OAuth fails, try email/password session
    const sessionCookie = opts.req.cookies?.[COOKIE_NAME];
    if (sessionCookie) {
      try {
        // Decode session data from cookie
        const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
        if (sessionData.userId) {
          // Fetch user from database
          const dbUser = await db.getUserById(sessionData.userId);
          if (dbUser) {
            user = dbUser;
          }
        }
      } catch (decodeError) {
        // Invalid session cookie, user remains null
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
