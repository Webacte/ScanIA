-- Fonctions SQL simplifiées pour analyser les annonces
-- Version simplifiée pour éviter les problèmes de types complexes

-- Fonction pour extraire le modèle iPhone d'un titre
CREATE OR REPLACE FUNCTION marketplace.extract_iphone_model(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    model TEXT;
BEGIN
    -- Patterns de détection des modèles iPhone (par ordre de priorité)
    CASE
        WHEN title_text ~* 'iphone\s*15\s*pro\s*max' THEN model := 'iPhone 15 Pro Max';
        WHEN title_text ~* 'iphone\s*15\s*pro(?!\s*max)' THEN model := 'iPhone 15 Pro';
        WHEN title_text ~* 'iphone\s*15\s*mini' THEN model := 'iPhone 15 mini';
        WHEN title_text ~* 'iphone\s*15(?!\s*(pro|mini|max))' THEN model := 'iPhone 15';
        WHEN title_text ~* 'iphone\s*14\s*pro\s*max' THEN model := 'iPhone 14 Pro Max';
        WHEN title_text ~* 'iphone\s*14\s*pro(?!\s*max)' THEN model := 'iPhone 14 Pro';
        WHEN title_text ~* 'iphone\s*14\s*mini' THEN model := 'iPhone 14 mini';
        WHEN title_text ~* 'iphone\s*14(?!\s*(pro|mini|max))' THEN model := 'iPhone 14';
        WHEN title_text ~* 'iphone\s*13\s*pro\s*max' THEN model := 'iPhone 13 Pro Max';
        WHEN title_text ~* 'iphone\s*13\s*pro(?!\s*max)' THEN model := 'iPhone 13 Pro';
        WHEN title_text ~* 'iphone\s*13\s*mini' THEN model := 'iPhone 13 mini';
        WHEN title_text ~* 'iphone\s*13(?!\s*(pro|mini|max))' THEN model := 'iPhone 13';
        WHEN title_text ~* 'iphone\s*12\s*pro\s*max' THEN model := 'iPhone 12 Pro Max';
        WHEN title_text ~* 'iphone\s*12\s*pro(?!\s*max)' THEN model := 'iPhone 12 Pro';
        WHEN title_text ~* 'iphone\s*12\s*mini' THEN model := 'iPhone 12 mini';
        WHEN title_text ~* 'iphone\s*12(?!\s*(pro|mini|max))' THEN model := 'iPhone 12';
        WHEN title_text ~* 'iphone\s*11\s*pro\s*max' THEN model := 'iPhone 11 Pro Max';
        WHEN title_text ~* 'iphone\s*11\s*pro(?!\s*max)' THEN model := 'iPhone 11 Pro';
        WHEN title_text ~* 'iphone\s*11(?!\s*(pro|max))' THEN model := 'iPhone 11';
        WHEN title_text ~* 'iphone\s*xr' THEN model := 'iPhone XR';
        WHEN title_text ~* 'iphone\s*xs\s*max' THEN model := 'iPhone XS Max';
        WHEN title_text ~* 'iphone\s*xs(?!\s*max)' THEN model := 'iPhone XS';
        WHEN title_text ~* 'iphone\s*x(?![srm])' THEN model := 'iPhone X';
        WHEN title_text ~* 'iphone\s*8\s*plus' THEN model := 'iPhone 8 Plus';
        WHEN title_text ~* 'iphone\s*8(?!\s*plus)' THEN model := 'iPhone 8';
        WHEN title_text ~* 'iphone\s*7\s*plus' THEN model := 'iPhone 7 Plus';
        WHEN title_text ~* 'iphone\s*7(?!\s*plus)' THEN model := 'iPhone 7';
        WHEN title_text ~* 'iphone\s*6s\s*plus' THEN model := 'iPhone 6s Plus';
        WHEN title_text ~* 'iphone\s*6s(?!\s*plus)' THEN model := 'iPhone 6s';
        WHEN title_text ~* 'iphone\s*6\s*plus' THEN model := 'iPhone 6 Plus';
        WHEN title_text ~* 'iphone\s*6(?!\s*(s|plus))' THEN model := 'iPhone 6';
        WHEN title_text ~* 'iphone\s*se' THEN model := 'iPhone SE';
        ELSE model := NULL;
    END CASE;
    
    RETURN model;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour extraire la capacité de stockage (améliorée)
CREATE OR REPLACE FUNCTION marketplace.extract_storage(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    storage TEXT;
BEGIN
    CASE
        WHEN title_text ~* '1\s*tb|1000\s*gb|1000\s*go' THEN storage := '1TB';
        WHEN title_text ~* '512\s*gb|512\s*go' THEN storage := '512GB';
        WHEN title_text ~* '256\s*gb|256\s*go|256go' THEN storage := '256GB';
        WHEN title_text ~* '128\s*gb|128\s*go|128go' THEN storage := '128GB';
        WHEN title_text ~* '64\s*gb|64\s*go|64go' THEN storage := '64GB';
        WHEN title_text ~* '32\s*gb|32\s*go|32go' THEN storage := '32GB';
        WHEN title_text ~* '16\s*gb|16\s*go|16go' THEN storage := '16GB';
        ELSE storage := NULL;
    END CASE;
    
    RETURN storage;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vue simplifiée pour les annonces analysées
CREATE OR REPLACE VIEW marketplace.analyzed_listings_simple AS
SELECT 
    l.id,
    l.title,
    l.price_cents / 100.0 as price_euros,
    l.url,
    l.created_at,
    loc.label as location,
    
    -- Informations extraites
    marketplace.extract_iphone_model(l.title) as detected_model,
    marketplace.extract_storage(l.title) as detected_storage,
    
    -- Score de confiance basé sur les informations détectées
    CASE 
        WHEN marketplace.extract_iphone_model(l.title) IS NOT NULL THEN 30 ELSE 0
    END +
    CASE 
        WHEN marketplace.extract_storage(l.title) IS NOT NULL THEN 25 ELSE 0
    END as confidence_score,
    
    -- Vérifications de filtrage
    CASE 
        WHEN l.title ~* 'iphone\s*\d+\s*et\s*iphone\s*\d+|iphone\s*\d+\s*&\s*iphone\s*\d+|lot\s*de\s*\d+|collection\s*de\s*\d+' 
        THEN true ELSE false 
    END as is_multiple_devices,
    
    CASE 
        WHEN l.title ~* 'pour\s*pièces|pour\s*piece|cassé|casse|hs\s*\(hors\s*service\)|hors\s*service|ne\s*marche\s*pas|écran\s*cassé' 
        THEN true ELSE false 
    END as is_for_parts_only

FROM marketplace.listings l
LEFT JOIN marketplace.locations loc ON l.location_id = loc.id
WHERE 
    l.title ~* 'iphone' -- Seulement les annonces iPhone
    AND l.price_cents > 0;

-- Fonction pour extraire la couleur (améliorée)
CREATE OR REPLACE FUNCTION marketplace.extract_color(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    color TEXT;
BEGIN
    CASE
        WHEN title_text ~* 'noir|black' THEN color := 'Noir';
        WHEN title_text ~* 'blanc|white' THEN color := 'Blanc';
        WHEN title_text ~* 'rouge|red' THEN color := 'Rouge';
        WHEN title_text ~* 'bleu|blue' THEN color := 'Bleu';
        WHEN title_text ~* 'vert|green' THEN color := 'Vert';
        WHEN title_text ~* 'rose|pink' THEN color := 'Rose';
        WHEN title_text ~* 'violet|purple' THEN color := 'Violet';
        WHEN title_text ~* 'argent|silver' THEN color := 'Argent';
        WHEN title_text ~* 'or|gold' THEN color := 'Or';
        WHEN title_text ~* 'gris|gray|grey' THEN color := 'Gris';
        ELSE color := NULL;
    END CASE;
    
    RETURN color;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour extraire l'état
CREATE OR REPLACE FUNCTION marketplace.extract_condition(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    condition TEXT;
BEGIN
    CASE
        WHEN title_text ~* 'neuf|new' THEN condition := 'Neuf';
        WHEN title_text ~* 'comme\s*neuf|like\s*new' THEN condition := 'Comme neuf';
        WHEN title_text ~* 'bon\s*état|good\s*condition|très\s*bon\s*état' THEN condition := 'Bon état';
        WHEN title_text ~* 'état\s*correct|fair\s*condition' THEN condition := 'État correct';
        WHEN title_text ~* 'mauvais\s*état|poor\s*condition' THEN condition := 'Mauvais état';
        ELSE condition := NULL;
    END CASE;
    
    RETURN condition;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Supprimer les vues existantes avant de les recréer
DROP VIEW IF EXISTS marketplace.listings_with_characteristics CASCADE;
DROP VIEW IF EXISTS marketplace.listings_with_storage CASCADE;

-- Vue complète pour les annonces avec toutes les caractéristiques
CREATE VIEW marketplace.listings_with_characteristics AS
SELECT 
    l.id,
    l.title,
    l.price_cents / 100.0 as price_euros,
    l.url,
    l.created_at,
    loc.label as location,
    marketplace.extract_iphone_model(l.title) as detected_model,
    marketplace.extract_storage(l.title) as detected_storage,
    marketplace.extract_color(l.title) as detected_color,
    marketplace.extract_condition(l.title) as detected_condition,
    CASE 
        WHEN marketplace.extract_iphone_model(l.title) IS NOT NULL THEN 30 ELSE 0
    END +
    CASE 
        WHEN marketplace.extract_storage(l.title) IS NOT NULL THEN 25 ELSE 0
    END +
    CASE 
        WHEN marketplace.extract_color(l.title) IS NOT NULL THEN 15 ELSE 0
    END +
    CASE 
        WHEN marketplace.extract_condition(l.title) IS NOT NULL THEN 10 ELSE 0
    END as confidence_score,
    -- Vérifications de filtrage
    CASE 
        WHEN l.title ~* 'iphone\s*\d+\s*et\s*iphone\s*\d+|iphone\s*\d+\s*&\s*iphone\s*\d+|lot\s*de\s*\d+|collection\s*de\s*\d+' 
        THEN true ELSE false 
    END as is_multiple_devices,
    CASE 
        WHEN l.title ~* 'pour\s*pièces|pour\s*piece|cassé|casse|hs\s*\(hors\s*service\)|hors\s*service|ne\s*marche\s*pas|écran\s*cassé' 
        THEN true ELSE false 
    END as is_for_parts_only
FROM marketplace.listings l
LEFT JOIN marketplace.locations loc ON l.location_id = loc.id
WHERE 
    l.title ~* 'iphone'
    AND l.price_cents > 0;

-- Vue pour les annonces avec stockage spécifique (pour la recherche filtrée)
CREATE VIEW marketplace.listings_with_storage AS
SELECT 
    id, title, price_euros, url, created_at, location,
    detected_model, detected_storage, detected_color, detected_condition,
    confidence_score, is_multiple_devices, is_for_parts_only
FROM marketplace.listings_with_characteristics
WHERE detected_storage IS NOT NULL; -- Seulement les annonces avec stockage détecté

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_listings_title_lower ON marketplace.listings (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_listings_price_recent ON marketplace.listings (price_cents, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created_recent ON marketplace.listings (created_at DESC);
