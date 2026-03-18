# CSA — Sistema de Gestão de Eventos

## Overview

Expo React Native mobile application for the **Congresso de Alimento 2026** event management system by URNM (Universidade Rainha Njinga a Mbande).

## Features

- **Login Screen**: Email + password, biometric authentication (Face ID / Touch ID), URNM & CSA logos, event branding
- **Registration Flow**: 5-step wizard with progress bar (Dados Pessoais → Perfil Académico → Participação → Acesso → Confirmação)
  - Spectator types: Docente/Investigador, Estudante, Outro, Prelector
  - URNM/Externo pricing table (Kwanza)
  - 3 Eixos Temáticos
  - Post-registration "aguardar aprovação" modal
- **Admin Panel** (CEO & Supervisor): Bottom nav tabs — Dashboard, Participantes, **Programa**, Presença, Senhas. Includes full congress program management.
- **QR Code Credential**: Generated per approved participant — used for attendance scanning at event entrance
- **QR Attendance Scanner**: CEO/Supervisor scan participant QR codes with device camera → participant turns green (present) in the attendance list. Attendance counter shows Presentes / Ausentes / Total
- **Forgot Password**: Email request → CEO approves and sets new password
- **Congress Program**: Full real-time program management:
  - Admin can configure multiple days with dates and titles, add/edit/delete program items (tema, horaInicio, horaFim)
  - CEO/Supervisor can mark any item as "Em curso" (active), "Concluído" (done), or reset to "Pendente"
  - All participants see live updates (polled every 5s) — active item highlighted in green, completed items struck through
  - Today's day is highlighted with green header and "HOJE" badge
- **Home Screen (Participants)**: 4 tabs:
  - Credencial: QR code credential after approval (show at entrance)
  - Programa: Live congress schedule — see current/upcoming/completed items in real time
  - Apresentação: Submit presentation (tema, palavras-chave, resumo, PDF/DOC min. 5MB)
  - Notif.: Receive messages from Conselho Científico
- **Conselho Científico Panel**: Approve/reject participant presentations, send messages to participants
- **Registration Draft Persistence**: Form data saved automatically, restored if user exits mid-registration

## Stack

- **Framework**: Expo SDK 54, Expo Router v6, React Native 0.81
- **State**: AsyncStorage + React Context (polled every 8s for real-time-like updates)
- **Auth**: expo-local-authentication (biometrics), custom context
- **QR Code**: react-native-qrcode-svg (display), expo-camera (scan for attendance)
- **File Picker**: expo-document-picker (PDF/DOC, min 5MB)
- **Crypto**: expo-crypto (UUID generation)
- **UI**: Inter font, custom design system

## Admin Credentials

- CEO: `ceo@csa.com` / `ceo2026`
- Supervisor: `supervisor@csa.com` / `super2026`
- Conselho Científico: `conselho@csa.com` / `conselho2026`

## Structure

```
artifacts/csa-app/
├── app/
│   ├── index.tsx          # Login screen
│   ├── register.tsx       # 5-step registration wizard
│   ├── forgot-password.tsx
│   ├── home.tsx           # Participant home (Credencial | Apresentação | Notificações)
│   ├── admin/
│   │   ├── index.tsx      # Admin dashboard (Pendentes | Todos | Senhas | Notificações)
│   │   └── participant.tsx # Participant detail + QR
│   ├── conselho/
│   │   └── index.tsx      # Conselho Científico panel (approve submissions, send messages)
│   └── _layout.tsx
├── contexts/
│   ├── AuthContext.tsx    # Auth state (ceo, supervisor, conselho, participant roles)
│   ├── EventContext.tsx   # Participants, submissions, notifications, approvals
│   └── ProgramContext.tsx # Congress program days & items (real-time via 5s poll)
├── constants/colors.ts    # CSA green + navy theme
└── assets/images/
    ├── csa-logo.png
    └── urnm-logo.png
```

## Pricing Table (Kwanza)

| Categoria         | URNM   | Externo |
|-------------------|--------|---------|
| Docente/Invest.   | 5.000  | 7.000   |
| Estudantes        | 3.000  | 4.000   |
| Outros            | 5.000  | 10.000  |
| Prelectores       | 20.000 | 20.000  |

## Data Flow

- All data stored in AsyncStorage (no backend required for core functionality)
- Context polls AsyncStorage every 8 seconds for near-real-time updates
- Registration → admin notified → approve/reject → participant can login
- Participant submits presentation → Conselho evaluates → sends notification/message to participant
