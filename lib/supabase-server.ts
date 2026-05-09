// ============================================================
// Portal Intern — Inginerie Creativă
// Supabase Server Client — Service Role (bypasses RLS)
// Use ONLY in server-side code (API routes, Server Actions)
// NEVER expose service role key to the browser!
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase server environment variables. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
}

/**
 * Server-side Supabase client — uses service role key, BYPASSES RLS.
 * Use for admin operations, background jobs, and server-side data access.
 * Import ONLY in server-side files (app/api/*, server actions, etc.)
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ============================================================
// SERVER-SIDE AUTH HELPERS
// ============================================================

/**
 * Create a Supabase client that acts on behalf of the current user.
 * Pass the user's JWT access token from the request headers.
 * This client respects RLS policies.
 */
export function createServerClient(accessToken: string) {
  return createClient<Database>(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

// ============================================================
// ADMIN OPERATIONS (service role only)
// ============================================================

/**
 * Create a new user in auth.users (admin only).
 * The trigger will auto-create the public.users profile.
 */
export async function adminCreateUser(email: string, password: string, metadata?: {
  name?: string;
  role?: string;
}) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata ?? {},
  });
  if (error) throw error;
  return data;
}

/**
 * Delete a user from auth.users (cascades to public.users via FK).
 */
export async function adminDeleteUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;
  return data;
}

/**
 * Send a notification to a user by inserting into public.notifications.
 * Replaces the Manus notifyOwner() helper.
 */
export async function sendNotification(params: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message ?? null,
      link: params.link ?? null,
      is_read: false,
    });
  if (error) throw error;
}

/**
 * Send a notification to all admin users.
 * Replaces notifyOwner() for system-wide alerts.
 */
export async function notifyAdmins(params: {
  type: string;
  title: string;
  message?: string;
  link?: string;
}) {
  const { data: admins, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (error) throw error;

  const notifications = admins.map((admin) => ({
    user_id: admin.id,
    type: params.type,
    title: params.title,
    message: params.message ?? null,
    link: params.link ?? null,
    is_read: false,
  }));

  const { error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(notifications);

  if (insertError) throw insertError;
}
