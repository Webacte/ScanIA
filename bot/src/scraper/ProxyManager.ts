/**
 * Gestionnaire de proxies rotatifs pour contourner la détection par IP
 * 
 * Cette classe gère une liste de proxies et les fait tourner
 * pour éviter la détection par IP
 */

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country?: string;
  speed?: number;
  uptime?: number;
  lastUsed?: number;
  successCount?: number;
  failureCount?: number;
}

export interface ProxyStats {
  total: number;
  active: number;
  failed: number;
  successRate: number;
  averageSpeed: number;
}

export class ProxyManager {
  private proxies: ProxyConfig[] = [];
  private currentIndex: number = 0;
  private failedProxies: Set<string> = new Set();
  private proxyStats: Map<string, { success: number; failure: number }> = new Map();

  constructor() {
    this.loadDefaultProxies();
  }

  /**
   * Charge des proxies par défaut (gratuits)
   */
  private loadDefaultProxies(): void {
    // Proxies gratuits publics (attention: instables)
    const freeProxies: Partial<ProxyConfig>[] = [
      { host: '8.8.8.8', port: 8080, protocol: 'http' },
      { host: '1.1.1.1', port: 8080, protocol: 'http' },
      { host: '208.67.222.222', port: 8080, protocol: 'http' },
      { host: '9.9.9.9', port: 8080, protocol: 'http' },
      { host: '76.76.19.19', port: 8080, protocol: 'http' }
    ];

    // Proxies de test (ne fonctionneront pas, mais pour la démo)
    freeProxies.forEach(proxy => {
      this.proxies.push({
        ...proxy,
        host: proxy.host || '127.0.0.1',
        port: proxy.port || 8080,
        protocol: proxy.protocol || 'http',
        successCount: 0,
        failureCount: 0
      } as ProxyConfig);
    });

    console.log(`🔧 ${this.proxies.length} proxies par défaut chargés`);
  }

  /**
   * Ajoute des proxies personnalisés
   */
  addProxies(proxies: ProxyConfig[]): void {
    proxies.forEach(proxy => {
      proxy.successCount = 0;
      proxy.failureCount = 0;
      this.proxies.push(proxy);
    });
    console.log(`🔧 ${proxies.length} proxies personnalisés ajoutés (total: ${this.proxies.length})`);
  }

  /**
   * Obtient le prochain proxy de la liste
   */
  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      console.log('⚠️ Aucun proxy disponible');
      return null;
    }

    // Filtrer les proxies qui ont échoué récemment
    const availableProxies = this.proxies.filter(proxy => {
      const proxyKey = `${proxy.host}:${proxy.port}`;
      return !this.failedProxies.has(proxyKey);
    });

    if (availableProxies.length === 0) {
      console.log('⚠️ Tous les proxies ont échoué, réinitialisation...');
      this.failedProxies.clear();
      return this.proxies[0];
    }

    // Sélectionner le prochain proxy
    const proxy = availableProxies[this.currentIndex % availableProxies.length];
    this.currentIndex++;

    console.log(`🔄 Utilisation du proxy: ${proxy.host}:${proxy.port} (${proxy.protocol})`);
    return proxy;
  }

  /**
   * Marque un proxy comme ayant réussi
   */
  markProxySuccess(proxy: ProxyConfig): void {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    proxy.successCount = (proxy.successCount || 0) + 1;
    proxy.lastUsed = Date.now();

    const stats = this.proxyStats.get(proxyKey) || { success: 0, failure: 0 };
    stats.success++;
    this.proxyStats.set(proxyKey, stats);

    console.log(`✅ Proxy ${proxyKey} marqué comme réussi (${proxy.successCount} succès)`);
  }

  /**
   * Marque un proxy comme ayant échoué
   */
  markProxyFailure(proxy: ProxyConfig, reason?: string): void {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    proxy.failureCount = (proxy.failureCount || 0) + 1;

    const stats = this.proxyStats.get(proxyKey) || { success: 0, failure: 0 };
    stats.failure++;
    this.proxyStats.set(proxyKey, stats);

    // Si le proxy échoue trop souvent, le marquer comme échoué
    if (proxy.failureCount >= 3) {
      this.failedProxies.add(proxyKey);
      console.log(`❌ Proxy ${proxyKey} marqué comme échoué (${proxy.failureCount} échecs)${reason ? `: ${reason}` : ''}`);
    } else {
      console.log(`⚠️ Proxy ${proxyKey} échec ${proxy.failureCount}/3${reason ? `: ${reason}` : ''}`);
    }
  }

  /**
   * Obtient les statistiques des proxies
   */
  getProxyStats(): ProxyStats {
    const total = this.proxies.length;
    const active = this.proxies.length - this.failedProxies.size;
    const failed = this.failedProxies.size;

    let totalSuccess = 0;
    let totalFailure = 0;
    let totalSpeed = 0;

    this.proxies.forEach(proxy => {
      totalSuccess += proxy.successCount || 0;
      totalFailure += proxy.failureCount || 0;
      totalSpeed += proxy.speed || 0;
    });

    const successRate = totalSuccess + totalFailure > 0 ? (totalSuccess / (totalSuccess + totalFailure)) * 100 : 0;
    const averageSpeed = total > 0 ? totalSpeed / total : 0;

    return {
      total,
      active,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      averageSpeed: Math.round(averageSpeed * 100) / 100
    };
  }

  /**
   * Obtient la liste des proxies actifs
   */
  getActiveProxies(): ProxyConfig[] {
    return this.proxies.filter(proxy => {
      const proxyKey = `${proxy.host}:${proxy.port}`;
      return !this.failedProxies.has(proxyKey);
    });
  }

  /**
   * Obtient la liste des proxies échoués
   */
  getFailedProxies(): ProxyConfig[] {
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
   * Teste tous les proxies disponibles
   */
  async testAllProxies(testUrl: string = 'https://httpbin.org/ip'): Promise<{ proxy: ProxyConfig; success: boolean; responseTime: number }[]> {
    console.log(`🧪 Test de ${this.proxies.length} proxies avec ${testUrl}...`);
    
    const results: { proxy: ProxyConfig; success: boolean; responseTime: number }[] = [];
    
    for (const proxy of this.proxies) {
      try {
        const startTime = Date.now();
        
        // Simuler un test de proxy (en réalité, il faudrait implémenter la logique de proxy)
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
   * Teste un proxy individuel
   */
  private async testProxy(proxy: ProxyConfig, testUrl: string): Promise<boolean> {
    // Simulation d'un test de proxy
    // En réalité, il faudrait implémenter la logique de proxy avec fetch ou axios
    
    // Pour la démo, on simule un test
    const random = Math.random();
    
    // 70% de chance de succès pour les proxies par défaut
    if (random < 0.7) {
      return true;
    } else {
      throw new Error('Proxy non accessible');
    }
  }

  /**
   * Obtient un proxy aléatoire
   */
  getRandomProxy(): ProxyConfig | null {
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
  getBestProxy(): ProxyConfig | null {
    const activeProxies = this.getActiveProxies();
    if (activeProxies.length === 0) {
      return null;
    }
    
    // Trier par taux de succès
    const sortedProxies = activeProxies.sort((a, b) => {
      const aSuccessRate = (a.successCount || 0) / ((a.successCount || 0) + (a.failureCount || 0));
      const bSuccessRate = (b.successCount || 0) / ((b.successCount || 0) + (b.failureCount || 0));
      return bSuccessRate - aSuccessRate;
    });
    
    return sortedProxies[0];
  }

  /**
   * Nettoie les proxies inactifs
   */
  cleanupInactiveProxies(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const initialCount = this.proxies.length;
    
    this.proxies = this.proxies.filter(proxy => {
      if (!proxy.lastUsed) return true;
      return (now - proxy.lastUsed) < maxAge;
    });
    
    const removedCount = initialCount - this.proxies.length;
    if (removedCount > 0) {
      console.log(`🧹 ${removedCount} proxies inactifs supprimés`);
    }
  }
}
