/**
 * Test avec de vrais proxies
 */

import { RealProxyHttpClient } from './src/scraper/RealProxyHttpClient';
import { ProxyConfig } from './src/scraper/ProxyManager';

async function testRealProxies() {
  console.log('🔄 Test avec de vrais proxies...');
  
  const httpClient = new RealProxyHttpClient();
  
  try {
    // 1. Ajouter des proxies gratuits réels
    console.log('\n📋 Phase 1: Ajout de proxies gratuits réels');
    const freeProxies: ProxyConfig[] = [
      // Proxies HTTP gratuits (attention: instables)
      { host: '103.152.112.145', port: 80, protocol: 'http' },
      { host: '103.152.112.162', port: 80, protocol: 'http' },
      { host: '103.152.112.145', port: 8080, protocol: 'http' },
      { host: '103.152.112.162', port: 8080, protocol: 'http' },
      { host: '103.152.112.145', port: 3128, protocol: 'http' },
      { host: '103.152.112.162', port: 3128, protocol: 'http' }
    ];
    
    httpClient.addProxies(freeProxies);
    
    const stats = httpClient.getProxyStats();
    console.log(`📊 Proxies disponibles: ${stats.total}`);
    
    // 2. Test avec httpbin.org (service de test)
    console.log('\n📋 Phase 2: Test avec httpbin.org');
    const testUrl = 'https://httpbin.org/ip';
    
    try {
      const response = await httpClient.get(testUrl);
      console.log(`✅ Réponse ${response.status} reçue`);
      console.log(`📄 Contenu: ${response.body}`);
    } catch (error) {
      console.log(`❌ Erreur: ${(error as Error).message}`);
    }
    
    // 3. Test avec Leboncoin
    console.log('\n📋 Phase 3: Test avec Leboncoin');
    const leboncoinUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    try {
      const response = await httpClient.get(leboncoinUrl);
      console.log(`✅ Réponse ${response.status} reçue`);
      console.log(`📊 Taille: ${response.body.length} caractères`);
      
      if (response.status === 200) {
        console.log('🎉 SUCCÈS ! Proxy fonctionnel trouvé !');
      } else if (response.status === 403) {
        console.log('🚫 403: Protection anti-bot active');
      } else {
        console.log(`⚠️ Statut inattendu: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${(error as Error).message}`);
    }
    
    // 4. Statistiques finales
    console.log('\n📋 Phase 4: Statistiques finales');
    const finalStats = httpClient.getProxyStats();
    console.log(`📊 Statistiques:`);
    console.log(`   - Total: ${finalStats.total}`);
    console.log(`   - Actifs: ${finalStats.active}`);
    console.log(`   - Échoués: ${finalStats.failed}`);
    console.log(`   - Taux de succès: ${finalStats.successRate}%`);
    
    // 5. Afficher les proxies actifs
    const activeProxies = httpClient.getActiveProxies();
    console.log(`\n📋 Proxies actifs (${activeProxies.length}):`);
    activeProxies.forEach(proxy => {
      console.log(`   ✅ ${proxy.host}:${proxy.port} (${proxy.protocol}) - ${proxy.successCount || 0} succès`);
    });
    
    // 6. Afficher les proxies échoués
    const failedProxies = httpClient.getFailedProxies();
    console.log(`\n📋 Proxies échoués (${failedProxies.length}):`);
    failedProxies.forEach(proxy => {
      console.log(`   ❌ ${proxy.host}:${proxy.port} (${proxy.protocol}) - ${proxy.failureCount || 0} échecs`);
    });
    
    // 7. Recommandations
    console.log('\n💡 Recommandations:');
    if (finalStats.successRate > 50) {
      console.log('   - Le système de proxies fonctionne bien');
      console.log('   - Continuer avec cette approche');
    } else if (finalStats.successRate > 20) {
      console.log('   - Le système de proxies a des résultats mitigés');
      console.log('   - Améliorer la qualité des proxies');
    } else {
      console.log('   - Le système de proxies ne fonctionne pas bien');
      console.log('   - Utiliser des proxies premium ou d\'autres techniques');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testRealProxies().catch(console.error);
}
