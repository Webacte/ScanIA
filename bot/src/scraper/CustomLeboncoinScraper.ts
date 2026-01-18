/**
 * Scraper Leboncoin personnalisé utilisant HTTP direct
 * 
 * Cette classe contourne la détection en utilisant des requêtes HTTP
 * directes au lieu de Playwright/Selenium
 */

import { CustomHttpClient, HttpResponse } from './CustomHttpClient';
import { ListingData } from '../types';
import { JSDOM } from 'jsdom';

export class CustomLeboncoinScraper {
  private httpClient: CustomHttpClient;
  private baseUrl: string = 'https://www.leboncoin.fr';

  constructor() {
    this.httpClient = new CustomHttpClient();
  }

  /**
   * Scrape les résultats de recherche
   */
  async scrapeSearchResults(searchUrl: string, maxPages: number = 2): Promise<ListingData[]> {
    console.log(`🔍 Début du scraping personnalisé: ${searchUrl}`);
    
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    try {
      // Simuler un comportement humain initial
      await this.httpClient.simulateHumanBehavior();

      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}/${maxPages}...`);
        
        // Effectuer la requête HTTP
        const response = await this.httpClient.get(currentUrl);
        
        if (response.status === 403) {
          console.log('🚫 Erreur 403: Accès interdit');
          break;
        }
        
        if (response.status !== 200) {
          console.log(`⚠️ Statut inattendu: ${response.status}`);
          break;
        }

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
        await this.httpClient.simulateHumanBehavior();
      }

      console.log(`🎉 Scraping terminé: ${allListings.length} annonces au total`);
      return allListings;

    } catch (error) {
      console.error('❌ Erreur lors du scraping:', error);
      throw error;
    }
  }

  /**
   * Extrait les annonces du HTML
   */
  protected extractListingsFromHtml(document: Document, baseUrl: string): ListingData[] {
    const listings: ListingData[] = [];

    // Essayer différents sélecteurs possibles
    const selectors = [
      '[data-qa-id="aditem_container"]',
      '[data-qa-id="aditem"]',
      'article[data-test-id="ad"]',
      'article',
      '.aditem',
      '[class*="ad"]'
    ];

    let listingElements: NodeListOf<Element> | null = null;
    let usedSelector = '';

    for (const selector of selectors) {
      listingElements = document.querySelectorAll(selector);
      if (listingElements.length > 0) {
        usedSelector = selector;
        console.log(`🎯 Utilisation du sélecteur: ${selector} (${listingElements.length} éléments)`);
        break;
      }
    }

    if (!listingElements || listingElements.length === 0) {
      console.log('⚠️ Aucun sélecteur d\'annonce ne fonctionne');
      return listings;
    }

    listingElements.forEach((element, index) => {
      try {
        const listing = this.extractListingData(element, baseUrl);
        if (listing) {
          listings.push(listing);
        }
      } catch (error) {
        console.error(`Erreur lors de l'extraction de l'annonce ${index + 1}:`, error);
      }
    });

    return listings;
  }

  /**
   * Extrait les données d'une annonce
   */
  private extractListingData(element: Element, baseUrl: string): ListingData | null {
    try {
      // Extraire l'URL et l'ID externe
      const linkElement = element.querySelector('a') as HTMLAnchorElement;
      if (!linkElement) return null;

      const url = linkElement.href || '';
      const external_id = this.extractExternalId(url);

      // Extraire le titre
      const titleSelectors = [
        '[data-test-id="adcard-title"]',
        '[data-qa-id="aditem_title"]',
        '.aditem-title',
        'h3',
        'h2',
        '.title'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const titleElement = element.querySelector(selector);
        if (titleElement) {
          title = titleElement.textContent?.trim() || '';
          break;
        }
      }

      // Extraire le prix
      const priceSelectors = [
        '[data-qa-id="aditem_price"]',
        '.price',
        '[class*="price"]'
      ];
      
      let price_cents = 0;
      for (const selector of priceSelectors) {
        const priceElement = element.querySelector(selector);
        if (priceElement) {
          const priceText = priceElement.textContent?.trim() || '';
          price_cents = this.parsePrice(priceText);
          if (price_cents > 0) break;
        }
      }

      // Extraire la localisation
      const locationSelectors = [
        'p.text-caption.text-neutral',
        '.location',
        '[class*="location"]',
        '.aditem-location'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        const locationElement = element.querySelector(selector);
        if (locationElement) {
          location = locationElement.textContent?.trim() || '';
          break;
        }
      }

      // Extraire l'image
      const imageElement = element.querySelector('img') as HTMLImageElement;
      const image_url = imageElement?.src || '';

      // Vérifier la livraison
      const hasShipping = element.textContent?.toLowerCase().includes('livraison') || false;

      // Validation des données essentielles
      if (!external_id || !title || price_cents <= 0) {
        return null;
      }

      return {
        external_id,
        title,
        price_cents,
        url: this.buildAbsoluteUrl(url, baseUrl),
        location,
        has_shipping: hasShipping,
        image_url: this.buildAbsoluteUrl(image_url, baseUrl)
      };

    } catch (error) {
      console.error('Erreur lors de l\'extraction des données:', error);
      return null;
    }
  }

  /**
   * Extrait l'ID externe depuis l'URL
   */
  private extractExternalId(url: string): string {
    const patterns = [
      /\/(\d+)$/,           // /ad/category/123456
      /\/(\d+)\.htm/,       // /ad/category/123456.htm
      /ad\/[^\/]+\/(\d+)/,  // /ad/telephones_objets_connectes/123456
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Parse le prix en centimes
   */
  private parsePrice(priceText: string): number {
    const cleanPrice = priceText.replace(/[^\d]/g, '');
    const price = parseInt(cleanPrice);
    return isNaN(price) ? 0 : price * 100;
  }

  /**
   * Construit une URL absolue
   */
  private buildAbsoluteUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    return `${baseUrl}/${url}`;
  }

  /**
   * Trouve l'URL de la page suivante
   */
  protected findNextPageUrl(document: Document, currentUrl: string): string | null {
    const nextPageSelectors = [
      'a[aria-label*="suivant"]',
      'a[aria-label*="next"]',
      'a[title*="suivant"]',
      'a[title*="next"]',
      '.pagination .next',
      '.pagination-next',
      '[data-qa-id="pagination-next"]'
    ];

    for (const selector of nextPageSelectors) {
      const nextElement = document.querySelector(selector) as HTMLAnchorElement;
      if (nextElement && nextElement.href) {
        return nextElement.href;
      }
    }

    return null;
  }

  /**
   * Scrape les détails d'une annonce
   */
  async scrapeListingDetails(listingUrl: string): Promise<Partial<ListingData>> {
    try {
      console.log(`🔍 Scraping des détails: ${listingUrl}`);
      
      const response = await this.httpClient.get(listingUrl);
      
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
   * Obtient les statistiques de la session
   */
  getSessionStats(): { cookieCount: number; userAgent: string } {
    return this.httpClient.getSessionStats();
  }

  /**
   * Nettoie la session
   */
  clearSession(): void {
    this.httpClient.clearSession();
  }
}
