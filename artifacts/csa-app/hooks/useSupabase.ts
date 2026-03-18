import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Participant, ProgramDay, Submission, Notification, AdminUser } from '../lib/database';

// Hook para buscar todos os participantes
export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchParticipants() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setParticipants(data as Participant[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchParticipants();
  }, []);

  return { participants, loading, error };
}

// Hook para buscar um participante por ID
export function useParticipant(id: string) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchParticipant() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setParticipant(data as Participant);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchParticipant();
  }, [id]);

  return { participant, loading, error };
}

// Hook para buscar programa do congresso
export function useProgramDays() {
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProgram() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('program_days')
          .select(`
            *,
            program_items (*)
          `)
          .order('data', { ascending: true });
        
        if (error) throw error;
        setDays(data as ProgramDay[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgram();
  }, []);

  return { days, loading, error };
}

// Hook para buscar submissões
export function useSubmissions(participantId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        let query = supabase
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });
        
        if (participantId) {
          query = query.eq('participant_id', participantId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setSubmissions(data as Submission[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [participantId]);

  return { submissions, loading, error };
}

// Hook para buscar notificações
export function useNotifications(targetId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('target_id', targetId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setNotifications(data as Notification[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (targetId) fetchNotifications();
  }, [targetId]);

  return { notifications, loading, error };
}

// Hook para real-time subscriptions
export function useRealtimeSubscription(table: string, callback: (payload: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, callback]);
}
