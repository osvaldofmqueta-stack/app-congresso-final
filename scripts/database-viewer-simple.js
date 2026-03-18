console.log('🚀 Iniciando análise da base de dados CSA...');

const fs = require('fs');

// Estrutura completa do banco de dados CSA
const databaseStructure = {
  nome: "CSA - Congresso de Alimento 2026",
  versao: "1.0.0",
  tipo: "Híbrido (AsyncStorage + PostgreSQL)",
  descricao: "Sistema de gestão de eventos para congresso acadêmico",
  
  storage: {
    asyncStorage: {
      descricao: "Armazenamento local React Native (dispositivo)",
      prefixo: "@csa_",
      tabelas: {
        auth: {
          chave: "@csa_auth_user",
          estrutura: {
            id: "string (UUID)",
            email: "string",
            name: "string", 
            role: "ceo | supervisor | conselho | null",
            participantId: "string (opcional)",
            avatar: "string (URI, opcional)"
          }
        },
        credentials: {
          chave: "@csa_credentials",
          estrutura: {
            email: "string",
            password: "string"
          }
        },
        admin_passwords: {
          chave: "@csa_admin_pwd_overrides",
          estrutura: "Record<string, string> (email -> senha)"
        },
        biometric: {
          chave: "@csa_biometric_enabled",
          estrutura: "boolean"
        },
        participants: {
          chave: "@csa_participants",
          estrutura: {
            id: "string (UUID)",
            nomeCompleto: "string",
            username: "string",
            email: "string",
            password: "string",
            nivelAcademico: "string",
            origemInstitucional: "string",
            origemTipo: "URNM | Externo",
            eixo: "1 | 2 | 3",
            spectatorType: "docente_investigador | estudante | outro | prelector",
            tarifa: "number (Kwanza)",
            status: "pendente | aprovado | rejeitado",
            qrData: "string (JSON, opcional)",
            presente: "boolean",
            presenceMarkedAt: "string (ISO datetime, opcional)",
            createdAt: "string (ISO datetime)",
            updatedAt: "string (ISO datetime)"
          }
        },
        reset_requests: {
          chave: "@csa_reset_requests",
          estrutura: {
            id: "string (UUID)",
            email: "string",
            username: "string",
            requestedAt: "string (ISO datetime)",
            status: "pendente | aprovado | rejeitado",
            newPassword: "string (opcional)"
          }
        },
        submissions: {
          chave: "@csa_submissions",
          estrutura: {
            id: "string (UUID)",
            participantId: "string",
            participantName: "string",
            tema: "string",
            palavraChave: "string",
            resumo: "string",
            fileName: "string (opcional)",
            fileUri: "string (opcional)",
            fileSize: "number (opcional)",
            status: "pendente | aprovado | rejeitado",
            submittedAt: "string (ISO datetime)",
            updatedAt: "string (ISO datetime)"
          }
        },
        notifications: {
          chave: "@csa_notifications",
          estrutura: {
            id: "string (UUID)",
            targetId: "string",
            type: "new_registration | message | submission_approved | submission_rejected",
            title: "string",
            body: "string",
            read: "boolean",
            createdAt: "string (ISO datetime)"
          }
        },
        program: {
          chave: "@csa_programa",
          estrutura: "ProgramDay[] (ver estrutura abaixo)"
        },
        congress_dates: {
          chave: "@csa_congress_dates",
          estrutura: {
            dataInicio: "string (YYYY-MM-DD)",
            dataFim: "string (YYYY-MM-DD)", 
            localNome: "string"
          }
        }
      }
    },
    
    postgresql: {
      descricao: "Backend API com Drizzle ORM e PostgreSQL",
      config: {
        dialect: "postgresql",
        orm: "Drizzle ORM",
        config_file: "lib/db/drizzle.config.ts",
        schema_file: "lib/db/src/schema/index.ts"
      },
      tabelas: {
        status: "Em desenvolvimento - schema definido mas sem tabelas implementadas"
      }
    }
  },

  modelos: {
    participant: {
      campos: [
        "id (UUID)",
        "nomeCompleto",
        "username", 
        "email",
        "password",
        "nivelAcademico",
        "origemInstitucional",
        "origemTipo (URNM/Externo)",
        "eixo (1/2/3)",
        "spectatorType",
        "tarifa (Kwanza)",
        "status (pendente/aprovado/rejeitado)",
        "qrData (JSON)",
        "presente (boolean)",
        "presenceMarkedAt",
        "createdAt",
        "updatedAt"
      ]
    },

    programDay: {
      campos: [
        "id (UUID)",
        "data (YYYY-MM-DD)",
        "titulo",
        "itens (ProgramItem[])",
        "createdAt"
      ]
    },

    programItem: {
      campos: [
        "id (UUID)",
        "tema",
        "horaInicio",
        "horaFim", 
        "preletores (string[])",
        "status (pendente/ativo/concluido)",
        "concluidoEm",
        "ativadoEm",
        "ordem (number)"
      ]
    },

    submission: {
      campos: [
        "id (UUID)",
        "participantId",
        "participantName",
        "tema",
        "palavraChave",
        "resumo",
        "fileName (opcional)",
        "fileUri (opcional)",
        "fileSize (opcional)",
        "status (pendente/aprovado/rejeitado)",
        "submittedAt",
        "updatedAt"
      ]
    },

    notification: {
      campos: [
        "id (UUID)",
        "targetId",
        "type (new_registration/message/submission_approved/submission_rejected)",
        "title",
        "body",
        "read (boolean)",
        "createdAt"
      ]
    },

    passwordReset: {
      campos: [
        "id (UUID)",
        "email",
        "username",
        "requestedAt",
        "status (pendente/aprovado/rejeitado)",
        "newPassword (opcional)"
      ]
    }
  },

  relacionamentos: [
    "Participant -> Submission (1:N)",
    "Participant -> Notification (1:N, via targetId)",
    "Participant -> PasswordReset (1:N, via email)",
    "ProgramDay -> ProgramItem (1:N)",
    "Admin -> Notification (1:N, targetId='admin')"
  ],

  precos: {
    tabela: "Tarifas em Kwanza (Kz)",
    valores: {
      "Docente/Investigador": { "URNM": 5000, "Externo": 7000 },
      "Estudante": { "URNM": 3000, "Externo": 4000 },
      "Outros": { "URNM": 5000, "Externo": 10000 },
      "Prelectores": { "URNM": 20000, "Externo": 20000 }
    }
  },

  eixos_tematicos: {
    1: "Ensino e Investigação aplicada ao sector agro-alimentar",
    2: "Contribuição sector agro na economia nacional", 
    3: "Integração empresarial na criação de políticas de desenvolvimento do sector agro em Angola"
  },

  usuarios_admin: {
    ceo: {
      email: "ceo@csa.com",
      senha: "ceo2026",
      permissoes: [
        "Gerenciar participantes",
        "Excluir participantes", 
        "Gerenciar senhas",
        "Gerenciar programa",
        "Marcar presença",
        "Ver submissões",
        "Aprovar submissões",
        "Enviar mensagens",
        "Ver dashboard"
      ]
    },
    supervisor: {
      email: "supervisor@csa.com", 
      senha: "super2026",
      permissoes: [
        "Gerenciar participantes",
        "Gerenciar programa",
        "Marcar presença",
        "Ver submissões",
        "Enviar mensagens",
        "Ver dashboard"
      ]
    },
    conselho: {
      email: "conselho@csa.com",
      senha: "conselho2026", 
      permissoes: [
        "Ver submissões",
        "Aprovar submissões",
        "Enviar mensagens"
      ]
    }
  }
};

function displayDatabaseStructure() {
  console.log('\n' + '='.repeat(80));
  console.log('CSA - CONGRESSO DE ALIMENTO 2026 - ESTRUTURA DE DADOS COMPLETA');
  console.log('='.repeat(80));
  
  console.log(`\n📊 ${databaseStructure.nome} v${databaseStructure.versao}`);
  console.log(`🔧 Tipo: ${databaseStructure.tipo}`);
  console.log(`📝 ${databaseStructure.descricao}\n`);

  // AsyncStorage
  console.log('\n📱 ASYNCSTORAGE (ARMazenamento Local React Native)');
  console.log('-'.repeat(50));
  
  Object.entries(databaseStructure.storage.asyncStorage.tabelas).forEach(([key, table]) => {
    console.log(`\n📋 ${key.toUpperCase()}: ${table.chave}`);
    if (typeof table.estrutura === 'object') {
      Object.entries(table.estrutura).forEach(([field, type]) => {
        console.log(`   ├─ ${field}: ${type}`);
      });
    } else {
      console.log(`   └─ Estrutura: ${table.estrutura}`);
    }
  });

  // PostgreSQL
  console.log('\n\n🗄️ POSTGRESQL (Backend API)');
  console.log('-'.repeat(50));
  console.log(`📋 Config: ${databaseStructure.storage.postgresql.config.dialect}`);
  console.log(`📋 ORM: ${databaseStructure.storage.postgresql.config.orm}`);
  console.log(`📋 Status: ${databaseStructure.storage.postgresql.tabelas.status}`);

  // Modelos de Dados
  console.log('\n\n📐 MODELOS DE DADOS');
  console.log('-'.repeat(50));
  
  Object.entries(databaseStructure.modelos).forEach(([model, info]) => {
    console.log(`\n🏗️  ${model.toUpperCase()}`);
    info.campos.forEach(campo => {
      console.log(`   ├─ ${campo}`);
    });
  });

  // Relacionamentos
  console.log('\n\n🔗 RELACIONAMENTOS');
  console.log('-'.repeat(50));
  databaseStructure.relacionamentos.forEach(rel => {
    console.log(`   ├─ ${rel}`);
  });

  // Tabela de Preços
  console.log(`\n\n💰 ${databaseStructure.precos.tabela}`);
  console.log('-'.repeat(50));
  Object.entries(databaseStructure.precos.valores).forEach(([categoria, precos]) => {
    console.log(`   ${categoria}:`);
    Object.entries(precos).forEach(([origem, valor]) => {
      console.log(`      ├─ ${origem}: ${valor.toLocaleString()} Kz`);
    });
  });

  // Eixos Temáticos
  console.log('\n\n🎯 EIXOS TEMÁTICOS');
  console.log('-'.repeat(50));
  Object.entries(databaseStructure.eixos_tematicos).forEach(([eixo, descricao]) => {
    console.log(`   ├─ Eixo ${eixo}: ${descricao}`);
  });

  // Usuários Admin
  console.log('\n\n👑 USUÁRIOS ADMINISTRATIVOS');
  console.log('-'.repeat(50));
  Object.entries(databaseStructure.usuarios_admin).forEach(([role, info]) => {
    console.log(`   ${role.toUpperCase()}: ${info.email} / ${info.senha}`);
    console.log('   └─ Permissões:');
    info.permissoes.forEach(perm => {
      console.log(`      ├─ ${perm}`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('FIM DA ESTRUTURA DE DADOS CSA');
  console.log('='.repeat(80) + '\n');
}

// Gerar schema SQL
function generateSQLSchema() {
  const sqlSchema = `
-- CSA Congresso 2026 - PostgreSQL Schema
-- Gerado automaticamente pelo script database-viewer.js

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Participantes
CREATE TABLE participants (
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

-- Tabela de Dias do Programa
CREATE TABLE program_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Programa
CREATE TABLE program_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID REFERENCES program_days(id) ON DELETE CASCADE,
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

-- Tabela de Submissões
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
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

-- Tabela de Notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id VARCHAR(255) NOT NULL,
    type VARCHAR(30) CHECK (type IN ('new_registration', 'message', 'submission_approved', 'submission_rejected')),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Requisições de Reset de Senha
CREATE TABLE password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    new_password VARCHAR(255)
);

-- Tabela de Configurações do Congresso
CREATE TABLE congress_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    local_nome VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

  try {
    fs.writeFileSync('./database-schema.sql', sqlSchema);
    console.log('\n✅ Schema SQL salvo em: database-schema.sql');
  } catch (error) {
    console.log('\n❌ Erro ao salvar schema SQL:', error.message);
  }
}

// Execução principal
function main() {
  displayDatabaseStructure();
  generateSQLSchema();
  console.log('\n✅ Análise concluída com sucesso!');
  console.log('📁 Arquivos gerados:');
  console.log('   ├─ database-schema.sql (Schema PostgreSQL)');
}

main();
