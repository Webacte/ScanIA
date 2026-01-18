/**
 * Scraper Leboncoin utilisant les proxies Webshare
 * 
 * Cette classe utilise les proxies Webshare avec authentification
 * pour contourner la détection par IP
 */

import { WebshareProxyHttpClient } from './WebshareProxyHttpClient';
import { CustomLeboncoinScraper } from './CustomLeboncoinScraper';
import { ListingData } from '../types';
import { JSDOM } from 'jsdom';

export class WebshareLeboncoinScraper extends CustomLeboncoinScraper {
  private proxyClient: WebshareProxyHttpClient;

  constructor() {
    super();
    this.proxyClient = new WebshareProxyHttpClient();
  }

  /**
   * Scrape les résultats de recherche avec proxies Webshare
   */
  async scrapeSearchResultsWithWebshareProxy(searchUrl: string, maxPages: number = 2): Promise<ListingData[]> {
    console.log(`🔍 Début du scraping avec proxies Webshare: ${searchUrl}`);
    
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    try {
      // Tester les proxies disponibles
      console.log('🧪 Test des proxies Webshare disponibles...');
      await this.proxyClient.testAllProxies('https://httpbin.org/ip', 5);
      
      const proxyStats = this.proxyClient.getProxyStats();
      console.log(`📊 Proxies Webshare disponibles: ${proxyStats.active}/${proxyStats.total} (${proxyStats.successRate}% succès)`);
      
      if (proxyStats.active === 0) {
        console.log('⚠️ Aucun proxy disponible, utilisation directe');
        this.proxyClient.setUseProxies(false);
      }

      // Simuler un comportement humain initial
      await this.simulateHumanBehavior();

      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}/${maxPages}...`);
        
        // Effectuer la requête HTTP avec proxy Webshare
        const response = await this.proxyClient.get(currentUrl);
        
        if (response.status === 403) {
          console.log('🚫 Erreur 403: Accès interdit');
          
          // Essayer avec un autre proxy
          const bestProxy = this.proxyClient.getBestProxy();
          if (bestProxy) {
            console.log(`🔄 Tentative avec le meilleur proxy: ${bestProxy.host}:${bestProxy.port}`);
          }
          
          break;
        }
        
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
        await this.simulateHumanBehavior();
      }

      console.log(`🎉 Scraping terminé: ${allListings.length} annonces au total`);
      return allListings;

    } catch (error) {
      console.error('❌ Erreur lors du scraping:', error);
      throw error;
    }
  }

  /**
   * Scrape les détails d'une annonce avec proxy Webshare
   */
  async scrapeListingDetailsWithWebshareProxy(listingUrl: string): Promise<Partial<ListingData>> {
    try {
      console.log(`🔍 Scraping des détails avec proxy Webshare: ${listingUrl}`);
      
      const response = await this.proxyClient.get(listingUrl);
      
      if (response.status !== 200) {
        console.log(`⚠️ Erreur ${response.status} lors du scraping des détails`);
        return {};
      }

      const dom = new JSDOM(response.body);
      const document = dom.window.document;

      const details: Partial<ListingData> = {};

      // Extraire la description
      const descriptionSelectors = [
        '[data-qa-id="adview_content_container"]',
        '.adview_content_container',
        '[data-test-id="adview-content"]',
        '.description',
        '.content'
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
        '.state'
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
        '.vendor'
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
   * Obtient les statistiques des proxies
   */
  getProxyStats() {
    return this.proxyClient.getProxyStats();
  }

  /**
   * Obtient la liste des proxies actifs
   */
  getActiveProxies() {
    return this.proxyClient.getActiveProxies();
  }

  /**
   * Obtient la liste des proxies échoués
   */
  getFailedProxies() {
    return this.proxyClient.getFailedProxies();
  }

  /**
   * Réinitialise les proxies échoués
   */
  resetFailedProxies(): void {
    this.proxyClient.resetFailedProxies();
  }

  /**
   * Active ou désactive l'utilisation des proxies
   */
  setUseProxies(useProxies: boolean): void {
    this.proxyClient.setUseProxies(useProxies);
  }

  /**
   * Obtient le meilleur proxy disponible
   */
  getBestProxy() {
    return this.proxyClient.getBestProxy();
  }

  /**
   * Obtient un proxy aléatoire
   */
  getRandomProxy() {
    return this.proxyClient.getRandomProxy();
  }

  /**
   * Simule un comportement humain
   */
  private async simulateHumanBehavior(): Promise<void> {
    // Délai aléatoire entre 1 et 3 secondes
    const delay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
