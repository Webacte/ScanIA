/**
 * Testeur de différentes sources de proxies
 */

import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

interface ProxyTestResult {
  proxy: string;
  success: boolean;
  latency: number;
  status?: number;
  error?: string;
  detected?: boolean;
}

class ProxySourceTester {
  private testUrl = 'https://www.leboncoin.fr';
  private testTimeout = 10000; // 10 secondes

  /**
   * Teste une liste de proxies
   */
  async testProxyList(proxies: string[]): Promise<ProxyTestResult[]> {
    console.log(`🧪 Test de ${proxies.length} proxies...`);
    
    const results: ProxyTestResult[] = [];
    
    for (const proxy of proxies) {
      const result = await this.testSingleProxy(proxy);
      results.push(result);
      
      // Délai entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Teste un proxy individuel
   */
  private async testSingleProxy(proxy: string): Promise<ProxyTestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Test du proxy: ${proxy}`);
      
      const agent = new HttpsProxyAgent(`http://${proxy}`);
      
      const response = await fetch(this.testUrl, {
        agent: agent as any,
        timeout: this.testTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });
      
      const latency = Date.now() - startTime;
      const body = await response.text();
      
      // Analyser la réponse
      const detected = this.analyzeResponse(response.status, body);
      
      console.log(`   ${detected ? '❌' : '✅'} ${proxy}: ${response.status} (${latency}ms) ${detected ? '- Détecté' : '- OK'}`);
      
      return {
        proxy,
        success: response.status === 200 && !detected,
        latency,
        status: response.status,
        detected
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      console.log(`   ❌ ${proxy}: Erreur - ${(error as Error).message}`);
      
      return {
        proxy,
        success: false,
        latency,
        error: (error as Error).message
      };
    }
  }

  /**
   * Analyse la réponse pour détecter les signes de blocage
   */
  private analyzeResponse(status: number, body: string): boolean {
    if (status === 403 || status === 429) {
      return true;
    }
    
    const bodyLower = body.toLowerCase();
    const indicators = [
      'access denied',
      'blocked',
      'captcha',
      'cloudflare',
      'ddos protection',
      'rate limit',
      'temporarily unavailable'
    ];
    
    return indicators.some(indicator => bodyLower.includes(indicator));
  }

  /**
   * Génère un rapport des résultats
   */
  generateReport(results: ProxyTestResult[]): void {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const detected = results.filter(r => r.detected);
    
    console.log('\n📊 Rapport des tests:');
    console.log(`   - Total testé: ${results.length}`);
    console.log(`   - Succès: ${successful.length} (${Math.round(successful.length / results.length * 100)}%)`);
    console.log(`   - Échecs: ${failed.length} (${Math.round(failed.length / results.length * 100)}%)`);
    console.log(`   - Détectés: ${detected.length} (${Math.round(detected.length / results.length * 100)}%)`);
    
    if (successful.length > 0) {
      console.log('\n✅ Proxies fonctionnels:');
      successful.forEach(result => {
        console.log(`   - ${result.proxy} (${result.latency}ms)`);
      });
    }
    
    if (detected.length > 0) {
      console.log('\n❌ Proxies détectés:');
      detected.forEach(result => {
        console.log(`   - ${result.proxy} (Status: ${result.status})`);
      });
    }
    
    // Recommandations
    console.log('\n💡 Recommandations:');
    if (successful.length === 0) {
      console.log('   - Aucun proxy fonctionnel trouvé');
      console.log('   - Utiliser le client HTTP simple (sans proxies)');
      console.log('   - Considérer des proxies résidentiels premium');
    } else if (successful.length < results.length * 0.5) {
      console.log('   - Taux de succès faible');
      console.log('   - Améliorer la qualité des proxies');
      console.log('   - Tester des sources alternatives');
    } else {
      console.log('   - Taux de succès acceptable');
      console.log('   - Utiliser les proxies fonctionnels');
      console.log('   - Surveiller la stabilité');
    }
  }
}

async function testProxySources() {
  console.log('🔍 Test de différentes sources de proxies...');
  
  const tester = new ProxySourceTester();
  
  // 1. Test de proxies gratuits (exemples)
  console.log('\n📋 Test 1: Proxies gratuits (exemples)');
  const freeProxies = [
    '8.8.8.8:8080', // Exemple (ne fonctionnera probablement pas)
    '1.1.1.1:8080', // Exemple (ne fonctionnera probablement pas)
    '127.0.0.1:8080' // Exemple local (ne fonctionnera pas)
  ];
  
  const freeResults = await tester.testProxyList(freeProxies);
  tester.generateReport(freeResults);
  
  // 2. Test de proxies de datacenter (exemples)
  console.log('\n📋 Test 2: Proxies de datacenter (exemples)');
  const datacenterProxies = [
    'proxy1.example.com:8080', // Exemple
    'proxy2.example.com:3128', // Exemple
    'proxy3.example.com:8080'  // Exemple
  ];
  
  const datacenterResults = await tester.testProxyList(datacenterProxies);
  tester.generateReport(datacenterResults);
  
  // 3. Test de proxies résidentiels (exemples)
  console.log('\n📋 Test 3: Proxies résidentiels (exemples)');
  const residentialProxies = [
    'residential1.example.com:8080', // Exemple
    'residential2.example.com:3128', // Exemple
    'residential3.example.com:8080'  // Exemple
  ];
  
  const residentialResults = await tester.testProxyList(residentialProxies);
  tester.generateReport(residentialResults);
  
  // 4. Comparaison avec client HTTP simple
  console.log('\n📋 Test 4: Comparaison avec client HTTP simple');
  try {
    const startTime = Date.now();
    const response = await fetch('https://www.leboncoin.fr', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });
    
    const latency = Date.now() - startTime;
    const body = await response.text();
    const detected = tester['analyzeResponse'](response.status, body);
    
    console.log(`✅ Client HTTP simple: ${response.status} (${latency}ms) ${detected ? '- Détecté' : '- OK'}`);
    console.log(`   - Taille de la réponse: ${body.length} caractères`);
    
    if (response.status === 200 && !detected) {
      console.log('🎉 Le client HTTP simple fonctionne parfaitement !');
    }
    
  } catch (error) {
    console.log(`❌ Client HTTP simple: Erreur - ${(error as Error).message}`);
  }
  
  // 5. Recommandations finales
  console.log('\n💡 Recommandations finales:');
  console.log('   1. Tester le client HTTP simple en premier (gratuit)');
  console.log('   2. Si nécessaire, utiliser des proxies résidentiels premium');
  console.log('   3. Éviter les proxies gratuits et de datacenter');
  console.log('   4. Surveiller les changements de détection');
  
  console.log('\n🏁 Test des sources de proxies terminé');
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testProxySources().catch(console.error);
}
