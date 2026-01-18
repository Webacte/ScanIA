/**
 * Worker principal pour le scraping continu de Leboncoin
 * 
 * Ce fichier démarre le worker avec le système de jobs BullMQ et le cron automatique.
 * Utilisez: npm run worker
 */

import { ScrapingWorker, DatabaseConfig, RedisConfig } from '../src';

/**
 * Configuration par défaut
 */
const defaultDbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'marketplace',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
};

const defaultRedisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

/**
 * URLs de recherche par défaut
 */
const defaultSearchUrls = [
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2014&phone_memory=128go',
  'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015&phone_memory=128go'
];

/**
 * Expression cron par défaut (toutes les 10 minutes)
 */
const defaultCronExpression = '*/10 * * * *';

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage du worker de scraping ScanLeCoin...');
  
  try {
    // Créer le worker
    const worker = new ScrapingWorker(defaultDbConfig, defaultRedisConfig);
    
    // Configurer le cron job automatique
    worker.setupCronJob(defaultCronExpression, defaultSearchUrls);
    
    // Démarrer le worker
    await worker.start();
    
    console.log('✅ Worker démarré avec succès');
    console.log('⏰ Cron job configuré (toutes les 10 minutes)');
    console.log('🔄 En attente de jobs...');
    
    // Garder le processus en vie
    setInterval(async () => {
      if (worker.isActive()) {
        const stats = await worker.getQueueStats();
        console.log(`📊 Queue stats: ${stats.waiting} en attente, ${stats.active} actifs, ${stats.completed} terminés, ${stats.failed} échoués`);
      }
    }, 60000); // Afficher les stats toutes les minutes
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du worker:', error);
    process.exit(1);
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  main().catch(console.error);
}
