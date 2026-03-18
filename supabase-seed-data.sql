-- ============================================================================
-- CSA CONGRESSO 2026 - DADOS DE TESTE/SEED
-- Execute no SQL Editor do Supabase para popular o banco
-- ============================================================================

-- ============================================================================
-- 1. LIMPAR DADOS EXISTENTES (CUIDADO: APAGA TUDO!)
-- ============================================================================
-- Descomente se quiser limpar antes de inserir:
-- TRUNCATE TABLE notifications, submissions, program_items, program_days, participants, password_reset_requests RESTART IDENTITY CASCADE;

-- ============================================================================
-- 2. PARTICIPANTES DE TESTE
-- ============================================================================

INSERT INTO public.participants (nome_completo, username, email, password, nivel_academico, origem_institucional, origem_tipo, eixo, spectator_type, tarifa, status, presente) VALUES
('Dr. Maria Santos', 'maria.santos', 'maria@urnm.edu.ao', '123456', 'Doutoramento', 'Universidade Rainha Njinga', 'URNM', '1', 'docente_investigador', 5000, 'aprovado', true),
('Prof. João Manuel', 'joao.manuel', 'joao@gmail.com', '123456', 'Mestrado', 'Universidade de Lisboa', 'Externo', '2', 'docente_investigador', 7000, 'aprovado', false),
('Ana Beatriz', 'ana.beatriz', 'ana@urnm.edu.ao', '123456', 'Licenciatura', 'URNM', 'URNM', '3', 'estudante', 3000, 'aprovado', true),
('Carlos Eduardo', 'carlos.eduardo', 'carlos@yahoo.com', '123456', 'Licenciatura', 'Universidade Agostinho Neto', 'Externo', '1', 'estudante', 4000, 'pendente', false),
('Dr. Pedro Fernandes', 'pedro.fernandes', 'pedro@urnm.edu.ao', '123456', 'Doutoramento', 'Universidade Rainha Njinga', 'URNM', '2', 'prelector', 20000, 'aprovado', true),
('Lucia Maria', 'lucia.maria', 'lucia@hotmail.com', '123456', 'Médio', 'Escola Técnica', 'Externo', '3', 'outro', 10000, 'rejeitado', false),
('Fernando Almeida', 'fernando.almeida', 'fernando@urnm.edu.ao', '123456', 'Mestrado', 'URNM', 'URNM', '1', 'docente_investigador', 5000, 'aprovado', false),
('Isabel Cristina', 'isabel.cristina', 'isabel@gmail.com', '123456', 'Licenciatura', 'Universidade Katyavala', 'Externo', '2', 'estudante', 4000, 'pendente', false),
('Dr. António Neto', 'antonio.neto', 'antonio@urnm.edu.ao', '123456', 'Pós-Doutoramento', 'Universidade Rainha Njinga', 'URNM', '3', 'prelector', 20000, 'aprovado', true),
('Beatriz Ferreira', 'beatriz.ferreira', 'beatriz@outlook.com', '123456', 'Médio', 'Instituto Médio', 'Externo', '1', 'outro', 10000, 'aprovado', false)
ON CONFLICT (email) DO NOTHING;

-- Atualizar QR codes para participantes aprovados
UPDATE public.participants 
SET qr_data = json_build_object(
    'id', id,
    'nome', nome_completo,
    'categoria', spectator_type,
    'eixo', 'Eixo ' || eixo,
    'origem', origem_tipo,
    'origemInstitucional', origem_institucional,
    'evento', 'Congresso de Alimento 2026',
    'tarifa', tarifa || ' Kz',
    'status', 'APROVADO'
)::text
WHERE status = 'aprovado';

-- ============================================================================
-- 3. DIAS DO PROGRAMA
-- ============================================================================

INSERT INTO public.program_days (data, titulo) VALUES
('2026-03-20', 'Dia 1 - Abertura e Eixo 1'),
('2026-03-21', 'Dia 2 - Eixo 2'),
('2026-03-22', 'Dia 3 - Eixo 3'),
('2026-03-23', 'Dia 4 - Encerramento')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. ITENS DO PROGRAMA
-- ============================================================================

DO $$
DECLARE
    dia1_id UUID;
    dia2_id UUID;
    dia3_id UUID;
    dia4_id UUID;
BEGIN
    -- Buscar IDs dos dias
    SELECT id INTO dia1_id FROM public.program_days WHERE data = '2026-03-20' LIMIT 1;
    SELECT id INTO dia2_id FROM public.program_days WHERE data = '2026-03-21' LIMIT 1;
    SELECT id INTO dia3_id FROM public.program_days WHERE data = '2026-03-22' LIMIT 1;
    SELECT id INTO dia4_id FROM public.program_days WHERE data = '2026-03-23' LIMIT 1;

    -- Dia 1 - Abertura
    IF dia1_id IS NOT NULL THEN
        INSERT INTO public.program_items (day_id, tema, hora_inicio, hora_fim, preletores, status, ordem) VALUES
        (dia1_id, 'Credenciamento e Welcome Coffee', '08:00', '09:00', ARRAY['Equipe Organizacional'], 'concluido', 1),
        (dia1_id, 'Cerimônia de Abertura', '09:00', '10:30', ARRAY['Reitor URNM', 'CEO CSA'], 'concluido', 2),
        (dia1_id, 'Coffee Break', '10:30', '11:00', ARRAY[]::text[], 'concluido', 3),
        (dia1_id, 'Ensino Superior e Agroindústria', '11:00', '12:30', ARRAY['Dr. Maria Santos', 'Prof. João Manuel'], 'ativo', 4),
        (dia1_id, 'Almoço', '12:30', '14:00', ARRAY[]::text[], 'pendente', 5),
        (dia1_id, 'Pesquisa Aplicada em Alimentos', '14:00', '15:30', ARRAY['Dr. António Neto'], 'pendente', 6),
        (dia1_id, 'Painel: Desafios do Setor Agroalimentar', '15:30', '17:00', ARRAY['Vários Especialistas'], 'pendente', 7)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dia 2 - Eixo 2
    IF dia2_id IS NOT NULL THEN
        INSERT INTO public.program_items (day_id, tema, hora_inicio, hora_fim, preletores, status, ordem) VALUES
        (dia2_id, 'Café de Boas Vindas', '08:30', '09:00', ARRAY[]::text[], 'pendente', 1),
        (dia2_id, 'Economia Circular no Agro', '09:00', '10:30', ARRAY['Prof. João Manuel'], 'pendente', 2),
        (dia2_id, 'Impacto Econômico da Agricultura Familiar', '10:30', '12:00', ARRAY['Dr. Pedro Fernandes'], 'pendente', 3),
        (dia2_id, 'Almoço', '12:00', '13:30', ARRAY[]::text[], 'pendente', 4),
        (dia2_id, 'Exportação de Produtos Agrícolas', '13:30', '15:00', ARRAY['Fernando Almeida'], 'pendente', 5),
        (dia2_id, 'Apresentação de Trabalhos Eixo 2', '15:00', '17:00', ARRAY['Vários Pesquisadores'], 'pendente', 6)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dia 3 - Eixo 3
    IF dia3_id IS NOT NULL THEN
        INSERT INTO public.program_items (day_id, tema, hora_inicio, hora_fim, preletores, status, ordem) VALUES
        (dia3_id, 'Integração Empresarial', '09:00', '10:30', ARRAY['Ana Beatriz'], 'pendente', 1),
        (dia3_id, 'Políticas Públicas para o Agro', '10:30', '12:00', ARRAY['Dr. António Neto'], 'pendente', 2),
        (dia3_id, 'Almoço', '12:00', '13:30', ARRAY[]::text[], 'pendente', 3),
        (dia3_id, 'Workshop: Inovação no Campo', '13:30', '15:30', ARRAY['Equipe Técnica'], 'pendente', 4),
        (dia3_id, 'Rodada de Negócios', '15:30', '17:00', ARRAY['Empresários e Pesquisadores'], 'pendente', 5)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dia 4 - Encerramento
    IF dia4_id IS NOT NULL THEN
        INSERT INTO public.program_items (day_id, tema, hora_inicio, hora_fim, preletores, status, ordem) VALUES
        (dia4_id, 'Sessão de Pôsteres', '09:00', '10:30', ARRAY['Todos Participantes'], 'pendente', 1),
        (dia4_id, 'Premiação de Melhores Trabalhos', '10:30', '11:30', ARRAY['Comissão Científica'], 'pendente', 2),
        (dia4_id, 'Cerimônia de Encerramento', '11:30', '12:30', ARRAY['CEO CSA', 'Reitor URNM'], 'pendente', 3),
        (dia4_id, 'Confraternização', '12:30', '14:00', ARRAY[]::text[], 'pendente', 4)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 5. SUBMISSÕES DE APRESENTAÇÕES
-- ============================================================================

DO $$
DECLARE
    participante1_id UUID;
    participante2_id UUID;
    participante5_id UUID;
BEGIN
    SELECT id INTO participante1_id FROM public.participants WHERE email = 'maria@urnm.edu.ao' LIMIT 1;
    SELECT id INTO participante2_id FROM public.participants WHERE email = 'joao@gmail.com' LIMIT 1;
    SELECT id INTO participante5_id FROM public.participants WHERE email = 'pedro@urnm.edu.ao' LIMIT 1;

    IF participante1_id IS NOT NULL THEN
        INSERT INTO public.submissions (participant_id, participant_name, tema, palavra_chave, resumo, status) VALUES
        (participante1_id, 'Dr. Maria Santos', 'Inovação no Ensino de Agronomia', 'educação, agronomia, metodologia', 'Este trabalho apresenta novas metodologias de ensino aplicadas à agronomia...', 'aprovado'),
        (participante1_id, 'Dr. Maria Santos', 'Sustentabilidade na Produção Agrícola', 'sustentabilidade, agricultura', 'Análise de práticas sustentáveis...', 'pendente');
    END IF;

    IF participante2_id IS NOT NULL THEN
        INSERT INTO public.submissions (participant_id, participant_name, tema, palavra_chave, resumo, status) VALUES
        (participante2_id, 'Prof. João Manuel', 'Impacto da Globalização no Agro Angolano', 'globalização, economia, agricultura', 'Estudo sobre os efeitos da globalização...', 'aprovado');
    END IF;

    IF participante5_id IS NOT NULL THEN
        INSERT INTO public.submissions (participant_id, participant_name, tema, palavra_chave, resumo, status) VALUES
        (participante5_id, 'Dr. Pedro Fernandes', 'Tecnologia 4.0 no Campo', 'indústria 4.0, agricultura digital', 'Integração de IoT e IA na produção agrícola...', 'aprovado'),
        (participante5_id, 'Dr. Pedro Fernandes', 'Agroindústria e Desenvolvimento', 'agroindústria, desenvolvimento', 'Papel da agroindústria no crescimento econômico...', 'rejeitado');
    END IF;
END $$;

-- ============================================================================
-- 6. NOTIFICAÇÕES
-- ============================================================================

INSERT INTO public.notifications (target_id, type, title, body, read) VALUES
-- Notificações para admins
('admin', 'new_registration', 'Novo Participante Registrado', 'Carlos Eduardo acabou de se registrar no congresso e aguarda aprovação.', false),
('admin', 'new_registration', 'Novo Participante Registrado', 'Isabel Cristina acabou de se registrar no congresso e aguarda aprovação.', false),
('admin', 'submission_approved', 'Submissão Aprovada', 'A submissão de Dr. Maria Santos foi aprovada pelo Conselho Científico.', true),

-- Notificações para participantes
((SELECT id::text FROM public.participants WHERE email = 'maria@urnm.edu.ao' LIMIT 1), 'submission_approved', 'Sua Apresentação Foi Aprovada!', 'Parabéns! Sua apresentação "Inovação no Ensino de Agronomia" foi aprovada.', true),
((SELECT id::text FROM public.participants WHERE email = 'pedro@urnm.edu.ao' LIMIT 1), 'submission_approved', 'Sua Apresentação Foi Aprovada!', 'Parabéns! Sua apresentação "Tecnologia 4.0 no Campo" foi aprovada.', false),
((SELECT id::text FROM public.participants WHERE email = 'pedro@urnm.edu.ao' LIMIT 1), 'submission_rejected', 'Apresentação Não Aprovada', 'Sua apresentação "Agroindústria e Desenvolvimento" não foi aprovada. Entre em contato com o Conselho.', false),
((SELECT id::text FROM public.participants WHERE email = 'ana@urnm.edu.ao' LIMIT 1), 'message', 'Bem-vindo ao Congresso!', 'Sua inscrição foi aprovada! Seu QR code está disponível na credencial.', true),
((SELECT id::text FROM public.participants WHERE email = 'lucia@hotmail.com' LIMIT 1), 'submission_rejected', 'Inscrição Não Aprovada', 'Infelizmente sua inscrição não foi aprovada. Entre em contato para mais informações.', true);

-- ============================================================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 'DADOS INSERIDOS COM SUCESSO!' as status;
SELECT '================================' as separator;
SELECT 'Participantes cadastrados: ' || (SELECT COUNT(*) FROM public.participants) as info;
SELECT 'Dias de programa: ' || (SELECT COUNT(*) FROM public.program_days) as info;
SELECT 'Itens do programa: ' || (SELECT COUNT(*) FROM public.program_items) as info;
SELECT 'Submissões: ' || (SELECT COUNT(*) FROM public.submissions) as info;
SELECT 'Notificações: ' || (SELECT COUNT(*) FROM public.notifications) as info;
SELECT '================================' as separator;
SELECT 'Resumo do Dashboard:' as info;
SELECT * FROM public.dashboard_summary;
SELECT '================================' as separator;
SELECT 'Estatísticas por Categoria:' as info;
SELECT * FROM public.stats_by_category;
