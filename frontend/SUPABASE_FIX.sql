-- =====================================================
-- CORRECTIONS SUPABASE POUR BEATTRIBE
-- Exécutez ces requêtes dans Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. VOIR TOUTES LES TABLES EXISTANTES
-- =====================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- 2. AJOUTER LES COLONNES STRIPE À site_settings
-- (Ces colonnes sont nécessaires pour le CMS)
-- =====================================================
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS stripe_pro_monthly TEXT DEFAULT '';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS stripe_pro_yearly TEXT DEFAULT '';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS stripe_enterprise_monthly TEXT DEFAULT '';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS stripe_enterprise_yearly TEXT DEFAULT '';

-- =====================================================
-- 3. VÉRIFIER LA STRUCTURE DE site_settings
-- =====================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
ORDER BY ordinal_position;

-- =====================================================
-- 4. NETTOYER LES PLAYLISTS (table correcte)
-- =====================================================
-- D'abord, voir les sessions avec des pistes de test
SELECT session_id, tracks 
FROM playlists 
WHERE tracks::text LIKE '%Midnight%' 
   OR tracks::text LIKE '%Urban%' 
   OR tracks::text LIKE '%Summer%';

-- Supprimer les pistes de test (vider le tableau tracks)
UPDATE playlists 
SET tracks = '[]'::jsonb 
WHERE tracks::text LIKE '%Midnight%' 
   OR tracks::text LIKE '%Urban%' 
   OR tracks::text LIKE '%Summer%';

-- OU supprimer complètement ces sessions
-- DELETE FROM playlists WHERE tracks::text LIKE '%Midnight%';

-- =====================================================
-- 5. VÉRIFIER QUE LA TABLE playlists EXISTE
-- =====================================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'playlists'
);

-- =====================================================
-- 6. SI LA TABLE playlists N'EXISTE PAS, LA CRÉER
-- =====================================================
-- CREATE TABLE IF NOT EXISTS playlists (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   session_id TEXT UNIQUE NOT NULL,
--   tracks JSONB DEFAULT '[]'::jsonb,
--   selected_track_id TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Activer RLS si nécessaire
-- ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre tout accès (ajuster selon vos besoins)
-- CREATE POLICY "Allow all access" ON playlists FOR ALL USING (true);
