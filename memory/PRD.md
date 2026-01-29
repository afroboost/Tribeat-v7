# Beattribe - Product Requirements Document

## Vision
**"Unite Through Rhythm"** - Application d'écoute musicale synchronisée en temps réel.

## État Actuel - AUTHENTIFICATION COMPLÈTE ✅

### ✅ Implémentation Auth (28 Jan 2026)

#### Architecture Auth Supabase
```
┌─────────────────────────────────────────────────┐
│              AUTHENTIFICATION                   │
│  • Email/Password                              │
│  • Google OAuth                                │
│  • Password Reset                              │
│  • CGU obligatoires à l'inscription           │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────┐
│              RÔLES & ABONNEMENTS               │
│  • Admin : role='admin' dans table profiles    │
│  • User : trial, monthly, yearly, enterprise   │
│  • Accès illimité pour Admin (via DB)         │
└─────────────────────────────────────────────────┘
```

### Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `/context/AuthContext.tsx` | Gestion auth Supabase, profils, rôles |
| `/pages/LoginPage.tsx` | Page connexion/inscription/reset |
| `/components/auth/RequireAuth.tsx` | Guard de route authentifié |

### Fonctionnalités Auth

#### 1. Page Login (/login)
- Email + Mot de passe
- Bouton "Se connecter avec Google"
- Lien "Mot de passe oublié ?"
- Toggle Login/Signup
- Redirection vers page précédente après login

#### 2. Page Signup
- Nom complet
- Email + Mot de passe (min 6 caractères)
- **Checkbox CGU obligatoire** ✅
- Confirmation email envoyée

#### 3. Sécurisation Admin
```sql
-- L'admin n'est plus défini par mot de passe hardcodé
-- Il est défini par son email dans la table profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'admin' pour les admins
  subscription_status TEXT DEFAULT 'trial',
  has_accepted_terms BOOLEAN DEFAULT FALSE
);

-- Pour créer un admin :
UPDATE profiles SET role = 'admin' WHERE email = 'votre@email.com';
```

#### 4. Navigation Protégée
```typescript
// Route protégée - redirige vers /login si non connecté
<RequireAuth>
  <SessionPage />
</RequireAuth>

// Admin bypass toutes les restrictions
if (isAdmin) return true;
```

### UI Updates

#### Header
- **Non connecté** : Boutons "Connexion" + "Commencer"
- **Connecté** : Avatar + Nom + Badge Admin + Bouton déconnexion
- **"Communauté" supprimée** du menu ✅

#### Page Pricing
- **Toggle Mensuel/Annuel** avec badge "-17%"
- **3 plans** : Essai Gratuit, Pro, Enterprise
- Prix dynamiques selon période sélectionnée

### Routes

| Route | Protection | Description |
|-------|------------|-------------|
| `/` | Public | Page d'accueil |
| `/login` | Public | Connexion/Inscription |
| `/pricing` | Public | Tarifs |
| `/session` | Auth Required | Créer une session |
| `/session/:id` | Public | Rejoindre une session |
| `/admin` | Password Protected | Dashboard admin |

### Checklist ✅
- [x] Login Email/Password
- [x] Google OAuth
- [x] Password Reset
- [x] CGU à l'inscription
- [x] Admin via DB (pas hardcodé)
- [x] Redirection après login vers page précédente
- [x] Toggle Mensuel/Annuel
- [x] "Communauté" supprimé
- [x] Build `yarn build` réussi
- [x] WebRTC/Microphone NON MODIFIÉ ✅

### Configuration Supabase Requise

```sql
-- 1. Créer la table profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'trial',
  has_accepted_terms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activer Google Auth dans Supabase Dashboard
-- Settings > Authentication > Providers > Google

-- 3. Créer un admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@votredomaine.com';
```

## Credentials
- **Admin Legacy**: `/admin` → MDP: `BEATTRIBE2026` (pour le dashboard admin)
- **Admin Real**: Utilisateur avec `role='admin'` dans la table `profiles`

## URLs
- **Accueil**: `/`
- **Login**: `/login`
- **Tarifs**: `/pricing`
- **Session**: `/session`
- **Admin**: `/admin`

## Mises à jour récentes (29 Jan 2026)

### ✅ Purge Branding & Données de Test
1. **Badge "Made with Emergent" supprimé** - Retiré de `index.html`
2. **Morceaux de test supprimés** - "Midnight Groove", "Urban Pulse", "Summer Vibes" retirés
3. **Participants mock supprimés** - Sarah K., Alex M., Emma L. retirés
4. **Playlist vide par défaut** - Les sessions démarrent sans pistes

### ✅ Fix "Rejoindre la tribu"
- Tunnel d'accès réparé : saisir un code → redirection vers `/session/[CODE]`
- Fonctionne correctement pour les participants

### ✅ Gestion Playlist Vide
- Message "Playlist vide" affiché quand aucune piste
- Instruction "Uploadez votre premier morceau pour démarrer la session"
- Auto-sélection de la première piste uploadée

---

## Tâches Restantes

### P0 - En attente de configuration utilisateur
- [ ] Configuration domaine `www.boosttribe.pro`
- [ ] Mise à jour des redirect URLs OAuth dans Supabase

### P1 - Bugs à vérifier
- [ ] Upload MP3 (erreur "body stream already read" - fix en attente de validation)
- [ ] Créer table `profiles` dans Supabase
- [ ] Activer Google Auth Provider

### P2 - Stripe
- [ ] Créer Payment Links dans Stripe Dashboard
- [ ] Webhook pour mettre à jour `subscription_status`

### P3 - Backlog
- [ ] Dashboard utilisateur (historique, factures)
- [ ] Analytics abonnements
- [ ] Refactoriser SessionPage.tsx
- [ ] Convertir composants UI en TypeScript

---
*Dernière mise à jour: 29 Jan 2026 - Purge branding et données de test*
