import { COOKIE_NAME, ONE_YEAR_MS } from from "../../shared/const";
import type { Express, Request, Response } from "express";
import { google } from "googleapis";
import { SignJWT } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

async function createSessionToken(openId: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.jwtSecret);
  const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secret);
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}

// Generate Google OAuth URL — called by frontend via /api/oauth/google-url
export function getGoogleAuthUrl(origin: string): string {
  const redirectUri = `${origin}/api/oauth/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
    state: Buffer.from(JSON.stringify({ origin })).toString("base64"),
  });
}

export function registerOAuthRoutes(app: Express) {
  // Frontend calls this to get the Google login URL dynamically
  app.get("/api/oauth/google-url", (req: Request, res: Response) => {
    const origin = getQueryParam(req, "origin") ?? `${req.protocol}://${req.get("host")}`;
    const url = getGoogleAuthUrl(origin);
    res.json({ url });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    let origin = "/";
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      origin = decoded.origin ?? "/";
    } catch {
      origin = "/";
    }

    const redirectUri = `${origin}/api/oauth/callback`;

    try {
      const oauth2Client = getOAuth2Client(redirectUri);
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: googleUser } = await oauth2.userinfo.get();

      const email = googleUser.email ?? "";
      const googleId = googleUser.id ?? "";
      const name = googleUser.name ?? "";

      if (!email || !googleId) {
        res.status(400).json({ error: "Could not get user info from Google" });
        return;
      }

      // Restrict access to @ingineriecreativa.ro accounts only
      if (!email.endsWith("@ingineriecreativa.ro")) {
        const errorUrl = `${origin}/?error=unauthorized_domain&email=${encodeURIComponent(email)}`;
        res.redirect(302, errorUrl);
        return;
      }

      const openId = `google:${googleId}`;

      await db.upsertUser({
        openId,
        name: name || null,
        email: email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await createSessionToken(openId, name);

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
