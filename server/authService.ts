/**
 * Unified Authentication Service
 * 
 * This module provides a clean, centralized authentication system with:
 * - Email/password authentication
 * - JWT-based session management
 * - Role-based access control
 * - Automatic profile creation
 * - Session persistence
 */

import { hashPassword, comparePassword } from "./auth";
import * as db from "./db";
import { updateUserById } from "./dbUpdate";
import { generateVerificationToken, generateTokenExpiry } from "./auth";
import { sendVerificationEmail } from "./authEmails";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'recruiter' | 'candidate' | 'admin' | 'user';
  emailVerified: boolean;
}

export interface SessionData {
  userId: number;
  email: string;
  role: 'recruiter' | 'candidate' | 'admin' | 'user';
  expiry: string;
  rememberMe: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: 'recruiter' | 'candidate';
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData, baseUrl: string): Promise<{ success: boolean; user: AuthUser; message: string }> {
  // Check if user already exists
  const existingUser = await db.getUserByEmail(data.email);
  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Generate verification token
  const verificationToken = generateVerificationToken();
  const verificationTokenExpiry = generateTokenExpiry(24); // 24 hours

  // Create user
  const user = await db.upsertUser({
    openId: null,
    name: data.name,
    email: data.email,
    passwordHash,
    loginMethod: 'email',
    emailVerified: false,
    verificationToken,
    verificationTokenExpiry,
  });

  // Get the created user to get the ID
  const createdUser = await db.getUserByEmail(data.email);
  if (!createdUser) {
    throw new Error('Failed to create user');
  }

  // Note: User role will be determined by profile existence

  // Create role-specific profile
  if (data.role === 'recruiter') {
    await db.createRecruiter({
      userId: createdUser.id,
      companyName: null,
      phoneNumber: null,
      bio: null,
    });
  } else if (data.role === 'candidate') {
    await db.createCandidate({
      userId: createdUser.id,
      title: null,
      phoneNumber: null,
      location: null,
      bio: null,
      skills: null,
      experience: null,
      education: null,
    });
  }

  // Send verification email
  await sendVerificationEmail(data.email, data.name, verificationToken, baseUrl);

  return {
    success: true,
    user: {
      id: createdUser.id,
      email: createdUser.email!,
      name: createdUser.name!,
      role: data.role,
      emailVerified: false,
    },
    message: 'Account created! Please check your email to verify your account.',
  };
}

/**
 * Sign in a user with email and password
 */
export async function signIn(data: SignInData): Promise<{ success: boolean; user: AuthUser; sessionData: SessionData }> {
  // Find user by email
  const user = await db.getUserByEmail(data.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user has a password (not OAuth user)
  if (!user.passwordHash) {
    throw new Error('This account uses social login. Please sign in with your social account.');
  }

  // Verify password
  const isValid = await comparePassword(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Update last signed in
  await updateUserById(user.id, { lastSignedIn: new Date() });

  // Determine user role
  let role: 'recruiter' | 'candidate' | 'admin' | 'user' = user.role as any || 'user';
  
  // Double-check role by looking at profiles
  if (role === 'user') {
    const recruiter = await db.getRecruiterByUserId(user.id);
    const candidate = await db.getCandidateByUserId(user.id);
    
    if (recruiter) {
      role = 'recruiter';
      // Role determined by recruiter profile
    } else if (candidate) {
      role = 'candidate';
      // Role determined by candidate profile
    }
  }

  // Create session data
  const maxAge = data.rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);
  const expiry = new Date(Date.now() + maxAge);
  
  const sessionData: SessionData = {
    userId: user.id,
    email: user.email!,
    role,
    expiry: expiry.toISOString(),
    rememberMe: data.rememberMe || false,
  };

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email!,
      name: user.name!,
      role,
      emailVerified: user.emailVerified || false,
    },
    sessionData,
  };
}

/**
 * Get user from session data
 */
export async function getUserFromSession(sessionData: SessionData): Promise<AuthUser | null> {
  // Check if session is expired
  const expiry = new Date(sessionData.expiry);
  if (expiry < new Date()) {
    return null;
  }

  // Get user from database
  const user = await db.getUserById(sessionData.userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.name!,
    role: sessionData.role,
    emailVerified: user.emailVerified || false,
  };
}

/**
 * Extend session expiry
 */
export function extendSession(sessionData: SessionData, days: number = 30): SessionData {
  const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return {
    ...sessionData,
    expiry: newExpiry.toISOString(),
  };
}

/**
 * Encode session data to cookie string
 */
export function encodeSession(sessionData: SessionData): string {
  return Buffer.from(JSON.stringify(sessionData)).toString('base64');
}

/**
 * Decode session data from cookie string
 */
export function decodeSession(cookieValue: string): SessionData | null {
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    return JSON.parse(decoded) as SessionData;
  } catch {
    return null;
  }
}
