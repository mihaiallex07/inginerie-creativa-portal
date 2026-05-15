// ============================================================
// Portal Intern — Inginerie Creativă
// Projects Service — Supabase adapter
// Replaces: server/db.ts project helpers + server/routers/projects.ts
// ============================================================

import { supabase } from '../lib/supabase';
import type { Project, ProjectPhase, ProjectTask, TaskSession, TaskAssignee } from '../types/database.types';

// ============================================================
// PROJECTS
// ============================================================

export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      manager:users!manager_id(id, name, avatar_url),
      project_members(user_id, project_role)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProject(projectId: number) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      manager:users!manager_id(id, name, avatar_url),
      project_phases(
        *,
        project_tasks(
          *,
          assigned_user:users!assigned_user_id(id, name, avatar_url),
          task_assignees(user_id, users(id, name, avatar_url))
        )
      ),
      project_members(
        id, project_role, joined_at,
        user:users(id, name, avatar_url, department, job_title)
      )
    `)
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(input: {
  name: string;
  code?: string;
  clientName?: string;
  status?: Project['status'];
  managerId?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  color?: string;
  abbreviation?: string;
  emoji?: string;
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      code: input.code ?? null,
      client_name: input.clientName ?? null,
      status: input.status ?? 'activ',
      manager_id: input.managerId ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      description: input.description ?? null,
      color: input.color ?? '#FFCB09',
      abbreviation: input.abbreviation ?? null,
      emoji: input.emoji ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(projectId: number, input: Partial<{
  name: string;
  code: string;
  clientName: string;
  status: Project['status'];
  managerId: string;
  startDate: string;
  endDate: string;
  description: string;
  color: string;
  abbreviation: string;
  emoji: string;
}>) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.clientName !== undefined && { client_name: input.clientName }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.managerId !== undefined && { manager_id: input.managerId }),
      ...(input.startDate !== undefined && { start_date: input.startDate }),
      ...(input.endDate !== undefined && { end_date: input.endDate }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.abbreviation !== undefined && { abbreviation: input.abbreviation }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId: number) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}

// ============================================================
// PHASES
// ============================================================

export async function addPhase(input: {
  projectId: number;
  name: string;
  code?: string;
  budgetHours?: number;
  color?: string;
  displayOrder?: number;
}) {
  const { data, error } = await supabase
    .from('project_phases')
    .insert({
      project_id: input.projectId,
      name: input.name,
      code: input.code ?? null,
      budget_hours: input.budgetHours ?? 0,
      color: input.color ?? '#FFCB09',
      display_order: input.displayOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePhase(phaseId: number, input: Partial<{
  name: string;
  code: string;
  budgetHours: number;
  color: string;
  status: ProjectPhase['status'];
  displayOrder: number;
}>) {
  const { data, error } = await supabase
    .from('project_phases')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.budgetHours !== undefined && { budget_hours: input.budgetHours }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.displayOrder !== undefined && { display_order: input.displayOrder }),
    })
    .eq('id', phaseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// TASKS
// ============================================================

export async function addTask(input: {
  phaseId: number;
  projectId: number;
  name: string;
  description?: string;
  budgetHours?: number;
  assignedUserId?: string;
  displayOrder?: number;
}) {
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      phase_id: input.phaseId,
      project_id: input.projectId,
      name: input.name,
      description: input.description ?? null,
      budget_hours: input.budgetHours ?? 0,
      assigned_user_id: input.assignedUserId ?? null,
      display_order: input.displayOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: number, input: Partial<{
  name: string;
  description: string;
  budgetHours: number;
  status: ProjectTask['status'];
  assignedUserId: string;
}>) {
  const { data, error } = await supabase
    .from('project_tasks')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.budgetHours !== undefined && { budget_hours: input.budgetHours }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.assignedUserId !== undefined && { assigned_user_id: input.assignedUserId }),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// TASK SESSIONS (Timer: Start / Pause / Resume / Stop)
// ============================================================

/**
 * Get the active (running or paused) session for the current user.
 */
export async function getActiveSession(userId: string) {
  const { data, error } = await supabase
    .from('task_sessions')
    .select(`
      *,
      task:project_tasks(id, name, budget_hours, minutes_worked),
      project:projects(id, name, code, abbreviation, emoji, color)
    `)
    .eq('user_id', userId)
    .in('status', ['activa', 'in_pauza'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Start a new task session.
 * Fails if user already has an active session.
 */
export async function startTaskSession(input: {
  taskId: number;
  projectId: number;
  userId: string;
}) {
  // Check for existing active session
  const existing = await getActiveSession(input.userId);
  if (existing) {
    throw new Error('Există deja o sesiune activă. Oprește sesiunea curentă înainte de a porni alta.');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('task_sessions')
    .insert({
      task_id: input.taskId,
      project_id: input.projectId,
      user_id: input.userId,
      started_at: now,
      status: 'activa',
      total_minutes: 0,
    })
    .select()
    .single();

  if (error) throw error;

  // Update task status to in_lucru
  await supabase
    .from('project_tasks')
    .update({ status: 'in_lucru' })
    .eq('id', input.taskId);

  return data;
}

/**
 * Pause an active task session.
 */
export async function pauseTaskSession(sessionId: number, userId: string) {
  const now = new Date().toISOString();

  // Get current session to calculate elapsed minutes
  const { data: session, error: fetchError } = await supabase
    .from('task_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('status', 'activa')
    .single();

  if (fetchError) throw fetchError;

  const startMs = new Date(session.resumed_at ?? session.started_at).getTime();
  const elapsedMinutes = Math.floor((Date.now() - startMs) / 60000);
  const newTotal = (session.total_minutes ?? 0) + elapsedMinutes;

  const { data, error } = await supabase
    .from('task_sessions')
    .update({
      status: 'in_pauza',
      paused_at: now,
      total_minutes: newTotal,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  // Update task status
  await supabase
    .from('project_tasks')
    .update({ status: 'in_pauza' })
    .eq('id', session.task_id);

  return data;
}

/**
 * Resume a paused task session.
 */
export async function resumeTaskSession(sessionId: number, userId: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('task_sessions')
    .update({
      status: 'activa',
      resumed_at: now,
      paused_at: null,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('status', 'in_pauza')
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('project_tasks')
    .update({ status: 'in_lucru' })
    .eq('id', data.task_id);

  return data;
}

/**
 * Stop a task session and accumulate minutes to the task.
 */
export async function stopTaskSession(sessionId: number, userId: string) {
  const now = new Date().toISOString();

  const { data: session, error: fetchError } = await supabase
    .from('task_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .in('status', ['activa', 'in_pauza'])
    .single();

  if (fetchError) throw fetchError;

  let additionalMinutes = 0;
  if (session.status === 'activa') {
    const startMs = new Date(session.resumed_at ?? session.started_at).getTime();
    additionalMinutes = Math.floor((Date.now() - startMs) / 60000);
  }

  const finalMinutes = (session.total_minutes ?? 0) + additionalMinutes;

  // Close the session
  const { data, error } = await supabase
    .from('task_sessions')
    .update({
      status: 'finalizata',
      ended_at: now,
      total_minutes: finalMinutes,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;

  // Accumulate minutes on the task
  const { data: task } = await supabase
    .from('project_tasks')
    .select('minutes_worked, budget_hours')
    .eq('id', session.task_id)
    .single();

  if (task) {
    const newMinutesWorked = (task.minutes_worked ?? 0) + finalMinutes;
    await supabase
      .from('project_tasks')
      .update({
        minutes_worked: newMinutesWorked,
        status: 'neinceputa',
      })
      .eq('id', session.task_id);
  }

  return { session: data, totalMinutes: finalMinutes };
}

// ============================================================
// ENROLLED TASKS (for TT dialog and header picker)
// ============================================================

/**
 * Get all tasks the current user is enrolled in, grouped by project.
 * Used for Time-Tracking dialog and header quick-start picker.
 */
export async function getMyEnrolledTasks(userId: string) {
  // Tasks via task_assignees
  const { data: assignedTasks, error: e1 } = await supabase
    .from('task_assignees')
    .select(`
      task:project_tasks(
        id, name, status, phase_id,
        phase:project_phases(id, name),
        project:projects(id, name, code, abbreviation, emoji, color)
      )
    `)
    .eq('user_id', userId);

  if (e1) throw e1;

  // Tasks via assignedUserId
  const { data: directTasks, error: e2 } = await supabase
    .from('project_tasks')
    .select(`
      id, name, status, phase_id,
      phase:project_phases(id, name),
      project:projects(id, name, code, abbreviation, emoji, color)
    `)
    .eq('assigned_user_id', userId);

  if (e2) throw e2;

  // Merge and deduplicate
  const allTasks = [
    ...(assignedTasks?.map((a) => a.task).filter(Boolean) ?? []),
    ...(directTasks ?? []),
  ];

  const seen = new Set<number>();
  const uniqueTasks = allTasks.filter((t) => {
    if (!t || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  // Group by project
  const grouped = new Map<number, {
    projectId: number;
    projectName: string;
    projectCode: string | null;
    projectAbbreviation: string | null;
    projectEmoji: string | null;
    projectColor: string;
    tasks: Array<{ taskId: number; taskName: string; phaseId: number; phaseName: string }>;
  }>();

  for (const task of uniqueTasks) {
    const project = (task as any).project;
    if (!project) continue;

    if (!grouped.has(project.id)) {
      grouped.set(project.id, {
        projectId: project.id,
        projectName: project.name,
        projectCode: project.code,
        projectAbbreviation: project.abbreviation,
        projectEmoji: project.emoji,
        projectColor: project.color,
        tasks: [],
      });
    }

    const phase = (task as any).phase;
    grouped.get(project.id)!.tasks.push({
      taskId: task.id,
      taskName: task.name,
      phaseId: phase?.id ?? 0,
      phaseName: phase?.name ?? '',
    });
  }

  return Array.from(grouped.values());
}

// ============================================================
// BUDGET ALERTS
// ============================================================

/**
 * Check budget alerts for all tasks assigned to a user.
 * Returns tasks that have exceeded 25/50/75/90% of budget.
 */
export async function checkBudgetAlerts(userId: string) {
  const { data: tasks, error } = await supabase
    .from('project_tasks')
    .select(`
      id, name, budget_hours, minutes_worked,
      alert_sent_25, alert_sent_50, alert_sent_75, alert_sent_90,
      project:projects(id, name, code),
      phase:project_phases(id, name)
    `)
    .or(`assigned_user_id.eq.${userId},task_assignees.user_id.eq.${userId}`)
    .gt('budget_hours', 0);

  if (error) throw error;

  const alerts: Array<{
    taskId: number;
    taskName: string;
    projectName: string;
    percentage: number;
    budgetHours: number;
    workedHours: number;
  }> = [];

  for (const task of tasks ?? []) {
    const budgetMinutes = (task.budget_hours ?? 0) * 60;
    if (budgetMinutes === 0) continue;

    const pct = (task.minutes_worked / budgetMinutes) * 100;

    if (pct >= 90 && !task.alert_sent_90) {
      alerts.push({ taskId: task.id, taskName: task.name, projectName: (task as any).project?.name ?? '', percentage: 90, budgetHours: task.budget_hours, workedHours: task.minutes_worked / 60 });
    } else if (pct >= 75 && !task.alert_sent_75) {
      alerts.push({ taskId: task.id, taskName: task.name, projectName: (task as any).project?.name ?? '', percentage: 75, budgetHours: task.budget_hours, workedHours: task.minutes_worked / 60 });
    } else if (pct >= 50 && !task.alert_sent_50) {
      alerts.push({ taskId: task.id, taskName: task.name, projectName: (task as any).project?.name ?? '', percentage: 50, budgetHours: task.budget_hours, workedHours: task.minutes_worked / 60 });
    } else if (pct >= 25 && !task.alert_sent_25) {
      alerts.push({ taskId: task.id, taskName: task.name, projectName: (task as any).project?.name ?? '', percentage: 25, budgetHours: task.budget_hours, workedHours: task.minutes_worked / 60 });
    }
  }

  return alerts;
}
