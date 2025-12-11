import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Mock users for testing without authentication
const MOCK_RECRUITER: User = {
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

const MOCK_CANDIDATE: User = {
  id: 2,
  openId: "mock-candidate-open-id",
  email: "test@candidate.com",
  name: "Test Candidate",
  role: "user",
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
  // Return appropriate mock user based on the request path
  const path = opts.req.path || "";
  const referer = opts.req.headers.referer || "";
  
  // Determine which mock user to use based on the route
  let mockUser = MOCK_RECRUITER; // Default to recruiter
  
  // Use candidate mock user for candidate-related routes
  // Check referer first (more reliable for tRPC calls)
  if (referer.includes("/candidate") || referer.includes("/jobs") || referer.includes("/apply")) {
    mockUser = MOCK_CANDIDATE;
  }
  // Override with recruiter if referer explicitly contains /recruiter
  if (referer.includes("/recruiter")) {
    mockUser = MOCK_RECRUITER;
  }
  // Also check path for direct API calls
  if (path.includes("/candidate")) {
    mockUser = MOCK_CANDIDATE;
  }
  
  console.log(`[Auth Bypass] Using mock ${mockUser.role === 'recruiter' ? 'recruiter' : 'candidate'} for testing`);
  
  return {
    req: opts.req,
    res: opts.res,
    user: mockUser,
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
