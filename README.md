# CSA — Sistema de Gestão de Eventos

Aplicação móvel Expo React Native para gestão do **Congresso de Alimento 2026** pela URNM (Universidade Rainha Njinga a Mbande).

## 📱 Funcionalidades Principais

### 🔐 Autenticação
- Login com email + senha
- Autenticação biométrica (Face ID / Touch ID)
- Sistema de papéis: CEO, Supervisor, Conselho Científico, Participante
- Recuperação de senha com aprovação administrativa

### 📝 Fluxo de Registro
- Wizard de 5 passos com barra de progresso
- **Dados Pessoais** → **Perfil Académico** → **Participação** → **Acesso** → **Confirmação**
- Tipos de participantes: Docente/Investigador, Estudante, Outro, Prelector
- Tabela de preços URNM vs Externo (Kwanza)
- Persistência automática de dados do formulário
- Modal "aguardar aprovação" pós-registro

### 👨‍💼 Painel Administrativo
- Dashboard com navegação inferior: Dashboard, Participantes, **Programa**, Presença, Senhas
- Gestão completa do programa do congresso
- Scanner de QR codes para controle de presença
- Gestão de senhas e aprovações
- Contador de presença: Presentes / Ausentes / Total

### 🎫 Credencial QR Code
- QR code gerado por participante aprovado
- Utilizado para escaneamento na entrada do evento
- Scanner de presença com câmera do dispositivo

### 📅 Programa do Congresso
- Gestão em tempo real do programa completo
- Configuração de múltiplos dias com datas e títulos
- Adição/edição/exclusão de itens do programa
- Status em tempo real: "Em curso", "Concluído", "Pendente"
- Atualizações automáticas a cada 5 segundos para todos os participantes
- Destaque do dia atual com badge "HOJE"

### 📱 Tela Principal (Participantes)
- **Credencial**: QR code para entrada
- **Programa**: Agenda ao vivo do congresso
- **Apresentação**: Submissão de trabalhos (tema, palavras-chave, resumo, PDF/DOC min. 5MB)
- **Notificações**: Mensagens do Conselho Científico

### 👩‍🏫 Painel do Conselho Científico
- Aprovação/rejeição de apresentações
- Sistema de mensagens para participantes
- Avaliação de submissões

## 🛠 Stack Tecnológico

### Frontend
- **Framework**: Expo SDK 54, Expo Router v6, React Native 0.81
- **State Management**: AsyncStorage + React Context (polling a cada 8s)
- **Autenticação**: expo-local-authentication (biometria)
- **QR Code**: react-native-qrcode-svg (exibição), expo-camera (scan)
- **File Picker**: expo-document-picker (PDF/DOC, min. 5MB)
- **Crypto**: expo-crypto (geração de UUID)
- **UI**: Fonte Inter, sistema de design personalizado

### Backend
- **API**: Express.js com Drizzle ORM
- **Database**: Configuração para PostgreSQL/SQLite
- **TypeScript**: Tipagem completa

### DevOps
- **Package Manager**: pnpm com workspaces
- **Build**: ESBuild, TypeScript
- **Security**: Configuração de supply chain protection

## 🏗 Estrutura do Projeto

```
app-ita/
├── artifacts/
│   ├── csa-app/                 # Aplicação móvel Expo
│   │   ├── app/
│   │   │   ├── index.tsx        # Tela de login
│   │   │   ├── register.tsx     # Wizard de registro
│   │   │   ├── home.tsx         # Tela principal participantes
│   │   │   ├── admin/           # Painéis administrativos
│   │   │   └── conselho/        # Painel Conselho Científico
│   │   ├── contexts/            # React Contexts
│   │   ├── components/          # Componentes reutilizáveis
│   │   └── constants/           # Cores e configurações
│   ├── api-server/              # Backend Express.js
│   └── mockup-sandbox/          # Ambiente de desenvolvimento
├── lib/                         # Bibliotecas compartilhadas
├── scripts/                     # Scripts de build e deploy
└── package.json                 # Workspace configuration
```

## 💰 Tabela de Preços (Kwanza)

| Categoria         | URNM   | Externo |
|-------------------|--------|---------|
| Docente/Invest.   | 5.000  | 7.000   |
| Estudantes        | 3.000  | 4.000   |
| Outros            | 5.000  | 10.000  |
| Prelectores       | 20.000 | 20.000  |

## 👤 Credenciais de Administrador

- **CEO**: `ceo@csa.com` / `ceo2026`
- **Supervisor**: `supervisor@csa.com` / `super2026`
- **Conselho Científico**: `conselho@csa.com` / `conselho2026`

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- pnpm 8+
- Expo CLI
- Dispositivo iOS/Android ou Expo Go

### Instalação
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/app-congresso-final.git
cd app-congresso-final

# Instalar dependências
pnpm install

# Iniciar aplicação
cd artifacts/csa-app
pnpm dev
```

### Variáveis de Ambiente
```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_DOMAIN=localhost
```

## 🔄 Fluxo de Dados

- **Armazenamento**: AsyncStorage para dados locais
- **Sincronização**: Context polling a cada 8 segundos
- **Registro**: → notificação admin → aprovação/rejeição → participante pode fazer login
- **Apresentações**: Participante submete → Conselho avalia → notificação ao participante

## 📱 Telas do Aplicativo

### Tela de Login
- Formulário de email/senha
- Botão de autenticação biométrica
- Logos URNM e CSA
- Link "Esqueci a senha"

### Fluxo de Registro
- Step 1: Dados Pessoais (nome, email, telefone)
- Step 2: Perfil Académico (instituição, categoria)
- Step 3: Participação (eixos temáticos, tipo de participação)
- Step 4: Acesso (senha, confirmação)
- Step 5: Confirmação (resumo e submit)

### Painéis Administrativos
- **Dashboard**: Estatísticas e navegação rápida
- **Participantes**: Lista com filtros e ações
- **Programa**: Gestão completa do congresso
- **Presença**: Scanner de QR codes e contagem
- **Senhas**: Reset de senhas dos usuários

## 🎨 Design System

### Cores
- **Primária**: #1A7C3F (Verde CSA)
- **Primária Escura**: #0F5229
- **Primária Clara**: #2EA858
- **Secundária**: #1A3A6E (Navy)
- **Texto**: #0D1117
- **Fundo**: #FFFFFF

### Tipografia
- **Fonte**: Inter (400, 500, 600, 700)
- **Tamanhos**: Hierarquia clara e consistente

## 🔒 Segurança

- **Supply Chain Protection**: Idade mínima de 1 dia para pacotes npm
- **Autenticação Biométrica**: Face ID/Touch ID
- **Role-Based Access Control**: Permissões granulares
- **Validação de Dados**: Zod schemas para validação
- **Platform Security**: Apenas dependências necessárias por plataforma

## 📊 Performance

- **Polling Otimizado**: 5-8 segundos para atualizações em tempo real
- **Lazy Loading**: Carregamento sob demanda de componentes
- **Memory Management**: Cleanup adequado de listeners e timers
- **Bundle Size**: Otimização com ESBuild

## 🧪 Testes

```bash
# Type checking
pnpm typecheck

# Build para produção
pnpm build

# Servir build
pnpm serve
```

## 📦 Deploy

### Replit
- Configurado para desenvolvimento em Replit
- Build automático com ESBuild
- Servidor de desenvolvimento integrado

### Produção
- Build otimizado com ESBuild
- Servidor Express.js para API
- Configuração para Vercel/Netlify

## 🤝 Contribuição

1. Fork o projeto
2. Crie branch para feature (`git checkout -b feature/amazing-feature`)
3. Commit mudanças (`git commit -m 'Add amazing feature'`)
4. Push para branch (`git push origin feature/amazing-feature`)
5. Abra Pull Request

## 📄 Licença

MIT License - ver arquivo LICENSE para detalhes

## 📞 Contato

- **Projeto**: Congresso de Alimento 2026
- **Instituição**: Universidade Rainha Njinga a Mbande (URNM)
- **Email**: contato@csa.urnm.edu.ao

---

**Desenvolvido com ❤️ para o Congresso de Alimento 2026**
