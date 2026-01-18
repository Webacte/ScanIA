/**
 * Point d'entrée principal du projet ScanLeCoin
 * 
 * Ce fichier exporte tous les modules principaux pour une utilisation facile
 * dans d'autres parties de l'application.
 */

// Types et interfaces
export * from './types';

// Modules de base de données
export { DatabaseManager } from './database/DatabaseManager';

// Modules de scraping
export { LeboncoinScraper } from './scraper/LeboncoinScraper';

// Modules utilitaires
export { RateLimiter, BackoffManager } from './utils/RateLimiter';

// Modules de workers
export { ScrapingWorker } from './workers/ScrapingWorker';

// Configuration
export * from './config';
