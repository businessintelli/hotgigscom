import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Mock user for testing without authentication
const MOCK_USER: User = {
  id: 1,
  openId: "mock-open-id",
  email: "test@recruiter.com",
  name: "Test Recruiter",
  role: "recruiter",
  loginMethod: "oauth",
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // TEMPORARY: Bypass authentication for testing
  // Return mock user instead of checking OAuth
  console.log("[Auth Bypass] Using mock user for testing");
  
  return {
    req: opts.req,
    res: opts.res,
    user: MOCK_USER,
  };
  
  /* Original OAuth authentication (commented out for testing)
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Silently handle authentication failures
    // User will be null for unauthenticated requests
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
  */
}
