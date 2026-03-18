-- ============================================================================
-- CSA CONGRESSO 2026 - VERIFICAÇÃO E ATUALIZAÇÃO DO SCHEMA SUPABASE
-- Execute apenas se algumas tabelas já existirem
-- ============================================================================

-- Verificar tabelas existentes
DO $$
DECLARE
    tabela_participants INTEGER;
    tabela_program_days INTEGER;
    tabela_program_items INTEGER;
    tabela_submissions INTEGER;
    tabela_notifications INTEGER;
    tabela_password_reset INTEGER;
    tabela_congress_config INTEGER;
    tabela_admin_users INTEGER;
BEGIN
    -- Verificar participants
    SELECT COUNT(*) INTO tabela_participants 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'participants';
    
    IF tabela_participants = 0 THEN
        RAISE NOTICE 'Criando tabela participants...';
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
        
        CREATE INDEX idx_participants_email ON public.participants(email);
        CREATE INDEX idx_participants_status ON public.participants(status);
        CREATE INDEX idx_participants_spectator ON public.participants(spectator_type);
        CREATE INDEX idx_participants_presente ON public.participants(presente);
        
        RAISE NOTICE 'Tabela participants criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela participants já existe. Pulando...';
    END IF;
    
    -- Verificar program_days
    SELECT COUNT(*) INTO tabela_program_days 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'program_days';
    
    IF tabela_program_days = 0 THEN
        RAISE NOTICE 'Criando tabela program_days...';
        CREATE TABLE public.program_days (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            data DATE NOT NULL,
            titulo VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_program_days_data ON public.program_days(data);
        RAISE NOTICE 'Tabela program_days criada!';
    ELSE
        RAISE NOTICE 'Tabela program_days já existe.';
    END IF;
    
    -- Verificar program_items
    SELECT COUNT(*) INTO tabela_program_items 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'program_items';
    
    IF tabela_program_items = 0 THEN
        RAISE NOTICE 'Criando tabela program_items...';
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
        CREATE INDEX idx_program_items_day_id ON public.program_items(day_id);
        CREATE INDEX idx_program_items_status ON public.program_items(status);
        RAISE NOTICE 'Tabela program_items criada!';
    ELSE
        RAISE NOTICE 'Tabela program_items já existe.';
    END IF;
    
    -- Verificar submissions
    SELECT COUNT(*) INTO tabela_submissions 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'submissions';
    
    IF tabela_submissions = 0 THEN
        RAISE NOTICE 'Criando tabela submissions...';
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
        CREATE INDEX idx_submissions_participant ON public.submissions(participant_id);
        CREATE INDEX idx_submissions_status ON public.submissions(status);
        RAISE NOTICE 'Tabela submissions criada!';
    ELSE
        RAISE NOTICE 'Tabela submissions já existe.';
    END IF;
    
    -- Verificar notifications
    SELECT COUNT(*) INTO tabela_notifications 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications';
    
    IF tabela_notifications = 0 THEN
        RAISE NOTICE 'Criando tabela notifications...';
        CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            target_id VARCHAR(255) NOT NULL,
            type VARCHAR(30) CHECK (type IN ('new_registration', 'message', 'submission_approved', 'submission_rejected')),
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_notifications_target ON public.notifications(target_id);
        CREATE INDEX idx_notifications_read ON public.notifications(read);
        CREATE INDEX idx_notifications_type ON public.notifications(type);
        RAISE NOTICE 'Tabela notifications criada!';
    ELSE
        RAISE NOTICE 'Tabela notifications já existe.';
    END IF;
    
    -- Verificar password_reset_requests
    SELECT COUNT(*) INTO tabela_password_reset 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'password_reset_requests';
    
    IF tabela_password_reset = 0 THEN
        RAISE NOTICE 'Criando tabela password_reset_requests...';
        CREATE TABLE public.password_reset_requests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) NOT NULL,
            username VARCHAR(100) NOT NULL,
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
            new_password VARCHAR(255)
        );
        CREATE INDEX idx_password_reset_email ON public.password_reset_requests(email);
        CREATE INDEX idx_password_reset_status ON public.password_reset_requests(status);
        RAISE NOTICE 'Tabela password_reset_requests criada!';
    ELSE
        RAISE NOTICE 'Tabela password_reset_requests já existe.';
    END IF;
    
    -- Verificar congress_config
    SELECT COUNT(*) INTO tabela_congress_config 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'congress_config';
    
    IF tabela_congress_config = 0 THEN
        RAISE NOTICE 'Criando tabela congress_config...';
        CREATE TABLE public.congress_config (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            data_inicio DATE NOT NULL,
            data_fim DATE NOT NULL,
            local_nome VARCHAR(255) NOT NULL DEFAULT 'Universidade Rainha Njinga a Mbande',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Inserir configuração padrão
        INSERT INTO public.congress_config (data_inicio, data_fim, local_nome)
        VALUES ('2026-03-20', '2026-04-30', 'Universidade Rainha Njinga a Mbande');
        
        RAISE NOTICE 'Tabela congress_config criada com dados padrão!';
    ELSE
        RAISE NOTICE 'Tabela congress_config já existe.';
    END IF;
    
    -- Verificar admin_users
    SELECT COUNT(*) INTO tabela_admin_users 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'admin_users';
    
    IF tabela_admin_users = 0 THEN
        RAISE NOTICE 'Criando tabela admin_users...';
        CREATE TABLE public.admin_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(20) CHECK (role IN ('ceo', 'supervisor', 'conselho')),
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Inserir usuários admin padrão
        INSERT INTO public.admin_users (email, name, role, password_hash) VALUES
        ('ceo@csa.com', 'CEO - Director Geral', 'ceo', 'ceo2026'),
        ('supervisor@csa.com', 'Supervisor de Eventos', 'supervisor', 'super2026'),
        ('conselho@csa.com', 'Conselho Científico', 'conselho', 'conselho2026');
        
        RAISE NOTICE 'Tabela admin_users criada com usuários padrão!';
    ELSE
        RAISE NOTICE 'Tabela admin_users já existe.';
    END IF;
    
    RAISE NOTICE 'Verificação de schema concluída!';
END $$;

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) - SEMPRE EXECUTAR
-- ============================================================================

-- Função auxiliar para verificar se RLS já está habilitado
DO $$
BEGIN
    -- Habilitar RLS em todas as tabelas
    ALTER TABLE IF EXISTS public.participants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.program_days ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.program_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.submissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.password_reset_requests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.congress_config ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS habilitado em todas as tabelas!';
END $$;

-- ============================================================================
-- CRIAR POLÍTICAS (apenas se não existirem)
-- ============================================================================

DO $$
BEGIN
    -- Remover políticas existentes para recriar
    DROP POLICY IF EXISTS "Participants can view own data" ON public.participants;
    DROP POLICY IF EXISTS "Participants can update own data" ON public.participants;
    DROP POLICY IF EXISTS "Admins can view all participants" ON public.participants;
    DROP POLICY IF EXISTS "Admins can manage all participants" ON public.participants;
    DROP POLICY IF EXISTS "Everyone can view program" ON public.program_days;
    DROP POLICY IF EXISTS "Everyone can view program items" ON public.program_items;
    DROP POLICY IF EXISTS "Only admins can modify program" ON public.program_days;
    DROP POLICY IF EXISTS "Only admins can modify program items" ON public.program_items;
    DROP POLICY IF EXISTS "Participants can view own submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Staff can view all submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Staff can manage submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Everyone can view congress config" ON public.congress_config;
    DROP POLICY IF EXISTS "Only CEO can modify congress config" ON public.congress_config;
    
    RAISE NOTICE 'Políticas antigas removidas. Criando novas...';
    
    -- Políticas Participants
    CREATE POLICY "Participants can view own data" ON public.participants
        FOR SELECT USING (auth.uid()::text = id::text);
    
    CREATE POLICY "Participants can update own data" ON public.participants
        FOR UPDATE USING (auth.uid()::text = id::text);
    
    CREATE POLICY "Admins can view all participants" ON public.participants
        FOR SELECT USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));
    
    CREATE POLICY "Admins can manage all participants" ON public.participants
        FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));
    
    -- Políticas Program
    CREATE POLICY "Everyone can view program" ON public.program_days
        FOR SELECT USING (true);
    
    CREATE POLICY "Everyone can view program items" ON public.program_items
        FOR SELECT USING (true);
    
    CREATE POLICY "Only admins can modify program" ON public.program_days
        FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));
    
    CREATE POLICY "Only admins can modify program items" ON public.program_items
        FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));
    
    -- Políticas Submissions
    CREATE POLICY "Participants can view own submissions" ON public.submissions
        FOR SELECT USING (auth.uid()::text = participant_id::text);
    
    CREATE POLICY "Staff can view all submissions" ON public.submissions
        FOR SELECT USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));
    
    CREATE POLICY "Staff can manage submissions" ON public.submissions
        FOR ALL USING (auth.uid()::text IN (SELECT id::text FROM public.admin_users));
    
    -- Políticas Notifications
    CREATE POLICY "Users can view own notifications" ON public.notifications
        FOR SELECT USING (
            target_id = auth.uid()::text OR 
            (target_id = 'admin' AND auth.uid()::text IN (SELECT id::text FROM public.admin_users))
        );
    
    -- Políticas Congress Config
    CREATE POLICY "Everyone can view congress config" ON public.congress_config
        FOR SELECT USING (true);
    
    CREATE POLICY "Only CEO can modify congress config" ON public.congress_config
        FOR ALL USING (auth.uid()::text IN (
            SELECT id::text FROM public.admin_users WHERE role = 'ceo'
        ));
    
    RAISE NOTICE 'Todas as políticas RLS criadas com sucesso!';
END $$;

-- ============================================================================
-- FUNÇÕES ÚTEIS
-- ============================================================================

-- Função para calcular tarifa automaticamente
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
    
    UPDATE public.participants 
    SET status = 'aprovado', 
        qr_data = v_qr_data,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_participant_id;
    
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

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers apenas se não existirem
DO $$
BEGIN
    -- Remover triggers existentes
    DROP TRIGGER IF EXISTS update_participants_updated_at ON public.participants;
    DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.submissions;
    DROP TRIGGER IF EXISTS update_congress_config_updated_at ON public.congress_config;
    
    -- Criar novos triggers
    CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON public.participants
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_congress_config_updated_at BEFORE UPDATE ON public.congress_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Triggers criados com sucesso!';
END $$;

-- ============================================================================
-- VIEWS (VISTAS)
-- ============================================================================

-- View: Resumo do Dashboard Admin
DROP VIEW IF EXISTS public.dashboard_summary;
CREATE VIEW public.dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM public.participants WHERE status = 'pendente') as pendentes,
    (SELECT COUNT(*) FROM public.participants WHERE status = 'aprovado') as aprovados,
    (SELECT COUNT(*) FROM public.participants WHERE status = 'rejeitado') as rejeitados,
    (SELECT COUNT(*) FROM public.participants WHERE presente = true) as presentes,
    (SELECT COUNT(*) FROM public.submissions WHERE status = 'pendente') as submissoes_pendentes,
    (SELECT COUNT(*) FROM public.password_reset_requests WHERE status = 'pendente') as resets_pendentes;

-- View: Estatísticas por Categoria
DROP VIEW IF EXISTS public.stats_by_category;
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
DROP VIEW IF EXISTS public.current_program;
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
-- FIM - VERIFICAÇÃO CONCLUÍDA
-- ============================================================================
SELECT 'Schema verificado e atualizado com sucesso!' as status;
SELECT * FROM public.dashboard_summary;
