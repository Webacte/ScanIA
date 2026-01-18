/**
 * Client HTTP furtif avec techniques de contournement avancées
 * 
 * Implémente des techniques de contournement très avancées
 * pour contourner la détection anti-bot de Leboncoin
 */

import { AdvancedHttpClient } from './AdvancedHttpClient';
import { HttpRequestOptions, HttpResponse } from './CustomHttpClient';

export class StealthHttpClient extends AdvancedHttpClient {
  private sessionTokens: Map<string, string> = new Map();
  private requestFingerprint: string = '';
  private browserFingerprint: string = '';

  constructor() {
    super();
    this.generateBrowserFingerprint();
    this.generateRequestFingerprint();
  }

  /**
   * Génère une empreinte de navigateur réaliste
   */
  private generateBrowserFingerprint(): void {
    const components = [
      'Mozilla/5.0',
      'Windows NT 10.0; Win64; x64',
      'AppleWebKit/537.36',
      'KHTML, like Gecko',
      'Chrome/120.0.0.0',
      'Safari/537.36'
    ];
    this.browserFingerprint = components.join(' ');
  }

  /**
   * Génère une empreinte de requête unique
   */
  private generateRequestFingerprint(): void {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    this.requestFingerprint = `${timestamp}-${random}`;
  }

  /**
   * Effectue une requête avec techniques de contournement avancées
   */
  async stealthGet(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    console.log('🥷 Requête furtive en cours...');
    
    // 1. Préparer la session
    await this.prepareStealthSession();
    
    // 2. Construire les headers furtifs
    const stealthHeaders = this.buildStealthHeaders(options);
    
    // 3. Effectuer la requête avec retry intelligent
    return this.getWithRetry(url, { ...options, headers: stealthHeaders }, 5);
  }

  /**
   * Prépare une session furtive
   */
  private async prepareStealthSession(): Promise<void> {
    console.log('🔧 Préparation de la session furtive...');
    
    // 1. Nettoyer la session précédente
    this.clearSession();
    
    // 2. Générer de nouveaux tokens
    this.generateSessionTokens();
    
    // 3. Attendre un délai réaliste
    const delay = Math.random() * 3000 + 2000; // 2-5 secondes
    console.log(`⏳ Attente de ${Math.round(delay)}ms pour la préparation...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Génère des tokens de session réalistes
   */
  private generateSessionTokens(): void {
    const tokens = [
      'session_id',
      'csrf_token',
      'user_token',
      'browser_id',
      'device_id'
    ];
    
    tokens.forEach(token => {
      const value = this.generateRandomToken();
      this.sessionTokens.set(token, value);
    });
    
    console.log(`🔑 ${tokens.length} tokens de session générés`);
  }

  /**
   * Génère un token aléatoire réaliste
   */
  private generateRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Construit des headers furtifs ultra-réalistes
   */
  private buildStealthHeaders(options: HttpRequestOptions): Record<string, string> {
    const baseHeaders = this.buildAdvancedHeaders(options);
    
    // Headers furtifs supplémentaires
    const stealthHeaders = {
      ...baseHeaders,
      'User-Agent': this.browserFingerprint,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'DNT': '1',
      'Connection': 'keep-alive',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': this.sessionTokens.get('csrf_token') || '',
      'X-Session-ID': this.sessionTokens.get('session_id') || '',
      'X-Device-ID': this.sessionTokens.get('device_id') || '',
      'X-Browser-ID': this.sessionTokens.get('browser_id') || '',
      'X-Request-ID': this.requestFingerprint,
      'X-Forwarded-For': this.generateRandomIPAddress(),
      'X-Real-IP': this.generateRandomIPAddress(),
      'X-Client-IP': this.generateRandomIPAddress(),
      'X-Remote-IP': this.generateRandomIPAddress(),
      'X-Originating-IP': this.generateRandomIPAddress(),
      'X-Remote-Addr': this.generateRandomIPAddress(),
      'X-Forwarded-Host': 'www.leboncoin.fr',
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-Port': '443',
      'X-Forwarded-Ssl': 'on',
      'X-Forwarded-Scheme': 'https',
      'X-Forwarded-Protocol': 'https'
    };
    
    return stealthHeaders;
  }

  /**
   * Génère une IP aléatoire
   */
  private generateRandomIPAddress(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  /**
   * Effectue une requête avec contournement de protection
   */
  async bypassProtection(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    console.log('🛡️ Tentative de contournement de protection...');
    
    // 1. Essayer avec la requête furtive
    try {
      return await this.stealthGet(url, options);
    } catch (error) {
      console.log('❌ Requête furtive échouée, essai avec navigation humaine...');
    }
    
    // 2. Essayer avec navigation humaine
    try {
      return await this.simulateHumanNavigation(url);
    } catch (error) {
      console.log('❌ Navigation humaine échouée, essai avec retry intelligent...');
    }
    
    // 3. Essayer avec retry intelligent
    try {
      return await this.getWithRetry(url, options, 5);
    } catch (error) {
      console.log('❌ Retry intelligent échoué, essai avec User-Agents...');
    }
    
    // 4. Essayer avec différents User-Agents
    const userAgentResults = await this.testUserAgents(url);
    const bestResult = userAgentResults.find(r => r.status === 200);
    
    if (bestResult) {
      console.log('✅ User-Agent fonctionnel trouvé !');
      return this.get(url, { userAgent: bestResult.userAgent });
    }
    
    throw new Error('Toutes les techniques de contournement ont échoué');
  }
}