/**
 * Configuration de production pour le scraper Leboncoin
 * 
 * Ce fichier contient toutes les configurations nécessaires
 * pour le fonctionnement en production
 */

import { HumanBehaviorConfig } from '../scraper/HumanLikeLeboncoinScraper';
import { DatabaseConfig } from '../types';

// Configuration de la base de données
export const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scania',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
};

// Configuration du comportement humain (optimisée pour éviter les blocages)
export const humanBehaviorConfig: HumanBehaviorConfig = {
  minDelayBetweenRequests: parseInt(process.env.SCRAPER_MIN_DELAY || '5000'),  // 5 secondes minimum (réduit)
  maxDelayBetweenRequests: parseInt(process.env.SCRAPER_MAX_DELAY || '10000'), // 10 secondes maximum (réduit)
  minDelayBetweenPages: parseInt(process.env.SCRAPER_PAGES_DELAY_MIN || '8000'),    // 8 secondes minimum entre pages (réduit)
  maxDelayBetweenPages: parseInt(process.env.SCRAPER_PAGES_DELAY_MAX || '15000'),    // 15 secondes maximum entre pages (réduit)
  maxPagesPerSession: parseInt(process.env.SCRAPER_PAGES_PER_SESSION || '2'),          // Maximum 2 pages par session
  sessionBreakDuration: parseInt(process.env.SCRAPER_SESSION_BREAK || '30000'),   // 30 secondes de pause entre sessions (réduit)
  randomScrollBehavior: true,
  randomClickBehavior: true,
  realisticUserAgent: true,
  duplicateThreshold: parseFloat(process.env.SCRAPER_DUPLICATE_THRESHOLD || '0.8'),  // 80% de doublons = passer à l'URL suivante
  minListingsToCheck: parseInt(process.env.SCRAPER_MIN_LISTINGS_CHECK || '10')       // Vérifier au moins 10 annonces
};

// URLs de recherche optimisées pour éviter les captchas (par petits lots)
export const searchUrls: string[] = [
  // Lot 1: iPhone 15 Series (3 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015%20pro',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015%20pro%20max',
  
  // Lot 2: iPhone 14 Series (3 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2014',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2014%20pro',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2014%20pro%20max',
  
  // Lot 3: iPhone 13 Series (4 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013%20pro',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013%20pro%20max',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013%20mini',
  
  // Lot 4: iPhone 12 Series (4 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2012',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2012%20pro',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2012%20pro%20max',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2012%20mini',
  
  // Lot 5: iPhone 11 Series (3 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2011',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2011%20pro',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2011%20pro%20max',
  
  // Lot 6: iPhone X Series (4 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%20x',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%20xs',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%20xs%20max',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%20xr',
  
  // Lot 7: iPhone 8 Series (2 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%208',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%208%20plus',
  
  // Lot 8: iPhone 7 Series (2 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%207',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%207%20plus',
  
  // Lot 9: iPhone 6 Series (4 URLs)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%206',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%206%20plus',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%206s',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%206s%20plus',
  
  // Lot 10: iPhone SE Series (1 URL)
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%20se'
];

// Configuration pour le scraping par lots
export const scrapingBatches = {
  batchSize: 3, // Nombre d'URLs par lot
  delayBetweenBatches: 300000, // 5 minutes entre les lots
  maxBatchesPerDay: 10 // Maximum 10 lots par jour
};

// Configuration de planification
export const schedulingConfig = {
  enabled: process.env.SCHEDULING_ENABLED === 'true',
  cronExpression: process.env.CRON_EXPRESSION || '0 */6 * * *', // Toutes les 6 heures
  maxSessionsPerDay: parseInt(process.env.MAX_SESSIONS_PER_DAY || '4')
};

// Configuration des notifications
export const notificationConfig = {
  enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
  email: process.env.NOTIFICATION_EMAIL || '',
  webhook: process.env.SLACK_WEBHOOK_URL || ''
};

// Configuration du monitoring
export const monitoringConfig = {
  enabled: process.env.MONITORING_ENABLED !== 'false',
  logLevel: (process.env.LOG_LEVEL || 'info') as 'info' | 'warn' | 'error',
  saveStats: process.env.SAVE_STATS !== 'false'
};

// Configuration des proxies
export const proxyConfig = {
  enabled: process.env.USE_PROXIES === 'true',
  file: process.env.PROXY_FILE || 'proxyServer/ResidentialProxies.txt'
};

// Configuration Redis (pour BullMQ)
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || ''
};

// Configuration de sécurité
export const securityConfig = {
  secretKey: process.env.SECRET_KEY
};

// Configuration de l'environnement
export const environmentConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production'
};

// Configuration complète de production
export const productionConfig = {
  database: {
    enabled: process.env.DATABASE_ENABLED !== 'false',
    autoCreateTables: process.env.AUTO_CREATE_TABLES !== 'false',
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

// Fonction pour valider la configuration
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Vérifier la base de données
  if (productionConfig.database.enabled) {
    if (!databaseConfig.host) errors.push('DB_HOST est requis');
    if (!databaseConfig.database) errors.push('DB_NAME est requis');
    if (!databaseConfig.user) errors.push('DB_USER est requis');
    if (!databaseConfig.password) {
      errors.push('DB_PASSWORD doit être configuré (variable d\'environnement DB_PASSWORD)');
    }
  }

  // Vérifier les URLs de recherche
  if (searchUrls.length === 0) {
    errors.push('Au moins une URL de recherche est requise');
  }

  // Vérifier la planification
  if (schedulingConfig.enabled && !schedulingConfig.cronExpression) {
    errors.push('CRON_EXPRESSION est requis si la planification est activée');
  }

  // Vérifier les notifications
  if (notificationConfig.enabled) {
    if (!notificationConfig.email && !notificationConfig.webhook) {
      errors.push('NOTIFICATION_EMAIL ou SLACK_WEBHOOK_URL est requis si les notifications sont activées');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Fonction pour afficher la configuration (sans les mots de passe)
export function displayConfig(): void {
  console.log('🔧 Configuration de production:');
  console.log(`   - Base de données: ${productionConfig.database.enabled ? 'Activée' : 'Désactivée'}`);
  if (productionConfig.database.enabled) {
    console.log(`     • Host: ${databaseConfig.host}`);
    console.log(`     • Port: ${databaseConfig.port}`);
    console.log(`     • Database: ${databaseConfig.database}`);
    console.log(`     • User: ${databaseConfig.user}`);
    console.log(`     • Password: ${databaseConfig.password ? '***' : 'Non configuré'}`);
  }
  
  console.log(`   - Comportement humain:`);
  console.log(`     • Délais: ${humanBehaviorConfig.minDelayBetweenRequests}-${humanBehaviorConfig.maxDelayBetweenRequests}ms`);
  console.log(`     • Pages/session: ${humanBehaviorConfig.maxPagesPerSession}`);
  console.log(`     • Pause session: ${humanBehaviorConfig.sessionBreakDuration / 1000}s`);
  
  console.log(`   - Planification: ${schedulingConfig.enabled ? 'Activée' : 'Désactivée'}`);
  if (schedulingConfig.enabled) {
    console.log(`     • Cron: ${schedulingConfig.cronExpression}`);
    console.log(`     • Sessions max/jour: ${schedulingConfig.maxSessionsPerDay}`);
  }
  
  console.log(`   - URLs de recherche: ${searchUrls.length}`);
  console.log(`   - Monitoring: ${monitoringConfig.enabled ? 'Activé' : 'Désactivé'}`);
  console.log(`   - Notifications: ${notificationConfig.enabled ? 'Activées' : 'Désactivées'}`);
  console.log(`   - Proxies: ${proxyConfig.enabled ? 'Activés' : 'Désactivés'}`);
  console.log(`   - Environnement: ${environmentConfig.nodeEnv}`);
}

// Export par défaut
export default productionConfig;
