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
      
      if (user && role) {
        // Create appropriate profile based on role if it doesn't exist
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
        }
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to appropriate dashboard based on role
      let redirectPath = "/";
      if (role === 'recruiter') {
        redirectPath = "/recruiter/dashboard";
      } else if (role === 'candidate') {
        redirectPath = "/candidate-dashboard";
      }

      res.redirect(302, redirectPath);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
