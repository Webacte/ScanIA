/**
 * Client HTTP personnalisé pour contourner la détection de Leboncoin
 * 
 * Cette classe implémente une approche directe avec fetch/axios
 * sans utiliser Playwright ou Selenium
 */

import { RateLimiter } from '../utils/RateLimiter';

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  userAgent?: string;
  body?: any;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  url: string;
}

export class CustomHttpClient {
  private rateLimiter: RateLimiter;
  private sessionCookies: Map<string, string> = new Map();
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];

  constructor() {
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Effectue une requête HTTP GET
   */
  async get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    await this.rateLimiter.waitForNextRequest();
    
    const headers = this.buildHeaders(options);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      console.log(`🌐 Requête GET vers: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      // Extraire les cookies de la réponse
      this.extractCookies(response);

      const body = await response.text();
      
      console.log(`✅ Réponse ${response.status} reçue (${body.length} caractères)`);

      return {
        status: response.status,
        headers: this.headersToObject(response.headers),
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
   * Effectue une requête HTTP POST
   */
  async post(url: string, data: any, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    await this.rateLimiter.waitForNextRequest();
    
    const headers = this.buildHeaders(options);
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      console.log(`🌐 Requête POST vers: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: this.encodeFormData(data),
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      // Extraire les cookies de la réponse
      this.extractCookies(response);

      const body = await response.text();
      
      console.log(`✅ Réponse ${response.status} reçue (${body.length} caractères)`);

      return {
        status: response.status,
        headers: this.headersToObject(response.headers),
        body,
        url: response.url
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Construit les headers réalistes
   */
  protected buildHeaders(options: HttpRequestOptions): Record<string, string> {
    const userAgent = options.userAgent || this.getRandomUserAgent();
    
    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
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
      ...options.headers
    };

    // Ajouter les cookies de session
    const cookieString = this.buildCookieString();
    if (cookieString) {
      headers['Cookie'] = cookieString;
    }

    return headers;
  }

  /**
   * Obtient un User-Agent aléatoire
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Extrait les cookies de la réponse
   */
  private extractCookies(response: Response): void {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(',').map(cookie => cookie.trim());
      cookies.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          this.sessionCookies.set(name.trim(), value.trim());
        }
      });
    }
  }

  /**
   * Construit la chaîne de cookies pour les requêtes
   */
  private buildCookieString(): string {
    const cookies: string[] = [];
    this.sessionCookies.forEach((value, name) => {
      cookies.push(`${name}=${value}`);
    });
    return cookies.join('; ');
  }

  /**
   * Convertit les headers en objet
   */
  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Encode les données de formulaire
   */
  private encodeFormData(data: any): string {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => {
      params.append(key, data[key]);
    });
    return params.toString();
  }

  /**
   * Simule un comportement humain avec des délais aléatoires
   */
  async simulateHumanBehavior(): Promise<void> {
    const delay = Math.random() * 2000 + 1000; // 1-3 secondes
    console.log(`👤 Simulation comportement humain: attente de ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Nettoie les cookies de session
   */
  clearSession(): void {
    this.sessionCookies.clear();
    console.log('🧹 Session nettoyée');
  }

  /**
   * Obtient les statistiques de la session
   */
  getSessionStats(): { cookieCount: number; userAgent: string } {
    return {
      cookieCount: this.sessionCookies.size,
      userAgent: this.getRandomUserAgent()
    };
  }
}
