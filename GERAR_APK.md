# ============================================================================
# GUIA COMPLETO: GERAR APK DO CSA APP COM SUPABASE
# ============================================================================

## 🎯 PRÉ-REQUISITOS ANTES DE GERAR APK

### ✅ 1. Banco de Dados Configurado
- [x] Schema criado no Supabase
- [x] Dados de teste inseridos
- [x] Conexão testada e funcionando

### ✅ 2. Variáveis de Ambiente
Certifique-se que `artifacts/csa-app/.env` tem:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xrpquuklhungyvctmpch.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHF1dWtsaHVuZ3l2Y3RtcGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzU1NjIsImV4cCI6MjA4OTQxMTU2Mn0.pFfGjx-732pEoPA-RLjrpy1P18OS9O8ygDmFY2Bl1Jw
EXPO_PUBLIC_API_URL=https://xrpquuklhungyvctmpch.supabase.co
EXPO_PUBLIC_DOMAIN=xrpquuklhungyvctmpch.supabase.co
```

### ✅ 3. Dependências Instaladas
**IMPORTANTE:** Precisa resolver o erro do pnpm primeiro!

## 🔧 OPÇÃO 1: BUILD COM EAS (EXPO APPLICATION SERVICES) - RECOMENDADO

### Passo 1: Instalar EAS CLI
```bash
cd c:\Projetos\app-congresso-final\artifacts\csa-app
npm install -g eas-cli
```

### Passo 2: Login no Expo
```bash
eas login
# Digite seu usuário/senha do expo.dev
```

### Passo 3: Configurar eas.json
Crie o arquivo `artifacts/csa-app/eas.json`:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Passo 4: Gerar APK
```bash
# APK para testes (mais rápido)
eas build --platform android --profile preview

# APK de produção
eas build --platform android --profile production
```

### Passo 5: Download do APK
- O EAS vai fazer upload e build na nuvem
- Você receberá um link para download
- Ou use: `eas build:list` para ver builds

## 🔧 OPÇÃO 2: BUILD LOCAL COM EXPO PREBUILD

### Passo 1: Configurar Android Studio
1. Instale Android Studio
2. Configure ANDROID_HOME environment variable
3. Instale SDK Android 33+

### Passo 2: Prebuild
```bash
cd c:\Projetos\app-congresso-final\artifacts\csa-app

# Instalar dependências primeiro (resolver problema do pnpm)
npm install

# Gerar arquivos Android
npx expo prebuild --platform android
```

### Passo 3: Build Local
```bash
cd android
./gradlew assembleRelease
```

### Passo 4: APK Location
```
c:\Projetos\app-congresso-final\artifacts\csa-app\android\app\build\outputs\apk\release\app-release.apk
```

## 🔧 OPÇÃO 3: EXPO GO (TESTES RÁPIDOS SEM BUILD)

Para testar rapidamente sem gerar APK:
```bash
cd c:\Projetos\app-congresso-final\artifacts\csa-app
npx expo start

# Leia o QR code com Expo Go app no celular
```

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: Erro do pnpm no install
**Solução:** Use npm diretamente
```bash
# No arquivo package.json, mude a versão do supabase para compatível
npm install @supabase/supabase-js@^2.49.4 --save
```

### Problema 2: Variáveis de ambiente não carregam
**Solução:** Verifique se está usando EXPO_PUBLIC_ prefix
```env
# Correto ✅
EXPO_PUBLIC_SUPABASE_URL=https://...

# Errado ❌
SUPABASE_URL=https://...
```

### Problema 3: Conexão com Supabase falha no APK
**Solução:** Verifique permissões de internet no app.json
```json
{
  "expo": {
    "android": {
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    }
  }
}
```

## 📋 CHECKLIST FINAL ANTES DO BUILD

- [ ] Todas as dependências instaladas
- [ ] Variáveis de ambiente configuradas (EXPO_PUBLIC_*)
- [ ] Teste de conexão com Supabase funcionando
- [ ] Dados no banco (participantes, programa, etc.)
- [ ] Ícone do app configurado (assets/images/icon.png)
- [ ] Splash screen configurado
- [ ] Nome do app definido
- [ ] Versão do app definida

## 🚀 COMANDOS RÁPIDOS

```bash
# 1. Ir para pasta do app
cd c:\Projetos\app-congresso-final\artifacts\csa-app

# 2. Instalar dependências
npm install

# 3. Configurar EAS
eas login

# 4. Gerar APK (opção mais fácil)
eas build --platform android --profile preview

# 5. Aguardar email com link de download
```

## 📱 TESTAR APK

1. Instale o APK no celular Android
2. Abra o app
3. Teste login com:
   - Email: `maria@urnm.edu.ao`
   - Senha: `123456`
4. Verifique se carrega dados do Supabase

## 🆘 SUPORTE

Se der erro no build:
1. Verifique logs no EAS Dashboard
2. Confirme que todas as variáveis EXPO_PUBLIC_* estão no .env
3. Teste localmente primeiro com `npx expo start`

Boa sorte! 🎉
