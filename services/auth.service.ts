// ============================================================
// Portal Intern — Inginerie Creativă
// Auth Service — Supabase adapter
// Replaces: Manus OAuth (server/_core/oauth.ts)
// ============================================================

import { supabase } from '../lib/supabase';
import type { User } from '../types/database.types';

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Get the current authenticated session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Get the current user's auth record + profile.
 * Returns null if not authenticated.
 */
export async function getCurrentUserWithProfile(): Promise<{
  authUser: { id: string; email: string | undefined };
  profile: User;
} | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) throw error;

  return {
    authUser: { id: authUser.id, email: authUser.email },
    profile,
  };
}

// ============================================================
// SIGN IN
// ============================================================

/**
 * Sign in with Google OAuth.
 * Restricts to @ingineriecreativa.ro domain via hd parameter.
 */
export async function signInWithGoogle(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
      queryParams: {
        // Restrict to company Google Workspace domain
        hd: 'ingineriecreativa.ro',
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: [
        'openid',
        'email',
        'profile',
        // Add Google Calendar scope if needed:
        // 'https://www.googleapis.com/auth/calendar',
      ].join(' '),
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password (for non-Google accounts).
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Send a password reset email.
 */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

// ============================================================
// SIGN OUT
// ============================================================

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ============================================================
// AUTH CALLBACK HANDLER
// ============================================================

/**
 * Handle the OAuth callback after Google sign-in.
 * Call this in your /auth/callback page.
 *
 * Example usage in Next.js App Router:
 *
 * // app/auth/callback/route.ts
 * import { handleAuthCallback } from '@/services/auth.service';
 * export async function GET(request: Request) {
 *   return handleAuthCallback(request);
 * }
 */
export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data;
}

// ============================================================
// AUTH STATE LISTENER (React hook pattern)
// ============================================================

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 *
 * Usage:
 *   const unsubscribe = onAuthStateChange((user) => {
 *     setUser(user);
 *   });
 *   return () => unsubscribe();
 */
export function onAuthStateChange(callback: (user: { id: string; email?: string } | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? { id: session.user.id, email: session.user.email } : null);
  });

  return () => subscription.unsubscribe();
}

// ============================================================
// GOOGLE CALENDAR TOKEN MANAGEMENT
// (Replaces server/routers.ts googleCalendar procedures)
// ============================================================

/**
 * Save or update Google Calendar OAuth tokens for a user.
 * Called after the Google Calendar OAuth flow completes.
 */
export async function saveGoogleCalendarTokens(input: {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
}) {
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .upsert({
      user_id: input.userId,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      expires_at: input.expiresAt ?? null,
      scope: input.scope ?? null,
      sync_enabled: true,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get Google Calendar tokens for a user.
 */
export async function getGoogleCalendarTokens(userId: string) {
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Disconnect Google Calendar for a user.
 */
export async function disconnectGoogleCalendar(userId: string) {
  const { error } = await supabase
    .from('google_calendar_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
