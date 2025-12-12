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
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const role = getQueryParam(req, "role"); // Get role from query parameter

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Upsert user in database
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Get the user ID to create role-specific profile
      const user = await db.getUserByOpenId(userInfo.openId);
      
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create session token first
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

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
      const existingRecruiter = await db.getRecruiterByUserId(user.id);
      const existingCandidate = await db.getCandidateByUserId(user.id);

      if (existingRecruiter) {
        res.redirect(302, "/recruiter/dashboard");
      } else if (existingCandidate) {
        res.redirect(302, "/candidate-dashboard");
      } else {
        // New user without role - redirect to role selection page
        res.redirect(302, "/select-role");
      }
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
