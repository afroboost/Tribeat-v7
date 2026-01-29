-- =====================================================
-- 🚀 BEATTRIBE - SCRIPT SQL COMPLET (CREATE + ALTER)
-- =====================================================
-- Copiez et collez ce script ENTIER dans Supabase SQL Editor
-- Il gère automatiquement les tables existantes ou nouvelles
-- =====================================================

-- =====================================================
-- ÉTAPE 1 : CRÉATION DES TABLES (IF NOT EXISTS)
-- =====================================================

-- Table: site_settings (Configuration du site + Stripe)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BIGSERIAL PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'Beattribe',
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
-- ÉTAPE 2 : AJOUT DES COLONNES STRIPE (ALTER TABLE)
-- Si les colonnes existent déjà, les erreurs sont ignorées
-- =====================================================

DO $$
BEGIN
    -- stripe_pro_monthly
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'stripe_pro_monthly') THEN
        ALTER TABLE public.site_settings ADD COLUMN stripe_pro_monthly TEXT DEFAULT '';
        RAISE NOTICE '✅ Colonne stripe_pro_monthly ajoutée';
    ELSE
        RAISE NOTICE '⏭️ Colonne stripe_pro_monthly existe déjà';
    END IF;

    -- stripe_pro_yearly
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'stripe_pro_yearly') THEN
        ALTER TABLE public.site_settings ADD COLUMN stripe_pro_yearly TEXT DEFAULT '';
        RAISE NOTICE '✅ Colonne stripe_pro_yearly ajoutée';
    ELSE
        RAISE NOTICE '⏭️ Colonne stripe_pro_yearly existe déjà';
    END IF;

    -- stripe_enterprise_monthly
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'stripe_enterprise_monthly') THEN
        ALTER TABLE public.site_settings ADD COLUMN stripe_enterprise_monthly TEXT DEFAULT '';
        RAISE NOTICE '✅ Colonne stripe_enterprise_monthly ajoutée';
    ELSE
        RAISE NOTICE '⏭️ Colonne stripe_enterprise_monthly existe déjà';
    END IF;

    -- stripe_enterprise_yearly
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'stripe_enterprise_yearly') THEN
        ALTER TABLE public.site_settings ADD COLUMN stripe_enterprise_yearly TEXT DEFAULT '';
        RAISE NOTICE '✅ Colonne stripe_enterprise_yearly ajoutée';
    ELSE
        RAISE NOTICE '⏭️ Colonne stripe_enterprise_yearly existe déjà';
    END IF;
END $$;

-- =====================================================
-- ÉTAPE 3 : INSERTION DES DONNÉES PAR DÉFAUT
-- =====================================================

INSERT INTO public.site_settings (
  site_name, 
  site_slogan, 
  site_description,
  color_primary,
  color_secondary,
  stripe_pro_monthly,
  stripe_pro_yearly,
  stripe_enterprise_monthly,
  stripe_enterprise_yearly
) 
SELECT 
  'Beattribe', 
  'Unite Through Rhythm', 
  'Rejoignez la communauté des beatmakers et producteurs.',
  '#8A2EFF',
  '#FF2FB3',
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- =====================================================
-- ÉTAPE 4 : NETTOYAGE PLAYLISTS (Suppression données test)
-- =====================================================

-- Supprimer toutes les playlists qui contiennent "Midnight Groove" ou "Urban Pulse"
DELETE FROM public.playlists 
WHERE tracks::text LIKE '%Midnight Groove%' 
   OR tracks::text LIKE '%Urban Pulse%'
   OR tracks::text LIKE '%Summer Vibes%';

-- =====================================================
-- ÉTAPE 5 : SÉCURITÉ RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 6 : POLITIQUES D'ACCÈS
-- =====================================================

-- site_settings: Accès complet pour tous (CMS)
DROP POLICY IF EXISTS "site_settings_select" ON public.site_settings;
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_insert" ON public.site_settings;
CREATE POLICY "site_settings_insert" ON public.site_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "site_settings_update" ON public.site_settings;
CREATE POLICY "site_settings_update" ON public.site_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "site_settings_delete" ON public.site_settings;
CREATE POLICY "site_settings_delete" ON public.site_settings FOR DELETE USING (true);

-- playlists: Accès complet pour tous (sessions publiques)
DROP POLICY IF EXISTS "playlists_all" ON public.playlists;
CREATE POLICY "playlists_all" ON public.playlists FOR ALL USING (true) WITH CHECK (true);

-- profiles: Utilisateurs gèrent leur propre profil
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- ÉTAPE 7 : TRIGGERS (Mise à jour automatique)
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlists_updated_at ON public.playlists;
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÉTAPE 8 : VÉRIFICATION FINALE
-- =====================================================

SELECT '✅ TABLES CRÉÉES:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('site_settings', 'playlists', 'profiles')
ORDER BY table_name;

SELECT '✅ COLONNES STRIPE:' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND column_name LIKE 'stripe%'
ORDER BY column_name;

SELECT '✅ DONNÉES site_settings:' as status;
SELECT id, site_name, stripe_pro_monthly, stripe_pro_yearly 
FROM public.site_settings 
LIMIT 1;

SELECT '🎉 SETUP TERMINÉ AVEC SUCCÈS!' as message;
