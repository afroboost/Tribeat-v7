-- =====================================================
-- 🚀 BEATTRIBE - INITIALISATION COMPLÈTE BASE DE DONNÉES
-- =====================================================
-- Exécutez ce script EN ENTIER dans Supabase SQL Editor
-- Cliquez sur "Run" pour exécuter toutes les commandes
-- =====================================================

-- =====================================================
-- PARTIE 1 : CRÉATION DES TABLES
-- =====================================================

-- Table: site_settings (Configuration du site + Stripe)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identité du site
  site_name TEXT NOT NULL DEFAULT 'Beattribe',
  site_slogan TEXT DEFAULT 'Unite Through Rhythm',
  site_description TEXT DEFAULT 'Rejoignez la communauté des beatmakers et producteurs.',
  site_badge TEXT DEFAULT 'La communauté des créateurs',
  favicon_url TEXT DEFAULT '',
  
  -- Couleurs
  color_primary TEXT DEFAULT '#8A2EFF',
  color_secondary TEXT DEFAULT '#FF2FB3',
  color_background TEXT DEFAULT '#000000',
  
  -- Boutons (labels)
  btn_login TEXT DEFAULT 'Connexion',
  btn_start TEXT DEFAULT 'Commencer',
  btn_join TEXT DEFAULT 'Rejoindre la tribu',
  btn_explore TEXT DEFAULT 'Explorer les beats',
  
  -- Statistiques affichées
  stat_creators TEXT DEFAULT '50K+',
  stat_beats TEXT DEFAULT '1M+',
  stat_countries TEXT DEFAULT '120+',
  
  -- 🔥 STRIPE - Liens de paiement
  stripe_pro_monthly TEXT DEFAULT '',
  stripe_pro_yearly TEXT DEFAULT '',
  stripe_enterprise_monthly TEXT DEFAULT '',
  stripe_enterprise_yearly TEXT DEFAULT '',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: playlists (Sessions musicales)
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  tracks JSONB DEFAULT '[]'::jsonb,
  selected_track_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: profiles (Profils utilisateurs)
CREATE TABLE IF NOT EXISTS public.profiles (
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
-- PARTIE 2 : DONNÉES INITIALES
-- =====================================================

-- Insérer les paramètres par défaut (une seule ligne)
INSERT INTO public.site_settings (
  site_name, 
  site_slogan, 
  site_description,
  color_primary,
  color_secondary
) 
SELECT 
  'Beattribe', 
  'Unite Through Rhythm', 
  'Rejoignez la communauté des beatmakers et producteurs.',
  '#8A2EFF',
  '#FF2FB3'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- =====================================================
-- PARTIE 3 : SÉCURITÉ RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTIE 4 : POLITIQUES D'ACCÈS
-- =====================================================

-- site_settings: Lecture publique, écriture pour tous (CMS)
DROP POLICY IF EXISTS "site_settings_select" ON public.site_settings;
CREATE POLICY "site_settings_select" ON public.site_settings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_insert" ON public.site_settings;
CREATE POLICY "site_settings_insert" ON public.site_settings 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "site_settings_update" ON public.site_settings;
CREATE POLICY "site_settings_update" ON public.site_settings 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "site_settings_delete" ON public.site_settings;
CREATE POLICY "site_settings_delete" ON public.site_settings 
  FOR DELETE USING (true);

-- playlists: Accès complet pour tous (sessions publiques)
DROP POLICY IF EXISTS "playlists_all" ON public.playlists;
CREATE POLICY "playlists_all" ON public.playlists 
  FOR ALL USING (true) WITH CHECK (true);

-- profiles: Utilisateurs gèrent leur propre profil
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles 
  FOR SELECT USING (auth.uid() = id OR true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- PARTIE 5 : TRIGGERS (Mise à jour automatique)
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur site_settings
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger sur playlists
DROP TRIGGER IF EXISTS update_playlists_updated_at ON public.playlists;
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger sur profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PARTIE 6 : VÉRIFICATION
-- =====================================================

-- Afficher les tables créées
SELECT 
  '✅ Tables créées:' as status,
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('site_settings', 'playlists', 'profiles')
ORDER BY table_name;

-- Afficher les colonnes de site_settings
SELECT 
  '📋 Colonnes site_settings:' as info,
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
ORDER BY ordinal_position;

-- Vérifier que les données initiales existent
SELECT 
  '🎵 Site settings:' as info,
  id,
  site_name,
  stripe_pro_monthly,
  stripe_pro_yearly
FROM public.site_settings 
LIMIT 1;
