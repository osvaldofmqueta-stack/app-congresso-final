// ============================================================================
// TESTE DE CONEXÃO COM SUPABASE (usando REST API diretamente)
// Execute: node test-supabase-connection-simple.mjs
// ============================================================================

const SUPABASE_URL = 'https://xrpquuklhungyvctmpch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHF1dWtsaHVuZ3l2Y3RtcGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzU1NjIsImV4cCI6MjA4OTQxMTU2Mn0.pFfGjx-732pEoPA-RLjrpy1P18OS9O8ygDmFY2Bl1Jw';

async function supabaseRequest(table, select = '*', limit = 10) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return await response.json();
}

async function testConnection() {
  console.log('🧪 Testando conexão com Supabase...\n');
  console.log(`🔗 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);
  
  try {
    // Teste 1: Configuração do congresso
    console.log('📋 Teste 1: Buscando configuração do congresso...');
    try {
      const config = await supabaseRequest('congress_config', '*', 1);
      if (config && config.length > 0) {
        console.log('✅ Config encontrada:');
        console.log(`   📅 Data: ${config[0].data_inicio} a ${config[0].data_fim}`);
        console.log(`   📍 Local: ${config[0].local_nome}`);
      } else {
        console.log('⚠️ Configuração não encontrada (tabela vazia)');
      }
    } catch (e) {
      console.log('❌ Erro:', e.message);
    }
    
    // Teste 2: Participantes
    console.log('\n👥 Teste 2: Buscando participantes...');
    try {
      const participants = await supabaseRequest('participants', 'id,nome_completo,email,status', 5);
      console.log(`✅ Encontrados ${participants.length} participantes:`);
      participants.forEach(p => {
        console.log(`   • ${p.nome_completo} (${p.email}) - ${p.status}`);
      });
    } catch (e) {
      console.log('❌ Erro:', e.message);
    }
    
    // Teste 3: Programação
    console.log('\n📅 Teste 3: Buscando programação...');
    try {
      const program = await supabaseRequest('program_days', 'id,data,titulo', 5);
      console.log(`✅ Encontrados ${program.length} dias de programa:`);
      program.forEach(d => {
        console.log(`   • ${d.data}: ${d.titulo}`);
      });
    } catch (e) {
      console.log('❌ Erro:', e.message);
    }
    
    // Teste 4: Admins
    console.log('\n👑 Teste 4: Verificando usuários admin...');
    try {
      const admins = await supabaseRequest('admin_users', 'email,name,role', 10);
      console.log(`✅ Encontrados ${admins.length} usuários admin:`);
      admins.forEach(a => {
        console.log(`   • ${a.name} (${a.role}) - ${a.email}`);
      });
    } catch (e) {
      console.log('❌ Erro:', e.message);
    }
    
    // Teste 5: Dashboard
    console.log('\n📊 Teste 5: Buscando resumo do dashboard...');
    try {
      const dashboard = await supabaseRequest('dashboard_summary', '*', 1);
      if (dashboard && dashboard.length > 0) {
        const d = dashboard[0];
        console.log('✅ Resumo do Dashboard:');
        console.log(`   • Pendentes: ${d.pendentes}`);
        console.log(`   • Aprovados: ${d.aprovados}`);
        console.log(`   • Rejeitados: ${d.rejeitados}`);
        console.log(`   • Presentes: ${d.presentes}`);
      }
    } catch (e) {
      console.log('❌ Erro:', e.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Teste de conexão concluído!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    process.exit(1);
  }
}

testConnection();
