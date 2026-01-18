/**
 * Scraper Leboncoin avec comportement humain réaliste
 * 
 * Cette classe améliore la crédibilité humaine avec :
 * - Délais variables et réalistes
 * - Comportements aléatoires
 * - Pagination intelligente
 * - Simulation de navigation humaine
 */

import { SimpleLeboncoinScraper } from './SimpleLeboncoinScraper';
import { ListingData } from '../types';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { CaptchaManager } from './CaptchaManager';
import { CaptchaDetector } from './CaptchaDetector';
import { DatabaseManager } from '../database/DatabaseManager';

export interface HumanBehaviorConfig {
  minDelayBetweenRequests: number; // Délai minimum entre requêtes (ms)
  maxDelayBetweenRequests: number; // Délai maximum entre requêtes (ms)
  minDelayBetweenPages: number;    // Délai minimum entre pages (ms)
  maxDelayBetweenPages: number;    // Délai maximum entre pages (ms)
  maxPagesPerSession: number;      // Nombre maximum de pages par session
  sessionBreakDuration: number;    // Durée de pause entre sessions (ms)
  randomScrollBehavior: boolean;   // Simuler le scroll aléatoire
  randomClickBehavior: boolean;    // Simuler des clics aléatoires
  realisticUserAgent: boolean;     // Utiliser des User-Agents réalistes
  duplicateThreshold: number;      // Seuil de doublons pour passer à l'URL suivante (0-1)
  minListingsToCheck: number;      // Nombre minimum d'annonces à vérifier avant de décider
}

export class HumanLikeLeboncoinScraper extends SimpleLeboncoinScraper {
  private config: HumanBehaviorConfig;
  private sessionStartTime: number = 0;
  private pagesScrapedInSession: number = 0;
  private totalRequestsInSession: number = 0;
  private captchaManager: CaptchaManager;
  private captchaStats = { detected: 0, solved: 0, failed: 0 };
  private duplicateDetectionStats = { 
    urlsSkipped: 0, 
    totalDuplicatesDetected: 0, 
    totalListingsChecked: 0 
  };
  private dbManager?: DatabaseManager;

  constructor(config: HumanBehaviorConfig = {
    minDelayBetweenRequests: 5000,  // 5 secondes minimum (réduit)
    maxDelayBetweenRequests: 10000, // 10 secondes maximum (réduit)
    minDelayBetweenPages: 8000,     // 8 secondes minimum entre pages (réduit)
    maxDelayBetweenPages: 15000,    // 15 secondes maximum entre pages (réduit)
    maxPagesPerSession: 2,          // Maximum 2 pages par session
    sessionBreakDuration: 30000,    // 30 secondes de pause entre sessions (réduit de 10min à 30s)
    randomScrollBehavior: true,
    randomClickBehavior: true,
    realisticUserAgent: true,
    duplicateThreshold: 0.8,        // 80% de doublons = passer à l'URL suivante
    minListingsToCheck: 10          // Vérifier au moins 10 annonces avant de décider
  }) {
    super();
    this.config = config;
    this.sessionStartTime = Date.now();
    
    // Initialiser le gestionnaire de captcha
    this.captchaManager = new CaptchaManager({
      manualMode: true,
      savePages: true,
      autoOpenBrowser: true,
      retryDelay: 30000,
      maxRetries: 3
    });
    
    console.log('👤 Scraper Leboncoin avec comportement humain initialisé');
    console.log(`🔧 Configuration: ${this.config.maxPagesPerSession} pages max/session, délais ${this.config.minDelayBetweenRequests}-${this.config.maxDelayBetweenPages}ms`);
    console.log('🛡️ Gestionnaire de captcha activé');
    console.log(`🔍 Détection de doublons: seuil ${Math.round(this.config.duplicateThreshold * 100)}%, min ${this.config.minListingsToCheck} annonces`);
  }

  /**
   * Initialise le gestionnaire de base de données pour la détection de doublons
   */
  setDatabaseManager(dbManager: DatabaseManager): void {
    this.dbManager = dbManager;
    console.log('💾 Gestionnaire de base de données configuré pour la détection de doublons');
  }

  /**
   * Vérifie si une URL contient trop de doublons et doit être skippée
   */
  private async shouldSkipUrlDueToDuplicates(listings: ListingData[]): Promise<boolean> {
    if (!this.dbManager || listings.length < this.config.minListingsToCheck) {
      return false;
    }

    try {
      console.log(`🔍 Vérification des doublons: ${listings.length} annonces à analyser...`);
      
      let duplicateCount = 0;
      const sampleSize = Math.min(listings.length, 20); // Vérifier max 20 annonces pour la performance
      
      for (let i = 0; i < sampleSize; i++) {
        const listing = listings[i];
        if (listing.external_id) {
          const exists = await this.dbManager.listingExists(1, listing.external_id); // source_id = 1 pour Leboncoin
          if (exists) {
            duplicateCount++;
          }
        }
      }

      const duplicateRate = duplicateCount / sampleSize;
      this.duplicateDetectionStats.totalDuplicatesDetected += duplicateCount;
      this.duplicateDetectionStats.totalListingsChecked += sampleSize;

      console.log(`📊 Taux de doublons: ${Math.round(duplicateRate * 100)}% (${duplicateCount}/${sampleSize})`);

      if (duplicateRate >= this.config.duplicateThreshold) {
        console.log(`⏭️ URL skippée: ${Math.round(duplicateRate * 100)}% de doublons >= seuil ${Math.round(this.config.duplicateThreshold * 100)}%`);
        this.duplicateDetectionStats.urlsSkipped++;
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Erreur lors de la vérification des doublons:', error);
      return false; // En cas d'erreur, continuer le scraping
    }
  }

  /**
   * Scrape avec comportement humain et pagination
   */
  async scrapeWithHumanBehavior(searchUrl: string): Promise<ListingData[]> {
    console.log(`👤 Début du scraping avec comportement humain: ${searchUrl}`);
    
    const allListings: ListingData[] = [];
    let currentPage = 1;
    let currentUrl = searchUrl;

    try {
      while (currentPage <= this.config.maxPagesPerSession) {
        console.log(`📄 Scraping page ${currentPage}/${this.config.maxPagesPerSession}...`);
        
        // Vérifier si on doit faire une pause de session
        if (this.shouldTakeSessionBreak()) {
          await this.takeSessionBreak();
        }
        
        // Délai humain avant la requête
        await this.humanLikeDelay('request');
        
        // Simuler un comportement de navigation
        await this.simulateHumanNavigation();
        
        // Scraper la page
        const pageListings = await this.scrapeSinglePageWithHumanBehavior(currentUrl);
        
        if (pageListings.length === 0) {
          console.log('📭 Aucune annonce trouvée sur cette page');
          break;
        }

        console.log(`✅ ${pageListings.length} annonces extraites de la page ${currentPage}`);
        allListings.push(...pageListings);
        this.pagesScrapedInSession++;
        this.totalRequestsInSession++;

        // Vérifier les doublons après la première page pour décider si on continue
        if (currentPage === 1 && await this.shouldSkipUrlDueToDuplicates(pageListings)) {
          console.log('⏭️ Arrêt du scraping de cette URL: trop de doublons détectés');
          break;
        }

        // Chercher la page suivante
        const nextPageUrl = await this.findNextPageUrlWithHumanBehavior(currentUrl);
        if (!nextPageUrl) {
          console.log('📄 Aucune page suivante trouvée');
          break;
        }

        currentUrl = nextPageUrl;
        currentPage++;

        // Délai humain entre les pages
        if (currentPage <= this.config.maxPagesPerSession) {
          await this.humanLikeDelay('page');
          await this.simulatePageTransitionBehavior();
        }
      }

      console.log(`🎉 Scraping terminé: ${allListings.length} annonces au total`);
      console.log(`📊 Session: ${this.pagesScrapedInSession} pages, ${this.totalRequestsInSession} requêtes`);
      
      return allListings;

    } catch (error) {
      console.error('❌ Erreur lors du scraping avec comportement humain:', error);
      throw error;
    }
  }

  /**
   * Scrape une page avec comportement humain et gestion des captchas
   */
  private async scrapeSinglePageWithHumanBehavior(url: string): Promise<ListingData[]> {
    let response = await this.makeHumanLikeRequest(url);
    
    // Vérifier si on a un captcha
    if (response.status === 403 || response.status === 429 || this.containsCaptcha(response.body)) {
      console.log('🚨 Captcha détecté, tentative de résolution...');
      this.captchaStats.detected++;
      
      const solution = await this.captchaManager.handleCaptcha(
        response.body, 
        url, 
        response.headers as Record<string, string>
      );
      
      if (solution.solved) {
        this.captchaStats.solved++;
        console.log('✅ Captcha résolu, nouvelle tentative...');
        
        // Réessayer avec les nouveaux headers si disponibles
        if (solution.headers) {
          response = await this.makeHumanLikeRequest(url, solution.headers);
        } else {
          // Attendre un peu et réessayer
          await new Promise(resolve => setTimeout(resolve, 5000));
          response = await this.makeHumanLikeRequest(url);
        }
      } else {
        this.captchaStats.failed++;
        console.log('❌ Impossible de résoudre le captcha:', solution.error);
        throw new Error(`Captcha non résolu: ${solution.error}`);
      }
    }
    
    if (response.status !== 200) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const dom = new JSDOM(response.body);
    const document = dom.window.document;
    
    // Simuler un comportement de lecture
    await this.simulateReadingBehavior(response.body.length);
    
    return this.extractListingsFromHtml(document, response.url);
  }

  /**
   * Vérifie si le contenu contient un captcha
   */
  private containsCaptcha(html: string): boolean {
    const captchaKeywords = [
      'captcha', 'hcaptcha', 'recaptcha', 'cloudflare',
      'verification', 'robot', 'spam', 'blocked',
      'suspicious activity', 'too many requests',
      'rate limit', 'access denied', 'challenge'
    ];
    
    const htmlLower = html.toLowerCase();
    return captchaKeywords.some(keyword => htmlLower.includes(keyword));
  }

  /**
   * Effectue une requête avec comportement humain
   */
  private async makeHumanLikeRequest(url: string, customHeaders?: Record<string, string>): Promise<{ status: number; body: string; url: string; headers: Record<string, string> }> {
    this.requestCount++;
    
    try {
      // User-Agent réaliste et variable
      const userAgent = this.config.realisticUserAgent ? this.getRandomUserAgent() : 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      // Fusionner les headers par défaut avec les headers personnalisés
      const requestHeaders = {
        'User-Agent': userAgent,
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
        ...customHeaders // Fusionner les headers personnalisés
      };

      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders
      });

      const body = await response.text();
      this.lastRequestTime = Date.now();

      // Convertir les headers de réponse en format simple
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        body,
        url: response.url,
        headers: responseHeaders
      };

    } catch (error) {
      console.error(`❌ Erreur requête vers ${url}:`, (error as Error).message);
      throw error;
    }
  }

  /**
   * Trouve l'URL de la page suivante avec comportement humain
   */
  private async findNextPageUrlWithHumanBehavior(currentUrl: string): Promise<string | null> {
    try {
      // Délai avant de chercher la page suivante
      await this.humanLikeDelay('navigation');
      
      const response = await this.makeHumanLikeRequest(currentUrl);
      const dom = new JSDOM(response.body);
      const document = dom.window.document;
      
      return this.findNextPageUrlFromDocument(document, currentUrl);
    } catch (error) {
      console.error('Erreur lors de la recherche de la page suivante:', (error as Error).message);
      return null;
    }
  }

  /**
   * Trouve l'URL de la page suivante dans le document (CORRIGÉ)
   */
  private findNextPageUrlFromDocument(document: Document, currentUrl: string): string | null {
    // Utiliser le bon sélecteur pour le bouton "Page suivante"
    const nextButton = document.querySelector('[data-spark-component="pagination-next-trigger"]');
    if (nextButton) {
      const href = nextButton.getAttribute('href');
      if (href) {
        return this.baseUrl + href;
      }
    }
    
    // Fallback: chercher le lien vers la page suivante
    const nextPageLink = document.querySelector('a[href*="&page="]');
    if (nextPageLink) {
      const href = nextPageLink.getAttribute('href');
      if (href && href.includes('page=')) {
        return this.baseUrl + href;
      }
    }
    
    return null;
  }

  /**
   * Délai humain variable selon le contexte
   */
  private async humanLikeDelay(context: 'request' | 'page' | 'navigation'): Promise<void> {
    let minDelay: number;
    let maxDelay: number;
    
    switch (context) {
      case 'request':
        minDelay = this.config.minDelayBetweenRequests;
        maxDelay = this.config.maxDelayBetweenRequests;
        break;
      case 'page':
        minDelay = this.config.minDelayBetweenPages;
        maxDelay = this.config.maxDelayBetweenPages;
        break;
      case 'navigation':
        minDelay = 2000;
        maxDelay = 5000;
        break;
    }
    
    // Ajouter de la variabilité selon l'heure
    const hour = new Date().getHours();
    let timeMultiplier = 1;
    
    if (hour >= 22 || hour <= 6) {
      timeMultiplier = 1.5; // Plus lent la nuit
    } else if (hour >= 12 && hour <= 14) {
      timeMultiplier = 0.8; // Plus rapide à midi
    }
    
    const delay = (Math.random() * (maxDelay - minDelay) + minDelay) * timeMultiplier;
    console.log(`👤 Délai humain (${context}): ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simule un comportement de navigation humain
   */
  private async simulateHumanNavigation(): Promise<void> {
    if (!this.config.randomClickBehavior) return;
    
    // Simuler des mouvements de souris aléatoires
    const mouseMovements = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < mouseMovements; i++) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    }
    
    // Simuler un scroll aléatoire
    if (this.config.randomScrollBehavior) {
      const scrollDelay = Math.random() * 1000 + 500;
      await new Promise(resolve => setTimeout(resolve, scrollDelay));
    }
  }

  /**
   * Simule un comportement de lecture
   */
  private async simulateReadingBehavior(contentLength: number): Promise<void> {
    // Temps de lecture basé sur la longueur du contenu
    const readingTime = Math.min(
      contentLength * 0.01, // 10ms par caractère
      5000 // Maximum 5 secondes
    );
    
    console.log(`📖 Simulation lecture: ${Math.round(readingTime)}ms`);
    await new Promise(resolve => setTimeout(resolve, readingTime));
  }

  /**
   * Simule un comportement de transition entre pages
   */
  private async simulatePageTransitionBehavior(): Promise<void> {
    console.log('🔄 Simulation transition entre pages...');
    
    // Simuler un scroll vers le bas puis vers le haut
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    // Simuler un clic sur le bouton suivant
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
  }

  /**
   * Vérifie si on doit faire une pause de session
   */
  private shouldTakeSessionBreak(): boolean {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const maxSessionDuration = 5 * 60 * 1000; // 5 minutes (réduit de 10 à 5)
    
    return sessionDuration > maxSessionDuration || 
           this.pagesScrapedInSession >= this.config.maxPagesPerSession;
  }

  /**
   * Prend une pause de session
   */
  private async takeSessionBreak(): Promise<void> {
    console.log(`☕ Pause de session: ${Math.round(this.config.sessionBreakDuration / 1000)}s`);
    console.log(`📊 Session terminée: ${this.pagesScrapedInSession} pages, ${this.totalRequestsInSession} requêtes`);
    
    // Réduire la pause pour éviter les blocages
    const shortBreak = Math.min(this.config.sessionBreakDuration, 30000); // Maximum 30 secondes
    console.log(`⏱️ Pause réduite à: ${Math.round(shortBreak / 1000)}s pour éviter les blocages`);
    
    await new Promise(resolve => setTimeout(resolve, shortBreak));
    
    // Réinitialiser la session
    this.sessionStartTime = Date.now();
    this.pagesScrapedInSession = 0;
    this.totalRequestsInSession = 0;
    
    console.log('🔄 Nouvelle session démarrée');
  }

  /**
   * Obtient un User-Agent aléatoire et réaliste
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Obtient les statistiques de la session
   */
  getSessionStats(): {
    pagesScraped: number;
    requestsMade: number;
    sessionDuration: number;
    timeSinceLastRequest: number;
    captchaStats: { detected: number; solved: number; failed: number };
    duplicateDetectionStats: { urlsSkipped: number; totalDuplicatesDetected: number; totalListingsChecked: number };
  } {
    return {
      pagesScraped: this.pagesScrapedInSession,
      requestsMade: this.totalRequestsInSession,
      sessionDuration: Date.now() - this.sessionStartTime,
      timeSinceLastRequest: Date.now() - this.lastRequestTime,
      captchaStats: this.captchaStats,
      duplicateDetectionStats: this.duplicateDetectionStats
    };
  }

  /**
   * Affiche les statistiques des captchas
   */
  displayCaptchaStats(): void {
    console.log('🛡️ Statistiques des Captchas:');
    console.log(`   📊 Détectés: ${this.captchaStats.detected}`);
    console.log(`   ✅ Résolus: ${this.captchaStats.solved}`);
    console.log(`   ❌ Échoués: ${this.captchaStats.failed}`);
    
    if (this.captchaStats.detected > 0) {
      const successRate = Math.round((this.captchaStats.solved / this.captchaStats.detected) * 100);
      console.log(`   📈 Taux de réussite: ${successRate}%`);
    }
  }

  /**
   * Affiche les statistiques de détection de doublons
   */
  displayDuplicateDetectionStats(): void {
    console.log('🔍 Statistiques de Détection de Doublons:');
    console.log(`   ⏭️ URLs skippées: ${this.duplicateDetectionStats.urlsSkipped}`);
    console.log(`   📊 Doublons détectés: ${this.duplicateDetectionStats.totalDuplicatesDetected}`);
    console.log(`   🔍 Annonces vérifiées: ${this.duplicateDetectionStats.totalListingsChecked}`);
    
    if (this.duplicateDetectionStats.totalListingsChecked > 0) {
      const duplicateRate = Math.round((this.duplicateDetectionStats.totalDuplicatesDetected / this.duplicateDetectionStats.totalListingsChecked) * 100);
      console.log(`   📈 Taux global de doublons: ${duplicateRate}%`);
    }
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<HumanBehaviorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Configuration du comportement humain mise à jour');
  }

  /**
   * Réinitialise la session
   */
  resetSession(): void {
    this.sessionStartTime = Date.now();
    this.pagesScrapedInSession = 0;
    this.totalRequestsInSession = 0;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    console.log('🔄 Session réinitialisée');
  }
}
