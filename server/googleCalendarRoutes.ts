/**
 * Google Calendar OAuth callback route
 * Handles the redirect from Google after user authorizes Calendar access
 */
import type { Express } from "express";
import { exchangeCodeForTokens, saveTokens } from "./googleCalendar";

export function registerGoogleCalendarRoutes(app: Express) {
  app.get("/api/oauth/google-calendar/callback", async (req, res) => {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      console.error("[GCal OAuth] Error:", error);
      return res.redirect("/?gcal=error&reason=" + encodeURIComponent(error));
    }

    if (!code || !state) {
      return res.redirect("/?gcal=error&reason=missing_params");
    }

    let parsedState: { userId: number; origin: string };
    try {
      parsedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    } catch {
      return res.redirect("/?gcal=error&reason=invalid_state");
    }

    const { userId, origin } = parsedState;
    const redirectUri = `${origin}/api/oauth/google-calendar/callback`;

    try {
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      await saveTokens(
        userId,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
        tokens.scope
      );
      console.log(`[GCal OAuth] User ${userId} connected Google Calendar`);
      // Redirect back to time-tracking page with success indicator
      return res.redirect("/time-tracking?gcal=connected");
    } catch (err) {
      console.error("[GCal OAuth] Token exchange failed:", err);
      return res.redirect("/time-tracking?gcal=error");
    }
  });
}
