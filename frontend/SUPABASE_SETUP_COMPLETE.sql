-- =====================================================
-- SCRIPT DE CRÉATION DES TABLES BEATTRIBE
-- Exécutez dans Supabase SQL Editor (dans l'ordre)
-- =====================================================

-- =====================================================
-- ÉTAPE 1: LISTER LES TABLES EXISTANTES
-- =====================================================
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY table_schema, table_name;

-- =====================================================
-- ÉTAPE 2: CRÉER LA TABLE site_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id BIGSERIAL PRIMARY KEY,
  site_name TEXT DEFAULT 'Beattribe',
  site_slogan TEXT DEFAULT 'Unite Through Rhythm',
  site_description TEXT DEFAULT 'Rejoignez la communauté des beatmakers et producteurs.',
  site_badge TEXT DEFAULT 'La communauté des créateurs',
  favicon_url TEXT DEFAULT '',
  color_primary TEXT DEFAULT '#8A2EFF',
  color_secondary TEXT DEFAULT '#FF2FB3',
  color_background TEXT DEFAULT '#000000',
  btn_login TEXT DEFAULT 'Connexion',
  btn_start TEXT DEFAULT 'Commencer',
  btn_join TEXT DEFAULT 'Rejoindre la tribu',
  btn_explore TEXT DEFAULT 'Explorer les beats',
  stat_creators TEXT DEFAULT '50K+',
  stat_beats TEXT DEFAULT '1M+',
  stat_countries TEXT DEFAULT '120+',
  -- Colonnes Stripe
  stripe_pro_monthly TEXT DEFAULT '',
  stripe_pro_yearly TEXT DEFAULT '',
  stripe_enterprise_monthly TEXT DEFAULT '',
  stripe_enterprise_yearly TEXT DEFAULT '',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer une ligne par défaut si la table est vide
INSERT INTO site_settings (site_name) 
SELECT 'Beattribe' 
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

-- =====================================================
-- ÉTAPE 3: CRÉER LA TABLE playlists
-- =====================================================
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  tracks JSONB DEFAULT '[]'::jsonb,
  selected_track_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 4: CRÉER LA TABLE profiles (si pas existante)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'free',
  terms_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 5: ACTIVER RLS (Row Level Security)
-- =====================================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 6: CRÉER LES POLITIQUES D'ACCÈS
-- =====================================================

-- site_settings: lecture publique, écriture admin
DROP POLICY IF EXISTS "Allow public read" ON site_settings;
CREATE POLICY "Allow public read" ON site_settings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all update" ON site_settings;
CREATE POLICY "Allow all update" ON site_settings 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow all insert" ON site_settings;
CREATE POLICY "Allow all insert" ON site_settings 
  FOR INSERT WITH CHECK (true);

-- playlists: accès complet
DROP POLICY IF EXISTS "Allow all access" ON playlists;
CREATE POLICY "Allow all access" ON playlists 
  FOR ALL USING (true) WITH CHECK (true);

-- profiles: utilisateurs voient leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- ÉTAPE 7: NETTOYER LES DONNÉES DE TEST
-- =====================================================
UPDATE playlists 
SET tracks = '[]'::jsonb 
WHERE tracks::text LIKE '%Midnight%' 
   OR tracks::text LIKE '%Urban%' 
   OR tracks::text LIKE '%Summer%';

-- =====================================================
-- ÉTAPE 8: VÉRIFICATION FINALE
-- =====================================================
-- Vérifier que les tables existent
SELECT 'Tables créées:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('site_settings', 'playlists', 'profiles');

-- Vérifier les colonnes de site_settings
SELECT 'Colonnes site_settings:' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
ORDER BY ordinal_position;
