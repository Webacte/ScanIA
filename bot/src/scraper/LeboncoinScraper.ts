import { chromium, Browser, Page } from 'playwright';
import { DatabaseManager } from '../database/DatabaseManager';
import { RateLimiter, BackoffManager } from '../utils/RateLimiter';
import { DatabaseConfig, ListingData } from '../types';

/**
 * Scraper principal pour Leboncoin
 * 
 * Cette classe gère le scraping des annonces Leboncoin avec toutes les protections
 * anti-détection : rate limiting, headers réalistes, gestion d'erreurs HTTP.
 */
export class LeboncoinScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private dbManager: DatabaseManager;
  private rateLimiter: RateLimiter;
  private backoffManager: BackoffManager;

  constructor(dbConfig: DatabaseConfig) {
    this.dbManager = new DatabaseManager(dbConfig);
    this.rateLimiter = new RateLimiter();
    this.backoffManager = new BackoffManager();
  }

  /**
   * Initialise le navigateur et configure les headers
   */
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: true,
      slowMo: 100
    });
    this.page = await this.browser.newPage();
    
    // Headers réalistes pour éviter la détection
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    // Intercepter les réponses pour gérer les erreurs HTTP
    this.page.on('response', async (response) => {
      const status = response.status();
      const url = response.url();
      
      if (status === 403) {
        console.error(`🚫 Erreur 403 (Forbidden) sur ${url}`);
      } else if (status === 429) {
        console.error(`⏰ Erreur 429 (Too Many Requests) sur ${url}`);
      } else if (status >= 400) {
        console.error(`❌ Erreur HTTP ${status} sur ${url}`);
      }
    });
  }

  /**
   * Scrape les résultats de recherche sur plusieurs pages
   * @param searchUrl URL de recherche
   * @param maxPages Nombre maximum de pages à scraper
   * @returns Liste des annonces trouvées
   */
  async scrapeSearchResults(searchUrl: string, maxPages: number = 3): Promise<ListingData[]> {
    if (!this.page) {
      throw new Error('Scraper non initialisé');
    }

    const allListings: ListingData[] = [];
    
    try {
      console.log(`🔍 Début du scraping: ${searchUrl}`);
      
      // Attendre avant la première requête
      await this.rateLimiter.waitForNextRequest();
      
      // Navigation avec gestion d'erreurs
      const navigationSuccess = await this.navigateWithRetry(searchUrl);
      if (!navigationSuccess) {
        throw new Error('Impossible de naviguer vers la page de recherche');
      }

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        console.log(`📄 Scraping de la page ${pageNum}/${maxPages}...`);
        
        // Attendre entre les pages
        if (pageNum > 1) {
          await this.rateLimiter.waitForNextRequest();
        }
        
        const pageListings = await this.extractListingsFromPage();
        allListings.push(...pageListings);
        
        console.log(`✅ ${pageListings.length} annonces trouvées sur la page ${pageNum}`);
        
        if (pageNum < maxPages) {
          const hasNextPage = await this.goToNextPage();
          if (!hasNextPage) {
            console.log('📋 Aucune page suivante trouvée, arrêt du scraping');
            break;
          }
        }
      }
      
    } catch (error) {
      console.error('💥 Erreur lors du scraping:', error);
    }

    return allListings;
  }

  /**
   * Navigue vers une URL avec retry et gestion d'erreurs
   * @param url URL à visiter
   * @param maxRetries Nombre maximum de tentatives
   * @returns true si la navigation a réussi
   */
  private async navigateWithRetry(url: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Tentative ${attempt}/${maxRetries} de navigation vers ${url}`);
        
        const response = await this.page!.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        if (response?.status() === 429) {
          console.log('⏰ Rate limit détecté, application du backoff...');
          const shouldRetry = await this.backoffManager.handleRateLimit();
          if (!shouldRetry) {
            return false;
          }
          continue;
        }

        if (response?.status() === 403) {
          console.error('🚫 Accès interdit (403), arrêt du scraping');
          return false;
        }

        if (response?.status() && response.status() >= 400) {
          console.error(`❌ Erreur HTTP ${response.status()}, tentative ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            await this.sleep(2000 * attempt);
            continue;
          }
          return false;
        }

        // Attendre que les annonces se chargent
        await this.page!.waitForSelector('[data-qa-id="aditem_container"]', { timeout: 10000 });
        this.backoffManager.reset();
        return true;

      } catch (error) {
        console.error(`❌ Erreur de navigation (tentative ${attempt}/${maxRetries}):`, error);
        if (attempt < maxRetries) {
          await this.sleep(2000 * attempt);
        }
      }
    }
    
    return false;
  }

  /**
   * Extrait les annonces de la page courante
   * @returns Liste des annonces de la page
   */
  private async extractListingsFromPage(): Promise<ListingData[]> {
    if (!this.page) return [];

    const listings = await this.page.evaluate(() => {
      const listingElements = document.querySelectorAll('[data-qa-id="aditem_container"]');
      const results: ListingData[] = [];

      listingElements.forEach((element) => {
        try {
          // Extraire l'ID externe depuis l'URL
          const linkElement = element.querySelector('a') as HTMLAnchorElement;
          const url = linkElement?.href || '';
          // Extraire l'ID depuis l'URL (ex: /ad/telephones_objets_connectes/3039434933)
          const external_id = url.match(/\/(\d+)$/)?.[1] || url.match(/\/(\d+)\.htm/)?.[1] || '';

          // Extraire le titre (sélecteur correct basé sur l'HTML réel)
          const titleElement = element.querySelector('[data-test-id="adcard-title"]') as HTMLElement;
          const title = titleElement?.textContent?.trim() || '';

          // Extraire le prix
          const priceElement = element.querySelector('[data-qa-id="aditem_price"]') as HTMLElement;
          const priceText = priceElement?.textContent?.trim() || '';
          const price_cents = parseInt(priceText.replace(/[^\d]/g, '')) * 100 || 0;

          // Extraire la localisation (sélecteur basé sur l'HTML réel)
          const locationElement = element.querySelector('p.text-caption.text-neutral') as HTMLElement;
          const location = locationElement?.textContent?.trim() || '';

          // Extraire l'image (sélecteur basé sur l'HTML réel)
          const imageElement = element.querySelector('img[src*="img.leboncoin.fr"]') as HTMLImageElement;
          const image_url = imageElement?.src || '';

          // Vérifier si livraison disponible
          const hasShipping = element.textContent?.toLowerCase().includes('livraison') || false;

          // Extraire le nom du vendeur (pas présent dans l'HTML de l'exemple)
          const sellerElement = element.querySelector('[data-qa-id="aditem_seller"]') as HTMLElement;
          const seller_name = sellerElement?.textContent?.trim() || '';

          if (external_id && title && price_cents > 0) {
            results.push({
              external_id,
              title,
              price_cents,
              url: url.startsWith('http') ? url : `https://www.leboncoin.fr${url}`,
              location,
              has_shipping: hasShipping,
              image_url,
              seller_name: seller_name || undefined
            });
          }
        } catch (error) {
          console.error('Erreur lors de l\'extraction d\'une annonce:', error);
        }
      });

      return results;
    });

    return listings;
  }

  /**
   * Passe à la page suivante
   * @returns true si une page suivante a été trouvée
   */
  private async goToNextPage(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const nextButton = await this.page.$('[data-qa-id="pagination-next"]') || 
                        await this.page.$('a[aria-label="Page suivante"]') ||
                        await this.page.$('a:has-text("Suivant")');

      if (nextButton) {
        await nextButton.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForSelector('[data-qa-id="aditem_container"]', { timeout: 10000 });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors du passage à la page suivante:', error);
      return false;
    }
  }

  /**
   * Scrape les détails d'une annonce spécifique
   * @param listingUrl URL de l'annonce
   * @returns Détails supplémentaires de l'annonce
   */
  async scrapeListingDetails(listingUrl: string): Promise<Partial<ListingData>> {
    if (!this.page) return {};

    try {
      await this.page.goto(listingUrl, { waitUntil: 'networkidle' });
      
      const details = await this.page.evaluate(() => {
        const result: Partial<ListingData> = {};

        // Extraire la description (sélecteurs à adapter selon l'HTML réel de la page de détail)
        const descriptionElement = document.querySelector('[data-qa-id="adview_content_container"]') as HTMLElement ||
                                 document.querySelector('.adview_content_container') as HTMLElement ||
                                 document.querySelector('[data-test-id="adview-content"]') as HTMLElement;
        result.description = descriptionElement?.textContent?.trim();

        // Extraire l'état/condition
        const conditionElement = document.querySelector('[data-qa-id="criteria_item_condition"]') as HTMLElement ||
                               document.querySelector('.criteria_item_condition') as HTMLElement;
        result.condition = conditionElement?.textContent?.trim();

        // Extraire le profil du vendeur
        const sellerProfileElement = document.querySelector('[data-qa-id="adview_contact_container"] a') as HTMLAnchorElement ||
                                   document.querySelector('.adview_contact_container a') as HTMLAnchorElement;
        result.seller_profile = sellerProfileElement?.href;

        // Extraire le nom du vendeur si disponible
        const sellerNameElement = document.querySelector('[data-qa-id="adview_seller_name"]') as HTMLElement ||
                                document.querySelector('.adview_seller_name') as HTMLElement;
        result.seller_name = sellerNameElement?.textContent?.trim();

        return result;
      });

      return details;
    } catch (error) {
      console.error('Erreur lors du scraping des détails:', error);
      return {};
    }
  }

  /**
   * Sauvegarde les annonces en base de données
   * @param listings Liste des annonces à sauvegarder
   * @returns Résultat de la sauvegarde
   */
  async saveListingsToDatabase(listings: ListingData[]) {
    return await this.dbManager.saveListings(listings);
  }

  /**
   * Ferme le navigateur et les connexions
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    await this.dbManager.close();
  }

  /**
   * Fonction utilitaire pour attendre un délai
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
