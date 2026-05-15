// ============================================================
// Portal Intern — Inginerie Creativă
// Time Tracking Service — Supabase adapter
// Replaces: server/db.ts time tracking helpers
// ============================================================

import { supabase } from '../lib/supabase';
import type { TimeEntry, ActivityType } from '../types/database.types';

// ============================================================
// CALENDAR ENTRIES
// ============================================================

/**
 * Get all time entries for a user in a given month.
 */
export async function getCalendarEntries(userId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      project:projects(id, name, code, abbreviation, emoji, color),
      task:project_tasks(id, name)
    `)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_hour', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Add a new calendar time entry.
 * If projectTaskId is provided, deducts hours from task budget.
 */
export async function addCalendarEntry(input: {
  userId: string;
  date: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  activityType: ActivityType;
  taskName?: string;
  description?: string;
  projectId?: number;
  projectTaskId?: number;
  isBillable?: boolean;
}) {
  const durationMinutes =
    (input.endHour * 60 + input.endMin) - (input.startHour * 60 + input.startMin);

  if (durationMinutes <= 0) {
    throw new Error('Ora de sfârșit trebuie să fie după ora de început.');
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: input.userId,
      date: input.date,
      start_hour: input.startHour,
      start_min: input.startMin,
      end_hour: input.endHour,
      end_min: input.endMin,
      duration_minutes: durationMinutes,
      activity_type: input.activityType,
      task_name: input.taskName ?? null,
      description: input.description ?? null,
      project_id: input.projectId ?? null,
      project_task_id: input.projectTaskId ?? null,
      is_billable: input.isBillable ?? true,
      status: 'salvat',
    })
    .select()
    .single();

  if (error) throw error;

  // If linked to a task, deduct minutes from task budget
  if (input.projectTaskId) {
    const { data: task } = await supabase
      .from('project_tasks')
      .select('minutes_worked')
      .eq('id', input.projectTaskId)
      .single();

    if (task) {
      await supabase
        .from('project_tasks')
        .update({ minutes_worked: (task.minutes_worked ?? 0) + durationMinutes })
        .eq('id', input.projectTaskId);
    }
  }

  return data;
}

/**
 * Update an existing time entry.
 */
export async function updateCalendarEntry(
  entryId: number,
  userId: string,
  input: Partial<{
    date: string;
    startHour: number;
    startMin: number;
    endHour: number;
    endMin: number;
    activityType: ActivityType;
    taskName: string;
    description: string;
    projectId: number;
    projectTaskId: number;
  }>
) {
  let durationMinutes: number | undefined;

  if (
    input.startHour !== undefined &&
    input.startMin !== undefined &&
    input.endHour !== undefined &&
    input.endMin !== undefined
  ) {
    durationMinutes =
      (input.endHour * 60 + input.endMin) - (input.startHour * 60 + input.startMin);
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      ...(input.date !== undefined && { date: input.date }),
      ...(input.startHour !== undefined && { start_hour: input.startHour }),
      ...(input.startMin !== undefined && { start_min: input.startMin }),
      ...(input.endHour !== undefined && { end_hour: input.endHour }),
      ...(input.endMin !== undefined && { end_min: input.endMin }),
      ...(durationMinutes !== undefined && { duration_minutes: durationMinutes }),
      ...(input.activityType !== undefined && { activity_type: input.activityType }),
      ...(input.taskName !== undefined && { task_name: input.taskName }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.projectId !== undefined && { project_id: input.projectId }),
      ...(input.projectTaskId !== undefined && { project_task_id: input.projectTaskId }),
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a time entry.
 */
export async function deleteCalendarEntry(entryId: number, userId: string) {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================================
// PONTAJ
// ============================================================

/**
 * Get pontaj entries for a user in a given month.
 */
export async function getPontajEntries(userId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('pontaj')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Check in (start of workday).
 */
export async function checkIn(userId: string, date: string, type: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('pontaj')
    .upsert({
      user_id: userId,
      date,
      check_in: now,
      type: type as any,
    }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check out (end of workday).
 */
export async function checkOut(userId: string, date: string) {
  const now = new Date().toISOString();

  // Get existing entry to calculate total
  const { data: existing } = await supabase
    .from('pontaj')
    .select('check_in, break_minutes')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  let totalMinutes = 0;
  if (existing?.check_in) {
    const checkInMs = new Date(existing.check_in).getTime();
    const totalMs = Date.now() - checkInMs;
    totalMinutes = Math.floor(totalMs / 60000) - (existing.break_minutes ?? 0);
  }

  const { data, error } = await supabase
    .from('pontaj')
    .update({
      check_out: now,
      total_minutes: totalMinutes,
    })
    .eq('user_id', userId)
    .eq('date', date)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// GANTT DATA (Process Overview)
// ============================================================

/**
 * Get Gantt data: all employees with their enrolled projects.
 * Used for the Process Overview Gantt chart.
 */
export async function getGanttData(startDate: string, endDate: string) {
  // Get all active users with their project memberships
  const { data: members, error } = await supabase
    .from('project_members')
    .select(`
      project_role,
      user:users(id, name, department, avatar_url),
      project:projects(id, name, code, abbreviation, emoji, color, start_date, end_date, status)
    `)
    .eq('project.status', 'activ');

  if (error) throw error;

  // Group by department → user → projects
  const departments = new Map<string, Map<string, {
    userId: string;
    userName: string;
    department: string;
    avatarUrl: string | null;
    projects: Array<{
      projectId: number;
      projectName: string;
      projectCode: string | null;
      projectAbbreviation: string | null;
      projectEmoji: string | null;
      projectColor: string;
      startDate: string | null;
      endDate: string | null;
    }>;
  }>>();

  for (const member of members ?? []) {
    const user = (member as any).user;
    const project = (member as any).project;
    if (!user || !project) continue;

    const dept = user.department ?? 'Fără departament';
    if (!departments.has(dept)) departments.set(dept, new Map());

    const deptMap = departments.get(dept)!;
    if (!deptMap.has(user.id)) {
      deptMap.set(user.id, {
        userId: user.id,
        userName: user.name,
        department: dept,
        avatarUrl: user.avatar_url,
        projects: [],
      });
    }

    deptMap.get(user.id)!.projects.push({
      projectId: project.id,
      projectName: project.name,
      projectCode: project.code,
      projectAbbreviation: project.abbreviation,
      projectEmoji: project.emoji,
      projectColor: project.color,
      startDate: project.start_date,
      endDate: project.end_date,
    });
  }

  return Array.from(departments.entries()).map(([deptName, usersMap]) => ({
    department: deptName,
    employees: Array.from(usersMap.values()),
  }));
}
