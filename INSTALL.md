# Guia de Instalação e Configuração

## 📋 Pré-requisitos

### Software Necessário
- **Node.js** 18.0+ 
- **pnpm** 8.0+ (recomendado) ou npm/yarn
- **Expo CLI** (`npm install -g @expo/cli`)
- **Git**

### Hardware/Dispositivos
- **iOS**: iPhone/iPad com iOS 13+ ou simulador
- **Android**: Dispositivo Android com API 21+ ou emulador
- **Development**: Expo Go app no dispositivo

---

## 🚀 Instalação Rápida

### 1. Clonar o Repositório
```bash
git clone https://github.com/osvaldofmqueta-stack/app-congresso-final.git
cd app-congresso-final
```

### 2. Instalar Dependências
```bash
# Usando pnpm (recomendado)
pnpm install

# Ou usando npm
npm install
```

### 3. Iniciar Aplicação
```bash
# Navegar para o app
cd artifacts/csa-app

# Iniciar servidor de desenvolvimento
pnpm dev
```

### 4. Abrir no Dispositivo
- Escanear QR code com Expo Go
- Ou abrir no simulador/emulador

---

## ⚙️ Configuração Detalhada

### Variáveis de Ambiente

Crie arquivo `.env` na raiz do projeto:

```bash
# Configuração da API
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_DOMAIN=localhost
EXPO_PUBLIC_REPL_ID=seu-repl-id

# Configuração Expo
EXPO_PACKAGER_PROXY_URL=https://seu-dominio.replit.app

# Opcional: Configurações de banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/csa_db
```

### Configuração do Backend

```bash
# Navegar para API server
cd artifacts/api-server

# Instalar dependências
pnpm install

# Configurar banco de dados
# Editar src/db/config.ts com suas credenciais

# Iniciar servidor
pnpm dev
```

---

## 📱 Configuração de Dispositivos

### iOS (iPhone/iPad)

1. **Instalar Expo Go**
   - App Store: "Expo Go"

2. **Configurar Desenvolvimento**
   ```bash
   # Instalar Xcode (Mac only)
   # Configurar simulador
   npx expo run:ios
   ```

3. **Build para Produção**
   ```bash
   npx expo build:ios
   ```

### Android

1. **Instalar Expo Go**
   - Google Play: "Expo Go"

2. **Configurar Desenvolvimento**
   ```bash
   # Instalar Android Studio
   # Configurar emulador
   npx expo run:android
   ```

3. **Build para Produção**
   ```bash
   npx expo build:android
   ```

---

## 🔧 Configuração de Desenvolvimento

### VS Code Setup

Instalar extensões recomendadas:
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Prettier**
- **ESLint**

### Configuração Prettier

Criar `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Configuração ESLint

Criar `.eslintrc.js`:
```javascript
module.exports = {
  extends: ['expo', '@react-native-community'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-native/no-unused-styles': 'error',
  },
};
```

---

## 🗄️ Configuração de Banco de Dados

### PostgreSQL (Produção)

```bash
# Criar banco de dados
createdb csa_db

# Rodar migrações
cd artifacts/api-server
pnpm db:migrate

# Inserir dados iniciais
pnpm db:seed
```

### SQLite (Desenvolvimento)

```bash
# O projeto usa AsyncStorage para desenvolvimento
# Para persistência completa, configure PostgreSQL
```

---

## 🚀 Deploy

### Replit (Desenvolvimento)

1. **Importar Projeto**
   - Upload para Replit
   - Configurar secrets

2. **Configurar Secrets**
   ```
   EXPO_PUBLIC_API_URL
   EXPO_PUBLIC_DOMAIN
   REPLIT_DEV_DOMAIN
   ```

### Vercel (Produção)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Railway/Heroku

```bash
# Configurar Railway
# Adicionar variáveis de ambiente
# Deploy automático
```

---

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Metro não inicia
```bash
# Limpar cache
npx expo start --clear

# Resetar projeto
npx expo install --fix
```

#### 2. Erro de dependências
```bash
# Reinstalar tudo
rm -rf node_modules
rm package-lock.json
pnpm install
```

#### 3. Problemas com iOS
```bash
# Limpar build
npx expo run:ios --clear

# Resetar pods
cd ios && pod install && cd ..
```

#### 4. Problemas com Android
```bash
# Limpar gradle
cd android && ./gradlew clean && cd ..

# Resetar projeto
npx expo run:android --clear
```

### Logs e Debug

```bash
# Ver logs do Metro
npx expo start --tunnel

# Debug remoto
# Abrir http://localhost:8081/debugger-ui/

# Logs do dispositivo
npx expo log:ios
npx expo log:android
```

---

## 📊 Performance e Monitoramento

### Otimizações

1. **Bundle Size**
   ```bash
   # Analisar bundle
   npx expo start --bundle-output bundle.js
   ```

2. **Performance**
   ```bash
   # React DevTools
   npx react-devtools
   
   # Flipper (Android/iOS)
   npx react-native flipper
   ```

### Monitoramento

Configurar analytics (opcional):
```bash
# Expo Analytics
npx expo install expo-analytics-amplitude

# Sentry para errors
npx expo install @sentry/react-native
```

---

## 🔐 Segurança

### Boas Práticas

1. **Variáveis de Ambiente**
   - Nunca commitar `.env`
   - Usar secrets em produção

2. **API Keys**
   - Configurar no backend
   - Validar no frontend

3. **Autenticação**
   - Usar HTTPS em produção
   - Implementar rate limiting

---

## 📱 Testes

### Unit Tests
```bash
# Jest (configurar)
pnpm test

# Testes de componente
pnpm test:components
```

### E2E Tests
```bash
# Detox (iOS/Android)
pnpm test:e2e

# Web tests
pnpm test:web
```

---

## 🚨 Suporte

### Recursos

- **Documentação Expo**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **GitHub Issues**: https://github.com/osvaldofmqueta-stack/app-congresso-final/issues

### Contato

- **Email**: contato@csa.urnm.edu.ao
- **Discord**: [Link do servidor]
- **WhatsApp**: [+244 XXX XXX XXX]

---

## 🔄 Atualizações

### Manter Atualizado

```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
pnpm update

# Atualizar Expo SDK
npx expo install --fix
```

### Changelog

Consulte `CHANGELOG.md` para detalhes das versões.

---

**Pronto! 🎉 Seu sistema CSA está configurado e pronto para uso.**
