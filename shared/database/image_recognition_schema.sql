--
-- Schéma SQL pour la reconnaissance d'images
-- Tables pour gérer les objets de référence, leurs photos, les tâches de recherche et les résultats
--

-- Table des objets de référence à reconnaître
CREATE TABLE IF NOT EXISTS marketplace.reference_objects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    confidence_threshold NUMERIC(5,2) DEFAULT 70.00 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT reference_objects_confidence_check CHECK (confidence_threshold >= 0 AND confidence_threshold <= 100)
);

-- Table des photos de référence pour chaque objet
CREATE TABLE IF NOT EXISTS marketplace.reference_images (
    id BIGSERIAL PRIMARY KEY,
    object_id BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT reference_images_object_id_fkey FOREIGN KEY (object_id) 
        REFERENCES marketplace.reference_objects(id) ON DELETE CASCADE
);

-- Table des tâches de recherche
CREATE TABLE IF NOT EXISTS marketplace.search_tasks (
    id BIGSERIAL PRIMARY KEY,
    search_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    total_listings INTEGER DEFAULT 0,
    processed_listings INTEGER DEFAULT 0,
    matches_found INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT search_tasks_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- Table de liaison entre les tâches et les objets à chercher
CREATE TABLE IF NOT EXISTS marketplace.search_task_objects (
    task_id BIGINT NOT NULL,
    object_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT search_task_objects_pkey PRIMARY KEY (task_id, object_id),
    CONSTRAINT search_task_objects_task_id_fkey FOREIGN KEY (task_id) 
        REFERENCES marketplace.search_tasks(id) ON DELETE CASCADE,
    CONSTRAINT search_task_objects_object_id_fkey FOREIGN KEY (object_id) 
        REFERENCES marketplace.reference_objects(id) ON DELETE CASCADE
);

-- Table des résultats de reconnaissance (matches)
CREATE TABLE IF NOT EXISTS marketplace.image_matches (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    object_id BIGINT NOT NULL,
    task_id BIGINT,
    reference_image_id BIGINT,
    matched_image_url TEXT NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT image_matches_listing_id_fkey FOREIGN KEY (listing_id) 
        REFERENCES marketplace.listings(id) ON DELETE CASCADE,
    CONSTRAINT image_matches_object_id_fkey FOREIGN KEY (object_id) 
        REFERENCES marketplace.reference_objects(id) ON DELETE CASCADE,
    CONSTRAINT image_matches_task_id_fkey FOREIGN KEY (task_id) 
        REFERENCES marketplace.search_tasks(id) ON DELETE SET NULL,
    CONSTRAINT image_matches_reference_image_id_fkey FOREIGN KEY (reference_image_id) 
        REFERENCES marketplace.reference_images(id) ON DELETE SET NULL,
    CONSTRAINT image_matches_confidence_check CHECK (confidence_score >= 0 AND confidence_score <= 100)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reference_images_object ON marketplace.reference_images(object_id);
CREATE INDEX IF NOT EXISTS idx_reference_images_object_position ON marketplace.reference_images(object_id, position);

CREATE INDEX IF NOT EXISTS idx_search_tasks_status ON marketplace.search_tasks(status);
CREATE INDEX IF NOT EXISTS idx_search_tasks_created ON marketplace.search_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_task_objects_task ON marketplace.search_task_objects(task_id);
CREATE INDEX IF NOT EXISTS idx_search_task_objects_object ON marketplace.search_task_objects(object_id);

CREATE INDEX IF NOT EXISTS idx_image_matches_listing ON marketplace.image_matches(listing_id);
CREATE INDEX IF NOT EXISTS idx_image_matches_object ON marketplace.image_matches(object_id);
CREATE INDEX IF NOT EXISTS idx_image_matches_task ON marketplace.image_matches(task_id);
CREATE INDEX IF NOT EXISTS idx_image_matches_confidence ON marketplace.image_matches(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_image_matches_listing_object ON marketplace.image_matches(listing_id, object_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION marketplace.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_reference_objects_updated_at
    BEFORE UPDATE ON marketplace.reference_objects
    FOR EACH ROW
    EXECUTE FUNCTION marketplace.update_updated_at_column();

CREATE TRIGGER update_search_tasks_updated_at
    BEFORE UPDATE ON marketplace.search_tasks
    FOR EACH ROW
    EXECUTE FUNCTION marketplace.update_updated_at_column();

-- Ajouter le champ local_path à la table listing_images si elle existe déjà
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'marketplace' AND table_name = 'listing_images') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'marketplace' AND table_name = 'listing_images' AND column_name = 'local_path') THEN
            ALTER TABLE marketplace.listing_images ADD COLUMN local_path TEXT;
            CREATE INDEX IF NOT EXISTS idx_listing_images_local_path ON marketplace.listing_images(local_path);
        END IF;
    END IF;
END $$;

-- Commentaires pour la documentation
COMMENT ON TABLE marketplace.reference_objects IS 'Objets de référence à reconnaître dans les images scrapées';
COMMENT ON TABLE marketplace.reference_images IS 'Photos de référence pour chaque objet (plusieurs photos par objet)';
COMMENT ON TABLE marketplace.search_tasks IS 'Tâches de recherche avec URL Leboncoin et statut de traitement';
COMMENT ON TABLE marketplace.search_task_objects IS 'Liaison entre les tâches et les objets à chercher';
COMMENT ON TABLE marketplace.image_matches IS 'Résultats de reconnaissance : annonces où des objets ont été détectés';

COMMENT ON COLUMN marketplace.reference_objects.confidence_threshold IS 'Seuil de confiance minimum (0-100) pour considérer une correspondance';
COMMENT ON COLUMN marketplace.image_matches.confidence_score IS 'Score de confiance de la correspondance (0-100)';
COMMENT ON COLUMN marketplace.search_tasks.status IS 'Statut: pending, running, completed, failed, cancelled';

