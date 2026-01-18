/**
 * Test du système de proxies rotatifs
 */

import { ProxyHttpClient } from './src/scraper/ProxyHttpClient';
import { ProxyConfig } from './src/scraper/ProxyManager';

async function testProxySystem() {
  console.log('🔄 Test du système de proxies rotatifs...');
  
  const httpClient = new ProxyHttpClient();
  
  try {
    // 1. Test des proxies par défaut
    console.log('\n📋 Phase 1: Test des proxies par défaut');
    const stats = httpClient.getProxyStats();
    console.log(`📊 Statistiques initiales:`);
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - Actifs: ${stats.active}`);
    console.log(`   - Échoués: ${stats.failed}`);
    console.log(`   - Taux de succès: ${stats.successRate}%`);
    console.log(`   - Vitesse moyenne: ${stats.averageSpeed}ms`);
    
    // 2. Ajouter des proxies personnalisés
    console.log('\n📋 Phase 2: Ajout de proxies personnalisés');
    const customProxies: ProxyConfig[] = [
      {
        host: '192.168.1.100',
        port: 8080,
        protocol: 'http',
        username: 'user1',
        password: 'pass1',
        country: 'FR'
      },
      {
        host: '192.168.1.101',
        port: 8080,
        protocol: 'http',
        username: 'user2',
        password: 'pass2',
        country: 'US'
      },
      {
        host: '192.168.1.102',
        port: 1080,
        protocol: 'socks5',
        username: 'user3',
        password: 'pass3',
        country: 'DE'
      }
    ];
    
    httpClient.addProxies(customProxies);
    
    const newStats = httpClient.getProxyStats();
    console.log(`📊 Nouvelles statistiques:`);
    console.log(`   - Total: ${newStats.total}`);
    console.log(`   - Actifs: ${newStats.active}`);
    console.log(`   - Échoués: ${newStats.failed}`);
    
    // 3. Test de rotation des proxies
    console.log('\n📋 Phase 3: Test de rotation des proxies');
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 Test avec l'URL: ${testUrl}`);
    
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`\n🔄 Test ${i}/5:`);
        const response = await httpClient.get(testUrl);
        console.log(`   Status: ${response.status}`);
        console.log(`   Taille: ${response.body.length} caractères`);
        
        if (response.status === 200) {
          console.log(`   ✅ SUCCÈS ! Proxy fonctionnel trouvé !`);
          break;
        } else if (response.status === 403) {
          console.log(`   🚫 403: Protection anti-bot active`);
        } else {
          console.log(`   ⚠️ Statut inattendu: ${response.status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${(error as Error).message}`);
      }
      
      // Attendre entre les tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 4. Test de tous les proxies
    console.log('\n📋 Phase 4: Test de tous les proxies');
    await httpClient.testAllProxies('https://httpbin.org/ip');
    
    // 5. Statistiques finales
    console.log('\n📋 Phase 5: Statistiques finales');
    const finalStats = httpClient.getProxyStats();
    console.log(`📊 Statistiques finales:`);
    console.log(`   - Total: ${finalStats.total}`);
    console.log(`   - Actifs: ${finalStats.active}`);
    console.log(`   - Échoués: ${finalStats.failed}`);
    console.log(`   - Taux de succès: ${finalStats.successRate}%`);
    console.log(`   - Vitesse moyenne: ${finalStats.averageSpeed}ms`);
    
    // 6. Afficher les proxies actifs et échoués
    const activeProxies = httpClient.getActiveProxies();
    const failedProxies = httpClient.getFailedProxies();
    
    console.log(`\n📋 Proxies actifs (${activeProxies.length}):`);
    activeProxies.forEach(proxy => {
      console.log(`   ✅ ${proxy.host}:${proxy.port} (${proxy.protocol}) - ${proxy.successCount || 0} succès`);
    });
    
    console.log(`\n📋 Proxies échoués (${failedProxies.length}):`);
    failedProxies.forEach(proxy => {
      console.log(`   ❌ ${proxy.host}:${proxy.port} (${proxy.protocol}) - ${proxy.failureCount || 0} échecs`);
    });
    
    // 7. Test du meilleur proxy
    console.log('\n📋 Phase 6: Test du meilleur proxy');
    const bestProxy = httpClient.getBestProxy();
    if (bestProxy) {
      console.log(`🏆 Meilleur proxy: ${bestProxy.host}:${bestProxy.port}`);
      console.log(`   - Succès: ${bestProxy.successCount || 0}`);
      console.log(`   - Échecs: ${bestProxy.failureCount || 0}`);
      
      // Tester avec le meilleur proxy
      try {
        console.log(`🧪 Test avec le meilleur proxy...`);
        const response = await httpClient.get(testUrl);
        console.log(`   Status: ${response.status}`);
        console.log(`   Taille: ${response.body.length} caractères`);
        
        if (response.status === 200) {
          console.log(`   ✅ SUCCÈS avec le meilleur proxy !`);
        } else {
          console.log(`   ⚠️ Statut: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${(error as Error).message}`);
      }
    } else {
      console.log(`⚠️ Aucun proxy disponible`);
    }
    
    // 8. Test sans proxy
    console.log('\n📋 Phase 7: Test sans proxy');
    httpClient.setUseProxies(false);
    
    try {
      console.log(`🧪 Test sans proxy...`);
      const response = await httpClient.get(testUrl);
      console.log(`   Status: ${response.status}`);
      console.log(`   Taille: ${response.body.length} caractères`);
      
      if (response.status === 200) {
        console.log(`   ✅ SUCCÈS sans proxy !`);
      } else {
        console.log(`   ⚠️ Statut: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${(error as Error).message}`);
    }
    
    // 9. Réinitialiser les proxies échoués
    console.log('\n📋 Phase 8: Réinitialisation des proxies échoués');
    httpClient.resetFailedProxies();
    
    const resetStats = httpClient.getProxyStats();
    console.log(`📊 Statistiques après réinitialisation:`);
    console.log(`   - Total: ${resetStats.total}`);
    console.log(`   - Actifs: ${resetStats.active}`);
    console.log(`   - Échoués: ${resetStats.failed}`);
    
    // 10. Recommandations
    console.log('\n💡 Recommandations:');
    if (finalStats.successRate > 50) {
      console.log('   - Le système de proxies fonctionne bien');
      console.log('   - Continuer avec cette approche');
    } else if (finalStats.successRate > 20) {
      console.log('   - Le système de proxies a des résultats mitigés');
      console.log('   - Améliorer la qualité des proxies');
    } else {
      console.log('   - Le système de proxies ne fonctionne pas bien');
      console.log('   - Passer à d\'autres techniques de contournement');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testProxySystem().catch(console.error);
}
