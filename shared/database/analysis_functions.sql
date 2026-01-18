-- Fonctions SQL pour analyser et trier les annonces directement dans PostgreSQL
-- Cela permet d'optimiser les performances en faisant le travail côté base de données

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

-- Fonction pour extraire la capacité de stockage
CREATE OR REPLACE FUNCTION marketplace.extract_storage(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    storage TEXT;
BEGIN
    CASE
        WHEN title_text ~* '1\s*tb|1000\s*gb|1000\s*go' THEN storage := '1TB';
        WHEN title_text ~* '512\s*gb|512\s*go' THEN storage := '512GB';
        WHEN title_text ~* '256\s*gb|256\s*go' THEN storage := '256GB';
        WHEN title_text ~* '128\s*gb|128\s*go' THEN storage := '128GB';
        WHEN title_text ~* '64\s*gb|64\s*go' THEN storage := '64GB';
        WHEN title_text ~* '32\s*gb|32\s*go' THEN storage := '32GB';
        WHEN title_text ~* '16\s*gb|16\s*go' THEN storage := '16GB';
        ELSE storage := NULL;
    END CASE;
    
    RETURN storage;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour extraire la couleur
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
        WHEN title_text ~* 'bon\s*état|good\s*condition' THEN condition := 'Bon état';
        WHEN title_text ~* 'état\s*correct|fair\s*condition' THEN condition := 'État correct';
        WHEN title_text ~* 'mauvais\s*état|poor\s*condition' THEN condition := 'Mauvais état';
        ELSE condition := NULL;
    END CASE;
    
    RETURN condition;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour calculer les prix de référence par modèle et stockage
CREATE OR REPLACE FUNCTION marketplace.calculate_reference_prices()
RETURNS TABLE(model_name TEXT, storage_name TEXT, reference_price NUMERIC, sample_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        marketplace.extract_iphone_model(l.title) as model_name,
        marketplace.extract_storage(l.title) as storage_name,
        ROUND(AVG(l.price_cents / 100.0)) as reference_price,
        COUNT(*) as sample_count
    FROM marketplace.listings l
    WHERE 
        marketplace.extract_iphone_model(l.title) IS NOT NULL
        AND marketplace.extract_storage(l.title) IS NOT NULL
        AND l.price_cents > 0
        AND l.created_at >= NOW() - INTERVAL '30 days' -- Derniers 30 jours
    GROUP BY 
        marketplace.extract_iphone_model(l.title),
        marketplace.extract_storage(l.title)
    HAVING COUNT(*) >= 3 -- Au moins 3 annonces pour être fiable
    ORDER BY 
        model_name, storage_name;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les annonces analysées avec toutes les informations extraites
CREATE OR REPLACE VIEW marketplace.analyzed_listings AS
SELECT 
    l.id,
    l.external_id,
    l.title,
    l.description,
    l.price_cents,
    l.price_cents / 100.0 as price_euros,
    l.url,
    l.created_at,
    l.raw_payload,
    loc.label as location,
    s.name as source_name,
    
    -- Informations extraites
    marketplace.extract_iphone_model(l.title) as detected_model,
    marketplace.extract_storage(l.title) as detected_storage,
    marketplace.extract_color(l.title) as detected_color,
    marketplace.extract_condition(l.title) as detected_condition,
    
    -- Score de confiance basé sur les informations détectées
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
LEFT JOIN marketplace.sources s ON l.source_id = s.id
WHERE 
    l.title ~* 'iphone' -- Seulement les annonces iPhone
    AND l.price_cents > 0;

-- Fonction pour récupérer les bonnes affaires avec analyse complète
CREATE OR REPLACE FUNCTION marketplace.get_good_deals(
    min_savings_percent INTEGER DEFAULT 20,
    min_confidence INTEGER DEFAULT 50,
    limit_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    listing_id BIGINT,
    title TEXT,
    price_euros NUMERIC,
    url TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    detected_model TEXT,
    detected_storage TEXT,
    detected_color TEXT,
    detected_condition TEXT,
    confidence_score INTEGER,
    reference_price NUMERIC,
    savings_euros NUMERIC,
    savings_percent INTEGER,
    deal_score INTEGER,
    hours_since_created INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH reference_prices AS (
        SELECT * FROM marketplace.calculate_reference_prices()
    ),
    analyzed_data AS (
        SELECT 
            al.*,
            rp.reference_price,
            CASE 
                WHEN rp.reference_price IS NOT NULL THEN 
                    ROUND((rp.reference_price - al.price_euros) * 100) / 100
                ELSE 0
            END as savings_euros,
            CASE 
                WHEN rp.reference_price IS NOT NULL AND rp.reference_price > 0 THEN 
                    ROUND(((rp.reference_price - al.price_euros) / rp.reference_price) * 100)
                ELSE 0
            END as savings_percent
        FROM marketplace.analyzed_listings al
        LEFT JOIN reference_prices rp ON 
            rp.model_name = al.detected_model 
            AND rp.storage_name = al.detected_storage
        WHERE 
            al.detected_model IS NOT NULL
            AND al.detected_storage IS NOT NULL
            AND al.confidence_score >= min_confidence
            AND NOT al.is_multiple_devices
            AND NOT al.is_for_parts_only
    )
    SELECT 
        ad.id as listing_id,
        ad.title,
        ad.price_euros,
        ad.url,
        ad.location,
        ad.created_at,
        ad.detected_model,
        ad.detected_storage,
        ad.detected_color,
        ad.detected_condition,
        ad.confidence_score,
        ad.reference_price,
        ad.savings_euros,
        ad.savings_percent,
        
        -- Calcul du score de bonne affaire
        (CASE 
            WHEN ad.savings_percent >= 40 THEN 95
            WHEN ad.savings_percent >= 30 THEN 85
            WHEN ad.savings_percent >= 25 THEN 75
            WHEN ad.savings_percent >= 20 THEN 65
            WHEN ad.savings_percent >= 15 THEN 55
            ELSE 0
        END +
        -- Bonus pour les annonces récentes
        CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - ad.created_at)) / 3600 < 2 THEN 10
            WHEN EXTRACT(EPOCH FROM (NOW() - ad.created_at)) / 3600 < 24 THEN 5
            ELSE 0
        END)::INTEGER as deal_score,
        
        ROUND(EXTRACT(EPOCH FROM (NOW() - ad.created_at)) / 3600)::INTEGER as hours_since_created
        
    FROM analyzed_data ad
    WHERE 
        ad.savings_percent >= min_savings_percent
        AND ad.savings_euros > 0
    ORDER BY 
        deal_score DESC,
        savings_percent DESC,
        ad.created_at DESC
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_listings_title_lower ON marketplace.listings (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_listings_price_recent ON marketplace.listings (price_cents, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_created_recent ON marketplace.listings (created_at DESC);
