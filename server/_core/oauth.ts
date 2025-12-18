import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Test endpoint to verify OAuth routes are working
  app.get("/api/oauth/test", (req: Request, res: Response) => {
    res.json({ 
      message: "OAuth routes are working!",
      timestamp: new Date().toISOString(),
      env: {
        hasOAuthServerUrl: !!process.env.OAUTH_SERVER_URL,
        hasAppId: !!process.env.VITE_APP_ID,
        hasJwtSecret: !!process.env.JWT_SECRET,
      }
    });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log("[OAuth] Callback received", { query: req.query });
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      console.error("[OAuth] Missing code or state", { code: !!code, state: !!state });
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // Decode role from state parameter
    let role: string | undefined;
    try {
      const stateData = JSON.parse(atob(state));
      role = stateData.role;
      console.log("[OAuth] Decoded role from state", { role });
    } catch (error) {
      console.log("[OAuth] Could not decode role from state, continuing without role");
    }

    try {
      console.log("[OAuth] Exchanging code for token");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchange successful");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info retrieved", { openId: userInfo.openId, email: userInfo.email });

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Upsert user in database
      console.log("[OAuth] Upserting user in database");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Get the user ID to create role-specific profile
      console.log("[OAuth] Getting user from database");
      const user = await db.getUserByOpenId(userInfo.openId);
      console.log("[OAuth] User retrieved", { userId: user?.id });
      
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create session token first
      console.log("[OAuth] Creating session token");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[OAuth] Session cookie set", { cookieName: COOKIE_NAME });

      // If role is specified in query param, create that profile
      if (role) {
        if (role === 'recruiter') {
          const existingRecruiter = await db.getRecruiterByUserId(user.id);
          if (!existingRecruiter) {
            await db.createRecruiter({
              userId: user.id,
              companyName: null,
              phoneNumber: null,
              bio: null,
            });
          }
          res.redirect(302, "/recruiter/dashboard");
          return;
        } else if (role === 'candidate') {
          const existingCandidate = await db.getCandidateByUserId(user.id);
          if (!existingCandidate) {
            await db.createCandidate({
              userId: user.id,
              title: null,
              phoneNumber: null,
              location: null,
              bio: null,
              skills: null,
              experience: null,
              education: null,
            });
          }
          res.redirect(302, "/candidate-dashboard");
          return;
        }
      }

      // Check if user already has a role
      console.log("[OAuth] Checking for existing roles");
      const existingRecruiter = await db.getRecruiterByUserId(user.id);
      const existingCandidate = await db.getCandidateByUserId(user.id);
      console.log("[OAuth] Role check complete", { hasRecruiter: !!existingRecruiter, hasCandidate: !!existingCandidate });

      if (existingRecruiter) {
        console.log("[OAuth] Redirecting to recruiter dashboard");
        res.redirect(302, "/recruiter/dashboard");
      } else if (existingCandidate) {
        console.log("[OAuth] Redirecting to candidate dashboard");
        res.redirect(302, "/candidate-dashboard");
      } else {
        // New user without role - redirect to role selection page
        console.log("[OAuth] Redirecting to role selection page");
        res.redirect(302, "/select-role");
      }
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      // Instead of JSON error, redirect to home with error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[OAuth] Error details:", errorMessage);
      res.redirect(302, `/?error=${encodeURIComponent(errorMessage)}`);
    }
  });
}
