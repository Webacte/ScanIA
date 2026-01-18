import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import * as cron from 'node-cron';
import { LeboncoinScraper } from '../scraper/LeboncoinScraper';
import { DatabaseConfig, ScrapingJobData, RedisConfig } from '../types';

/**
 * Worker de scraping avec système de jobs BullMQ
 * 
 * Ce module gère l'exécution asynchrone des jobs de scraping avec :
 * - Queue Redis pour la persistance
 * - Cron job automatique
 * - Retry automatique avec backoff
 * - Monitoring des jobs
 */
export class ScrapingWorker {
  private redisConnection: IORedis;
  private scrapingQueue: Queue<ScrapingJobData>;
  private scrapingWorker: Worker<ScrapingJobData>;
  private dbConfig: DatabaseConfig;
  private isRunning: boolean = false;

  constructor(dbConfig: DatabaseConfig, redisConfig: RedisConfig) {
    this.dbConfig = dbConfig;
    
    // Configuration Redis
    this.redisConnection = new IORedis({
      host: redisConfig.host,
      port: redisConfig.port,
      maxRetriesPerRequest: 3,
    });

    // Queue pour les jobs de scraping
    this.scrapingQueue = new Queue<ScrapingJobData>('scraping-jobs', {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 10, // Garder seulement les 10 derniers jobs terminés
        removeOnFail: 50,     // Garder les 50 derniers jobs échoués
        attempts: 3,          // 3 tentatives maximum
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Worker pour traiter les jobs
    this.scrapingWorker = new Worker<ScrapingJobData>(
      'scraping-jobs',
      this.processScrapingJob.bind(this),
      {
        connection: this.redisConnection,
        concurrency: 1, // Un seul job à la fois pour éviter la surcharge
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Configure les gestionnaires d'événements du worker
   */
  private setupEventHandlers(): void {
    this.scrapingWorker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} terminé avec succès`);
    });

    this.scrapingWorker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} échoué:`, err.message);
    });

    this.scrapingWorker.on('error', (err) => {
      console.error('💥 Erreur du worker:', err);
    });
  }

  /**
   * Traite un job de scraping
   * @param job Job à traiter
   * @returns Résultat du job
   */
  private async processScrapingJob(job: Job<ScrapingJobData>) {
    const { searchUrl, maxPages, jobId } = job.data;
    
    console.log(`🚀 Début du job de scraping ${jobId}`);
    console.log(`📋 URL: ${searchUrl}`);
    console.log(`📄 Pages max: ${maxPages}`);

    const scraper = new LeboncoinScraper(this.dbConfig);
    
    try {
      await scraper.initialize();
      
      const listings = await scraper.scrapeSearchResults(searchUrl, maxPages);
      console.log(`📊 ${listings.length} annonces trouvées`);
      
      const { saved, skipped } = await scraper.saveListingsToDatabase(listings);
      
      console.log(`✅ Job ${jobId} terminé:`);
      console.log(`   - Annonces sauvegardées: ${saved}`);
      console.log(`   - Annonces ignorées: ${skipped}`);
      
      return { saved, skipped, total: listings.length };
      
    } catch (error) {
      console.error(`❌ Erreur dans le job ${jobId}:`, error);
      throw error;
    } finally {
      await scraper.close();
    }
  }

  /**
   * Programme un job de scraping
   * @param searchUrl URL de recherche
   * @param maxPages Nombre maximum de pages
   * @returns ID du job programmé
   */
  async scheduleScrapingJob(searchUrl: string, maxPages: number = 2): Promise<string> {
    const jobId = `scraping-${Date.now()}`;
    
    await this.scrapingQueue.add(
      'scrape-leboncoin',
      {
        searchUrl,
        maxPages,
        jobId
      },
      {
        jobId,
        delay: 0, // Exécution immédiate
      }
    );
    
    console.log(`📅 Job de scraping programmé: ${jobId}`);
    return jobId;
  }

  /**
   * Configure le cron job automatique
   * @param cronExpression Expression cron (défaut: toutes les 10 minutes)
   * @param searchUrls URLs de recherche à scraper
   */
  setupCronJob(cronExpression: string = '*/10 * * * *', searchUrls: string[]): void {
    console.log('🕐 Configuration du cron job...');
    console.log(`⏰ Expression: ${cronExpression}`);

    cron.schedule(cronExpression, async () => {
      console.log('⏰ Déclenchement du cron job de scraping');
      
      for (const url of searchUrls) {
        try {
          await this.scheduleScrapingJob(url, 2); // 2 pages par recherche
          // Petit délai entre les jobs pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`❌ Erreur lors de la programmation du job pour ${url}:`, error);
        }
      }
    }, {
      timezone: "Europe/Paris"
    });
  }

  /**
   * Obtient les statistiques de la queue
   * @returns Statistiques des jobs
   */
  async getQueueStats() {
    const waiting = await this.scrapingQueue.getWaiting();
    const active = await this.scrapingQueue.getActive();
    const completed = await this.scrapingQueue.getCompleted();
    const failed = await this.scrapingQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  /**
   * Démarre le worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Worker déjà en cours d\'exécution');
      return;
    }

    console.log('🚀 Démarrage du worker de scraping...');
    console.log('📊 Queue BullMQ configurée');
    console.log('🔄 Worker en attente de jobs...');
    
    this.isRunning = true;

    // Gestion de l'arrêt propre
    process.on('SIGINT', async () => {
      console.log('🛑 Arrêt du worker...');
      await this.stop();
      process.exit(0);
    });
  }

  /**
   * Arrête le worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Arrêt du worker...');
    await this.scrapingWorker.close();
    await this.scrapingQueue.close();
    await this.redisConnection.quit();
    this.isRunning = false;
  }

  /**
   * Vérifie si le worker est en cours d'exécution
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
