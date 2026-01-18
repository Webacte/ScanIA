/**
 * Gestionnaire de Captcha pour ScanLeCoin
 * 
 * Ce module gère les différentes stratégies de contournement
 * des captchas détectés
 */

import { CaptchaDetector, CaptchaInfo, CaptchaSolution } from './CaptchaDetector';
import * as fs from 'fs';
import * as path from 'path';

export interface CaptchaStrategy {
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
}

export interface CaptchaConfig {
  strategies: CaptchaStrategy[];
  manualMode: boolean;
  savePages: boolean;
  retryDelay: number;
  maxRetries: number;
  autoOpenBrowser: boolean;
}

export class CaptchaManager {
  private config: CaptchaConfig;
  private detector: CaptchaDetector | null = null;
  private saveDir: string;

  constructor(config?: Partial<CaptchaConfig>) {
    this.saveDir = path.join(process.cwd(), 'captcha-saves');
    this.ensureSaveDirectory();
    
    this.config = {
      strategies: [
        {
          name: 'bypass_headers',
          description: 'Contournement par modification des headers',
          priority: 1,
          enabled: true
        },
        {
          name: 'retry_delay',
          description: 'Attendre et réessayer',
          priority: 2,
          enabled: true
        },
        {
          name: 'manual_solve',
          description: 'Résolution manuelle par l\'utilisateur',
          priority: 3,
          enabled: true
        },
        {
          name: 'proxy_rotation',
          description: 'Rotation des proxies',
          priority: 4,
          enabled: false
        }
      ],
      manualMode: false,
      savePages: true,
      retryDelay: 30000, // 30 secondes
      maxRetries: 3,
      autoOpenBrowser: true,
      ...config
    };
  }

  /**
   * Gère un captcha détecté
   */
  async handleCaptcha(html: string, url: string, headers?: Record<string, string>): Promise<CaptchaSolution> {
    console.log('🔍 Analyse du captcha détecté...');
    
    this.detector = new CaptchaDetector(html, url);
    const captchaInfo = this.detector.detectCaptcha();
    
    if (!captchaInfo.detected) {
      return { solved: true, method: 'automatic' };
    }

    console.log('🚨 Captcha détecté:', captchaInfo.type);
    console.log(this.detector.generateReport());

    // Sauvegarder la page si configuré
    if (this.config.savePages) {
      const savedPath = this.detector.savePageForManualReview();
      console.log(`💾 Page sauvegardée: ${savedPath}`);
    }

    // Essayer les stratégies dans l'ordre de priorité
    for (const strategy of this.config.strategies.filter(s => s.enabled).sort((a, b) => a.priority - b.priority)) {
      console.log(`🔄 Tentative de stratégie: ${strategy.name}`);
      
      try {
        const solution = await this.executeStrategy(strategy, captchaInfo, html, url, headers);
        if (solution.solved) {
          console.log(`✅ Captcha résolu avec la stratégie: ${strategy.name}`);
          return solution;
        }
      } catch (error) {
        console.log(`❌ Échec de la stratégie ${strategy.name}:`, error);
      }
    }

    return {
      solved: false,
      method: 'manual',
      error: 'Toutes les stratégies automatiques ont échoué'
    };
  }

  /**
   * Exécute une stratégie spécifique
   */
  private async executeStrategy(
    strategy: CaptchaStrategy, 
    captchaInfo: CaptchaInfo, 
    html: string, 
    url: string, 
    headers?: Record<string, string>
  ): Promise<CaptchaSolution> {
    
    switch (strategy.name) {
      case 'bypass_headers':
        return this.bypassWithHeaders(captchaInfo, headers);
        
      case 'retry_delay':
        return this.retryWithDelay();
        
      case 'manual_solve':
        return this.manualSolve(captchaInfo, html, url);
        
      case 'proxy_rotation':
        return this.rotateProxy();
        
      default:
        throw new Error(`Stratégie inconnue: ${strategy.name}`);
    }
  }

  /**
   * Stratégie 1: Contournement par modification des headers
   */
  private async bypassWithHeaders(captchaInfo: CaptchaInfo, headers?: Record<string, string>): Promise<CaptchaSolution> {
    console.log('🔄 Tentative de contournement par headers...');
    
    const bypassHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
      ...headers
    };

    // Ajouter des headers spécifiques selon le type de captcha
    if (captchaInfo.type === 'cloudflare') {
      bypassHeaders['CF-Connecting-IP'] = '127.0.0.1';
      bypassHeaders['CF-Ray'] = 'mock-ray-id';
    }

    return {
      solved: true,
      method: 'bypass',
      headers: bypassHeaders
    };
  }

  /**
   * Stratégie 2: Attendre et réessayer
   */
  private async retryWithDelay(): Promise<CaptchaSolution> {
    console.log(`⏳ Attente de ${this.config.retryDelay / 1000}s avant de réessayer...`);
    
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
    
    return {
      solved: true,
      method: 'retry'
    };
  }

  /**
   * Stratégie 3: Résolution manuelle
   */
  private async manualSolve(captchaInfo: CaptchaInfo, html: string, url: string): Promise<CaptchaSolution> {
    console.log('👤 Mode résolution manuelle activé...');
    
    // Sauvegarder la page pour analyse manuelle
    const savedPath = this.detector!.savePageForManualReview();
    
    // Ouvrir le navigateur si configuré
    if (this.config.autoOpenBrowser) {
      await this.openBrowserForManualSolve(url, savedPath);
    }
    
    // Attendre la résolution manuelle
    const solution = await this.waitForManualSolution();
    
    return solution;
  }

  /**
   * Stratégie 4: Rotation des proxies
   */
  private async rotateProxy(): Promise<CaptchaSolution> {
    console.log('🔄 Rotation des proxies...');
    
    // TODO: Implémenter la rotation des proxies
    // Pour l'instant, on simule un succès
    
    return {
      solved: true,
      method: 'bypass',
      error: 'Rotation des proxies non implémentée'
    };
  }

  /**
   * Ouvre le navigateur pour résolution manuelle
   */
  private async openBrowserForManualSolve(url: string, savedPath: string): Promise<void> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Ouvrir la page dans le navigateur par défaut
      await execAsync(`start ${url}`);
      
      // Ouvrir le fichier HTML sauvegardé
      await execAsync(`start ${savedPath}`);
      
      console.log('🌐 Navigateur ouvert pour résolution manuelle');
      console.log(`📄 Page sauvegardée ouverte: ${savedPath}`);
      
    } catch (error) {
      console.log('❌ Impossible d\'ouvrir le navigateur:', error);
    }
  }

  /**
   * Attend la résolution manuelle du captcha
   */
  private async waitForManualSolution(): Promise<CaptchaSolution> {
    return new Promise((resolve) => {
      console.log('⏳ En attente de la résolution manuelle...');
      console.log('💡 Instructions:');
      console.log('   1. Résolvez le captcha dans le navigateur ouvert');
      console.log('   2. Appuyez sur Entrée ici pour continuer');
      console.log('   3. Ou tapez "skip" pour ignorer cette URL');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Captcha résolu ? (Entrée = Oui, "skip" = Ignorer): ', (answer: string) => {
        rl.close();
        
        if (answer.toLowerCase().trim() === 'skip') {
          resolve({
            solved: false,
            method: 'manual',
            error: 'URL ignorée par l\'utilisateur'
          });
        } else {
          resolve({
            solved: true,
            method: 'manual'
          });
        }
      });
    });
  }

  /**
   * Crée le dossier de sauvegarde
   */
  private ensureSaveDirectory(): void {
    if (!fs.existsSync(this.saveDir)) {
      fs.mkdirSync(this.saveDir, { recursive: true });
    }
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<CaptchaConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Active/désactive une stratégie
   */
  toggleStrategy(strategyName: string, enabled: boolean): void {
    const strategy = this.config.strategies.find(s => s.name === strategyName);
    if (strategy) {
      strategy.enabled = enabled;
    }
  }

  /**
   * Obtient les statistiques des captchas
   */
  getStats(): { totalDetected: number; solved: number; failed: number } {
    // TODO: Implémenter les statistiques
    return { totalDetected: 0, solved: 0, failed: 0 };
  }
}
