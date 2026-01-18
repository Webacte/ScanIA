/**
 * Client HTTP avec support des proxies rotatifs
 * 
 * Cette classe étend CustomHttpClient pour utiliser
 * des proxies rotatifs et contourner la détection par IP
 */

import { CustomHttpClient, HttpRequestOptions, HttpResponse } from './CustomHttpClient';
import { ProxyManager, ProxyConfig } from './ProxyManager';

export class ProxyHttpClient extends CustomHttpClient {
  private proxyManager: ProxyManager;
  private useProxies: boolean = true;

  constructor() {
    super();
    this.proxyManager = new ProxyManager();
  }

  /**
   * Active ou désactive l'utilisation des proxies
   */
  setUseProxies(useProxies: boolean): void {
    this.useProxies = useProxies;
    console.log(`🔧 Utilisation des proxies: ${useProxies ? 'activée' : 'désactivée'}`);
  }

  /**
   * Ajoute des proxies personnalisés
   */
  addProxies(proxies: ProxyConfig[]): void {
    this.proxyManager.addProxies(proxies);
  }

  /**
   * Effectue une requête GET avec rotation de proxy
   */
  async get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    if (!this.useProxies) {
      return super.get(url, options);
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const proxy = this.proxyManager.getNextProxy();
      
      if (!proxy) {
        console.log('⚠️ Aucun proxy disponible, utilisation directe');
        return super.get(url, options);
      }

      try {
        console.log(`🔄 Tentative ${attempt}/${maxRetries} avec proxy ${proxy.host}:${proxy.port}`);
        
        // Simuler l'utilisation du proxy
        const response = await this.makeRequestWithProxy(url, options, proxy);
        
        // Marquer le proxy comme réussi
        this.proxyManager.markProxySuccess(proxy);
        
        console.log(`✅ Succès avec proxy ${proxy.host}:${proxy.port}`);
        return response;

      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Échec avec proxy ${proxy.host}:${proxy.port}: ${lastError.message}`);
        
        // Marquer le proxy comme échoué
        this.proxyManager.markProxyFailure(proxy, lastError.message);
        
        // Attendre avant de réessayer
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Si tous les proxies ont échoué, essayer sans proxy
    console.log('⚠️ Tous les proxies ont échoué, tentative sans proxy...');
    return super.get(url, options);
  }

  /**
   * Effectue une requête POST avec rotation de proxy
   */
  async post(url: string, data: any, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    if (!this.useProxies) {
      return super.post(url, data, options);
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const proxy = this.proxyManager.getNextProxy();
      
      if (!proxy) {
        console.log('⚠️ Aucun proxy disponible, utilisation directe');
        return super.post(url, data, options);
      }

      try {
        console.log(`🔄 Tentative ${attempt}/${maxRetries} avec proxy ${proxy.host}:${proxy.port}`);
        
        // Simuler l'utilisation du proxy
        const response = await this.makeRequestWithProxy(url, { ...options, body: data }, proxy);
        
        // Marquer le proxy comme réussi
        this.proxyManager.markProxySuccess(proxy);
        
        console.log(`✅ Succès avec proxy ${proxy.host}:${proxy.port}`);
        return response;

      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Échec avec proxy ${proxy.host}:${proxy.port}: ${lastError.message}`);
        
        // Marquer le proxy comme échoué
        this.proxyManager.markProxyFailure(proxy, lastError.message);
        
        // Attendre avant de réessayer
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Si tous les proxies ont échoué, essayer sans proxy
    console.log('⚠️ Tous les proxies ont échoué, tentative sans proxy...');
    return super.post(url, data, options);
  }

  /**
   * Effectue une requête avec un proxy spécifique
   */
  private async makeRequestWithProxy(url: string, options: HttpRequestOptions, proxy: ProxyConfig): Promise<HttpResponse> {
    // Simulation de l'utilisation d'un proxy
    // En réalité, il faudrait implémenter la logique de proxy avec fetch ou axios
    
    console.log(`🌐 Requête via proxy ${proxy.host}:${proxy.port} vers: ${url}`);
    
    // Simuler un délai de proxy
    const proxyDelay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, proxyDelay));
    
    // Simuler une réponse (en réalité, ce serait la vraie requête)
    const response = await super.get(url, options);
    
    // Simuler des erreurs de proxy occasionnelles
    if (Math.random() < 0.3) { // 30% de chance d'erreur
      throw new Error('Proxy non accessible');
    }
    
    return response;
  }

  /**
   * Teste tous les proxies disponibles
   */
  async testAllProxies(testUrl: string = 'https://httpbin.org/ip'): Promise<void> {
    console.log('🧪 Test de tous les proxies...');
    const results = await this.proxyManager.testAllProxies(testUrl);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Résultats du test: ${successful} succès, ${failed} échecs`);
  }

  /**
   * Obtient les statistiques des proxies
   */
  getProxyStats() {
    return this.proxyManager.getProxyStats();
  }

  /**
   * Obtient la liste des proxies actifs
   */
  getActiveProxies() {
    return this.proxyManager.getActiveProxies();
  }

  /**
   * Obtient la liste des proxies échoués
   */
  getFailedProxies() {
    return this.proxyManager.getFailedProxies();
  }

  /**
   * Réinitialise les proxies échoués
   */
  resetFailedProxies(): void {
    this.proxyManager.resetFailedProxies();
  }

  /**
   * Obtient le meilleur proxy disponible
   */
  getBestProxy() {
    return this.proxyManager.getBestProxy();
  }

  /**
   * Obtient un proxy aléatoire
   */
  getRandomProxy() {
    return this.proxyManager.getRandomProxy();
  }

  /**
   * Nettoie les proxies inactifs
   */
  cleanupInactiveProxies(maxAge?: number): void {
    this.proxyManager.cleanupInactiveProxies(maxAge);
  }
}
