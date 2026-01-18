/**
 * Client HTTP avec support RÉEL des proxies rotatifs
 * 
 * Cette classe implémente vraiment l'utilisation de proxies
 * pour contourner la détection par IP
 */

import { CustomHttpClient, HttpRequestOptions, HttpResponse } from './CustomHttpClient';
import { ProxyManager, ProxyConfig } from './ProxyManager';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fetch from 'node-fetch';

export class RealProxyHttpClient extends CustomHttpClient {
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
   * Effectue une requête GET avec rotation de proxy RÉELLE
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
        
        // Effectuer la vraie requête avec proxy
        const response = await this.makeRealRequestWithProxy(url, options, proxy);
        
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
   * Effectue une requête POST avec rotation de proxy RÉELLE
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
        
        // Effectuer la vraie requête avec proxy
        const response = await this.makeRealRequestWithProxy(url, { ...options, body: data }, proxy);
        
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
   * Effectue une vraie requête avec un proxy spécifique
   */
  private async makeRealRequestWithProxy(url: string, options: HttpRequestOptions, proxy: ProxyConfig): Promise<HttpResponse> {
    console.log(`🌐 Requête RÉELLE via proxy ${proxy.host}:${proxy.port} vers: ${url}`);
    
    // Construire l'URL du proxy
    const proxyUrl = this.buildProxyUrl(proxy);
    
    // Créer l'agent proxy approprié
    let agent: any;
    
    if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
      agent = new SocksProxyAgent(proxyUrl);
    } else if (url.startsWith('https:')) {
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
        headers: this.headersToObjectReal(response.headers),
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
   * Construit l'URL du proxy
   */
  private buildProxyUrl(proxy: ProxyConfig): string {
    let proxyUrl = `${proxy.protocol}://`;
    
    if (proxy.username && proxy.password) {
      proxyUrl += `${proxy.username}:${proxy.password}@`;
    }
    
    proxyUrl += `${proxy.host}:${proxy.port}`;
    
    return proxyUrl;
  }

  /**
   * Convertit les headers en objet
   */
  private headersToObjectReal(headers: any): Record<string, string> {
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
