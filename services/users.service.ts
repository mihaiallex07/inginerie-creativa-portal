// ============================================================
// Portal Intern — Inginerie Creativă
// Users Service — Supabase adapter
// Replaces: server/db.ts user helpers
// ============================================================

import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../types/database.types';

// ============================================================
// USER PROFILE
// ============================================================

/**
 * Get a user profile by ID.
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all active users (for employee directory, dropdowns, etc.)
 */
export async function listUsers(includeInactive = false) {
  let query = supabase
    .from('users')
    .select('id, name, email, role, department, job_title, avatar_url, phone, is_active, display_order')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * List users grouped by department.
 */
export async function listUsersByDepartment() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, department, job_title, avatar_url, is_active')
    .eq('is_active', true)
    .order('department', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  const grouped = new Map<string, typeof data>();
  for (const user of data ?? []) {
    const dept = user.department ?? 'Fără departament';
    if (!grouped.has(dept)) grouped.set(dept, []);
    grouped.get(dept)!.push(user);
  }

  return Array.from(grouped.entries()).map(([department, users]) => ({
    department,
    users,
  }));
}

/**
 * Update a user's profile.
 */
export async function updateUserProfile(userId: string, input: Partial<{
  name: string;
  department: string;
  jobTitle: string;
  phone: string;
  phoneMobile: string;
  avatarUrl: string;
  birthDate: string;
  hireDate: string;
  addressBuletin: string;
  city: string;
  cnp: string;
  ciSeries: string;
  ciNumber: string;
  ciExpiry: string;
  ciIssuedBy: string;
  iban: string;
  bankName: string;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelation: string;
  bloodType: User['blood_type'];
  allergies: string;
  profileNotes: string;
  workHoursPerDay: number;
}>) {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.jobTitle !== undefined && { job_title: input.jobTitle }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.phoneMobile !== undefined && { phone_mobile: input.phoneMobile }),
      ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
      ...(input.birthDate !== undefined && { birth_date: input.birthDate }),
      ...(input.hireDate !== undefined && { hire_date: input.hireDate }),
      ...(input.addressBuletin !== undefined && { address_buletin: input.addressBuletin }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.cnp !== undefined && { cnp: input.cnp }),
      ...(input.ciSeries !== undefined && { ci_series: input.ciSeries }),
      ...(input.ciNumber !== undefined && { ci_number: input.ciNumber }),
      ...(input.ciExpiry !== undefined && { ci_expiry: input.ciExpiry }),
      ...(input.ciIssuedBy !== undefined && { ci_issued_by: input.ciIssuedBy }),
      ...(input.iban !== undefined && { iban: input.iban }),
      ...(input.bankName !== undefined && { bank_name: input.bankName }),
      ...(input.emergencyContact !== undefined && { emergency_contact: input.emergencyContact }),
      ...(input.emergencyPhone !== undefined && { emergency_phone: input.emergencyPhone }),
      ...(input.emergencyRelation !== undefined && { emergency_relation: input.emergencyRelation }),
      ...(input.bloodType !== undefined && { blood_type: input.bloodType }),
      ...(input.allergies !== undefined && { allergies: input.allergies }),
      ...(input.profileNotes !== undefined && { profile_notes: input.profileNotes }),
      ...(input.workHoursPerDay !== undefined && { work_hours_per_day: input.workHoursPerDay }),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a user's role (admin only — enforced by RLS).
 */
export async function updateUserRole(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deactivate a user account.
 */
export async function deactivateUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

/**
 * Get unread notifications for a user.
 */
export async function getNotifications(userId: string, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Mark notifications as read.
 */
export async function markNotificationsRead(userId: string, notificationIds?: number[]) {
  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (notificationIds?.length) {
    query = query.in('id', notificationIds);
  }

  const { error } = await query;
  if (error) throw error;
}

// ============================================================
// LEAVE REQUESTS
// ============================================================

/**
 * Get leave requests for a user.
 */
export async function getLeaveRequests(userId: string) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      reviewer:users!reviewed_by(id, name),
      substitute:users!substitute_user_id(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Submit a leave request.
 */
export async function submitLeaveRequest(input: {
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  substituteUserId?: string;
}) {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: input.userId,
      type: input.type as any,
      start_date: input.startDate,
      end_date: input.endDate,
      total_days: input.totalDays,
      reason: input.reason ?? null,
      substitute_user_id: input.substituteUserId ?? null,
      status: 'in_asteptare',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Review a leave request (admin/coordonator only).
 */
export async function reviewLeaveRequest(
  requestId: number,
  reviewerId: string,
  status: 'aprobata' | 'respinsa',
  reviewNote?: string
) {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      reviewed_by: reviewerId,
      review_note: reviewNote ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
