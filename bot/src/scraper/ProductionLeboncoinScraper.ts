/**
 * Scraper Leboncoin prêt pour la production
 * 
 * Cette classe intègre :
 * - Scraping simple et efficace (sans proxies)
 * - Base de données PostgreSQL
 * - Gestion des erreurs robuste
 * - Monitoring et logging
 * - Évite les doublons
 */

import { SimpleLeboncoinScraper } from './SimpleLeboncoinScraper';
import { DatabaseManager } from '../database/DatabaseManager';
import { ListingData } from '../types';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

export interface ScrapingConfig {
  maxPages: number;
  delayBetweenRequests: number;
  delayBetweenPages: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ScrapingStats {
  totalListings: number;
  newListings: number;
  duplicateListings: number;
  errorListings: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pagesScraped: number;
  requestsMade: number;
}

export class ProductionLeboncoinScraper extends SimpleLeboncoinScraper {
  private dbManager: DatabaseManager;
  private config: ScrapingConfig;
  private stats: ScrapingStats;

  constructor(config: ScrapingConfig = {
    maxPages: 3,
    delayBetweenRequests: 2000,
    delayBetweenPages: 3000,
    retryAttempts: 3,
    retryDelay: 5000
  }) {
    super();
    this.config = config;
    this.dbManager = new DatabaseManager();
    this.stats = {
      totalListings: 0,
      newListings: 0,
      duplicateListings: 0,
      errorListings: 0,
      startTime: new Date(),
      pagesScraped: 0,
      requestsMade: 0
    };
    
    console.log('🚀 Scraper Leboncoin de production initialisé');
  }

  /**
   * Scrape complet avec base de données
   */
  async scrapeAndSave(searchUrl: string): Promise<ScrapingStats> {
    console.log(`🔍 Début du scraping de production: ${searchUrl}`);
    this.stats.startTime = new Date();
    
    try {
      // Initialiser la base de données
      await this.dbManager.initialize();
      console.log('✅ Base de données initialisée');

      // Scraper les résultats
      const allListings = await this.scrapeSearchResultsWithPagination(searchUrl);
      this.stats.totalListings = allListings.length;
      console.log(`📊 ${allListings.length} annonces scrapées au total`);

      // Sauvegarder en base de données
      await this.saveListingsToDatabase(allListings);
      
      this.stats.endTime = new Date();
      this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
      
      console.log('🎉 Scraping de production terminé avec succès');
      this.printStats();
      
      return this.stats;

    } catch (error) {
      console.error('❌ Erreur lors du scraping de production:', error);
      this.stats.endTime = new Date();
      this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
      throw error;
    } finally {
      // Fermer la connexion à la base de données
      await this.dbManager.close();
    }
  }

  /**
   * Scrape avec pagination
   */
  private async scrapeSearchResultsWithPagination(searchUrl: string): Promise<ListingData[]> {
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    while (currentPage <= this.config.maxPages) {
      console.log(`📄 Scraping page ${currentPage}/${this.config.maxPages}...`);
      
      try {
        // Délai entre les requêtes
        await this.humanDelay(this.config.delayBetweenRequests);
        
        // Scraper la page
        const pageListings = await this.scrapeSinglePage(currentUrl);
        
        if (pageListings.length === 0) {
          console.log('📭 Aucune annonce trouvée sur cette page');
          break;
        }

        console.log(`✅ ${pageListings.length} annonces extraites de la page ${currentPage}`);
        allListings.push(...pageListings);
        this.stats.pagesScraped++;
        this.stats.requestsMade++;

        // Chercher la page suivante
        const nextPageUrl = await this.findNextPageUrl(currentUrl);
        if (!nextPageUrl) {
          console.log('📄 Aucune page suivante trouvée');
          break;
        }

        currentUrl = nextPageUrl;
        currentPage++;

        // Délai entre les pages
        if (currentPage <= this.config.maxPages) {
          await this.humanDelay(this.config.delayBetweenPages);
        }

      } catch (error) {
        console.error(`❌ Erreur page ${currentPage}:`, (error as Error).message);
        this.stats.errorListings++;
        
        // Retry logic
        if (currentPage <= this.config.retryAttempts) {
          console.log(`🔄 Tentative ${currentPage}/${this.config.retryAttempts}...`);
          await this.humanDelay(this.config.retryDelay);
          continue;
        } else {
          break;
        }
      }
    }

    return allListings;
  }

  /**
   * Scrape une page unique
   */
  private async scrapeSinglePage(url: string): Promise<ListingData[]> {
    const response = await this.makeSimpleRequest(url);
    
    if (response.status !== 200) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const dom = new JSDOM(response.body);
    const document = dom.window.document;
    
    return this.extractListingsFromHtml(document, response.url);
  }

  /**
   * Sauvegarde les annonces en base de données
   */
  private async saveListingsToDatabase(listings: ListingData[]): Promise<void> {
    console.log(`💾 Sauvegarde de ${listings.length} annonces en base de données...`);
    
    for (const listing of listings) {
      try {
        // Vérifier si l'annonce existe déjà
        const exists = await this.dbManager.checkListingExists('leboncoin', listing.external_id);
        
        if (exists) {
          console.log(`⚠️ Annonce ${listing.external_id} déjà existante, ignorée`);
          this.stats.duplicateListings++;
          continue;
        }

        // Insérer la nouvelle annonce
        await this.dbManager.insertListing({
          source_id: 'leboncoin',
          external_id: listing.external_id,
          title: listing.title,
          price_cents: listing.price_cents,
          url: listing.url,
          location: listing.location,
          has_shipping: listing.has_shipping,
          image_url: listing.image_url,
          seller_name: listing.seller_name,
          description: listing.description,
          condition: listing.condition
        });

        console.log(`✅ Annonce ${listing.external_id} sauvegardée`);
        this.stats.newListings++;

      } catch (error) {
        console.error(`❌ Erreur sauvegarde annonce ${listing.external_id}:`, (error as Error).message);
        this.stats.errorListings++;
      }
    }
  }

  /**
   * Trouve l'URL de la page suivante
   */
  private async findNextPageUrl(currentUrl: string): Promise<string | null> {
    try {
      const response = await this.makeSimpleRequest(currentUrl);
      const dom = new JSDOM(response.body);
      const document = dom.window.document;
      
      return this.findNextPageUrlFromDocument(document, currentUrl);
    } catch (error) {
      console.error('Erreur lors de la recherche de la page suivante:', (error as Error).message);
      return null;
    }
  }

  /**
   * Trouve l'URL de la page suivante dans le document
   */
  private findNextPageUrlFromDocument(document: Document, currentUrl: string): string | null {
    const nextButton = document.querySelector('[data-qa-id="pagination-next"]');
    if (nextButton) {
      const href = nextButton.getAttribute('href');
      if (href) {
        return this.baseUrl + href;
      }
    }
    return null;
  }

  /**
   * Affiche les statistiques
   */
  private printStats(): void {
    console.log('\n📊 Statistiques du scraping:');
    console.log(`   - Annonces totales: ${this.stats.totalListings}`);
    console.log(`   - Nouvelles annonces: ${this.stats.newListings}`);
    console.log(`   - Doublons ignorés: ${this.stats.duplicateListings}`);
    console.log(`   - Erreurs: ${this.stats.errorListings}`);
    console.log(`   - Pages scrapées: ${this.stats.pagesScraped}`);
    console.log(`   - Requêtes effectuées: ${this.stats.requestsMade}`);
    console.log(`   - Durée: ${Math.round((this.stats.duration || 0) / 1000)}s`);
    
    if (this.stats.duration) {
      const rate = this.stats.totalListings / (this.stats.duration / 1000);
      console.log(`   - Taux: ${rate.toFixed(2)} annonces/seconde`);
    }
  }

  /**
   * Obtient les statistiques
   */
  getStats(): ScrapingStats {
    return { ...this.stats };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Configuration mise à jour');
  }

  /**
   * Réinitialise les statistiques
   */
  resetStats(): void {
    this.stats = {
      totalListings: 0,
      newListings: 0,
      duplicateListings: 0,
      errorListings: 0,
      startTime: new Date(),
      pagesScraped: 0,
      requestsMade: 0
    };
    console.log('🔄 Statistiques réinitialisées');
  }
}
