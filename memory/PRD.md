# Beattribe - Product Requirements Document

## Vision
**"Unite Through Rhythm"** - Application d'écoute musicale synchronisée en temps réel.

## Stack Technique
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build**: Create React App (CRA) avec CRACO
- **UI Components**: Shadcn/UI + Radix UI
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Real-time**: Supabase Realtime Channels (mode démo si non configuré)
- **Storage**: Supabase Storage (bucket: audio-tracks)
- **Routing**: react-router-dom v6
- **Fonts**: Space Grotesk (headings) + Inter (body) via Google Fonts CDN

## État du Déploiement

### ✅ Prêt pour Emergent/Vercel
- Build de production réussi sans erreurs ni warnings
- Mode Démo fonctionnel sans clés API
- Configuration Emergent créée (`emergent-config.json`)
- Variables d'environnement documentées

### Comportement selon configuration

| Fonctionnalité | Avec Supabase | Sans Supabase (Démo) |
|----------------|---------------|----------------------|
| Création session | ✅ | ✅ |
| Upload MP3 | Cloud Storage | Blob local |
| Sync multi-device | ✅ Realtime | ❌ Local uniquement |
| Persistance playlist | ✅ Database | ❌ Session only |
| UI/UX | Identique | Identique |

## Fonctionnalités Implémentées

### ✅ Phase 1 - Core
- [x] Design System Beattribe (couleurs, fonts, CSS variables)
- [x] Page d'accueil avec Hero Section
- [x] Dashboard Admin protégé (/admin) - MDP: `BEATTRIBE2026`
- [x] Lecteur audio avec distinction Host/Participant
- [x] Routes dynamiques (/session/:sessionId)

### ✅ Phase 2 - Playlist & Modération
- [x] Playlist Drag & Drop (10 titres max)
- [x] Panel de Modération Participants
- [x] Contrôle Micro Hôte

### ✅ Phase 3 - Real-Time & Supabase
- [x] SocketProvider avec Supabase Realtime
- [x] Modération temps réel (mute/unmute/eject/volume)
- [x] Sync Playlist multi-device
- [x] Upload MP3 vers Supabase Storage

### ✅ Phase 4 - Déploiement (27 Jan 2026)
- [x] Mode Démo avec UI dédiée (badge "⚡ Démo", indicateur visuel)
- [x] Fallback gracieux sans clés API
- [x] TrackUploader avec mode simulation
- [x] emergent-config.json pour déploiement
- [x] Suppression logs sensibles en production
- [x] Build optimisé (178KB JS, 7.8KB CSS gzip)

## Architecture Fichiers

```
/app/
├── emergent-config.json          # Config déploiement Emergent
├── frontend/
│   ├── .env.example              # Documentation variables
│   ├── src/
│   │   ├── components/audio/
│   │   │   ├── TrackUploader.tsx # Upload avec mode démo
│   │   │   ├── PlaylistDnD.tsx   # Playlist drag & drop
│   │   │   └── AudioPlayer.tsx   # Lecteur principal
│   │   ├── context/
│   │   │   ├── SocketContext.tsx # Realtime avec fallback
│   │   │   └── ThemeContext.tsx  # Thème dynamique
│   │   ├── lib/
│   │   │   └── supabaseClient.ts # Client + fonctions
│   │   ├── pages/
│   │   │   └── SessionPage.tsx   # Page session
│   │   └── styles/
│   │       └── globals.css       # Design system
│   └── build/                    # Production build
└── memory/
    └── PRD.md                    # Ce fichier
```

## Variables d'Environnement

### Requises pour production
```env
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbG...
```

### Optionnelles
```env
REACT_APP_SUPABASE_BUCKET=audio-tracks  # Défaut: audio-tracks
```

## Checklist Déploiement

- [x] Build production sans erreurs
- [x] Logs sensibles supprimés
- [x] .env.example documenté
- [x] emergent-config.json créé
- [x] Mode démo fonctionnel
- [x] Fonts CDN (Google Fonts)
- [x] Imports validés

## Tâches Futures

### P1 - Post-Déploiement
- [ ] Tests E2E avec Supabase réel
- [ ] Monitoring erreurs (Sentry)

### P2 - Améliorations
- [ ] Convertir .jsx → .tsx restants
- [ ] Refactoring SessionPage.tsx
- [ ] Authentification réelle

### P3 - Features
- [ ] Chat texte temps réel
- [ ] Historique sessions
- [ ] Equalizer avancé

## Credentials Test
- **Admin**: `/admin` → MDP: `BEATTRIBE2026`
- **Supabase**: Variables dans Emergent Dashboard

---
*Dernière mise à jour: 27 Jan 2026 - Prêt pour déploiement Emergent*
