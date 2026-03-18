#!/usr/bin/env node

/**
 * CSA Database Viewer
 * Script para mostrar toda a estrutura de dados da aplicação CSA Congresso
 * 
 * Este script analisa e exibe:
 * - Estrutura AsyncStorage (React Native)
 * - Schema PostgreSQL (Drizzle ORM)
 * - Contextos de dados e seus modelos
 * - Relacionamentos entre entidades
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

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
        // Nota: Schema atual está vazio, mas estrutura preparada para expansão
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
      ],
      validacoes: {
        email: "único",
        username: "único",
        password: "mínimo 6 caracteres",
        tarifa: "calculada por spectatorType + origemTipo"
      }
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
  },

  fluxos_dados: {
    registro: "Formulário -> AsyncStorage -> Notificação Admin -> Aprovação/Rejeição -> QR Code",
    submissao: "Participante -> Arquivo -> AsyncStorage -> Conselho -> Aprovação/Rejeição -> Notificação",
    presenca: "QR Code Scan -> Marcação Presença -> Atualização em tempo real",
    programa: "Admin Configura -> Todos veem em tempo real (poll 5s)"
  },

  sincronizacao: {
    metodo: "Polling AsyncStorage",
    frequencia: "5-8 segundos",
    contextos: [
      "AuthContext (autenticação)",
      "EventContext (participantes, submissões, notificações)",
      "ProgramContext (programa do congresso)",
      "CongressContext (datas e local)"
    ]
  }
};

function displayDatabaseStructure() {
  colorLog('cyan', '\n' + '='.repeat(80));
  colorLog('bright', 'CSA - CONGRESSO DE ALIMENTO 2026 - ESTRUTURA DE DADOS COMPLETA');
  colorLog('cyan', '='.repeat(80));
  
  colorLog('green', `\n📊 ${databaseStructure.nome} v${databaseStructure.versao}`);
  colorLog('yellow', `🔧 Tipo: ${databaseStructure.tipo}`);
  colorLog('white', `📝 ${databaseStructure.descricao}\n`);

  // AsyncStorage
  colorLog('bright', '\n📱 ASYNCSTORAGE (ARMazenamento Local React Native)');
  colorLog('cyan', '-'.repeat(50));
  
  Object.entries(databaseStructure.storage.asyncStorage.tabelas).forEach(([key, table]) => {
    colorLog('green', `\n📋 ${key.toUpperCase()}: ${table.chave}`);
    if (typeof table.estrutura === 'object') {
      Object.entries(table.estrutura).forEach(([field, type]) => {
        colorLog('white', `   ├─ ${field}: ${type}`);
      });
    } else {
      colorLog('white', `   └─ Estrutura: ${table.estrutura}`);
    }
  });

  // PostgreSQL
  colorLog('bright', '\n\n🗄️ POSTGRESQL (Backend API)');
  colorLog('cyan', '-'.repeat(50));
  colorLog('green', `📋 Config: ${databaseStructure.storage.postgresql.config.dialect}`);
  colorLog('green', `📋 ORM: ${databaseStructure.storage.postgresql.config.orm}`);
  colorLog('yellow', `📋 Status: ${databaseStructure.storage.postgresql.tabelas.status}`);

  // Modelos de Dados
  colorLog('bright', '\n\n📐 MODELOS DE DADOS');
  colorLog('cyan', '-'.repeat(50));
  
  Object.entries(databaseStructure.modelos).forEach(([model, info]) => {
    colorLog('green', `\n🏗️  ${model.toUpperCase()}`);
    info.campos.forEach(campo => {
      colorLog('white', `   ├─ ${campo}`);
    });
    if (info.validacoes) {
      colorLog('yellow', '   └─ Validações:');
      Object.entries(info.validacoes).forEach(([field, rule]) => {
        colorLog('white', `      ├─ ${field}: ${rule}`);
      });
    }
  });

  // Relacionamentos
  colorLog('bright', '\n\n🔗 RELACIONAMENTOS');
  colorLog('cyan', '-'.repeat(50));
  databaseStructure.relacionamentos.forEach(rel => {
    colorLog('white', `   ├─ ${rel}`);
  });

  // Tabela de Preços
  colorLog('bright', `\n\n💰 ${databaseStructure.precos.tabela}`);
  colorLog('cyan', '-'.repeat(50));
  Object.entries(databaseStructure.precos.valores).forEach(([categoria, precos]) => {
    colorLog('green', `   ${categoria}:`);
    Object.entries(precos).forEach(([origem, valor]) => {
      colorLog('white', `      ├─ ${origem}: ${valor.toLocaleString()} Kz`);
    });
  });

  // Eixos Temáticos
  colorLog('bright', '\n\n🎯 EIXOS TEMÁTICOS');
  colorLog('cyan', '-'.repeat(50));
  Object.entries(databaseStructure.eixos_tematicos).forEach(([eixo, descricao]) => {
    colorLog('white', `   ├─ Eixo ${eixo}: ${descricao}`);
  });

  // Usuários Admin
  colorLog('bright', '\n\n👑 USUÁRIOS ADMINISTRATIVOS');
  colorLog('cyan', '-'.repeat(50));
  Object.entries(databaseStructure.usuarios_admin).forEach(([role, info]) => {
    colorLog('green', `   ${role.toUpperCase()}: ${info.email} / ${info.senha}`);
    colorLog('white', '   └─ Permissões:');
    info.permissoes.forEach(perm => {
      colorLog('white', `      ├─ ${perm}`);
    });
  });

  // Fluxos de Dados
  colorLog('bright', '\n\n🔄 FLUXOS DE DADOS');
  colorLog('cyan', '-'.repeat(50));
  Object.entries(databaseStructure.fluxos_dados).forEach(([fluxo, descricao]) => {
    colorLog('white', `   ├─ ${fluxo}: ${descricao}`);
  });

  // Sincronização
  colorLog('bright', '\n\n⚡ SINCRONIZAÇÃO DE DADOS');
  colorLog('cyan', '-'.repeat(50));
  colorLog('white', `   ├─ Método: ${databaseStructure.sincronizacao.metodo}`);
  colorLog('white', `   ├─ Frequência: ${databaseStructure.sincronizacao.frequencia}`);
  colorLog('white', `   └─ Contextos:`);
  databaseStructure.sincronizacao.contextos.forEach(contexto => {
    colorLog('white', `      ├─ ${contexto}`);
  });

  colorLog('cyan', '\n' + '='.repeat(80));
  colorLog('bright', 'FIM DA ESTRUTURA DE DADOS CSA');
  colorLog('cyan', '='.repeat(80) + '\n');
}

// Função para gerar script SQL (para futuro PostgreSQL)
function generateSQLSchema() {
  colorLog('bright', '\n🗄️  GERANDO SCHEMA SQL (PARA FUTURA MIGRAÇÃO POSTGRESQL)');
  colorLog('cyan', '-'.repeat(50));

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

-- Índices para performance
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_participants_spectator ON participants(spectator_type);
CREATE INDEX idx_program_items_day_id ON program_items(day_id);
CREATE INDEX idx_program_items_status ON program_items(status);
CREATE INDEX idx_submissions_participant ON submissions(participant_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_notifications_target ON notifications(target_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_reset_requests_email ON password_reset_requests(email);
CREATE INDEX idx_reset_requests_status ON password_reset_requests(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_congress_config_updated_at BEFORE UPDATE ON congress_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

  console.log(sqlSchema);
  
  // Salvar schema em arquivo
  try {
    fs.writeFileSync('./database-schema.sql', sqlSchema);
    colorLog('green', '\n✅ Schema SQL salvo em: database-schema.sql');
  } catch (error) {
    colorLog('red', '\n❌ Erro ao salvar schema SQL:', error.message);
  }
}

// Função para gerar documentação
function generateDocumentation() {
  colorLog('bright', '\n📚 GERANDO DOCUMENTAÇÃO DA BASE DE DADOS');
  colorLog('cyan', '-'.repeat(50));

  const doc = `
# CSA Congresso 2026 - Documentação da Base de Dados

## Visão Geral

O sistema CSA utiliza uma arquitetura híbrida de armazenamento:
- **AsyncStorage**: Armazenamento local no dispositivo (React Native)
- **PostgreSQL**: Backend API com Drizzle ORM (em desenvolvimento)

## Estrutura AsyncStorage

### Chaves de Armazenamento

Todas as chaves usam o prefixo \`@csa_\`:

- \`@csa_auth_user\`: Dados do usuário autenticado
- \`@csa_credentials\**: Credenciais salvas para login automático
- \`@csa_admin_pwd_overrides\**: Senhas de administrador personalizadas
- \`@csa_biometric_enabled\**: Configuração de autenticação biométrica
- \`@csa_participants\**: Lista de participantes do congresso
- \`@csa_reset_requests\**: Solicitações de redefinição de senha
- \`@csa_submissions\**: Submissões de apresentações
- \`@csa_notifications\**: Sistema de notificações
- \`@csa_programa\**: Programação do congresso
- \`@csa_congress_dates\**: Datas e local do evento

## Modelos de Dados

### Participant
Entidade principal representando os participantes do congresso.

**Campos:**
- id: UUID único
- nomeCompleto: Nome completo do participante
- username: Nome de usuário único
- email: Email único
- password: Senha (mínimo 6 caracteres)
- nivelAcademico: Nível acadêmico
- origemInstitucional: Instituição de origem
- origemTipo: "URNM" | "Externo"
- eixo: 1 | 2 | 3 (eixo temático)
- spectatorType: Tipo de participante
- tarifa: Valor em Kwanza (calculado)
- status: "pendente" | "aprovado" | "rejeitado"
- qrData: JSON com dados do QR code
- presente: Boolean para controle de presença
- presenceMarkedAt: Timestamp da marcação de presença
- createdAt/updatedAt: Timestamps

### ProgramDay & ProgramItem
Estrutura para programação do congresso.

**ProgramDay:**
- id: UUID
- data: Data do evento (YYYY-MM-DD)
- titulo: Título do dia
- itens: Array de ProgramItem
- createdAt: Timestamp

**ProgramItem:**
- id: UUID
- tema: Título da apresentação
- horaInicio/horaFim: Horários
- preletores: Array de nomes
- status: "pendente" | "ativo" | "concluido"
- ordem: Ordem no dia

## Preços e Categorias

| Categoria | URNM | Externo |
|-----------|------|---------|
| Docente/Investigador | 5.000 Kz | 7.000 Kz |
| Estudante | 3.000 Kz | 4.000 Kz |
| Outros | 5.000 Kz | 10.000 Kz |
| Prelectores | 20.000 Kz | 20.000 Kz |

## Eixos Temáticos

1. Ensino e Investigação aplicada ao sector agro-alimentar
2. Contribuição sector agro na economia nacional
3. Integração empresarial na criação de políticas de desenvolvimento do sector agro em Angola

## Usuários Administrativos

### CEO (ceo@csa.com / ceo2026)
- Controle total do sistema
- Gestão de participantes
- Configuração do congresso

### Supervisor (supervisor@csa.com / super2026)
- Gestão de participantes
- Controle do programa
- Marcação de presença

### Conselho Científico (conselho@csa.com / conselho2026)
- Avaliação de submissões
- Comunicação com participantes

## Fluxos de Dados

1. **Registro**: Formulário → AsyncStorage → Notificação Admin → Aprovação
2. **Submissão**: Participante → Arquivo → Conselho → Avaliação
3. **Presença**: QR Code → Marcação → Atualização em tempo real
4. **Programa**: Admin → Todos (polling 5s)

## Sincronização

- Método: Polling do AsyncStorage
- Frequência: 5-8 segundos
- Contextos React para gerenciamento de estado

## Segurança

- Senhas de administrador configuráveis
- Autenticação biométrica opcional
- Validação de email e username únicos
- QR codes com dados criptografados

## Performance

- Armazenamento local para acesso rápido
- Polling otimizado para atualizações
- Índices planejados para PostgreSQL

---

*Gerado automaticamente pelo script database-viewer.js*
`;

  try {
    fs.writeFileSync('./DATABASE_DOCUMENTATION.md', doc);
    colorLog('green', '\n✅ Documentação salva em: DATABASE_DOCUMENTATION.md');
  } catch (error) {
    colorLog('red', '\n❌ Erro ao salvar documentação:', error.message);
  }
}

// Execução principal
function main() {
  colorLog('bright', '🚀 Iniciando análise da base de dados CSA...');
  
  // Exibir estrutura completa
  displayDatabaseStructure();
  
  // Gerar schema SQL
  generateSQLSchema();
  
  // Gerar documentação
  generateDocumentation();
  
  colorLog('green', '\n✅ Análise concluída com sucesso!');
  colorLog('cyan', '📁 Arquivos gerados:');
  colorLog('white', '   ├─ database-schema.sql (Schema PostgreSQL)');
  colorLog('white', '   └─ DATABASE_DOCUMENTATION.md (Documentação completa)');
}

// Tratamento de erros
process.on('uncaughtException', (error) => {
  colorLog('red', '\n❌ Erro não capturado:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  colorLog('red', '\n❌ Promise rejeitada:', reason);
  process.exit(1);
});

// Executar script
main();
