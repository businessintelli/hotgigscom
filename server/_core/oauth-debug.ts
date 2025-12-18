import type { Express, Request, Response } from "express";

export function registerOAuthDebugRoutes(app: Express) {
  // Debug endpoint to see what OAuth sends us
  app.get("/api/oauth/debug", async (req: Request, res: Response) => {
    res.json({
      query: req.query,
      headers: req.headers,
      cookies: req.cookies,
    });
  });
}
