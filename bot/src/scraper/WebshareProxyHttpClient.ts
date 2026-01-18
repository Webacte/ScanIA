/**
 * Client HTTP avec support des proxies Webshare
 * 
 * Cette classe utilise les proxies Webshare avec authentification
 * pour contourner la détection par IP
 */

import { CustomHttpClient, HttpRequestOptions, HttpResponse } from './CustomHttpClient';
import { WebshareProxyManager, WebshareProxy } from './WebshareProxyManager';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import fetch from 'node-fetch';

export class WebshareProxyHttpClient extends CustomHttpClient {
  private proxyManager: WebshareProxyManager;
  private useProxies: boolean = true;

  constructor() {
    super();
    this.proxyManager = new WebshareProxyManager();
  }

  /**
   * Active ou désactive l'utilisation des proxies
   */
  setUseProxies(useProxies: boolean): void {
    this.useProxies = useProxies;
    console.log(`🔧 Utilisation des proxies Webshare: ${useProxies ? 'activée' : 'désactivée'}`);
  }

  /**
   * Effectue une requête GET avec rotation de proxy Webshare
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
        
        // Effectuer la vraie requête avec proxy Webshare
        const response = await this.makeRequestWithWebshareProxy(url, options, proxy);
        
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
   * Effectue une requête POST avec rotation de proxy Webshare
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
        
        // Effectuer la vraie requête avec proxy Webshare
        const response = await this.makeRequestWithWebshareProxy(url, { ...options, body: data }, proxy);
        
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
   * Effectue une requête avec un proxy Webshare spécifique
   */
  private async makeRequestWithWebshareProxy(url: string, options: HttpRequestOptions, proxy: WebshareProxy): Promise<HttpResponse> {
    console.log(`🌐 Requête via proxy Webshare ${proxy.host}:${proxy.port} vers: ${url}`);
    
    // Construire l'URL du proxy avec authentification
    const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    
    // Créer l'agent proxy approprié
    let agent: any;
    
    if (url.startsWith('https:')) {
      agent = new HttpsProxyAgent(proxyUrl);
    } else {
      agent = new HttpProxyAgent(proxyUrl);
    }

    // Construire les headers
    const headers = this.buildHeaders(options);
    
    // Effectuer la requête avec le proxy
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        agent: agent,
        signal: controller.signal,
      });

      const body = await response.text();
      clearTimeout(timeoutId);

      return {
        status: response.status,
        headers: this.headersToObjectWebshare(response.headers),
        body,
        url: response.url
      };

    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new Error(`Timeout après ${options.timeout || 30000}ms`);
      }

      throw error;
    }
  }

  /**
   * Convertit les headers en objet
   */
  private headersToObjectWebshare(headers: any): Record<string, string> {
    const obj: Record<string, string> = {};
    if (headers && headers.forEach) {
      headers.forEach((value: string, key: string) => {
        obj[key] = value;
      });
    }
    return obj;
  }

  /**
   * Teste tous les proxies disponibles
   */
  async testAllProxies(testUrl: string = 'https://httpbin.org/ip', maxTests: number = 10): Promise<void> {
    console.log('🧪 Test des proxies Webshare...');
    const results = await this.proxyManager.testAllProxies(testUrl, maxTests);
    
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
    // Pas de nettoyage nécessaire pour les proxies Webshare
    console.log('🧹 Nettoyage des proxies inactifs (non applicable pour Webshare)');
  }
}
