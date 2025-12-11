import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import { verifyToken } from "../auth";
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
    // If OAuth fails, try password-based session
    const sessionCookie = opts.req.cookies?.[COOKIE_NAME];
    if (sessionCookie) {
      // Check if it's a JWT token (password-based auth)
      const decoded = verifyToken(sessionCookie);
      if (decoded && decoded.email) {
        const foundUser = await db.getUserByEmail(decoded.email);
        user = foundUser || null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
