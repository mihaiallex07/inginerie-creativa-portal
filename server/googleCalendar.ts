/**
 * Google Calendar integration service
 * Handles OAuth2 flow, token management, and bidirectional sync with Time-Tracking
 */
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { googleCalendarTokens, gcalSyncMap } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const GCAL_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GCAL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GCAL_API_BASE = "https://www.googleapis.com/calendar/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

// ─── OAuth URL generation ─────────────────────────────────────────────────────

export function getGoogleCalendarAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GCAL_AUTH_URL}?${params.toString()}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch(GCAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }>;
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GCAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  return data.access_token;
}

// ─── Get valid access token for user ─────────────────────────────────────────

export async function getValidAccessToken(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [tokenRow] = await db
    .select()
    .from(googleCalendarTokens)
    .where(eq(googleCalendarTokens.userId, userId));

  if (!tokenRow) return null;

  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const isExpired = tokenRow.expiresAt && tokenRow.expiresAt.getTime() < now.getTime() + 5 * 60 * 1000;

  if (isExpired && tokenRow.refreshToken) {
    try {
      const newAccessToken = await refreshAccessToken(tokenRow.refreshToken);
      const newExpiry = new Date(Date.now() + 3600 * 1000);
      await db
        .update(googleCalendarTokens)
        .set({ accessToken: newAccessToken, expiresAt: newExpiry, updatedAt: new Date() })
        .where(eq(googleCalendarTokens.userId, userId));
      return newAccessToken;
    } catch {
      return null;
    }
  }

  return tokenRow.accessToken;
}

// ─── Save tokens to DB ────────────────────────────────────────────────────────

export async function saveTokens(
  userId: number,
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
  scope: string
) {
  const db = await getDb();
  if (!db) return;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const existing = await db
    .select({ id: googleCalendarTokens.id })
    .from(googleCalendarTokens)
    .where(eq(googleCalendarTokens.userId, userId));

  if (existing.length > 0) {
    await db
      .update(googleCalendarTokens)
      .set({
        accessToken,
        ...(refreshToken ? { refreshToken } : {}),
        expiresAt,
        scope,
        syncEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarTokens.userId, userId));
  } else {
    await db.insert(googleCalendarTokens).values({
      userId,
      accessToken,
      refreshToken: refreshToken ?? null,
      expiresAt,
      scope,
      syncEnabled: true,
    });
  }
}

// ─── Fetch Google Calendar events ─────────────────────────────────────────────

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId = "primary"
): Promise<GCalEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${err}`);
  }
  const data = await res.json() as { items: GCalEvent[] };
  return data.items ?? [];
}

// ─── Create Google Calendar event ─────────────────────────────────────────────

export async function createCalendarEvent(
  accessToken: string,
  event: GCalEventInput,
  calendarId = "primary"
): Promise<GCalEvent> {
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create event failed: ${err}`);
  }
  return res.json() as Promise<GCalEvent>;
}

// ─── Update Google Calendar event ─────────────────────────────────────────────

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<GCalEventInput>,
  calendarId = "primary"
): Promise<GCalEvent> {
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update event failed: ${err}`);
  }
  return res.json() as Promise<GCalEvent>;
}

// ─── Delete Google Calendar event ─────────────────────────────────────────────

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  const res = await fetch(`${GCAL_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const err = await res.text();
    throw new Error(`Delete event failed: ${err}`);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
  status?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
}

export interface GCalEventInput {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
}

// ─── Check if user has connected Google Calendar ─────────────────────────────

export async function hasGoogleCalendarConnected(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ id: googleCalendarTokens.id, syncEnabled: googleCalendarTokens.syncEnabled })
    .from(googleCalendarTokens)
    .where(eq(googleCalendarTokens.userId, userId));
  return !!row && row.syncEnabled;
}

// ─── Disconnect Google Calendar ───────────────────────────────────────────────

export async function disconnectGoogleCalendar(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(googleCalendarTokens)
    .set({ syncEnabled: false, updatedAt: new Date() })
    .where(eq(googleCalendarTokens.userId, userId));
}

// ─── Get sync map entry ───────────────────────────────────────────────────────

export async function getSyncMapByTimeEntry(userId: number, timeEntryId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(gcalSyncMap)
    .where(and(eq(gcalSyncMap.userId, userId), eq(gcalSyncMap.timeEntryId, timeEntryId)));
  return row ?? null;
}

export async function upsertSyncMap(userId: number, timeEntryId: number | null, gcalEventId: string) {
  const db = await getDb();
  if (!db) return;
  if (timeEntryId) {
    const existing = await getSyncMapByTimeEntry(userId, timeEntryId);
    if (existing) {
      await db
        .update(gcalSyncMap)
        .set({ gcalEventId, lastSyncedAt: new Date() })
        .where(eq(gcalSyncMap.id, existing.id));
      return;
    }
  }
  await db.insert(gcalSyncMap).values({
    userId,
    timeEntryId,
    gcalEventId,
    direction: "both",
    lastSyncedAt: new Date(),
  });
}

export async function deleteSyncMapByTimeEntry(userId: number, timeEntryId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(gcalSyncMap)
    .where(and(eq(gcalSyncMap.userId, userId), eq(gcalSyncMap.timeEntryId, timeEntryId)));
}
