/**
 * Scraper Leboncoin ultra-avancé
 * 
 * Cette classe combine toutes les techniques de contournement :
 * - Proxies Webshare avec rotation intelligente
 * - Headers avancés et rotation de profils
 * - Simulation de comportement humain réaliste
 * - Gestion intelligente des erreurs et contre-mesures
 */

import { UltraAdvancedHttpClient, UltraAdvancedConfig } from './UltraAdvancedHttpClient';
import { CustomLeboncoinScraper } from './CustomLeboncoinScraper';
import { ListingData } from '../types';
import { JSDOM } from 'jsdom';

export class UltraAdvancedLeboncoinScraper extends CustomLeboncoinScraper {
  private ultraClient: UltraAdvancedHttpClient;
  private config: UltraAdvancedConfig;

  constructor(config: UltraAdvancedConfig = {
    useProxies: true,
    useAdvancedHeaders: true,
    useHumanBehavior: true,
    maxRetries: 5,
    retryDelay: 2000,
    sessionDuration: 30 * 60 * 1000 // 30 minutes
  }) {
    super();
    this.config = config;
    this.ultraClient = new UltraAdvancedHttpClient(config);
    
    console.log('🚀 Scraper Leboncoin ultra-avancé initialisé');
  }

  /**
   * Scrape les résultats de recherche avec toutes les techniques avancées
   */
  async scrapeSearchResultsUltraAdvanced(searchUrl: string, maxPages: number = 2): Promise<ListingData[]> {
    console.log(`🔍 Début du scraping ultra-avancé: ${searchUrl}`);
    
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    try {
      // Test initial des capacités
      await this.performInitialTests();
      
      // Simuler une session de navigation humaine
      await this.simulateHumanNavigationSession();

      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}/${maxPages}...`);
        
        // Effectuer la requête ultra-avancée
        const response = await this.ultraClient.get(currentUrl);
        
        if (response.status !== 200) {
          console.log(`⚠️ Statut inattendu: ${response.status}`);
          break;
        }

        console.log(`✅ Réponse ${response.status} reçue (${response.body.length} caractères)`);

        // Parser le HTML
        const dom = new JSDOM(response.body);
        const document = dom.window.document;

        // Extraire les annonces de la page
        const pageListings = this.extractListingsFromHtml(document, response.url);
        
        if (pageListings.length === 0) {
          console.log('📭 Aucune annonce trouvée sur cette page');
          break;
        }

        console.log(`✅ ${pageListings.length} annonces extraites de la page ${currentPage}`);
        allListings.push(...pageListings);

        // Chercher la page suivante
        const nextPageUrl = this.findNextPageUrl(document, currentUrl);
        if (!nextPageUrl) {
          console.log('📄 Aucune page suivante trouvée');
          break;
        }

        currentUrl = nextPageUrl;
        currentPage++;

        // Simuler un comportement humain entre les pages
        await this.simulatePageTransitionBehavior();
      }

      console.log(`🎉 Scraping terminé: ${allListings.length} annonces au total`);
      return allListings;

    } catch (error) {
      console.error('❌ Erreur lors du scraping ultra-avancé:', error);
      throw error;
    }
  }

  /**
   * Scrape les détails d'une annonce avec techniques avancées
   */
  async scrapeListingDetailsUltraAdvanced(listingUrl: string): Promise<Partial<ListingData>> {
    try {
      console.log(`🔍 Scraping des détails ultra-avancé: ${listingUrl}`);
      
      // Simuler un comportement de lecture d'annonce
      await this.simulateAdReadingBehavior();
      
      const response = await this.ultraClient.get(listingUrl);
      
      if (response.status !== 200) {
        console.log(`⚠️ Erreur ${response.status} lors du scraping des détails`);
        return {};
      }

      const dom = new JSDOM(response.body);
      const document = dom.window.document;

      const details: Partial<ListingData> = {};

      // Extraire la description avec sélecteurs avancés
      const descriptionSelectors = [
        '[data-qa-id="adview_content_container"]',
        '.adview_content_container',
        '[data-test-id="adview-content"]',
        '.description',
        '.content',
        '.adview-description',
        '.listing-description'
      ];

      for (const selector of descriptionSelectors) {
        const descElement = document.querySelector(selector);
        if (descElement) {
          details.description = descElement.textContent?.trim();
          break;
        }
      }

      // Extraire l'état/condition
      const conditionSelectors = [
        '[data-qa-id="criteria_item_condition"]',
        '.criteria_item_condition',
        '.condition',
        '.state',
        '.adview-condition',
        '.listing-condition'
      ];

      for (const selector of conditionSelectors) {
        const conditionElement = document.querySelector(selector);
        if (conditionElement) {
          details.condition = conditionElement.textContent?.trim();
          break;
        }
      }

      // Extraire le nom du vendeur
      const sellerSelectors = [
        '[data-qa-id="adview_seller_name"]',
        '.adview_seller_name',
        '.seller-name',
        '.vendor',
        '.adview-seller',
        '.listing-seller'
      ];

      for (const selector of sellerSelectors) {
        const sellerElement = document.querySelector(selector);
        if (sellerElement) {
          details.seller_name = sellerElement.textContent?.trim();
          break;
        }
      }

      return details;

    } catch (error) {
      console.error('Erreur lors du scraping des détails:', error);
      return {};
    }
  }

  /**
   * Effectue des tests initiaux
   */
  private async performInitialTests(): Promise<void> {
    console.log('🧪 Tests initiaux...');
    
    // Test de connectivité
    try {
      const testResponse = await this.ultraClient.get('https://httpbin.org/ip');
      console.log('✅ Test de connectivité réussi');
    } catch (error) {
      console.log('⚠️ Test de connectivité échoué:', (error as Error).message);
    }
    
    // Test des proxies
    if (this.config.useProxies) {
      const proxyStats = this.ultraClient.getProxyStats();
      console.log(`📊 Proxies: ${proxyStats.active}/${proxyStats.total} actifs (${proxyStats.successRate}% succès)`);
    }
  }

  /**
   * Simule une session de navigation humaine
   */
  private async simulateHumanNavigationSession(): Promise<void> {
    console.log('👤 Simulation d\'une session de navigation humaine...');
    
    // Visiter la page d'accueil
    try {
      await this.ultraClient.get('https://www.leboncoin.fr');
      console.log('🏠 Visite de la page d\'accueil');
    } catch (error) {
      console.log('⚠️ Erreur lors de la visite de la page d\'accueil');
    }
    
    // Simuler une navigation vers les catégories
    try {
      await this.ultraClient.get('https://www.leboncoin.fr/telephones_objets_connectes/');
      console.log('📱 Visite de la catégorie téléphones');
    } catch (error) {
      console.log('⚠️ Erreur lors de la visite de la catégorie');
    }
  }

  /**
   * Simule un comportement de transition entre pages
   */
  private async simulatePageTransitionBehavior(): Promise<void> {
    console.log('🔄 Simulation de transition entre pages...');
    
    // Délai de transition
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
    
    // Simuler un comportement de scroll
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }

  /**
   * Simule un comportement de lecture d'annonce
   */
  private async simulateAdReadingBehavior(): Promise<void> {
    console.log('📄 Simulation de lecture d\'annonce...');
    
    // Délai de lecture
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    // Simuler des mouvements de souris
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
  }

  /**
   * Obtient les statistiques complètes
   */
  getUltraStats() {
    return this.ultraClient.getStats();
  }

  /**
   * Obtient les statistiques des proxies
   */
  getProxyStats() {
    return this.ultraClient.getProxyStats();
  }

  /**
   * Obtient la liste des proxies actifs
   */
  getActiveProxies() {
    return this.ultraClient.getActiveProxies();
  }

  /**
   * Obtient la liste des proxies échoués
   */
  getFailedProxies() {
    return this.ultraClient.getFailedProxies();
  }

  /**
   * Réinitialise les proxies échoués
   */
  resetFailedProxies(): void {
    this.ultraClient.resetFailedProxies();
  }

  /**
   * Active ou désactive l'utilisation des proxies
   */
  setUseProxies(useProxies: boolean): void {
    this.ultraClient.setUseProxies(useProxies);
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<UltraAdvancedConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.ultraClient.updateConfig(newConfig);
  }

  /**
   * Réinitialise le scraper
   */
  reset(): void {
    this.ultraClient.reset();
    console.log('🔄 Scraper ultra-avancé réinitialisé');
  }
}
