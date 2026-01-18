-- Tables pour stocker les patterns de détection des modèles
-- Ces tables permettent de gérer dynamiquement les patterns de détection
-- au lieu d'avoir du code en dur

-- Table pour les catégories de patterns (modèles, stockage, couleurs, etc.)
CREATE TABLE IF NOT EXISTS marketplace.pattern_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table pour les patterns de détection
CREATE TABLE IF NOT EXISTS marketplace.detection_patterns (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES marketplace.pattern_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    pattern TEXT NOT NULL, -- Expression régulière
    priority INTEGER DEFAULT 0, -- Priorité de détection (plus élevé = testé en premier)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_detection_patterns_category ON marketplace.detection_patterns(category_id);
CREATE INDEX IF NOT EXISTS idx_detection_patterns_active ON marketplace.detection_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_detection_patterns_priority ON marketplace.detection_patterns(priority DESC);

-- Insérer les catégories de patterns
INSERT INTO marketplace.pattern_categories (name, description) VALUES
('models', 'Modèles d''appareils (iPhone 15, iPhone 14, etc.)'),
('storage', 'Capacités de stockage (64GB, 128GB, etc.)'),
('colors', 'Couleurs des appareils'),
('conditions', 'État des appareils (neuf, bon état, etc.)')
ON CONFLICT (name) DO NOTHING;

-- Insérer les patterns pour les modèles iPhone
INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 15',
    'iphone\s*15(?!\s*(pro|mini|max))',
    100
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 15 Pro',
    'iphone\s*15\s*pro(?!\s*max)',
    99
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 15 Pro Max',
    'iphone\s*15\s*pro\s*max',
    98
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 15 mini',
    'iphone\s*15\s*mini',
    97
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 14',
    'iphone\s*14(?!\s*(pro|mini|max))',
    96
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 14 Pro',
    'iphone\s*14\s*pro(?!\s*max)',
    95
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 14 Pro Max',
    'iphone\s*14\s*pro\s*max',
    94
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 14 mini',
    'iphone\s*14\s*mini',
    93
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 13',
    'iphone\s*13(?!\s*(pro|mini|max))',
    92
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 13 Pro',
    'iphone\s*13\s*pro(?!\s*max)',
    91
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 13 Pro Max',
    'iphone\s*13\s*pro\s*max',
    90
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 13 mini',
    'iphone\s*13\s*mini',
    89
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 12',
    'iphone\s*12(?!\s*(pro|mini|max))',
    88
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 12 Pro',
    'iphone\s*12\s*pro(?!\s*max)',
    87
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 12 Pro Max',
    'iphone\s*12\s*pro\s*max',
    86
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 12 mini',
    'iphone\s*12\s*mini',
    85
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 11',
    'iphone\s*11(?!\s*(pro|max))',
    84
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 11 Pro',
    'iphone\s*11\s*pro(?!\s*max)',
    83
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 11 Pro Max',
    'iphone\s*11\s*pro\s*max',
    82
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone XR',
    'iphone\s*xr',
    81
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone XS',
    'iphone\s*xs(?!\s*max)',
    80
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone XS Max',
    'iphone\s*xs\s*max',
    79
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone X',
    'iphone\s*x(?![srm])',
    78
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 8',
    'iphone\s*8(?!\s*plus)',
    77
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 8 Plus',
    'iphone\s*8\s*plus',
    76
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 7',
    'iphone\s*7(?!\s*plus)',
    75
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 7 Plus',
    'iphone\s*7\s*plus',
    74
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 6s',
    'iphone\s*6s(?!\s*plus)',
    73
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 6s Plus',
    'iphone\s*6s\s*plus',
    72
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 6',
    'iphone\s*6(?!\s*(s|plus))',
    71
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone 6 Plus',
    'iphone\s*6\s*plus',
    70
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'iPhone SE',
    'iphone\s*se',
    69
FROM marketplace.pattern_categories pc WHERE pc.name = 'models'
ON CONFLICT DO NOTHING;

-- Insérer les patterns pour le stockage
INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    '16GB',
    '16\s*gb|16\s*go',
    100
FROM marketplace.pattern_categories pc WHERE pc.name = 'storage'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    '32GB',
    '32\s*gb|32\s*go',
    99
FROM marketplace.pattern_categories pc WHERE pc.name = 'storage'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    '64GB',
    '64\s*gb|64\s*go',
    98
FROM marketplace.pattern_categories pc WHERE pc.name = 'storage'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    '128GB',
    '128\s*gb|128\s*go',
    97
FROM marketplace.pattern_categories pc WHERE pc.name = 'storage'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    '256GB',
    '256\s*gb|256\s*go',
    96
FROM marketplace.pattern_categories pc WHERE pc.name = 'storage'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    '512GB',
    '512\s*gb|512\s*go',
    95
FROM marketplace.pattern_categories pc WHERE pc.name = 'storage'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    '1TB',
    '1\s*tb|1000\s*gb|1000\s*go',
    94
FROM marketplace.pattern_categories pc WHERE pc.name = 'storage'
ON CONFLICT DO NOTHING;

-- Insérer les patterns pour les couleurs
INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Noir',
    'noir|black',
    100
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Blanc',
    'blanc|white',
    99
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Rouge',
    'rouge|red',
    98
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Bleu',
    'bleu|blue',
    97
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Vert',
    'vert|green',
    96
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Rose',
    'rose|pink',
    95
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Violet',
    'violet|purple',
    94
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Argent',
    'argent|silver',
    93
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Or',
    'or|gold',
    92
FROM marketplace.pattern_categories pc WHERE pc.name = 'colors'
ON CONFLICT DO NOTHING;

-- Insérer les patterns pour les conditions
INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Neuf',
    'neuf|new',
    100
FROM marketplace.pattern_categories pc WHERE pc.name = 'conditions'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Comme neuf',
    'comme\s*neuf|like\s*new',
    99
FROM marketplace.pattern_categories pc WHERE pc.name = 'conditions'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Bon état',
    'bon\s*état|good\s*condition',
    98
FROM marketplace.pattern_categories pc WHERE pc.name = 'conditions'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'État correct',
    'état\s*correct|fair\s*condition',
    97
FROM marketplace.pattern_categories pc WHERE pc.name = 'conditions'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority) 
SELECT 
    pc.id,
    'Mauvais état',
    'mauvais\s*état|poor\s*condition',
    96
FROM marketplace.pattern_categories pc WHERE pc.name = 'conditions'
ON CONFLICT DO NOTHING;
