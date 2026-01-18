/**
 * Scraper Leboncoin utilisant Selenium + Stealth
 * 
 * Cette classe utilise Selenium avec des techniques de contournement
 * pour éviter la détection anti-bot
 */

import { Builder, WebDriver, By, until, Key } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { ListingData } from '../types';

export class SeleniumStealthScraper {
  private driver: WebDriver | null = null;
  private baseUrl: string = 'https://www.leboncoin.fr';

  constructor() {
    // Configuration Selenium
  }

  /**
   * Initialise le driver Selenium avec options de contournement
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initialisation de Selenium avec options de contournement...');
    
    const chromeOptions = new ChromeOptions();
    
    // Options de contournement
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-setuid-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-accelerated-2d-canvas');
    chromeOptions.addArguments('--no-first-run');
    chromeOptions.addArguments('--no-zygote');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--disable-web-security');
    chromeOptions.addArguments('--disable-features=VizDisplayCompositor');
    chromeOptions.addArguments('--disable-extensions');
    chromeOptions.addArguments('--disable-plugins');
    chromeOptions.addArguments('--disable-images');
    chromeOptions.addArguments('--disable-javascript');
    chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    // Exécuter du JavaScript pour masquer l'automation
    await this.driver.executeScript(`
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    `);

    console.log('✅ Selenium initialisé avec succès');
  }

  /**
   * Scrape les résultats de recherche
   */
  async scrapeSearchResults(searchUrl: string, maxPages: number = 2): Promise<ListingData[]> {
    if (!this.driver) {
      throw new Error('Driver non initialisé');
    }

    console.log(`🔍 Début du scraping Selenium: ${searchUrl}`);
    
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    try {
      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}/${maxPages}...`);
        
        // Naviguer vers la page
        await this.driver.get(currentUrl);
        
        // Attendre que la page se charge
        await this.driver.wait(until.titleContains('leboncoin'), 10000);
        
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
    if (!this.driver) return [];

    const listings: ListingData[] = [];

    try {
      // Attendre que les annonces se chargent
      await this.driver.wait(until.elementsLocated(By.css('[data-qa-id="aditem_container"], [data-qa-id="aditem"], article')), 10000);
      
      // Trouver les éléments d'annonces
      const listingElements = await this.driver.findElements(By.css('[data-qa-id="aditem_container"], [data-qa-id="aditem"], article'));
      
      console.log(`🔍 ${listingElements.length} éléments d'annonces trouvés`);

      for (const element of listingElements) {
        try {
          const listing = await this.extractListingData(element);
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          console.error('Erreur lors de l\'extraction d\'une annonce:', error);
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'extraction des annonces:', error);
    }

    return listings;
  }

  /**
   * Extrait les données d'une annonce
   */
  private async extractListingData(element: any): Promise<ListingData | null> {
    try {
      // Extraire l'URL et l'ID externe
      const linkElement = await element.findElement(By.css('a')).catch(() => null);
      if (!linkElement) return null;

      const url = await linkElement.getAttribute('href');
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
        try {
          const titleElement = await element.findElement(By.css(selector));
          title = await titleElement.getText();
          if (title) break;
        } catch (e) {
          // Continuer avec le prochain sélecteur
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
        try {
          const priceElement = await element.findElement(By.css(selector));
          const priceText = await priceElement.getText();
          price_cents = this.parsePrice(priceText);
          if (price_cents > 0) break;
        } catch (e) {
          // Continuer avec le prochain sélecteur
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
        try {
          const locationElement = await element.findElement(By.css(selector));
          location = await locationElement.getText();
          if (location) break;
        } catch (e) {
          // Continuer avec le prochain sélecteur
        }
      }

      // Extraire l'image
      let image_url = '';
      try {
        const imageElement = await element.findElement(By.css('img'));
        image_url = await imageElement.getAttribute('src') || '';
      } catch (e) {
        // Pas d'image
      }

      // Vérifier la livraison
      let hasShipping = false;
      try {
        const text = await element.getText();
        hasShipping = text.toLowerCase().includes('livraison');
      } catch (e) {
        // Erreur lors de la vérification
      }

      // Validation des données essentielles
      if (!external_id || !title || price_cents <= 0) {
        return null;
      }

      return {
        external_id,
        title,
        price_cents,
        url: this.buildAbsoluteUrl(url),
        location,
        has_shipping: hasShipping,
        image_url: this.buildAbsoluteUrl(image_url)
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
      /\/(\d+)$/,
      /\/(\d+)\.htm/,
      /ad\/[^\/]+\/(\d+)/
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
  private buildAbsoluteUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    return `${this.baseUrl}/${url}`;
  }

  /**
   * Trouve l'URL de la page suivante
   */
  private async findNextPageUrl(): Promise<string | null> {
    if (!this.driver) return null;

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
        const nextElement = await this.driver.findElement(By.css(selector));
        const href = await nextElement.getAttribute('href');
        if (href) {
          return href;
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
    if (!this.driver) return;

    // Attendre un délai aléatoire
    const delay = Math.random() * 2000 + 1000; // 1-3 secondes
    await new Promise(resolve => setTimeout(resolve, delay));

    // Faire défiler la page
    await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight/2);');
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.driver.executeScript('window.scrollTo(0, 0);');
  }

  /**
   * Ferme le driver
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
      console.log('🔒 Driver Selenium fermé');
    }
  }
}
