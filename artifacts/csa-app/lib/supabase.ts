import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xrpquuklhungyvctmpch.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHF1dWtsaHVuZ3l2Y3RtcGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzU1NjIsImV4cCI6MjA4OTQxMTU2Mn0.pFfGjx-732pEoPA-RLjrpy1P18OS9O8ygDmFY2Bl1Jw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string;
          nome_completo: string;
          username: string;
          email: string;
          password: string;
          nivel_academico: string | null;
          origem_institucional: string | null;
          origem_tipo: 'URNM' | 'Externo';
          eixo: '1' | '2' | '3';
          spectator_type: 'docente_investigador' | 'estudante' | 'outro' | 'prelector';
          tarifa: number;
          status: 'pendente' | 'aprovado' | 'rejeitado';
          qr_data: string | null;
          presente: boolean;
          presence_marked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          nome_completo: string;
          username: string;
          email: string;
          password: string;
          nivel_academico?: string;
          origem_institucional?: string;
          origem_tipo: 'URNM' | 'Externo';
          eixo: '1' | '2' | '3';
          spectator_type: 'docente_investigador' | 'estudante' | 'outro' | 'prelector';
          tarifa: number;
          status?: 'pendente' | 'aprovado' | 'rejeitado';
          qr_data?: string;
          presente?: boolean;
        };
        Update: Partial<Database['public']['Tables']['participants']['Insert']>;
      };
      program_days: {
        Row: {
          id: string;
          data: string;
          titulo: string;
          created_at: string;
        };
      };
      program_items: {
        Row: {
          id: string;
          day_id: string;
          tema: string;
          hora_inicio: string;
          hora_fim: string;
          preletores: string[];
          status: 'pendente' | 'ativo' | 'concluido';
          concluido_em: string | null;
          ativado_em: string | null;
          ordem: number;
          created_at: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          participant_id: string;
          participant_name: string;
          tema: string;
          palavra_chave: string | null;
          resumo: string | null;
          file_name: string | null;
          file_uri: string | null;
          file_size: number | null;
          status: 'pendente' | 'aprovado' | 'rejeitado';
          submitted_at: string;
          updated_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          target_id: string;
          type: 'new_registration' | 'message' | 'submission_approved' | 'submission_rejected';
          title: string;
          body: string;
          read: boolean;
          created_at: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'ceo' | 'supervisor' | 'conselho';
          password_hash: string;
          created_at: string;
        };
      };
    };
  };
};
