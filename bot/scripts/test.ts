/**
 * Script de test pour le système de scraping
 * 
 * Ce fichier permet de tester les différents composants du système.
 */

import { ScrapingWorker, DatabaseConfig, RedisConfig } from '../src';

/**
 * Test du système de jobs
 */
async function testScrapingSystem() {
  console.log('🧪 Test du système de scraping...');
  
  // Configuration
  const dbConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'marketplace',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  };

  const redisConfig: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  };

  const worker = new ScrapingWorker(dbConfig, redisConfig);
  
  try {
    // Démarrer le worker
    await worker.start();
    
    // Programmer un job de test
    console.log('📅 Programmation d\'un job de test...');
    const jobId = await worker.scheduleScrapingJob(
      'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go',
      1 // Une seule page pour le test
    );
    
    console.log(`✅ Job de test programmé: ${jobId}`);
    
    // Attendre et afficher les statistiques
    console.log('⏳ Attente de 30 secondes pour voir le job s\'exécuter...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const stats = await worker.getQueueStats();
    console.log('📊 Statistiques de la queue:');
    console.log(`   - Jobs en attente: ${stats.waiting}`);
    console.log(`   - Jobs actifs: ${stats.active}`);
    console.log(`   - Jobs terminés: ${stats.completed}`);
    console.log(`   - Jobs échoués: ${stats.failed}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    // Arrêter le worker
    await worker.stop();
    console.log('🛑 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testScrapingSystem().catch(console.error);
}
