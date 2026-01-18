/**
 * Worker principal pour le scraping continu de Leboncoin avec proxies Webshare
 * 
 * Ce fichier démarre le worker avec les proxies Webshare pour contourner
 * la protection anti-bot de Leboncoin
 */

import { WebshareLeboncoinScraper } from '../src/scraper/WebshareLeboncoinScraper';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { DatabaseConfig } from '../src/types';
import * as cron from 'node-cron';

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
 * Classe Worker avec proxies Webshare
 */
class WebshareScrapingWorker {
  private scraper: WebshareLeboncoinScraper;
  private dbManager: DatabaseManager;
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(dbConfig: DatabaseConfig) {
    this.scraper = new WebshareLeboncoinScraper();
    this.dbManager = new DatabaseManager(dbConfig);
  }

  /**
   * Démarre le worker
   */
  async start(): Promise<void> {
    console.log('🚀 Démarrage du worker de scraping avec proxies Webshare...');
    
    try {
      // Initialiser la base de données
      await this.dbManager.initialize();
      console.log('✅ Base de données initialisée');
      
      // Tester les proxies Webshare
      console.log('🧪 Test des proxies Webshare...');
      const proxyStats = this.scraper.getProxyStats();
      console.log(`📊 Proxies disponibles: ${proxyStats.active}/${proxyStats.total} (${proxyStats.successRate}% succès)`);
      
      if (proxyStats.active === 0) {
        console.log('⚠️ Aucun proxy disponible, utilisation directe');
        this.scraper.setUseProxies(false);
      }
      
      this.isRunning = true;
      console.log('✅ Worker démarré avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du worker:', error);
      throw error;
    }
  }

  /**
   * Configure le cron job automatique
   */
  setupCronJob(cronExpression: string, searchUrls: string[]): void {
    console.log(`⏰ Configuration du cron job: ${cronExpression}`);
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      console.log('🔄 Exécution du cron job...');
      await this.executeScrapingJob(searchUrls);
    });
    
    console.log('✅ Cron job configuré');
  }

  /**
   * Exécute un job de scraping
   */
  async executeScrapingJob(searchUrls: string[]): Promise<void> {
    console.log(`🔍 Début du scraping de ${searchUrls.length} URLs...`);
    
    let totalListings = 0;
    let totalErrors = 0;
    
    for (const url of searchUrls) {
      try {
        console.log(`\n📄 Scraping: ${url}`);
        
        // Scraper avec proxies Webshare
        const listings = await this.scraper.scrapeSearchResultsWithWebshareProxy(url, 2);
        
        if (listings.length > 0) {
          console.log(`✅ ${listings.length} annonces trouvées`);
          
          // Sauvegarder en base de données
          for (const listing of listings) {
            try {
              await this.dbManager.saveListing(listing);
              totalListings++;
            } catch (dbError) {
              console.error('❌ Erreur lors de la sauvegarde:', dbError);
              totalErrors++;
            }
          }
        } else {
          console.log('📭 Aucune annonce trouvée');
        }
        
        // Attendre entre les URLs
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`❌ Erreur lors du scraping de ${url}:`, error);
        totalErrors++;
      }
    }
    
    console.log(`\n🎉 Scraping terminé: ${totalListings} annonces sauvegardées, ${totalErrors} erreurs`);
    
    // Afficher les statistiques des proxies
    const proxyStats = this.scraper.getProxyStats();
    console.log(`📊 Statistiques proxies: ${proxyStats.active}/${proxyStats.total} actifs (${proxyStats.successRate}% succès)`);
  }

  /**
   * Arrête le worker
   */
  async stop(): Promise<void> {
    console.log('🛑 Arrêt du worker...');
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.isRunning = false;
    await this.dbManager.close();
    
    console.log('✅ Worker arrêté');
  }

  /**
   * Vérifie si le worker est actif
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Obtient les statistiques des proxies
   */
  getProxyStats() {
    return this.scraper.getProxyStats();
  }

  /**
   * Obtient les statistiques de la base de données
   */
  async getDatabaseStats() {
    try {
      const stats = await this.dbManager.getStats();
      return stats;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats DB:', error);
      return null;
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage du worker de scraping ScanLeCoin avec proxies Webshare...');
  
  try {
    // Créer le worker
    const worker = new WebshareScrapingWorker(defaultDbConfig);
    
    // Configurer le cron job automatique
    worker.setupCronJob(defaultCronExpression, defaultSearchUrls);
    
    // Démarrer le worker
    await worker.start();
    
    console.log('✅ Worker démarré avec succès');
    console.log('⏰ Cron job configuré (toutes les 10 minutes)');
    console.log('🔄 En attente de jobs...');
    
    // Garder le processus en vie et afficher les stats
    setInterval(async () => {
      if (worker.isActive()) {
        const proxyStats = worker.getProxyStats();
        const dbStats = await worker.getDatabaseStats();
        
        console.log(`📊 Stats: ${proxyStats.active}/${proxyStats.total} proxies actifs (${proxyStats.successRate}% succès)`);
        if (dbStats) {
          console.log(`📊 DB: ${dbStats.totalListings} annonces, ${dbStats.totalSellers} vendeurs, ${dbStats.totalLocations} localisations`);
        }
      }
    }, 60000); // Afficher les stats toutes les minutes
    
    // Gestion propre de l'arrêt
    process.on('SIGINT', async () => {
      console.log('\n🛑 Signal d\'arrêt reçu...');
      await worker.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Signal de terminaison reçu...');
      await worker.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du worker:', error);
    process.exit(1);
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  main().catch(console.error);
}
