// ============================================================
// Portal Intern — Inginerie Creativă
// TypeScript Database Types for Supabase/PostgreSQL
// Auto-generated from schema — update when schema changes
// ============================================================

export type UserRole = 'admin' | 'coordonator' | 'angajat' | 'colaborator';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type PontajType =
  | 'bucuresti' | 'cluj' | 'miercurea_ciuc' | 'brasov'
  | 'eveniment' | 'deplasare' | 'vizita_santier' | 'telemunca'
  | 'concediu' | 'medical' | 'liber_legal' | 'absent' | 'recuperare';
export type ProjectStatus = 'activ' | 'suspendat' | 'finalizat' | 'intern';
export type PhaseStatus = 'activa' | 'suspendata' | 'finalizata';
export type TaskStatus = 'neinceputa' | 'in_lucru' | 'in_pauza' | 'finalizata' | 'blocata';
export type SessionStatus = 'activa' | 'in_pauza' | 'finalizata';
export type HourRequestStatus = 'in_asteptare' | 'aprobata' | 'respinsa';
export type ActivityType =
  | 'proiectare' | 'consultanta' | 'sedinta' | 'documentare'
  | 'deplasare' | 'administrativ' | 'verificare' | 'executie';
export type TimeEntryStatus = 'draft' | 'salvat' | 'aprobat' | 'blocat';
export type NewsCategory = 'companie' | 'proiecte' | 'hr' | 'it' | 'evenimente' | 'realizari';
export type DocumentType =
  | 'contract' | 'fisa_post' | 'evaluare' | 'certificat'
  | 'salariu' | 'concediu' | 'medical' | 'alt';
export type DocumentAction = 'view' | 'download' | 'upload' | 'delete' | 'update';
export type ProcessCategory =
  | 'proiectare' | 'management' | 'financiar' | 'hr'
  | 'it' | 'achizitii' | 'comunicare' | 'alt';
export type ProcessStatus = 'activ' | 'in_revizuire' | 'arhivat';
export type ProposalStatus = 'deschisa' | 'in_evaluare' | 'acceptata' | 'amanata' | 'respinsa';
export type LeaveType =
  | 'concediu_odihna' | 'concediu_medical' | 'concediu_fara_plata'
  | 'liber_legal' | 'recuperare' | 'alt';
export type LeaveStatus = 'in_asteptare' | 'aprobata' | 'respinsa' | 'anulata';
export type EventTarget = 'all' | 'department' | 'users';
export type ProjectRole = 'coordonator' | 'membru' | 'consultant';
export type GcalDirection = 'gcal_to_portal' | 'portal_to_gcal' | 'both';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

// ============================================================
// TABLE ROW TYPES
// ============================================================

export interface User {
  id: string; // UUID (auth.users.id)
  legacy_id: number | null;
  name: string | null;
  email: string | null;
  login_method: string | null;
  role: UserRole;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_mobile: string | null;
  is_active: boolean;
  work_hours_per_day: number;
  birth_date: string | null; // ISO date string
  hire_date: string | null;
  address_buletin: string | null;
  address_secondary: string | null;
  city: string | null;
  cnp: string | null;
  ci_series: string | null;
  ci_number: string | null;
  ci_expiry: string | null;
  ci_issued_by: string | null;
  iban: string | null;
  bank_name: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
  blood_type: BloodType | null;
  allergies: string | null;
  profile_notes: string | null;
  display_order: number;
  created_at: string; // ISO timestamp
  updated_at: string;
  last_signed_in: string;
}

export interface Pontaj {
  id: number;
  user_id: string;
  date: string; // ISO date
  check_in: string | null;
  check_out: string | null;
  break_minutes: number;
  total_minutes: number;
  type: PontajType;
  project_id: number | null;
  notes: string | null;
  is_approved: boolean;
  approved_by: string | null;
  correction_requested: boolean;
  correction_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  code: string | null;
  client_name: string | null;
  status: ProjectStatus;
  is_general: boolean;
  manager_id: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  color: string;
  abbreviation: string | null;
  emoji: string | null;
  drive_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhase {
  id: number;
  project_id: number;
  name: string;
  code: string | null;
  display_order: number;
  budget_hours: number;
  color: string;
  status: PhaseStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: number;
  phase_id: number;
  project_id: number;
  name: string;
  description: string | null;
  display_order: number;
  budget_hours: number;
  minutes_worked: number;
  status: TaskStatus;
  assigned_user_id: string | null;
  alert_sent_25: boolean;
  alert_sent_50: boolean;
  alert_sent_75: boolean;
  alert_sent_90: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  id: number;
  task_id: number;
  user_id: string;
  created_at: string;
}

export interface TaskSession {
  id: number;
  task_id: number;
  project_id: number;
  user_id: string;
  started_at: string;
  paused_at: string | null;
  resumed_at: string | null;
  ended_at: string | null;
  total_minutes: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface HourBank {
  id: number;
  user_id: string;
  date: string;
  minutes_worked: number;
  created_at: string;
  updated_at: string;
}

export interface TaskHourRequest {
  id: number;
  task_id: number;
  project_id: number;
  user_id: string;
  requested_hours: number;
  justification: string;
  status: HourRequestStatus;
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTemplate {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export interface TemplatePhase {
  id: number;
  template_id: number;
  name: string;
  code: string | null;
  display_order: number;
  color: string;
}

export interface TemplateTask {
  id: number;
  template_phase_id: number;
  name: string;
  display_order: number;
}

export interface TimeEntry {
  id: number;
  user_id: string;
  project_id: number | null;
  project_task_id: number | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  start_hour: number | null;
  start_min: number | null;
  end_hour: number | null;
  end_min: number | null;
  duration_minutes: number;
  activity_type: ActivityType;
  task_name: string | null;
  description: string | null;
  is_billable: boolean;
  is_running: boolean;
  status: TimeEntryStatus;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  category: NewsCategory;
  tags: string[];
  author_id: string;
  is_pinned: boolean;
  is_important: boolean;
  image_url: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface NewsReaction {
  id: number;
  news_id: number;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface NewsComment {
  id: number;
  news_id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  user_id: string;
  uploaded_by: string;
  type: DocumentType;
  title: string;
  description: string | null;
  file_url: string | null;
  file_key: string | null;
  mime_type: string | null;
  file_size: number | null;
  is_confidential: boolean;
  year: number | null;
  month: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentAuditLog {
  id: number;
  document_id: number;
  user_id: string;
  action: DocumentAction;
  ip_address: string | null;
  created_at: string;
}

export interface Process {
  id: number;
  title: string;
  code: string | null;
  department: string;
  category: ProcessCategory;
  version: string;
  owner_id: string | null;
  content: string | null;
  status: ProcessStatus;
  is_mandatory_read: boolean;
  target_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface ProcessReadConfirmation {
  id: number;
  process_id: number;
  user_id: string;
  confirmed_at: string;
}

export interface Proposal {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  benefits: string | null;
  departments: string[];
  author_id: string;
  is_anonymous: boolean;
  status: ProposalStatus;
  manager_id: string | null;
  manager_decision: string | null;
  committee_decision: string | null;
  votes_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalVote {
  id: number;
  proposal_id: number;
  user_id: string;
  created_at: string;
}

export interface ProposalComment {
  id: number;
  proposal_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface LeaveRequest {
  id: number;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  substitute_user_id: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyEvent {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_rule: string | null;
  recurring_until: string | null;
  color: string;
  target_type: EventTarget;
  target_department: string | null;
  target_user_ids: string[];
  activity_type: ActivityType | null;
  project_id: number | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: string;
  phase_id: number | null;
  project_role: ProjectRole;
  joined_at: string;
}

export interface AppSetting {
  id: number;
  key: string;
  value: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface GoogleCalendarToken {
  id: number;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
  calendar_id: string;
  sync_enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GcalSyncMap {
  id: number;
  user_id: string;
  time_entry_id: number | null;
  gcal_event_id: string;
  direction: GcalDirection;
  last_synced_at: string;
}

export interface RecurringActivity {
  id: number;
  user_id: string;
  task_name: string;
  activity_type: ActivityType;
  project_id: number | null;
  start_hour: number;
  start_min: number;
  duration_minutes: number;
  count_in_time: boolean;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringException {
  id: number;
  recurring_id: number;
  user_id: string;
  exception_date: string;
  override_start_hour: number | null;
  override_start_min: number | null;
  override_duration: number | null;
  is_deleted: boolean;
  created_at: string;
}

export interface ActivityInvitation {
  id: number;
  time_entry_id: number;
  host_user_id: string;
  invitee_user_id: string;
  status: InvitationStatus;
  invitee_entry_id: number | null;
  notified_at: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDriveFolder {
  id: number;
  user_id: string;
  folder_id: string;
  folder_name: string;
  created_at: string;
  updated_at: string;
}

export interface DriveFileSnapshot {
  id: number;
  file_id: string;
  file_name: string;
  folder_id: string;
  folder_type: string;
  owner_user_id: string | null;
  subfolder_name: string | null;
  modified_time: string | null;
  size: string | null;
  mime_type: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SUPABASE DATABASE TYPE (for createClient<Database>)
// ============================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at' | 'last_signed_in'> & {
          created_at?: string;
          updated_at?: string;
          last_signed_in?: string;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      pontaj: {
        Row: Pontaj;
        Insert: Omit<Pontaj, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Pontaj, 'id'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id'>>;
      };
      project_phases: {
        Row: ProjectPhase;
        Insert: Omit<ProjectPhase, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProjectPhase, 'id'>>;
      };
      project_tasks: {
        Row: ProjectTask;
        Insert: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProjectTask, 'id'>>;
      };
      task_assignees: {
        Row: TaskAssignee;
        Insert: Omit<TaskAssignee, 'id' | 'created_at'>;
        Update: Partial<Omit<TaskAssignee, 'id'>>;
      };
      task_sessions: {
        Row: TaskSession;
        Insert: Omit<TaskSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TaskSession, 'id'>>;
      };
      hour_bank: {
        Row: HourBank;
        Insert: Omit<HourBank, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HourBank, 'id'>>;
      };
      task_hour_requests: {
        Row: TaskHourRequest;
        Insert: Omit<TaskHourRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TaskHourRequest, 'id'>>;
      };
      project_templates: {
        Row: ProjectTemplate;
        Insert: Omit<ProjectTemplate, 'id' | 'created_at'>;
        Update: Partial<Omit<ProjectTemplate, 'id'>>;
      };
      template_phases: {
        Row: TemplatePhase;
        Insert: Omit<TemplatePhase, 'id'>;
        Update: Partial<Omit<TemplatePhase, 'id'>>;
      };
      template_tasks: {
        Row: TemplateTask;
        Insert: Omit<TemplateTask, 'id'>;
        Update: Partial<Omit<TemplateTask, 'id'>>;
      };
      time_entries: {
        Row: TimeEntry;
        Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TimeEntry, 'id'>>;
      };
      news: {
        Row: News;
        Insert: Omit<News, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<News, 'id'>>;
      };
      news_reactions: {
        Row: NewsReaction;
        Insert: Omit<NewsReaction, 'id' | 'created_at'>;
        Update: Partial<Omit<NewsReaction, 'id'>>;
      };
      news_comments: {
        Row: NewsComment;
        Insert: Omit<NewsComment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NewsComment, 'id'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Document, 'id'>>;
      };
      document_audit_log: {
        Row: DocumentAuditLog;
        Insert: Omit<DocumentAuditLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DocumentAuditLog, 'id'>>;
      };
      processes: {
        Row: Process;
        Insert: Omit<Process, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Process, 'id'>>;
      };
      process_read_confirmations: {
        Row: ProcessReadConfirmation;
        Insert: Omit<ProcessReadConfirmation, 'id'>;
        Update: Partial<Omit<ProcessReadConfirmation, 'id'>>;
      };
      proposals: {
        Row: Proposal;
        Insert: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Proposal, 'id'>>;
      };
      proposal_votes: {
        Row: ProposalVote;
        Insert: Omit<ProposalVote, 'id' | 'created_at'>;
        Update: Partial<Omit<ProposalVote, 'id'>>;
      };
      proposal_comments: {
        Row: ProposalComment;
        Insert: Omit<ProposalComment, 'id' | 'created_at'>;
        Update: Partial<Omit<ProposalComment, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      leave_requests: {
        Row: LeaveRequest;
        Insert: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LeaveRequest, 'id'>>;
      };
      company_events: {
        Row: CompanyEvent;
        Insert: Omit<CompanyEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CompanyEvent, 'id'>>;
      };
      project_members: {
        Row: ProjectMember;
        Insert: Omit<ProjectMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<ProjectMember, 'id'>>;
      };
      app_settings: {
        Row: AppSetting;
        Insert: Omit<AppSetting, 'id' | 'updated_at'>;
        Update: Partial<Omit<AppSetting, 'id'>>;
      };
      google_calendar_tokens: {
        Row: GoogleCalendarToken;
        Insert: Omit<GoogleCalendarToken, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GoogleCalendarToken, 'id'>>;
      };
      gcal_sync_map: {
        Row: GcalSyncMap;
        Insert: Omit<GcalSyncMap, 'id'>;
        Update: Partial<Omit<GcalSyncMap, 'id'>>;
      };
      recurring_activities: {
        Row: RecurringActivity;
        Insert: Omit<RecurringActivity, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RecurringActivity, 'id'>>;
      };
      recurring_exceptions: {
        Row: RecurringException;
        Insert: Omit<RecurringException, 'id' | 'created_at'>;
        Update: Partial<Omit<RecurringException, 'id'>>;
      };
      activity_invitations: {
        Row: ActivityInvitation;
        Insert: Omit<ActivityInvitation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ActivityInvitation, 'id'>>;
      };
      employee_drive_folders: {
        Row: EmployeeDriveFolder;
        Insert: Omit<EmployeeDriveFolder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EmployeeDriveFolder, 'id'>>;
      };
      drive_file_snapshots: {
        Row: DriveFileSnapshot;
        Insert: Omit<DriveFileSnapshot, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DriveFileSnapshot, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin_or_coordonator: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_project_member: {
        Args: { p_project_id: number };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      blood_type: BloodType;
      pontaj_type: PontajType;
      project_status: ProjectStatus;
      phase_status: PhaseStatus;
      task_status: TaskStatus;
      session_status: SessionStatus;
      hour_request_status: HourRequestStatus;
      activity_type: ActivityType;
      time_entry_status: TimeEntryStatus;
      news_category: NewsCategory;
      document_type: DocumentType;
      document_action: DocumentAction;
      process_category: ProcessCategory;
      process_status: ProcessStatus;
      proposal_status: ProposalStatus;
      leave_type: LeaveType;
      leave_status: LeaveStatus;
      event_target: EventTarget;
      project_role: ProjectRole;
      gcal_direction: GcalDirection;
      invitation_status: InvitationStatus;
    };
  };
}
