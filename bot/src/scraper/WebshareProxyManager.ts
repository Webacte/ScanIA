/**
 * Gestionnaire de proxies Webshare
 * 
 * Cette classe gère les proxies Webshare avec authentification
 * et rotation automatique
 */

import { ProxyConfig } from './ProxyManager';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface WebshareProxy {
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  successCount: number;
  failureCount: number;
  lastUsed?: number;
  isActive: boolean;
}

export class WebshareProxyManager {
  private proxies: WebshareProxy[] = [];
  private currentIndex: number = 0;
  private failedProxies: Set<string> = new Set();
  private proxyStats: Map<string, { success: number; failure: number }> = new Map();

  constructor() {
    this.loadProxiesFromFile();
  }

  /**
   * Charge les proxies depuis le fichier
   */
  private loadProxiesFromFile(): void {
    try {
      const filePath = join(process.cwd(), 'proxyServer', 'ResidentialProxies.txt');
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      console.log(`📁 Chargement de ${lines.length} proxies depuis le fichier...`);

      for (const line of lines) {
        const parts = line.trim().split(':');
        if (parts.length === 4) {
          const [host, port, username, password] = parts;
          
          this.proxies.push({
            host,
            port: parseInt(port),
            username,
            password,
            protocol: 'http', // Par défaut HTTP
            successCount: 0,
            failureCount: 0,
            isActive: true
          });
        }
      }

      console.log(`✅ ${this.proxies.length} proxies Webshare chargés`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des proxies:', error);
    }
  }

  /**
   * Obtient le prochain proxy de la liste
   */
  getNextProxy(): WebshareProxy | null {
    if (this.proxies.length === 0) {
      console.log('⚠️ Aucun proxy disponible');
      return null;
    }

    // Filtrer les proxies actifs
    const activeProxies = this.proxies.filter(proxy => {
      const proxyKey = `${proxy.host}:${proxy.port}`;
      return proxy.isActive && !this.failedProxies.has(proxyKey);
    });

    if (activeProxies.length === 0) {
      console.log('⚠️ Tous les proxies ont échoué, réinitialisation...');
      this.failedProxies.clear();
      return this.proxies[0];
    }

    // Sélectionner le prochain proxy
    const proxy = activeProxies[this.currentIndex % activeProxies.length];
    this.currentIndex++;

    console.log(`🔄 Utilisation du proxy: ${proxy.host}:${proxy.port} (${proxy.username})`);
    return proxy;
  }

  /**
   * Marque un proxy comme ayant réussi
   */
  markProxySuccess(proxy: WebshareProxy): void {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    proxy.successCount++;
    proxy.lastUsed = Date.now();

    const stats = this.proxyStats.get(proxyKey) || { success: 0, failure: 0 };
    stats.success++;
    this.proxyStats.set(proxyKey, stats);

    console.log(`✅ Proxy ${proxyKey} marqué comme réussi (${proxy.successCount} succès)`);
  }

  /**
   * Marque un proxy comme ayant échoué
   */
  markProxyFailure(proxy: WebshareProxy, reason?: string): void {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    proxy.failureCount++;

    const stats = this.proxyStats.get(proxyKey) || { success: 0, failure: 0 };
    stats.failure++;
    this.proxyStats.set(proxyKey, stats);

    // Si le proxy échoue trop souvent, le marquer comme échoué
    if (proxy.failureCount >= 5) { // Plus tolérant avec les proxies résidentiels
      this.failedProxies.add(proxyKey);
      console.log(`❌ Proxy ${proxyKey} marqué comme échoué (${proxy.failureCount} échecs)${reason ? `: ${reason}` : ''}`);
    } else {
      console.log(`⚠️ Proxy ${proxyKey} échec ${proxy.failureCount}/5${reason ? `: ${reason}` : ''}`);
    }
  }

  /**
   * Obtient les statistiques des proxies
   */
  getProxyStats(): { total: number; active: number; failed: number; successRate: number; averageSpeed: number } {
    const total = this.proxies.length;
    const active = this.proxies.length - this.failedProxies.size;
    const failed = this.failedProxies.size;

    let totalSuccess = 0;
    let totalFailure = 0;

    this.proxies.forEach(proxy => {
      totalSuccess += proxy.successCount;
      totalFailure += proxy.failureCount;
    });

    const successRate = totalSuccess + totalFailure > 0 ? (totalSuccess / (totalSuccess + totalFailure)) * 100 : 0;

    return {
      total,
      active,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      averageSpeed: 0 // Pas de mesure de vitesse pour l'instant
    };
  }

  /**
   * Obtient la liste des proxies actifs
   */
  getActiveProxies(): WebshareProxy[] {
    return this.proxies.filter(proxy => {
      const proxyKey = `${proxy.host}:${proxy.port}`;
      return proxy.isActive && !this.failedProxies.has(proxyKey);
    });
  }

  /**
   * Obtient la liste des proxies échoués
   */
  getFailedProxies(): WebshareProxy[] {
    return this.proxies.filter(proxy => {
      const proxyKey = `${proxy.host}:${proxy.port}`;
      return this.failedProxies.has(proxyKey);
    });
  }

  /**
   * Réinitialise les proxies échoués
   */
  resetFailedProxies(): void {
    this.failedProxies.clear();
    console.log('🔄 Proxies échoués réinitialisés');
  }

  /**
   * Teste un proxy individuel
   */
  async testProxy(proxy: WebshareProxy, testUrl: string = 'https://httpbin.org/ip'): Promise<boolean> {
    try {
      const { HttpsProxyAgent } = await import('https-proxy-agent');
      const fetch = (await import('node-fetch')).default;

      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      const response = await fetch(testUrl, {
        agent: agent,
        timeout: 10000
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Teste tous les proxies disponibles
   */
  async testAllProxies(testUrl: string = 'https://httpbin.org/ip', maxTests: number = 10): Promise<{ proxy: WebshareProxy; success: boolean; responseTime: number }[]> {
    console.log(`🧪 Test de ${Math.min(maxTests, this.proxies.length)} proxies avec ${testUrl}...`);
    
    const results: { proxy: WebshareProxy; success: boolean; responseTime: number }[] = [];
    const proxiesToTest = this.proxies.slice(0, maxTests);
    
    for (const proxy of proxiesToTest) {
      try {
        const startTime = Date.now();
        const success = await this.testProxy(proxy, testUrl);
        const responseTime = Date.now() - startTime;
        
        results.push({ proxy, success, responseTime });
        
        if (success) {
          this.markProxySuccess(proxy);
          console.log(`   ✅ ${proxy.host}:${proxy.port} - ${responseTime}ms`);
        } else {
          this.markProxyFailure(proxy, 'Test échoué');
          console.log(`   ❌ ${proxy.host}:${proxy.port} - ${responseTime}ms`);
        }
        
        // Attendre entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const responseTime = Date.now() - Date.now();
        results.push({ proxy, success: false, responseTime });
        this.markProxyFailure(proxy, (error as Error).message);
        console.log(`   ❌ ${proxy.host}:${proxy.port} - Erreur: ${(error as Error).message}`);
      }
    }
    
    return results;
  }

  /**
   * Obtient un proxy aléatoire
   */
  getRandomProxy(): WebshareProxy | null {
    const activeProxies = this.getActiveProxies();
    if (activeProxies.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * activeProxies.length);
    return activeProxies[randomIndex];
  }

  /**
   * Obtient le meilleur proxy (basé sur les statistiques)
   */
  getBestProxy(): WebshareProxy | null {
    const activeProxies = this.getActiveProxies();
    if (activeProxies.length === 0) {
      return null;
    }
    
    // Trier par taux de succès
    const sortedProxies = activeProxies.sort((a, b) => {
      const aSuccessRate = a.successCount / (a.successCount + a.failureCount);
      const bSuccessRate = b.successCount / (b.successCount + b.failureCount);
      return bSuccessRate - aSuccessRate;
    });
    
    return sortedProxies[0];
  }

  /**
   * Convertit un proxy Webshare en ProxyConfig
   */
  toProxyConfig(proxy: WebshareProxy): ProxyConfig {
    return {
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      protocol: proxy.protocol,
      successCount: proxy.successCount,
      failureCount: proxy.failureCount,
      lastUsed: proxy.lastUsed
    };
  }
}
