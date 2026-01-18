/**
 * Test du scraper furtif avec techniques de contournement ultra-avancées
 */

import { StealthHttpClient } from './src/scraper/StealthHttpClient';

async function testStealthScraper() {
  console.log('🥷 Test du scraper furtif avec techniques ultra-avancées...');
  
  const httpClient = new StealthHttpClient();
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    
    // Test 1: Requête furtive
    console.log('\n📋 Test 1: Requête furtive');
    try {
      const response = await httpClient.stealthGet(testUrl);
      console.log(`✅ Requête furtive: Status ${response.status}`);
      console.log(`📊 Taille de la réponse: ${response.body.length} caractères`);
      
      if (response.status === 200) {
        console.log('🎉 SUCCÈS ! La requête furtive a fonctionné !');
        return;
      }
    } catch (error) {
      console.log(`❌ Requête furtive échouée: ${(error as Error).message}`);
    }
    
    // Test 2: Contournement de protection
    console.log('\n📋 Test 2: Contournement de protection');
    try {
      const response = await httpClient.bypassProtection(testUrl);
      console.log(`✅ Contournement de protection: Status ${response.status}`);
      console.log(`📊 Taille de la réponse: ${response.body.length} caractères`);
      
      if (response.status === 200) {
        console.log('🎉 SUCCÈS ! Le contournement de protection a fonctionné !');
        return;
      }
    } catch (error) {
      console.log(`❌ Contournement de protection échoué: ${(error as Error).message}`);
    }
    
    // Test 3: Test avec différents headers
    console.log('\n📋 Test 3: Test avec headers ultra-avancés');
    try {
      const response = await httpClient.get(testUrl, {
        headers: {
          'X-Custom-Header': 'stealth-value',
          'X-Forwarded-For': '192.168.1.1',
          'X-Real-IP': '192.168.1.1',
          'X-Client-IP': '192.168.1.1',
          'X-Remote-IP': '192.168.1.1',
          'X-Originating-IP': '192.168.1.1',
          'X-Remote-Addr': '192.168.1.1',
          'X-Forwarded-Host': 'www.leboncoin.fr',
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Port': '443',
          'X-Forwarded-Ssl': 'on',
          'X-Forwarded-Scheme': 'https',
          'X-Forwarded-Protocol': 'https',
          'X-Request-ID': 'stealth-request-' + Date.now(),
          'X-Browser-ID': 'stealth-browser-' + Math.random().toString(36).substring(2),
          'X-Device-ID': 'stealth-device-' + Math.random().toString(36).substring(2),
          'X-Session-ID': 'stealth-session-' + Math.random().toString(36).substring(2),
          'X-CSRF-Token': 'stealth-csrf-' + Math.random().toString(36).substring(2),
          'X-Requested-With': 'XMLHttpRequest',
          'Connection': 'keep-alive',
          'DNT': '1',
          'sec-ch-ua-platform': '"Windows"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-User': '?1',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Dest': 'document',
          'Pragma': 'no-cache',
          'Cache-Control': 'max-age=0',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`✅ Headers ultra-avancés: Status ${response.status}`);
      console.log(`📊 Taille de la réponse: ${response.body.length} caractères`);
      
      if (response.status === 200) {
        console.log('🎉 SUCCÈS ! Les headers ultra-avancés ont fonctionné !');
        return;
      }
    } catch (error) {
      console.log(`❌ Headers ultra-avancés échoués: ${(error as Error).message}`);
    }
    
    // Test 4: Test avec navigation humaine
    console.log('\n📋 Test 4: Navigation humaine simulée');
    try {
      const response = await httpClient.simulateHumanNavigation(testUrl);
      console.log(`✅ Navigation humaine: Status ${response.status}`);
      console.log(`📊 Taille de la réponse: ${response.body.length} caractères`);
      
      if (response.status === 200) {
        console.log('🎉 SUCCÈS ! La navigation humaine a fonctionné !');
        return;
      }
    } catch (error) {
      console.log(`❌ Navigation humaine échouée: ${(error as Error).message}`);
    }
    
    // Test 5: Test avec retry intelligent
    console.log('\n📋 Test 5: Retry intelligent');
    try {
      const response = await httpClient.getWithRetry(testUrl, {}, 5);
      console.log(`✅ Retry intelligent: Status ${response.status}`);
      console.log(`📊 Taille de la réponse: ${response.body.length} caractères`);
      
      if (response.status === 200) {
        console.log('🎉 SUCCÈS ! Le retry intelligent a fonctionné !');
        return;
      }
    } catch (error) {
      console.log(`❌ Retry intelligent échoué: ${(error as Error).message}`);
    }
    
    // Test 6: Test des User-Agents
    console.log('\n📋 Test 6: Test des User-Agents');
    try {
      const results = await httpClient.testUserAgents(testUrl);
      console.log('📊 Résultats des User-Agents:');
      results.forEach((result, index) => {
        const status = result.status === 0 ? 'ERREUR' : result.status.toString();
        const userAgent = result.userAgent.substring(0, 50) + '...';
        console.log(`   ${index + 1}. ${status} - ${userAgent}`);
      });
      
      const bestResult = results.find(r => r.status === 200);
      if (bestResult) {
        console.log(`\n🎉 Meilleur User-Agent trouvé: ${bestResult.userAgent.substring(0, 50)}...`);
      } else {
        console.log('\n⚠️ Aucun User-Agent n\'a donné de réponse 200');
      }
    } catch (error) {
      console.log(`❌ Test des User-Agents échoué: ${(error as Error).message}`);
    }
    
    // Test 7: Statistiques de performance
    console.log('\n📋 Test 7: Statistiques de performance');
    const stats = httpClient.getPerformanceStats();
    console.log(`📊 Statistiques:`);
    console.log(`   - Requêtes totales: ${stats.totalRequests}`);
    console.log(`   - Taux de succès: ${stats.successRate}%`);
    console.log(`   - Requêtes récentes (5min): ${stats.recentRequests}`);
    console.log(`   - Empreinte de session: ${stats.sessionFingerprint}`);
    
    console.log('\n📊 Résumé des tests:');
    console.log('   - Toutes les techniques de contournement ont été testées');
    console.log('   - Leboncoin a une protection anti-bot très robuste');
    console.log('   - Aucune technique n\'a réussi à contourner la protection');
    console.log('   - Il faudrait des techniques encore plus avancées');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testStealthScraper().catch(console.error);
}
