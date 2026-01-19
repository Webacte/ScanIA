/**
 * Exemple de configuration de production
 * 
 * Copiez ce fichier vers src/config/production.ts
 * et modifiez les valeurs selon votre environnement
 */

import { HumanBehaviorConfig } from '../src/scraper/HumanLikeLeboncoinScraper';
import { DatabaseConfig } from '../src/types';

// Configuration de la base de données
export const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',           // Adresse de votre serveur PostgreSQL
  port: parseInt(process.env.DB_PORT || '5432'),                  // Port PostgreSQL
  database: process.env.DB_NAME,      // Nom de votre base de données
  user: process.env.DB_USER,            // Nom d'utilisateur PostgreSQL
  password: process.env.DB_PASSWORD  // Mot de passe PostgreSQL
};

// Configuration du comportement humain (ralenti pour éviter la détection)
export const humanBehaviorConfig: HumanBehaviorConfig = {
  minDelayBetweenRequests: 8000,   // 8 secondes minimum entre requêtes
  maxDelayBetweenRequests: 15000,  // 15 secondes maximum entre requêtes
  minDelayBetweenPages: 10000,     // 10 secondes minimum entre pages
  maxDelayBetweenPages: 25000,     // 25 secondes maximum entre pages
  maxPagesPerSession: 2,           // Maximum 2 pages par session
  sessionBreakDuration: 600000,    // 10 minutes de pause entre sessions
  randomScrollBehavior: true,      // Comportements aléatoires
  randomClickBehavior: true,
  realisticUserAgent: true         // User-Agents variés
};

// URLs de recherche
export const searchUrls: string[] = [
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2014&phone_memory=128go',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015&phone_memory=128go'
];

// Configuration de planification
export const schedulingConfig = {
  enabled: true,                    // Activer la planification automatique
  cronExpression: '0 */6 * * *',   // Toutes les 6 heures
  maxSessionsPerDay: 4             // Maximum 4 sessions par jour
};

// Configuration des notifications
export const notificationConfig = {
  enabled: true,                    // Activer les notifications
  email: 'your-email@example.com', // Email pour les notifications
  webhook: ''                      // Webhook Slack (optionnel)
};

// Configuration du monitoring
export const monitoringConfig = {
  enabled: true,                    // Activer le monitoring
  logLevel: 'info' as const,       // Niveau de log
  saveStats: true                  // Sauvegarder les statistiques
};

// Configuration des proxies
export const proxyConfig = {
  enabled: false,                   // Désactiver les proxies (recommandé)
  file: 'proxyServer/ResidentialProxies.txt'
};

// Configuration Redis (pour BullMQ)
export const redisConfig = {
  host: 'localhost',
  port: 6379,
  password: ''
};

// Configuration de sécurité
export const securityConfig = {
  secretKey: 'your_secret_key_here' // Générez une clé aléatoire
};

// Configuration de l'environnement
export const environmentConfig = {
  nodeEnv: 'production',
  isDevelopment: false,
  isProduction: true
};

// Configuration complète
export const productionConfig = {
  database: {
    enabled: true,
    autoCreateTables: true,
    config: databaseConfig
  },
  humanBehavior: humanBehaviorConfig,
  monitoring: monitoringConfig,
  scheduling: schedulingConfig,
  searchUrls: searchUrls,
  notifications: notificationConfig,
  proxy: proxyConfig,
  redis: redisConfig,
  security: securityConfig,
  environment: environmentConfig
};

export default productionConfig;
