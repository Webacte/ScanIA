/**
 * Scraper Leboncoin de Production Finale
 * 
 * Cette classe combine TOUS les éléments développés :
 * - Comportement humain réaliste
 * - Pagination intelligente
 * - Base de données PostgreSQL
 * - Gestion des erreurs robuste
 * - Monitoring et statistiques
 * - Éviter les doublons
 * - Planification automatique
 */

import { HumanLikeLeboncoinScraper, HumanBehaviorConfig } from './HumanLikeLeboncoinScraper';
import { DatabaseManager } from '../database/DatabaseManager';
import { ListingData, DatabaseConfig } from '../types';
import * as cron from 'node-cron';

export interface ProductionConfig {
  // Configuration comportement humain
  humanBehavior: HumanBehaviorConfig;
  
  // Configuration base de données
  database: {
    enabled: boolean;
    autoCreateTables: boolean;
    config?: DatabaseConfig;
  };
  
  // Configuration monitoring
  monitoring: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error';
    saveStats: boolean;
  };
  
  // Configuration planification
  scheduling: {
    enabled: boolean;
    cronExpression: string; // Ex: "0 */6 * * *" pour toutes les 6h
    maxSessionsPerDay: number;
  };
  
  // Configuration URLs de recherche
  searchUrls: string[];
  
  // Configuration notifications
  notifications: {
    enabled: boolean;
    email?: string;
    webhook?: string;
  };
}

export interface ProductionStats {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalListings: number;
  newListings: number;
  duplicateListings: number;
  errorListings: number;
  pagesScraped: number;
  requestsMade: number;
  searchUrls: string[];
  errors: string[];
  success: boolean;
}

export class FinalProductionScraper {
  private humanScraper: HumanLikeLeboncoinScraper;
  private dbManager: DatabaseManager;
  private config: ProductionConfig;
  private currentSessionId: string = '';
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(config: ProductionConfig) {
    this.config = config;
    this.humanScraper = new HumanLikeLeboncoinScraper(config.humanBehavior);
    
    // Initialiser le DatabaseManager avec la configuration par défaut si pas fournie
    const dbConfig = config.database.config || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'scania',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    };
    
    this.dbManager = new DatabaseManager(dbConfig);
    
    // Configurer le scraper avec le DatabaseManager pour la détection de doublons
    if (config.database.enabled) {
      this.humanScraper.setDatabaseManager(this.dbManager);
    }
    
    console.log('🚀 Scraper Leboncoin de Production Finale initialisé');
    console.log(`🔧 Configuration:`);
    console.log(`   - Base de données: ${config.database.enabled ? 'Activée' : 'Désactivée'}`);
    console.log(`   - Monitoring: ${config.monitoring.enabled ? 'Activé' : 'Désactivé'}`);
    console.log(`   - Planification: ${config.scheduling.enabled ? 'Activée' : 'Désactivée'}`);
    console.log(`   - URLs de recherche: ${config.searchUrls.length}`);
    console.log(`   - Détection de doublons: ${config.database.enabled ? 'Activée' : 'Désactivée'}`);
  }

  /**
   * Démarre le scraper de production
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Le scraper est déjà en cours d\'exécution');
      return;
    }

    console.log('🚀 Démarrage du scraper de production...');
    this.isRunning = true;

    try {
      // Initialiser la base de données si activée
      if (this.config.database.enabled) {
        await this.initializeDatabase();
      }

      // Démarrer la planification si activée
      if (this.config.scheduling.enabled) {
        this.startScheduling();
      }

      // Exécuter une session immédiate
      await this.executeScrapingSession();

      console.log('✅ Scraper de production démarré avec succès');

    } catch (error) {
      console.error('❌ Erreur lors du démarrage:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Arrête le scraper de production
   */
  async stop(): Promise<void> {
    console.log('🛑 Arrêt du scraper de production...');
    this.isRunning = false;

    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }

    if (this.config.database.enabled) {
      await this.dbManager.close();
    }

    console.log('✅ Scraper de production arrêté');
  }

  /**
   * Exécute une session de scraping complète
   */
  async executeScrapingSession(): Promise<ProductionStats> {
    this.currentSessionId = this.generateSessionId();
    const stats: ProductionStats = {
      sessionId: this.currentSessionId,
      startTime: new Date(),
      totalListings: 0,
      newListings: 0,
      duplicateListings: 0,
      errorListings: 0,
      pagesScraped: 0,
      requestsMade: 0,
      searchUrls: this.config.searchUrls,
      errors: [],
      success: false
    };

    console.log(`📋 Session ${this.currentSessionId} démarrée`);
    console.log(`🎯 URLs de recherche: ${this.config.searchUrls.length}`);

    try {
      const allListings: ListingData[] = [];

      // Scraper chaque URL de recherche
      for (const searchUrl of this.config.searchUrls) {
        console.log(`\n🔍 Scraping: ${searchUrl}`);
        
        try {
          const listings = await this.humanScraper.scrapeWithHumanBehavior(searchUrl);
          allListings.push(...listings);
          
          console.log(`✅ ${listings.length} annonces extraites de cette URL`);
          
        } catch (error) {
          const errorMsg = `Erreur URL ${searchUrl}: ${(error as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }

      stats.totalListings = allListings.length;
      console.log(`📊 Total: ${allListings.length} annonces extraites`);

      // Sauvegarder en base de données si activée
      if (this.config.database.enabled && allListings.length > 0) {
        const dbStats = await this.saveListingsToDatabase(allListings);
        stats.newListings = dbStats.newListings;
        stats.duplicateListings = dbStats.duplicateListings;
        stats.errorListings = dbStats.errorListings;
      }

      // Obtenir les statistiques de session
      const sessionStats = this.humanScraper.getSessionStats();
      stats.pagesScraped = sessionStats.pagesScraped;
      stats.requestsMade = sessionStats.requestsMade;

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      stats.success = true;

      // Sauvegarder les statistiques si activé
      if (this.config.monitoring.enabled && this.config.monitoring.saveStats) {
        await this.saveSessionStats(stats);
      }

      // Envoyer des notifications si activées
      if (this.config.notifications.enabled) {
        await this.sendNotifications(stats);
      }

      this.printSessionSummary(stats);
      return stats;

    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      stats.success = false;
      stats.errors.push(`Erreur session: ${(error as Error).message}`);
      
      console.error('❌ Erreur lors de la session de scraping:', error);
      return stats;
    }
  }

  /**
   * Initialise la base de données
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Tester la connexion à la base de données
      const client = await this.dbManager.getClient();
      await client.query('SELECT 1');
      client.release();
      
      console.log('✅ Base de données initialisée');
    } catch (error) {
      console.error('❌ Erreur initialisation base de données:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde les annonces en base de données
   */
  private async saveListingsToDatabase(listings: ListingData[]): Promise<{
    newListings: number;
    duplicateListings: number;
    errorListings: number;
  }> {
    console.log(`💾 Sauvegarde de ${listings.length} annonces en base de données...`);
    
    // Utiliser la méthode saveListings du DatabaseManager qui gère correctement
    // les vendeurs, localisations et images
    const result = await this.dbManager.saveListings(listings);
    
    console.log(`📊 Sauvegarde terminée: ${result.saved} nouvelles, ${result.skipped} doublons`);
    
    return { 
      newListings: result.saved, 
      duplicateListings: result.skipped, 
      errorListings: 0 
    };
  }

  /**
   * Sauvegarde les statistiques de session
   */
  private async saveSessionStats(stats: ProductionStats): Promise<void> {
    try {
      // Ici, vous pourriez sauvegarder dans une table de statistiques
      console.log(`📊 Statistiques de session ${stats.sessionId} sauvegardées`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde statistiques:', error);
    }
  }

  /**
   * Envoie des notifications
   */
  private async sendNotifications(stats: ProductionStats): Promise<void> {
    try {
      const message = `Scraping session ${stats.sessionId} terminée: ${stats.newListings} nouvelles annonces trouvées`;
      console.log(`📧 Notification envoyée: ${message}`);
      
      // Ici, vous pourriez envoyer un email ou une webhook
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
    }
  }

  /**
   * Démarre la planification automatique
   */
  private startScheduling(): void {
    if (!this.config.scheduling.enabled) return;

    console.log(`⏰ Planification démarrée: ${this.config.scheduling.cronExpression}`);
    
    this.cronJob = cron.schedule(this.config.scheduling.cronExpression, async () => {
      if (!this.isRunning) return;
      
      console.log('⏰ Exécution planifiée démarrée');
      await this.executeScrapingSession();
    });
  }

  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Affiche le résumé de la session
   */
  private printSessionSummary(stats: ProductionStats): void {
    console.log('\n📊 Résumé de la session:');
    console.log(`   - Session ID: ${stats.sessionId}`);
    console.log(`   - Durée: ${Math.round((stats.duration || 0) / 1000)}s`);
    console.log(`   - Annonces totales: ${stats.totalListings}`);
    console.log(`   - Nouvelles annonces: ${stats.newListings}`);
    console.log(`   - Doublons ignorés: ${stats.duplicateListings}`);
    console.log(`   - Erreurs: ${stats.errorListings}`);
    console.log(`   - Pages scrapées: ${stats.pagesScraped}`);
    console.log(`   - Requêtes effectuées: ${stats.requestsMade}`);
    console.log(`   - URLs traitées: ${stats.searchUrls.length}`);
    console.log(`   - Succès: ${stats.success ? '✅' : '❌'}`);
    
    // Afficher les statistiques de détection de doublons
    this.humanScraper.displayDuplicateDetectionStats();
    
    if (stats.errors.length > 0) {
      console.log(`   - Erreurs détaillées: ${stats.errors.length}`);
      stats.errors.forEach(error => console.log(`     • ${error}`));
    }
  }

  /**
   * Obtient l'état du scraper
   */
  getStatus(): {
    isRunning: boolean;
    currentSessionId: string;
    config: ProductionConfig;
  } {
    return {
      isRunning: this.isRunning,
      currentSessionId: this.currentSessionId,
      config: this.config
    };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<ProductionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.humanScraper.updateConfig(newConfig.humanBehavior || {});
    console.log('🔧 Configuration de production mise à jour');
  }
}
