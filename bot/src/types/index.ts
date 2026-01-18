/**
 * Types et interfaces pour le projet ScanLeCoin
 */

/**
 * Données d'une annonce Leboncoin
 */
export interface ListingData {
  /** ID externe de l'annonce (depuis l'URL) */
  external_id: string;
  /** Titre de l'annonce */
  title: string;
  /** Prix en centimes */
  price_cents: number;
  /** URL complète de l'annonce */
  url: string;
  /** Localisation (ville/département) */
  location: string;
  /** Disponibilité de la livraison */
  has_shipping: boolean;
  /** URL de la première image */
  image_url?: string;
  /** Nom du vendeur */
  seller_name?: string;
  /** URL du profil du vendeur */
  seller_profile?: string;
  /** Description complète de l'annonce */
  description?: string;
  /** État du produit */
  condition?: string;
  /** Toutes les images de l'annonce */
  images?: string[];
}

/**
 * Configuration de la base de données PostgreSQL
 */
export interface DatabaseConfig {
  /** Hôte de la base de données */
  host: string;
  /** Port de la base de données */
  port: number;
  /** Nom de la base de données */
  database: string;
  /** Utilisateur de la base de données */
  user: string;
  /** Mot de passe de la base de données (requis si DB activée ; fourni via DB_PASSWORD) */
  password?: string;
}

/**
 * Configuration Redis pour BullMQ
 */
export interface RedisConfig {
  /** Hôte Redis */
  host: string;
  /** Port Redis */
  port: number;
}

/**
 * Données d'un job de scraping
 */
export interface ScrapingJobData {
  /** URL de recherche à scraper */
  searchUrl: string;
  /** Nombre maximum de pages à scraper */
  maxPages: number;
  /** ID unique du job */
  jobId: string;
}

/**
 * Configuration du scraping
 */
export interface ScrapingConfig {
  /** Mode headless du navigateur */
  headless: boolean;
  /** Délai entre les actions (ms) */
  slowMo: number;
  /** Nombre maximum de pages à scraper */
  maxPages: number;
  /** Expression cron pour l'exécution automatique */
  cronExpression: string;
  /** URLs de recherche à scraper */
  searchUrls: string[];
}

/**
 * Configuration du rate limiting
 */
export interface RateLimitConfig {
  /** Délai minimum entre les requêtes (ms) */
  minDelay: number;
  /** Délai maximum entre les requêtes (ms) */
  maxDelay: number;
  /** Nombre maximum de tentatives */
  maxRetries: number;
  /** Délai de base pour le backoff exponentiel (ms) */
  backoffBaseDelay: number;
}

/**
 * Résultat de la sauvegarde des annonces
 */
export interface SaveResult {
  /** Nombre d'annonces sauvegardées */
  saved: number;
  /** Nombre d'annonces ignorées (déjà existantes) */
  skipped: number;
}

/**
 * Données pour l'insertion d'une annonce en base
 */
export interface ListingInsertData {
  /** ID de la source */
  sourceId: number;
  /** ID externe de l'annonce */
  externalId: string;
  /** URL de l'annonce */
  url: string;
  /** Titre de l'annonce */
  title: string;
  /** Description de l'annonce */
  description?: string;
  /** Prix en centimes */
  priceCents: number;
  /** Devise */
  currency: string;
  /** Code de l'état du produit */
  conditionCode?: string;
  /** Disponibilité de la livraison */
  hasShipping: boolean;
  /** Coût de la livraison en centimes */
  shippingCostCents?: number;
  /** ID du vendeur */
  sellerId?: number;
  /** ID de la localisation */
  locationId?: number;
  /** Date de publication */
  publishedAt?: Date;
  /** Données brutes de l'annonce */
  rawPayload: any;
}
