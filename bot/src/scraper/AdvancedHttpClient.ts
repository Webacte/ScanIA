/**
 * Client HTTP avancé avec techniques de contournement
 * 
 * Implémente des techniques avancées pour contourner
 * la détection anti-bot de Leboncoin
 */

import { CustomHttpClient, HttpRequestOptions, HttpResponse } from './CustomHttpClient';

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export class AdvancedHttpClient extends CustomHttpClient {
  private proxyList: ProxyConfig[] = [];
  private currentProxyIndex: number = 0;
  private requestHistory: Array<{ timestamp: number; success: boolean }> = [];
  private sessionFingerprint: string = '';

  constructor() {
    super();
    this.generateSessionFingerprint();
  }

  /**
   * Génère une empreinte de session unique
   */
  private generateSessionFingerprint(): void {
    const components = [
      Math.random().toString(36).substring(2),
      Date.now().toString(36),
      Math.random().toString(36).substring(2)
    ];
    this.sessionFingerprint = components.join('-');
  }

  /**
   * Ajoute une liste de proxies
   */
  addProxies(proxies: ProxyConfig[]): void {
    this.proxyList = [...this.proxyList, ...proxies];
    console.log(`🔧 ${proxies.length} proxies ajoutés (total: ${this.proxyList.length})`);
  }

  /**
   * Obtient le prochain proxy de la liste
   */
  private getNextProxy(): ProxyConfig | null {
    if (this.proxyList.length === 0) return null;
    
    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    return proxy;
  }

  /**
   * Effectue une requête avec rotation de proxy
   */
  async getWithProxy(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    const proxy = this.getNextProxy();
    
    if (proxy) {
      console.log(`🔄 Utilisation du proxy: ${proxy.host}:${proxy.port}`);
      // Note: L'implémentation des proxies nécessiterait une bibliothèque comme 'https-proxy-agent'
      // Pour l'instant, on simule la rotation
    }

    return this.get(url, options);
  }

  /**
   * Construit des headers ultra-réalistes
   */
  protected buildAdvancedHeaders(options: HttpRequestOptions): Record<string, string> {
    const baseHeaders = this.buildHeaders(options);
    
    // Headers supplémentaires pour paraître plus humain
    const advancedHeaders = {
      ...baseHeaders,
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'dnt': '1',
      'connection': 'keep-alive',
      'cache-control': 'max-age=0',
      'pragma': 'no-cache',
      'x-forwarded-for': this.generateRandomIP(),
      'x-real-ip': this.generateRandomIP(),
      'x-session-id': this.sessionFingerprint,
      'x-requested-with': 'XMLHttpRequest',
      'x-devtools-emulation-network-conditions': 'offline',
      'x-devtools-emulation-geolocation': '{"latitude":48.8566,"longitude":2.3522,"accuracy":100}'
    };

    return advancedHeaders;
  }

  /**
   * Génère une IP aléatoire
   */
  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  /**
   * Simule un comportement de navigation humain
   */
  async simulateHumanNavigation(url: string): Promise<HttpResponse> {
    console.log('👤 Simulation de navigation humaine...');
    
    // 1. Visiter d'abord la page d'accueil
    const homeUrl = 'https://www.leboncoin.fr/';
    console.log('🏠 Visite de la page d\'accueil...');
    await this.get(homeUrl);
    
    // 2. Attendre un délai réaliste
    await this.simulateHumanBehavior();
    
    // 3. Visiter une page de catégorie
    const categoryUrl = 'https://www.leboncoin.fr/telephones_objets_connectes/';
    console.log('📱 Visite de la catégorie téléphones...');
    await this.get(categoryUrl);
    
    // 4. Attendre un délai réaliste
    await this.simulateHumanBehavior();
    
    // 5. Maintenant visiter la page cible
    console.log('🎯 Navigation vers la page cible...');
    return this.get(url);
  }

  /**
   * Effectue une requête avec retry intelligent
   */
  async getWithRetry(url: string, options: HttpRequestOptions = {}, maxRetries: number = 3): Promise<HttpResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${maxRetries}...`);
        
        // Utiliser des headers avancés
        const advancedOptions = {
          ...options,
          headers: this.buildAdvancedHeaders(options)
        };
        
        const response = await this.get(url, advancedOptions);
        
        // Enregistrer le succès
        this.recordRequest(true);
        
        if (response.status === 200) {
          console.log(`✅ Succès à la tentative ${attempt}`);
          return response;
        } else if (response.status === 403) {
          console.log(`🚫 403 à la tentative ${attempt}, changement de stratégie...`);
          
          // Changer de stratégie
          await this.changeStrategy();
          
          // Attendre plus longtemps
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          lastError = new Error(`403 Forbidden (tentative ${attempt})`);
        } else {
          lastError = new Error(`Status ${response.status} (tentative ${attempt})`);
        }
        
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Erreur à la tentative ${attempt}: ${lastError.message}`);
        
        // Attendre avant de réessayer
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Toutes les tentatives ont échoué');
  }

  /**
   * Change de stratégie de contournement
   */
  private async changeStrategy(): Promise<void> {
    console.log('🔄 Changement de stratégie...');
    
    // 1. Changer l'empreinte de session
    this.generateSessionFingerprint();
    
    // 2. Nettoyer les cookies
    this.clearSession();
    
    // 3. Attendre un délai aléatoire
    const delay = Math.random() * 5000 + 2000; // 2-7 secondes
    console.log(`⏳ Attente de ${Math.round(delay)}ms pour le changement de stratégie...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Enregistre l'historique des requêtes
   */
  private recordRequest(success: boolean): void {
    this.requestHistory.push({
      timestamp: Date.now(),
      success
    });
    
    // Garder seulement les 100 dernières requêtes
    if (this.requestHistory.length > 100) {
      this.requestHistory = this.requestHistory.slice(-100);
    }
  }

  /**
   * Obtient les statistiques de performance
   */
  getPerformanceStats(): {
    totalRequests: number;
    successRate: number;
    recentRequests: number;
    sessionFingerprint: string;
  } {
    const totalRequests = this.requestHistory.length;
    const successfulRequests = this.requestHistory.filter(r => r.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    
    // Requêtes des 5 dernières minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentRequests = this.requestHistory.filter(r => r.timestamp > fiveMinutesAgo).length;
    
    return {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      recentRequests,
      sessionFingerprint: this.sessionFingerprint
    };
  }

  /**
   * Teste la connectivité avec différents User-Agents
   */
  async testUserAgents(url: string): Promise<{ userAgent: string; status: number }[]> {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const results: { userAgent: string; status: number }[] = [];
    
    for (const userAgent of userAgents) {
      try {
        console.log(`🧪 Test avec User-Agent: ${userAgent.substring(0, 50)}...`);
        
        const response = await this.get(url, { userAgent });
        results.push({ userAgent, status: response.status });
        
        // Attendre entre les tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        results.push({ userAgent, status: 0 });
      }
    }
    
    return results;
  }
}
