/**
 * Gestionnaire de headers avancés pour éviter la détection
 * 
 * Cette classe génère des headers réalistes et variés
 * pour simuler différents navigateurs et appareils
 */

export interface BrowserProfile {
  name: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  secChUa: string;
  secChUaMobile: string;
  secChUaPlatform: string;
  viewportWidth: string;
  deviceMemory: string;
  hardwareConcurrency: string;
}

export class AdvancedHeadersManager {
  private browserProfiles: BrowserProfile[] = [];
  private currentProfileIndex: number = 0;

  constructor() {
    this.initializeBrowserProfiles();
  }

  /**
   * Initialise les profils de navigateurs réalistes
   */
  private initializeBrowserProfiles(): void {
    this.browserProfiles = [
      // Chrome Windows
      {
        name: 'Chrome Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        acceptLanguage: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        acceptEncoding: 'gzip, deflate, br',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        secChUaMobile: '?0',
        secChUaPlatform: '"Windows"',
        viewportWidth: '1920',
        deviceMemory: '8',
        hardwareConcurrency: '8'
      },
      // Chrome Mac
      {
        name: 'Chrome Mac',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        acceptLanguage: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        acceptEncoding: 'gzip, deflate, br',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        secChUaMobile: '?0',
        secChUaPlatform: '"macOS"',
        viewportWidth: '1440',
        deviceMemory: '8',
        hardwareConcurrency: '8'
      },
      // Firefox Windows
      {
        name: 'Firefox Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
        acceptLanguage: 'fr-FR,fr;q=0.8,en-US;q=0.5,en;q=0.3',
        acceptEncoding: 'gzip, deflate, br',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        secChUaMobile: '?0',
        secChUaPlatform: '"Windows"',
        viewportWidth: '1920',
        deviceMemory: '8',
        hardwareConcurrency: '8'
      },
      // Safari Mac
      {
        name: 'Safari Mac',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
        acceptLanguage: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        acceptEncoding: 'gzip, deflate, br',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        secChUaMobile: '?0',
        secChUaPlatform: '"macOS"',
        viewportWidth: '1440',
        deviceMemory: '8',
        hardwareConcurrency: '8'
      },
      // Chrome Linux
      {
        name: 'Chrome Linux',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        acceptLanguage: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        acceptEncoding: 'gzip, deflate, br',
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        secChUaMobile: '?0',
        secChUaPlatform: '"Linux"',
        viewportWidth: '1920',
        deviceMemory: '8',
        hardwareConcurrency: '8'
      }
    ];

    console.log(`🔧 ${this.browserProfiles.length} profils de navigateurs initialisés`);
  }

  /**
   * Obtient le prochain profil de navigateur
   */
  getNextProfile(): BrowserProfile {
    const profile = this.browserProfiles[this.currentProfileIndex];
    this.currentProfileIndex = (this.currentProfileIndex + 1) % this.browserProfiles.length;
    return profile;
  }

  /**
   * Obtient un profil aléatoire
   */
  getRandomProfile(): BrowserProfile {
    const randomIndex = Math.floor(Math.random() * this.browserProfiles.length);
    return this.browserProfiles[randomIndex];
  }

  /**
   * Génère des headers avancés basés sur un profil
   */
  generateAdvancedHeaders(profile: BrowserProfile, options: {
    referrer?: string;
    origin?: string;
    customHeaders?: Record<string, string>;
  } = {}): Record<string, string> {
    const headers: Record<string, string> = {
      // Headers de base
      'User-Agent': profile.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': profile.acceptLanguage,
      'Accept-Encoding': profile.acceptEncoding,
      
      // Headers de sécurité
      'Sec-Ch-Ua': profile.secChUa,
      'Sec-Ch-Ua-Mobile': profile.secChUaMobile,
      'Sec-Ch-Ua-Platform': profile.secChUaPlatform,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      
      // Headers de connexion
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'Pragma': 'no-cache',
      
      // Headers de confidentialité
      'DNT': '1',
      'Sec-GPC': '1',
      
      // Headers de performance
      'Viewport-Width': profile.viewportWidth,
      'Device-Memory': profile.deviceMemory,
      'DPR': '1',
      
      // Headers de priorité
      'Priority': 'u=1, i',
      'Purpose': 'prefetch',
      
      // Headers de compatibilité
      'TE': 'trailers',
      'Alt-Used': 'www.leboncoin.fr'
    };

    // Ajouter le referrer si fourni
    if (options.referrer) {
      headers['Referer'] = options.referrer;
    }

    // Ajouter l'origin si fourni
    if (options.origin) {
      headers['Origin'] = options.origin;
    }

    // Ajouter des headers personnalisés
    if (options.customHeaders) {
      Object.assign(headers, options.customHeaders);
    }

    // Ajouter des headers de fingerprinting avancés
    headers['X-Requested-With'] = 'XMLHttpRequest';
    headers['X-Forwarded-For'] = this.generateRandomIP();
    headers['X-Real-IP'] = this.generateRandomIP();
    headers['X-Client-IP'] = this.generateRandomIP();
    headers['X-Remote-IP'] = this.generateRandomIP();
    headers['X-Originating-IP'] = this.generateRandomIP();
    headers['X-Remote-Addr'] = this.generateRandomIP();

    return headers;
  }

  /**
   * Génère une IP aléatoire pour les headers de proxy
   */
  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  /**
   * Génère des headers pour une requête de recherche
   */
  generateSearchHeaders(profile: BrowserProfile): Record<string, string> {
    return this.generateAdvancedHeaders(profile, {
      referrer: 'https://www.google.com/search?q=leboncoin',
      origin: 'https://www.leboncoin.fr',
      customHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.generateCSRFToken(),
        'X-Session-ID': this.generateSessionID()
      }
    });
  }

  /**
   * Génère des headers pour une requête de détail d'annonce
   */
  generateDetailHeaders(profile: BrowserProfile, referrer: string): Record<string, string> {
    return this.generateAdvancedHeaders(profile, {
      referrer: referrer,
      origin: 'https://www.leboncoin.fr',
      customHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.generateCSRFToken(),
        'X-Session-ID': this.generateSessionID()
      }
    });
  }

  /**
   * Génère un token CSRF aléatoire
   */
  private generateCSRFToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Génère un ID de session aléatoire
   */
  private generateSessionID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Obtient tous les profils disponibles
   */
  getAllProfiles(): BrowserProfile[] {
    return [...this.browserProfiles];
  }

  /**
   * Obtient le profil actuel
   */
  getCurrentProfile(): BrowserProfile {
    return this.browserProfiles[this.currentProfileIndex];
  }

  /**
   * Réinitialise l'index des profils
   */
  resetProfileIndex(): void {
    this.currentProfileIndex = 0;
  }
}
