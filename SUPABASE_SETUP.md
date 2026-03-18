# Configuração Supabase - CSA Congresso 2026
# Project URL: https://xrpquuklhungyvctmpch.supabase.co

# ============================================================================
# PASSO 1: Obter credenciais no Supabase Dashboard
# ============================================================================
# 1. Acesse: https://app.supabase.com/project/xrpquuklhungyvctmpch
# 2. Vá em: Project Settings → API
# 3. Copie: Project URL e anon/public key

# ============================================================================
# PASSO 2: Variáveis de Ambiente (.env)
# ============================================================================

# Backend / API Server (.env)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xrpquuklhungyvctmpch.supabase.co:5432/postgres
SUPABASE_URL=https://xrpquuklhungyvctmpch.supabase.co
SUPABASE_ANON_KEY=eyJhbG...  # Cole sua anon key aqui
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Cole sua service_role key aqui (apenas backend!)

# React Native App (.env)
EXPO_PUBLIC_SUPABASE_URL=https://xrpquuklhungyvctmpch.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...  # Cole sua anon key aqui

# ============================================================================
# PASSO 3: Configuração do arquivo lib/db/drizzle.config.ts
# ============================================================================

import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Configuração para Supabase
  out: "./drizzle",
  breakpoints: true,
  strict: true,
  verbose: true,
});

# ============================================================================
# PASSO 4: Schema atualizado para lib/db/src/schema/index.ts
# ============================================================================

import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, integer, array, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const statusEnum = pgEnum("status", ["pendente", "aprovado", "rejeitado"]);
export const origemEnum = pgEnum("origem_tipo", ["URNM", "Externo"]);
export const spectatorEnum = pgEnum("spectator_type", ["docente_investigador", "estudante", "outro", "prelector"]);
export const eixoEnum = pgEnum("eixo", ["1", "2", "3"]);
export const itemStatusEnum = pgEnum("item_status", ["pendente", "ativo", "concluido"]);
export const notifTypeEnum = pgEnum("notification_type", ["new_registration", "message", "submission_approved", "submission_rejected"]);
export const adminRoleEnum = pgEnum("admin_role", ["ceo", "supervisor", "conselho"]);

// Tabela Participants
export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomeCompleto: varchar("nome_completo", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  nivelAcademico: varchar("nivel_academico", { length: 100 }),
  origemInstitucional: varchar("origem_institucional", { length: 255 }),
  origemTipo: origemEnum("origem_tipo").notNull(),
  eixo: eixoEnum("eixo").notNull(),
  spectatorType: spectatorEnum("spectator_type").notNull(),
  tarifa: decimal("tarifa", { precision: 10, scale: 2 }).notNull(),
  status: statusEnum("status").default("pendente").notNull(),
  qrData: text("qr_data"),
  presente: boolean("presente").default(false).notNull(),
  presenceMarkedAt: timestamp("presence_marked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

// Tabela Program Days
export const programDays = pgTable("program_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  data: timestamp("data").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProgramDaySchema = createInsertSchema(programDays).omit({ id: true, createdAt: true });
export type InsertProgramDay = z.infer<typeof insertProgramDaySchema>;
export type ProgramDay = typeof programDays.$inferSelect;

// Tabela Program Items
export const programItems = pgTable("program_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayId: uuid("day_id").references(() => programDays.id, { onDelete: "cascade" }).notNull(),
  tema: varchar("tema", { length: 255 }).notNull(),
  horaInicio: varchar("hora_inicio", { length: 10 }).notNull(),
  horaFim: varchar("hora_fim", { length: 10 }).notNull(),
  preletores: array(varchar("preletores", { length: 255 })).default([]),
  status: itemStatusEnum("status").default("pendente").notNull(),
  concluidoEm: timestamp("concluido_em"),
  ativadoEm: timestamp("ativado_em"),
  ordem: integer("ordem").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProgramItemSchema = createInsertSchema(programItems).omit({ id: true, createdAt: true });
export type InsertProgramItem = z.infer<typeof insertProgramItemSchema>;
export type ProgramItem = typeof programItems.$inferSelect;

// Tabela Submissions
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  participantName: varchar("participant_name", { length: 255 }).notNull(),
  tema: varchar("tema", { length: 255 }).notNull(),
  palavraChave: varchar("palavra_chave", { length: 255 }),
  resumo: text("resumo"),
  fileName: varchar("file_name", { length: 255 }),
  fileUri: varchar("file_uri", { length: 500 }),
  fileSize: integer("file_size"),
  status: statusEnum("status").default("pendente").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true, updatedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// Tabela Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetId: varchar("target_id", { length: 255 }).notNull(),
  type: notifTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Tabela Password Reset Requests
export const passwordResetRequests = pgTable("password_reset_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  status: statusEnum("status").default("pendente").notNull(),
  newPassword: varchar("new_password", { length: 255 }),
});

export const insertPasswordResetSchema = createInsertSchema(passwordResetRequests).omit({ id: true, requestedAt: true });
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof passwordResetRequests.$inferSelect;

// Tabela Congress Config
export const congressConfig = pgTable("congress_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  dataInicio: timestamp("data_inicio").notNull(),
  dataFim: timestamp("data_fim").notNull(),
  localNome: varchar("local_nome", { length: 255 }).notNull().default("Universidade Rainha Njinga a Mbande"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCongressConfigSchema = createInsertSchema(congressConfig).omit({ id: true, updatedAt: true });
export type InsertCongressConfig = z.infer<typeof insertCongressConfigSchema>;
export type CongressConfig = typeof congressConfig.$inferSelect;

// Tabela Admin Users
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: adminRoleEnum("role").notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

# ============================================================================
# PASSO 5: Cliente Supabase para React Native
# ============================================================================

// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xrpquuklhungyvctmpch.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

# ============================================================================
# PASSO 6: Comandos para sincronizar schema
# ============================================================================

# 1. Instalar dependências
pnpm add @supabase/supabase-js

# 2. Push do schema para Supabase
cd lib/db
pnpm drizzle-kit push

# 3. Verificar tabelas criadas (no SQL Editor do Supabase)
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

# ============================================================================
# PREÇOS E CONFIGURAÇÕES
# ============================================================================

Tabela de Preços (Kwanza):
- Docente/Investigador: 5.000 (URNM) | 7.000 (Externo)
- Estudante: 3.000 (URNM) | 4.000 (Externo)  
- Outros: 5.000 (URNM) | 10.000 (Externo)
- Prelectores: 20.000 (Ambos)

Eixos Temáticos:
1. Ensino e Investigação aplicada ao sector agro-alimentar
2. Contribuição sector agro na economia nacional
3. Integração empresarial na criação de políticas de desenvolvimento

Usuários Admin:
- CEO: ceo@csa.com / ceo2026
- Supervisor: supervisor@csa.com / super2026
- Conselho: conselho@csa.com / conselho2026

# ============================================================================
# PASSO 7: Configurar RLS (Row Level Security) no Supabase Dashboard
# ============================================================================

# Políticas necessárias (já incluídas no supabase-schema.sql):

1. Participants - SELECT: auth.uid() = id OR auth.uid() IN (admin_ids)
2. Participants - UPDATE: auth.uid() = id OR auth.uid() IN (admin_ids)
3. Program - SELECT: true (público)
4. Program - ALL: auth.uid() IN (admin_ids)
5. Submissions - SELECT: participant_id = auth.uid() OR auth.uid() IN (admin_ids)
6. Notifications - SELECT: target_id = auth.uid() OR (target_id = 'admin' AND auth.uid() IN (admin_ids))

# ============================================================================
# PASSO 8: Verificar conexão
# ============================================================================

// Testar conexão
const { data, error } = await supabase
  .from('congress_config')
  .select('*');

if (error) console.error('Erro:', error);
else console.log('Config:', data);
