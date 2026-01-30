# Boosttribe - PRD (Product Requirements Document)

## Vue d'ensemble
Application web de sessions d'écoute musicale synchronisée. Permet à un hôte de créer une session, d'uploader de la musique, et d'inviter des participants pour une écoute en temps réel.

## Stack Technique
- **Frontend**: React 18 + TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **WebRTC**: PeerJS pour la voix en temps réel
- **UI Components**: Shadcn/UI + Tailwind CSS

## Fonctionnalités Implémentées

### 1. Système d'Authentification
- Connexion via Google (Supabase Auth)
- Système admin (email: contact.artboost@gmail.com)
- Protection des routes admin

### 2. Sessions d'Écoute
- Création de sessions avec code unique
- Upload de fichiers audio (MP3, WAV, AAC)
- Lecture synchronisée pour tous les participants
- Playlist drag-and-drop

### 3. CMS Admin (/admin)
- Gestion de l'identité du site (nom, slogan, description)
- Palette de couleurs personnalisable
- Configuration des liens Stripe
- Gestion de la visibilité et prix des plans (Pro/Enterprise)

### 4. Internationalisation (i18n)
- Sélecteur de langue (🇫🇷 🇬🇧 🇩🇪)
- Traductions pour FR, EN, DE
- Visible sur toutes les pages

### 5. ChatBot IA
- Assistant flottant
- Réservé aux membres PRO/Enterprise
- Message de verrouillage pour utilisateurs gratuits

## Changements - Session du 30/01/2025

### Synchronisation Temps Réel Supabase
- ✅ Ajouté souscription `postgres_changes` sur table `playlists` dans SessionPage.tsx
- ✅ Les participants voient les musiques de l'hôte instantanément (sans F5)
- ✅ Console.log "📡 [SUPABASE REALTIME] Playlist update:" pour debug

### Verrouillage Domaine
- ✅ Auth redirects utilisent `window.location.origin` (compatible boosttribe.pro)
- ✅ Pas de domaine hardcodé dans le code

### Nettoyage Interface
- ✅ Supprimé témoins visuels (●) de PricingPage.tsx
- ✅ Supprimé propriété `isFromSupabase` de l'interface Plan
- ✅ LanguageSelector avec z-index=50 pour visibilité garantie

### Dynamisation Composants
- ✅ PricingPage.tsx : Prix récupérés depuis `site_settings`
- ✅ HeroSection.tsx : Nom du site vient de `theme.name`
- ✅ Système de rafraîchissement global après save CMS

## Base de Données (Supabase)

### Table: site_settings
```sql
id: integer (PK, default: 1)
site_name: text
site_slogan: text
site_description: text
site_badge: text
favicon_url: text
color_primary: text
color_secondary: text
color_background: text
btn_login, btn_start, btn_join, btn_explore: text
stat_creators, stat_beats, stat_countries: text
stripe_pro_monthly, stripe_pro_yearly: text
stripe_enterprise_monthly, stripe_enterprise_yearly: text
plan_pro_visible, plan_enterprise_visible: boolean
plan_pro_price_monthly, plan_pro_price_yearly: text
plan_enterprise_price_monthly, plan_enterprise_price_yearly: text
default_language: text
updated_at: timestamp
```

### Table: profiles
```sql
id: uuid (FK → auth.users)
full_name: text
avatar_url: text
subscription_status: text ('free', 'pro', 'enterprise')
is_admin: boolean
```

### Bucket: audio-tracks
- Stockage des fichiers audio uploadés
- Accès public pour la lecture

## Tâches Restantes (Backlog)

### P1 - Priorité Haute
- [ ] Vérification utilisateur du fix CMS
- [ ] Mise à jour des données Supabase pour refléter "Boosttribe"

### P2 - Fonctionnalités
- [ ] Convertir composants UI restants en TypeScript
- [ ] Implémenter "Request to Speak" pour participants
- [ ] Gestion des pseudos par l'hôte
- [ ] Persister le thème via Supabase

### P3 - Refactoring
- [ ] Découper SessionPage.tsx en composants plus petits
- [ ] Nettoyer les imports non utilisés

## Credentials Test
- Admin: contact.artboost@gmail.com (Google Auth)
- Supabase: Configuré via .env

## Notes Importantes
- ⚠️ Ne pas toucher la logique d'upload audio (bucket 'audio-tracks')
- ⚠️ Ne pas toucher le système d'authentification
- ⚠️ Le nom "Boosttribe" dans l'UI dépend des données Supabase
