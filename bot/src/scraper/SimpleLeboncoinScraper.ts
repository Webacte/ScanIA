/**
 * Scraper Leboncoin simple et efficace
 * 
 * Cette classe utilise un client HTTP basique sans proxies
 * pour éviter la détection anti-bot de Leboncoin
 */

import { CustomLeboncoinScraper } from './CustomLeboncoinScraper';
import { ListingData } from '../types';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

export class SimpleLeboncoinScraper {
  protected baseUrl = 'https://www.leboncoin.fr';
  protected requestCount: number = 0;
  protected lastRequestTime: number = 0;

  constructor() {
    console.log('🚀 Scraper Leboncoin simple initialisé (sans proxies)');
  }

  /**
   * Scrape les résultats de recherche avec un client HTTP simple
   */
  async scrapeSearchResultsSimple(searchUrl: string, maxPages: number = 2): Promise<ListingData[]> {
    console.log(`🔍 Début du scraping simple: ${searchUrl}`);
    
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    try {
      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}/${maxPages}...`);
        
        // Délai humain entre les requêtes
        await this.humanDelay();
        
        // Effectuer la requête simple
        const response = await this.makeSimpleRequest(currentUrl);
        
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

        // Délai entre les pages
        await this.humanDelay(3000);
      }

      console.log(`🎉 Scraping terminé: ${allListings.length} annonces au total`);
      return allListings;

    } catch (error) {
      console.error('❌ Erreur lors du scraping simple:', error);
      throw error;
    }
  }

  /**
   * Effectue une requête HTTP simple
   */
  private async makeSimpleRequest(url: string): Promise<{ status: number; body: string; url: string }> {
    this.requestCount++;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'DNT': '1',
          'Referer': this.baseUrl,
        }
      });

      const body = await response.text();
      this.lastRequestTime = Date.now();

      return {
        status: response.status,
        body,
        url: response.url
      };

    } catch (error) {
      console.error(`❌ Erreur requête vers ${url}:`, (error as Error).message);
      throw error;
    }
  }

  /**
   * Simule un délai humain entre les requêtes
   */
  private async humanDelay(customDelay?: number): Promise<void> {
    const delay = customDelay || Math.random() * 2000 + 1000; // 1-3 secondes
    console.log(`👤 Délai humain: ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Scrape les détails d'une annonce
   */
  async scrapeListingDetailsSimple(listingUrl: string): Promise<Partial<ListingData>> {
    try {
      console.log(`🔍 Scraping des détails: ${listingUrl}`);
      
      // Délai humain
      await this.humanDelay();
      
      const response = await this.makeSimpleRequest(listingUrl);
      
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
   * Obtient les statistiques du scraper
   */
  getStats(): {
    requestCount: number;
    lastRequestTime: number;
    timeSinceLastRequest: number;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      timeSinceLastRequest: Date.now() - this.lastRequestTime
    };
  }

  /**
   * Extrait les annonces du HTML
   */
  protected extractListingsFromHtml(document: Document, baseUrl: string): ListingData[] {
    const listings: ListingData[] = [];
    const adContainers = document.querySelectorAll('[data-qa-id="aditem_container"]');

    console.log(`🔍 ${adContainers.length} conteneurs d'annonces trouvés`);

    adContainers.forEach((container, index) => {
      try {
        // ID externe - utiliser l'index ou extraire de l'URL
        const linkElement = container.querySelector('a[href*="/ad/"]');
        const href = linkElement?.getAttribute('href') || '';
        const external_id = href.split('/').pop() || `ad_${index}`;
        
        // Titre
        const title = container.querySelector('[data-test-id="adcard-title"]')?.textContent?.trim() || 'N/A';
        
        // Prix - chercher dans les éléments avec data-test-id contenant "price"
        const priceElement = container.querySelector('[data-test-id*="price"]');
        const priceText = priceElement?.textContent?.trim() || '0 €';
        const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
        
        // URL
        const url = this.baseUrl + href;
        
        // Localisation - chercher des patterns génériques
        const locationSelectors = [
          'p.text-caption.text-neutral',
          '[data-test-id*="location"]',
          '[data-qa-id*="location"]',
          '.location',
          'p:contains("km")',
          'span:contains("km")'
        ];
        
        let location = 'N/A';
        for (const selector of locationSelectors) {
          const locElement = container.querySelector(selector);
          if (locElement) {
            location = locElement.textContent?.trim() || 'N/A';
            break;
          }
        }
        
        // Livraison
        const has_shipping = !!(
          container.querySelector('[data-qa-id="delivery-badge"]') ||
          container.querySelector('[data-test-id*="delivery"]') ||
          container.querySelector('[data-test-id*="shipping"]') ||
          container.textContent?.toLowerCase().includes('livraison')
        );
        
        // Image
        const imageElement = container.querySelector('img[src*="img.leboncoin.fr"]') as HTMLImageElement;
        const image_url = imageElement?.src || undefined;

        if (title && title !== 'N/A' && price > 0 && url && url !== this.baseUrl + '#') {
          listings.push({
            external_id,
            title,
            price_cents: price * 100,
            url,
            location,
            has_shipping,
            image_url,
          });
          
          console.log(`   ✅ Annonce ${index + 1}: ${title} - ${price}€ - ${location}`);
        } else {
          console.log(`   ⚠️ Annonce ${index + 1} ignorée: titre="${title}", prix=${price}, url="${url}"`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur annonce ${index + 1}: ${(error as Error).message}`);
      }
    });

    console.log(`📊 ${listings.length} annonces valides extraites sur ${adContainers.length} conteneurs`);
    return listings;
  }

  /**
   * Trouve l'URL de la page suivante
   */
  protected findNextPageUrl(document: Document, currentUrl: string): string | null {
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
   * Réinitialise le scraper
   */
  reset(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    console.log('🔄 Scraper simple réinitialisé');
  }
}
