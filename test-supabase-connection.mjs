// ============================================================================
// TESTE DE CONEXÃO COM SUPABASE
// Execute: node test-supabase-connection.js
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrpquuklhungyvctmpch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHF1dWtsaHVuZ3l2Y3RtcGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzU1NjIsImV4cCI6MjA4OTQxMTU2Mn0.pFfGjx-732pEoPA-RLjrpy1P18OS9O8ygDmFY2Bl1Jw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🧪 Testando conexão com Supabase...\n');
  
  try {
    // Teste 1: Verificar configuração do congresso
    console.log('📋 Teste 1: Buscando configuração do congresso...');
    const { data: config, error: configError } = await supabase
      .from('congress_config')
      .select('*')
      .single();
    
    if (configError) {
      console.log('❌ Erro ao buscar config:', configError.message);
    } else {
      console.log('✅ Config encontrada:');
      console.log(`   📅 Data: ${config.data_inicio} a ${config.data_fim}`);
      console.log(`   📍 Local: ${config.local_nome}`);
    }
    
    // Teste 2: Contar participantes
    console.log('\n👥 Teste 2: Contando participantes...');
    const { count: participantCount, error: countError } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Erro ao contar participantes:', countError.message);
    } else {
      console.log(`✅ Total de participantes: ${participantCount}`);
    }
    
    // Teste 3: Buscar alguns participantes
    console.log('\n👤 Teste 3: Buscando participantes...');
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, nome_completo, email, status')
      .limit(3);
    
    if (participantsError) {
      console.log('❌ Erro ao buscar participantes:', participantsError.message);
    } else {
      console.log(`✅ Encontrados ${participants.length} participantes:`);
      participants.forEach(p => {
        console.log(`   • ${p.nome_completo} (${p.email}) - ${p.status}`);
      });
    }
    
    // Teste 4: Buscar programação
    console.log('\n📅 Teste 4: Buscando programação...');
    const { data: program, error: programError } = await supabase
      .from('program_days')
      .select('id, data, titulo')
      .limit(2);
    
    if (programError) {
      console.log('❌ Erro ao buscar programação:', programError.message);
    } else {
      console.log(`✅ Encontrados ${program.length} dias de programa:`);
      program.forEach(d => {
        console.log(`   • ${d.data}: ${d.titulo}`);
      });
    }
    
    // Teste 5: Verificar admins
    console.log('\n👑 Teste 5: Verificando usuários admin...');
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('email, name, role');
    
    if (adminsError) {
      console.log('❌ Erro ao buscar admins:', adminsError.message);
    } else {
      console.log(`✅ Encontrados ${admins.length} usuários admin:`);
      admins.forEach(a => {
        console.log(`   • ${a.name} (${a.role}) - ${a.email}`);
      });
    }
    
    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    console.log(config ? '✅ Configuração do Congresso: OK' : '❌ Configuração: Falha');
    console.log(participantCount !== null ? '✅ Participantes: OK' : '❌ Participantes: Falha');
    console.log(participants ? '✅ Consulta de Dados: OK' : '❌ Consulta: Falha');
    console.log(program ? '✅ Programação: OK' : '❌ Programação: Falha');
    console.log(admins ? '✅ Administradores: OK' : '❌ Administradores: Falha');
    console.log('='.repeat(60));
    console.log('🎉 Conexão com Supabase testada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

testConnection();
