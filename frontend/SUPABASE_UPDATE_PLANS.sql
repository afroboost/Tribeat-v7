-- =====================================================
-- 🚀 BEATTRIBE - MISE À JOUR SCHEMA (Plans & Pricing)
-- =====================================================
-- Exécutez ce script APRÈS le script initial
-- =====================================================

-- Ajout colonnes pour visibilité des plans
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'plan_pro_visible') THEN
        ALTER TABLE public.site_settings ADD COLUMN plan_pro_visible BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'plan_enterprise_visible') THEN
        ALTER TABLE public.site_settings ADD COLUMN plan_enterprise_visible BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Ajout colonnes pour prix dynamiques
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'plan_pro_price_monthly') THEN
        ALTER TABLE public.site_settings ADD COLUMN plan_pro_price_monthly TEXT DEFAULT '9.99';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'plan_pro_price_yearly') THEN
        ALTER TABLE public.site_settings ADD COLUMN plan_pro_price_yearly TEXT DEFAULT '99.99';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'plan_enterprise_price_monthly') THEN
        ALTER TABLE public.site_settings ADD COLUMN plan_enterprise_price_monthly TEXT DEFAULT '29.99';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'plan_enterprise_price_yearly') THEN
        ALTER TABLE public.site_settings ADD COLUMN plan_enterprise_price_yearly TEXT DEFAULT '299.99';
    END IF;
END $$;

-- Ajout colonne langue par défaut
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'default_language') THEN
        ALTER TABLE public.site_settings ADD COLUMN default_language TEXT DEFAULT 'fr';
    END IF;
END $$;

-- Vérification
SELECT '✅ Colonnes ajoutées:' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND column_name LIKE 'plan_%' OR column_name = 'default_language'
ORDER BY column_name;

SELECT '🎉 Mise à jour schema terminée!' as message;
