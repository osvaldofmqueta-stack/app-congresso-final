import { supabase } from './supabase';
import type { Database } from './supabase';

export type Participant = Database['public']['Tables']['participants']['Row'];
export type ProgramDay = Database['public']['Tables']['program_days']['Row'];
export type ProgramItem = Database['public']['Tables']['program_items']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];

// ============================================================================
// PARTICIPANTS
// ============================================================================

export async function getParticipants() {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Participant[];
}

export async function getParticipantById(id: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Participant;
}

export async function getParticipantByEmail(email: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) return null;
  return data as Participant;
}

export async function createParticipant(participant: Omit<Participant, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('participants')
    .insert(participant)
    .select()
    .single();
  
  if (error) throw error;
  return data as Participant;
}

export async function updateParticipant(id: string, updates: Partial<Participant>) {
  const { data, error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Participant;
}

export async function approveParticipant(id: string) {
  const { data, error } = await supabase
    .rpc('aprovar_participante', { p_participant_id: id });
  
  if (error) throw error;
  return data;
}

// ============================================================================
// PROGRAM
// ============================================================================

export async function getProgramDays() {
  const { data, error } = await supabase
    .from('program_days')
    .select(`
      *,
      program_items (*)
    `)
    .order('data', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function getProgramItemsByDay(dayId: string) {
  const { data, error } = await supabase
    .from('program_items')
    .select('*')
    .eq('day_id', dayId)
    .order('ordem', { ascending: true });
  
  if (error) throw error;
  return data as ProgramItem[];
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

export async function getSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false });
  
  if (error) throw error;
  return data as Submission[];
}

export async function getSubmissionsByParticipant(participantId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('participant_id', participantId)
    .order('submitted_at', { ascending: false });
  
  if (error) throw error;
  return data as Submission[];
}

export async function createSubmission(submission: Omit<Submission, 'id' | 'submitted_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single();
  
  if (error) throw error;
  return data as Submission;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getNotifications(targetId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationAsRead(id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Notification;
}

// ============================================================================
// ADMIN
// ============================================================================

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*');
  
  if (error) throw error;
  return data as AdminUser[];
}

export async function getAdminByEmail(email: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) return null;
  return data as AdminUser;
}

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getDashboardSummary() {
  const { data, error } = await supabase
    .from('dashboard_summary')
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
}

export async function getStatsByCategory() {
  const { data, error } = await supabase
    .from('stats_by_category')
    .select('*');
  
  if (error) throw error;
  return data;
}

// ============================================================================
// AUTH UTILS
// ============================================================================

export async function loginParticipant(email: string, password: string) {
  const participant = await getParticipantByEmail(email);
  if (!participant) return null;
  if (participant.password !== password) return null;
  return participant;
}

export async function loginAdmin(email: string, password: string) {
  const admin = await getAdminByEmail(email);
  if (!admin) return null;
  if (admin.password_hash !== password) return null;
  return admin;
}
