-- ============================================================================
-- CSA CONGRESSO 2026 - SUPABASE DATABASE SCHEMA
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- Habilitar extensão UUID (geralmente já está ativa no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELA: PARTICIPANTS (Participantes)
-- ============================================================================
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nivel_academico VARCHAR(100),
    origem_institucional VARCHAR(255),
    origem_tipo VARCHAR(20) CHECK (origem_tipo IN ('URNM', 'Externo')),
    eixo INTEGER CHECK (eixo IN (1, 2, 3)),
    spectator_type VARCHAR(30) CHECK (spectator_type IN ('docente_investigador', 'estudante', 'outro', 'prelector')),
    tarifa DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    qr_data TEXT,
    presente BOOLEAN DEFAULT FALSE,
    presence_marked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentários da tabela
COMMENT ON TABLE public.participants IS 'Participantes do Congresso de Alimento 2026';
COMMENT ON COLUMN public.participants.nivel_academico IS 'Básico, Médio, Licenciatura, Mestrado, Doutoramento, Pós-Doutoramento';
COMMENT ON COLUMN public.participants.eixo IS '1: Ensino/Investigação Agro | 2: Economia Nacional | 3: Políticas Empresariais';
COMMENT ON COLUMN public.participants.spectator_type IS 'docente_investigador, estudante, outro, prelector';
COMMENT ON COLUMN public.participants.tarifa IS 'Valores em Kwanza (Kz) - calculados por categoria e origem';

-- Índices
CREATE INDEX idx_participants_email ON public.participants(email);
CREATE INDEX idx_participants_status ON public.participants(status);
CREATE INDEX idx_participants_spectator ON public.participants(spectator_type);
CREATE INDEX idx_participants_presente ON public.participants(presente);

-- ============================================================================
-- TABELA: PROGRAM_DAYS (Dias do Programa)
-- ============================================================================
CREATE TABLE public.program_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.program_days IS 'Dias do programa do congresso';

CREATE INDEX idx_program_days_data ON public.program_days(data);

-- ============================================================================
-- TABELA: PROGRAM_ITEMS (Itens do Programa)
-- ============================================================================
CREATE TABLE public.program_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID REFERENCES public.program_days(id) ON DELETE CASCADE,
    tema VARCHAR(255) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    preletores TEXT[],
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'concluido')),
    concluido_em TIMESTAMP,
    ativado_em TIMESTAMP,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.program_items IS 'Itens/atividades de cada dia do programa';
COMMENT ON COLUMN public.program_items.status IS 'pendente: não iniciado | ativo: em curso | concluido: finalizado';

CREATE INDEX idx_program_items_day_id ON public.program_items(day_id);
CREATE INDEX idx_program_items_status ON public.program_items(status);

-- ============================================================================
-- TABELA: SUBMISSIONS (Submissões de Apresentações)
-- ============================================================================
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    participant_name VARCHAR(255) NOT NULL,
    tema VARCHAR(255) NOT NULL,
    palavra_chave VARCHAR(255),
    resumo TEXT,
    file_name VARCHAR(255),
    file_uri VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.submissions IS 'Submissões de apresentações/trabalhos dos participantes';
COMMENT ON COLUMN public.submissions.file_size IS 'Tamanho mínimo: 5MB para arquivos PDF/DOC';

CREATE INDEX idx_submissions_participant ON public.submissions(participant_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);

-- ============================================================================
-- TABELA: NOTIFICATIONS (Notificações)
-- ============================================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id VARCHAR(255) NOT NULL, -- 'admin' para admins, participant_id para participantes
    type VARCHAR(30) CHECK (type IN ('new_registration', 'message', 'submission_approved', 'submission_rejected')),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.notifications IS 'Sistema de notificações do congresso';
COMMENT ON COLUMN public.notifications.target_id IS 'admin = notificação para admins | participant_id = notificação para participante específico';

CREATE INDEX idx_notifications_target ON public.notifications(target_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- ============================================================================
-- TABELA: PASSWORD_RESET_REQUESTS (Requisições de Reset de Senha)
-- ============================================================================
CREATE TABLE public.password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    new_password VARCHAR(255)
);

COMMENT ON TABLE public.password_reset_requests IS 'Solicitações de redefinição de senha dos participantes';

CREATE INDEX idx_password_reset_email ON public.password_reset_requests(email);
CREATE INDEX idx_password_reset_status ON public.password_reset_requests(status);

-- ============================================================================
-- TABELA: CONGRESS_CONFIG (Configuração do Congresso)
-- ============================================================================
CREATE TABLE public.congress_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    local_nome VARCHAR(255) NOT NULL DEFAULT 'Universidade Rainha Njinga a Mbande',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.congress_config IS 'Configuração global do congresso (datas e local)';

-- Inserir configuração padrão
INSERT INTO public.congress_config (data_inicio, data_fim, local_nome)
VALUES ('2026-03-20', '2026-04-30', 'Universidade Rainha Njinga a Mbande');

-- ============================================================================
-- TABELA: ADMIN_USERS (Usuários Administrativos Fixos)
-- ============================================================================
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ceo', 'supervisor', 'conselho')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.admin_users IS 'Usuários administrativos do sistema (CEO, Supervisor, Conselho)';

-- Inserir usuários admin padrão
-- Senhas: ceo2026, super2026, conselho2026 (em produção usar hash bcrypt)
INSERT INTO public.admin_users (email, name, role, password_hash) VALUES
('ceo@csa.com', 'CEO - Director Geral', 'ceo', 'ceo2026'),
('supervisor@csa.com', 'Supervisor de Eventos', 'supervisor', 'super2026'),
('conselho@csa.com', 'Conselho Científico', 'conselho', 'conselho2026');

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON public.participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_congress_config_updated_at BEFORE UPDATE ON public.congress_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Política: Participantes podem ver apenas seus próprios dados
CREATE POLICY "Participants can view own data" ON public.participants
    FOR SELECT USING (auth.uid()::text = id::text);

-- Política: Participantes podem atualizar apenas seus próprios dados
CREATE POLICY "Participants can update own data" ON public.participants
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Política: Admins podem ver todos os participantes
CREATE POLICY "Admins can view all participants" ON public.participants
    FOR SELECT USING (auth.uid()::text IN (
        SELECT id::text FROM public.admin_users
    ));

-- Política: Admins podem gerenciar todos os participantes
CREATE POLICY "Admins can manage all participants" ON public.participants
    FOR ALL USING (auth.uid()::text IN (
        SELECT id::text FROM public.admin_users
    ));

-- Política: Todos podem ver programação
CREATE POLICY "Everyone can view program" ON public.program_days
    FOR SELECT USING (true);

CREATE POLICY "Everyone can view program items" ON public.program_items
    FOR SELECT USING (true);

-- Política: Apenas admins podem modificar programa
CREATE POLICY "Only admins can modify program" ON public.program_days
    FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));

CREATE POLICY "Only admins can modify program items" ON public.program_items
    FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));

-- Política: Participantes veem suas próprias submissões
CREATE POLICY "Participants can view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid()::text = participant_id::text);

-- Política: Conselho e Admins veem todas as submissões
CREATE POLICY "Staff can view all submissions" ON public.submissions
    FOR SELECT USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));

CREATE POLICY "Staff can manage submissions" ON public.submissions
    FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));

-- Política: Usuários veem suas próprias notificações
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        target_id = auth.uid()::text OR 
        target_id = 'admin' AND auth.uid()::text IN (SELECT id::text FROM public.admin_users)
    );

-- Política: Todos podem ver configuração do congresso
CREATE POLICY "Everyone can view congress config" ON public.congress_config
    FOR SELECT USING (true);

-- Política: Apenas CEO pode modificar config
CREATE POLICY "Only CEO can modify congress config" ON public.congress_config
    FOR ALL USING (auth.uid()::text IN (
        SELECT id::text FROM public.admin_users WHERE role = 'ceo'
    ));

-- ============================================================================
-- VIEWS (VISTAS) ÚTEIS
-- ============================================================================

-- View: Resumo do Dashboard Admin
CREATE VIEW public.dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM public.participants WHERE status = 'pendente') as pendentes,
    (SELECT COUNT(*) FROM public.participants WHERE status = 'aprovado') as aprovados,
    (SELECT COUNT(*) FROM public.participants WHERE status = 'rejeitado') as rejeitados,
    (SELECT COUNT(*) FROM public.participants WHERE presente = true) as presentes,
    (SELECT COUNT(*) FROM public.submissions WHERE status = 'pendente') as submissoes_pendentes,
    (SELECT COUNT(*) FROM public.password_reset_requests WHERE status = 'pendente') as resets_pendentes;

-- View: Estatísticas por Categoria
CREATE VIEW public.stats_by_category AS
SELECT 
    spectator_type,
    origem_tipo,
    COUNT(*) as total,
    SUM(tarifa) as total_arrecadado,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN presente = true THEN 1 END) as presentes
FROM public.participants
GROUP BY spectator_type, origem_tipo;

-- View: Programação Atual
CREATE VIEW public.current_program AS
SELECT 
    pd.id as day_id,
    pd.data,
    pd.titulo,
    json_agg(
        json_build_object(
            'id', pi.id,
            'tema', pi.tema,
            'hora_inicio', pi.hora_inicio,
            'hora_fim', pi.hora_fim,
            'preletores', pi.preletores,
            'status', pi.status,
            'ordem', pi.ordem
        ) ORDER BY pi.ordem
    ) as itens
FROM public.program_days pd
LEFT JOIN public.program_items pi ON pd.id = pi.day_id
GROUP BY pd.id, pd.data, pd.titulo
ORDER BY pd.data;

-- ============================================================================
-- STORED PROCEDURES (FUNÇÕES ÚTEIS)
-- ============================================================================

-- Função: Calcular tarifa automaticamente
CREATE OR REPLACE FUNCTION calcular_tarifa(
    p_spectator_type VARCHAR,
    p_origem_tipo VARCHAR
) RETURNS DECIMAL AS $$
BEGIN
    IF p_spectator_type = 'prelector' THEN
        RETURN 20000;
    END IF;
    
    RETURN CASE p_spectator_type
        WHEN 'docente_investigador' THEN 
            CASE p_origem_tipo WHEN 'URNM' THEN 5000 ELSE 7000 END
        WHEN 'estudante' THEN 
            CASE p_origem_tipo WHEN 'URNM' THEN 3000 ELSE 4000 END
        WHEN 'outro' THEN 
            CASE p_origem_tipo WHEN 'URNM' THEN 5000 ELSE 10000 END
        ELSE 5000
    END;
END;
$$ LANGUAGE plpgsql;

-- Função: Aprovar participante e gerar QR code
CREATE OR REPLACE FUNCTION aprovar_participante(
    p_participant_id UUID
) RETURNS TEXT AS $$
DECLARE
    v_participant RECORD;
    v_qr_data TEXT;
BEGIN
    SELECT * INTO v_participant FROM public.participants WHERE id = p_participant_id;
    
    IF NOT FOUND THEN
        RETURN 'Participante não encontrado';
    END IF;
    
    -- Gerar dados do QR code
    v_qr_data = json_build_object(
        'id', v_participant.id,
        'nome', v_participant.nome_completo,
        'categoria', v_participant.spectator_type,
        'eixo', 'Eixo ' || v_participant.eixo,
        'origem', v_participant.origem_tipo,
        'origemInstitucional', v_participant.origem_institucional,
        'evento', 'Congresso de Alimento 2026',
        'tarifa', v_participant.tarifa || ' Kz',
        'status', 'APROVADO'
    )::TEXT;
    
    -- Atualizar participante
    UPDATE public.participants 
    SET status = 'aprovado', 
        qr_data = v_qr_data,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_participant_id;
    
    -- Criar notificação
    INSERT INTO public.notifications (target_id, type, title, body)
    VALUES (
        p_participant_id::TEXT,
        'message',
        'Inscrição Aprovada',
        'Sua inscrição no Congresso de Alimento 2026 foi aprovada! Seu QR code está disponível na credencial.'
    );
    
    RETURN v_qr_data;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificação final
SELECT 'Schema CSA Congresso 2026 criado com sucesso!' as status;
SELECT * FROM public.dashboard_summary;
