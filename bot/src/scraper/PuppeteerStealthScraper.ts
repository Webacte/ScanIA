/**
 * Scraper Leboncoin utilisant Puppeteer + Stealth
 * 
 * Cette classe utilise Puppeteer avec le plugin stealth
 * pour éviter la détection anti-bot
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ListingData } from '../types';

// Ajouter le plugin stealth
puppeteer.use(StealthPlugin());

export class PuppeteerStealthScraper {
  private browser: any = null;
  private page: any = null;
  private baseUrl: string = 'https://www.leboncoin.fr';

  constructor() {
    // Configuration Puppeteer
  }

  /**
   * Initialise le navigateur avec options de contournement
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initialisation de Puppeteer avec plugin stealth...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Mode visible pour debug
      slowMo: 100, // Ralentir les actions
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    this.page = await this.browser.newPage();

    // Configuration de la page
    await this.page.setViewport({ width: 1366, height: 768 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Headers supplémentaires
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    console.log('✅ Puppeteer initialisé avec succès');
  }

  /**
   * Scrape les résultats de recherche
   */
  async scrapeSearchResults(searchUrl: string, maxPages: number = 2): Promise<ListingData[]> {
    if (!this.page) {
      throw new Error('Page non initialisée');
    }

    console.log(`🔍 Début du scraping Puppeteer: ${searchUrl}`);
    
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    try {
      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}/${maxPages}...`);
        
        // Naviguer vers la page
        await this.page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Simuler un comportement humain
        await this.simulateHumanBehavior();
        
        // Extraire les annonces
        const pageListings = await this.extractListingsFromPage();
        
        if (pageListings.length === 0) {
          console.log('📭 Aucune annonce trouvée sur cette page');
          break;
        }

        console.log(`✅ ${pageListings.length} annonces extraites de la page ${currentPage}`);
        allListings.push(...pageListings);

        // Chercher la page suivante
        const nextPageUrl = await this.findNextPageUrl();
        if (!nextPageUrl) {
          console.log('📄 Aucune page suivante trouvée');
          break;
        }

        currentUrl = nextPageUrl;
        currentPage++;

        // Attendre entre les pages
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
   * Extrait les annonces de la page actuelle
   */
  private async extractListingsFromPage(): Promise<ListingData[]> {
    if (!this.page) return [];

    const listings: ListingData[] = [];

    try {
      // Attendre que les annonces se chargent
      await this.page.waitForSelector('[data-qa-id="aditem_container"], [data-qa-id="aditem"], article', { timeout: 10000 });
      
      // Extraire les annonces
      const pageListings = await this.page.evaluate(() => {
        const listings: any[] = [];
        
        // Sélecteurs pour les annonces
        const selectors = [
          '[data-qa-id="aditem_container"]',
          '[data-qa-id="aditem"]',
          'article'
        ];
        
        let listingElements: Element[] = [];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            listingElements = Array.from(elements);
            break;
          }
        }
        
        console.log(`🔍 ${listingElements.length} éléments d'annonces trouvés`);

        listingElements.forEach((element, index) => {
          try {
            // Extraire l'URL et l'ID externe
            const linkElement = element.querySelector('a') as HTMLAnchorElement;
            if (!linkElement) return;

            const url = linkElement.href;
            const external_id = url.match(/\/(\d+)$/)?.[1] || '';

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
                if (title) break;
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
                const cleanPrice = priceText.replace(/[^\d]/g, '');
                const price = parseInt(cleanPrice);
                price_cents = isNaN(price) ? 0 : price * 100;
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
                if (location) break;
              }
            }

            // Extraire l'image
            const imageElement = element.querySelector('img') as HTMLImageElement;
            const image_url = imageElement?.src || '';

            // Vérifier la livraison
            const hasShipping = element.textContent?.toLowerCase().includes('livraison') || false;

            // Validation des données essentielles
            if (external_id && title && price_cents > 0) {
              listings.push({
                external_id,
                title,
                price_cents,
                url: url.startsWith('http') ? url : `https://www.leboncoin.fr${url}`,
                location,
                has_shipping: hasShipping,
                image_url: image_url.startsWith('http') ? image_url : `https://www.leboncoin.fr${image_url}`
              });
            }
          } catch (error) {
            console.error('Erreur lors de l\'extraction d\'une annonce:', error);
          }
        });

        return listings;
      });

      listings.push(...pageListings);

    } catch (error) {
      console.error('Erreur lors de l\'extraction des annonces:', error);
    }

    return listings;
  }

  /**
   * Trouve l'URL de la page suivante
   */
  private async findNextPageUrl(): Promise<string | null> {
    if (!this.page) return null;

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
      try {
        const nextElement = await this.page.$(selector);
        if (nextElement) {
          const href = await this.page.evaluate((el: any) => el.href, nextElement);
          if (href) {
            return href;
          }
        }
      } catch (e) {
        // Continuer avec le prochain sélecteur
      }
    }

    return null;
  }

  /**
   * Simule un comportement humain
   */
  private async simulateHumanBehavior(): Promise<void> {
    if (!this.page) return;

    // Attendre un délai aléatoire
    const delay = Math.random() * 2000 + 1000; // 1-3 secondes
    await new Promise(resolve => setTimeout(resolve, delay));

    // Faire défiler la page
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }

  /**
   * Ferme le navigateur
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Navigateur Puppeteer fermé');
    }
  }
}
