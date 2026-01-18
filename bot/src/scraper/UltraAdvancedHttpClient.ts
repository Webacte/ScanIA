/**
 * Client HTTP ultra-avancé avec toutes les techniques de contournement
 * 
 * Cette classe combine :
 * - Proxies Webshare avec rotation
 * - Headers avancés et rotation de profils
 * - Simulation de comportement humain
 * - Gestion intelligente des erreurs
 */

import { WebshareProxyHttpClient } from './WebshareProxyHttpClient';
import { AdvancedHeadersManager, BrowserProfile } from './AdvancedHeadersManager';
import { HumanBehaviorSimulator } from './HumanBehaviorSimulator';
import { HttpRequestOptions, HttpResponse } from './CustomHttpClient';

export interface UltraAdvancedConfig {
  useProxies: boolean;
  useAdvancedHeaders: boolean;
  useHumanBehavior: boolean;
  maxRetries: number;
  retryDelay: number;
  sessionDuration: number;
}

export class UltraAdvancedHttpClient extends WebshareProxyHttpClient {
  private headersManager: AdvancedHeadersManager;
  private behaviorSimulator: HumanBehaviorSimulator;
  private config: UltraAdvancedConfig;
  private currentProfile: BrowserProfile | null = null;
  private requestCount: number = 0;
  private sessionStartTime: number = Date.now();

  constructor(config: UltraAdvancedConfig = {
    useProxies: true,
    useAdvancedHeaders: true,
    useHumanBehavior: true,
    maxRetries: 5,
    retryDelay: 2000,
    sessionDuration: 30 * 60 * 1000 // 30 minutes
  }) {
    super();
    this.config = config;
    this.headersManager = new AdvancedHeadersManager();
    this.behaviorSimulator = new HumanBehaviorSimulator();
    
    // Initialiser le profil de navigateur
    this.currentProfile = this.headersManager.getNextProfile();
    
    console.log('🚀 Client HTTP ultra-avancé initialisé');
    console.log(`🔧 Configuration: Proxies=${config.useProxies}, Headers=${config.useAdvancedHeaders}, Comportement=${config.useHumanBehavior}`);
  }

  /**
   * Effectue une requête GET ultra-avancée
   */
  async get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    this.requestCount++;
    
    // Vérifier si une nouvelle session est nécessaire
    await this.checkSessionRotation();
    
    // Simuler un comportement humain avant la requête
    if (this.config.useHumanBehavior) {
      await this.behaviorSimulator.simulateNavigationBehavior();
    }
    
    // Générer des headers avancés
    if (this.config.useAdvancedHeaders && this.currentProfile) {
      options.headers = this.headersManager.generateSearchHeaders(this.currentProfile);
    }
    
    // Effectuer la requête avec retry intelligent
    return await this.makeIntelligentRequest(url, options, 'GET');
  }

  /**
   * Effectue une requête POST ultra-avancée
   */
  async post(url: string, data: any, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    this.requestCount++;
    
    // Vérifier si une nouvelle session est nécessaire
    await this.checkSessionRotation();
    
    // Simuler un comportement humain avant la requête
    if (this.config.useHumanBehavior) {
      await this.behaviorSimulator.simulateSearchBehavior();
    }
    
    // Générer des headers avancés
    if (this.config.useAdvancedHeaders && this.currentProfile) {
      options.headers = this.headersManager.generateSearchHeaders(this.currentProfile);
    }
    
    // Effectuer la requête avec retry intelligent
    return await this.makeIntelligentRequest(url, { ...options, body: data }, 'POST');
  }

  /**
   * Effectue une requête avec retry intelligent
   */
  private async makeIntelligentRequest(url: string, options: HttpRequestOptions, method: 'GET' | 'POST'): Promise<HttpResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${this.config.maxRetries} (${method})`);
        
        // Effectuer la requête
        let response: HttpResponse;
        if (method === 'POST') {
          response = await super.post(url, options.body, options);
        } else {
          response = await super.get(url, options);
        }
        
        // Analyser la réponse
        const analysis = this.analyzeResponse(response);
        
        if (analysis.isSuccess) {
          console.log(`✅ Succès: ${response.status} (${response.body.length} caractères)`);
          
          // Simuler un comportement humain après la requête
          if (this.config.useHumanBehavior) {
            await this.behaviorSimulator.simulateReading(response.body.length);
          }
          
          return response;
        } else if (analysis.shouldRetry) {
          console.log(`⚠️ Réponse suspecte: ${response.status} - ${analysis.reason}`);
          
          // Appliquer des contre-mesures
          await this.applyCountermeasures(analysis);
          
          // Attendre avant de réessayer
          const delay = this.calculateRetryDelay(attempt);
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error(`Réponse non récupérable: ${response.status} - ${analysis.reason}`);
        }
        
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Erreur à la tentative ${attempt}: ${lastError.message}`);
        
        // Appliquer des contre-mesures en cas d'erreur
        await this.applyErrorCountermeasures(lastError);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Toutes les ${this.config.maxRetries} tentatives ont échoué. Dernière erreur: ${lastError?.message}`);
  }

  /**
   * Analyse la réponse pour détecter les problèmes
   */
  private analyzeResponse(response: HttpResponse): { isSuccess: boolean; shouldRetry: boolean; reason: string } {
    if (response.status === 200) {
      // Vérifier si c'est une vraie page ou une page de blocage
      if (this.isBlockedPage(response.body)) {
        return {
          isSuccess: false,
          shouldRetry: true,
          reason: 'Page de blocage détectée'
        };
      }
      return { isSuccess: true, shouldRetry: false, reason: 'Succès' };
    } else if (response.status === 403) {
      return {
        isSuccess: false,
        shouldRetry: true,
        reason: 'Accès interdit (403)'
      };
    } else if (response.status === 429) {
      return {
        isSuccess: false,
        shouldRetry: true,
        reason: 'Trop de requêtes (429)'
      };
    } else if (response.status >= 500) {
      return {
        isSuccess: false,
        shouldRetry: true,
        reason: 'Erreur serveur'
      };
    } else {
      return {
        isSuccess: false,
        shouldRetry: false,
        reason: `Status inattendu: ${response.status}`
      };
    }
  }

  /**
   * Vérifie si la réponse est une page de blocage
   */
  private isBlockedPage(body: string): boolean {
    const blockIndicators = [
      'access denied',
      'blocked',
      'captcha',
      'cloudflare',
      'ddos protection',
      'rate limit',
      'temporarily unavailable'
    ];
    
    const lowerBody = body.toLowerCase();
    return blockIndicators.some(indicator => lowerBody.includes(indicator));
  }

  /**
   * Applique des contre-mesures selon l'analyse
   */
  private async applyCountermeasures(analysis: { reason: string }): Promise<void> {
    console.log(`🛡️ Application de contre-mesures: ${analysis.reason}`);
    
    if (analysis.reason.includes('403') || analysis.reason.includes('blocage')) {
      // Rotation de profil de navigateur
      if (this.config.useAdvancedHeaders) {
        this.currentProfile = this.headersManager.getNextProfile();
        console.log(`🔄 Nouveau profil: ${this.currentProfile.name}`);
      }
      
      // Rotation de proxy
      if (this.config.useProxies) {
        // Le proxy sera automatiquement roté par le client parent
        console.log('🔄 Rotation de proxy...');
      }
      
      // Pause plus longue
      if (this.config.useHumanBehavior) {
        await this.behaviorSimulator.humanDelay(10000); // 10 secondes
      }
    } else if (analysis.reason.includes('429')) {
      // Pause plus longue pour les rate limits
      if (this.config.useHumanBehavior) {
        await this.behaviorSimulator.humanDelay(30000); // 30 secondes
      }
    }
  }

  /**
   * Applique des contre-mesures en cas d'erreur
   */
  private async applyErrorCountermeasures(error: Error): Promise<void> {
    console.log(`🛡️ Contre-mesures d'erreur: ${error.message}`);
    
    // Rotation de profil
    if (this.config.useAdvancedHeaders) {
      this.currentProfile = this.headersManager.getNextProfile();
      console.log(`🔄 Nouveau profil après erreur: ${this.currentProfile.name}`);
    }
    
    // Pause de récupération
    if (this.config.useHumanBehavior) {
      await this.behaviorSimulator.humanDelay(5000); // 5 secondes
    }
  }

  /**
   * Calcule le délai de retry avec backoff exponentiel
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Ajouter du bruit
    return Math.round(exponentialDelay + jitter);
  }

  /**
   * Vérifie si une rotation de session est nécessaire
   */
  private async checkSessionRotation(): Promise<void> {
    const sessionTime = Date.now() - this.sessionStartTime;
    
    if (sessionTime > this.config.sessionDuration) {
      console.log('🔄 Rotation de session...');
      
      // Nouveau profil de navigateur
      if (this.config.useAdvancedHeaders) {
        this.currentProfile = this.headersManager.getNextProfile();
        console.log(`🆕 Nouveau profil de session: ${this.currentProfile.name}`);
      }
      
      // Réinitialiser le simulateur de comportement
      if (this.config.useHumanBehavior) {
        this.behaviorSimulator.reset();
      }
      
      // Pause de session
      await this.behaviorSimulator.simulateSessionBehavior();
      
      // Redémarrer la session
      this.sessionStartTime = Date.now();
      this.requestCount = 0;
    }
  }

  /**
   * Obtient les statistiques du client
   */
  getStats(): {
    requestCount: number;
    sessionTime: number;
    currentProfile: string;
    proxyStats: any;
    behaviorConfig: any;
  } {
    return {
      requestCount: this.requestCount,
      sessionTime: Date.now() - this.sessionStartTime,
      currentProfile: this.currentProfile?.name || 'Aucun',
      proxyStats: this.getProxyStats(),
      behaviorConfig: this.behaviorSimulator.getConfig()
    };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<UltraAdvancedConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Configuration ultra-avancée mise à jour');
  }

  /**
   * Réinitialise le client
   */
  reset(): void {
    this.currentProfile = this.headersManager.getNextProfile();
    this.requestCount = 0;
    this.sessionStartTime = Date.now();
    this.behaviorSimulator.reset();
    this.resetFailedProxies();
    console.log('🔄 Client ultra-avancé réinitialisé');
  }
}
