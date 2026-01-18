/**
 * Test du scraper avancé avec techniques de contournement
 */

import { AdvancedHttpClient } from './src/scraper/AdvancedHttpClient';

async function testAdvancedScraper() {
  console.log('🚀 Test du scraper avancé avec techniques de contournement...');
  
  const httpClient = new AdvancedHttpClient();
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    
    // Test 1: Navigation humaine simulée
    console.log('\n📋 Test 1: Navigation humaine simulée');
    try {
      const response = await httpClient.simulateHumanNavigation(testUrl);
      console.log(`✅ Navigation simulée: Status ${response.status}`);
      console.log(`📊 Taille de la réponse: ${response.body.length} caractères`);
    } catch (error) {
      console.log(`❌ Navigation simulée échouée: ${(error as Error).message}`);
    }
    
    // Test 2: Requête avec retry intelligent
    console.log('\n📋 Test 2: Requête avec retry intelligent');
    try {
      const response = await httpClient.getWithRetry(testUrl, {}, 3);
      console.log(`✅ Retry intelligent: Status ${response.status}`);
      console.log(`📊 Taille de la réponse: ${response.body.length} caractères`);
    } catch (error) {
      console.log(`❌ Retry intelligent échoué: ${(error as Error).message}`);
    }
    
    // Test 3: Test des User-Agents
    console.log('\n📋 Test 3: Test des User-Agents');
    try {
      const results = await httpClient.testUserAgents(testUrl);
      console.log('📊 Résultats des User-Agents:');
      results.forEach((result, index) => {
        const status = result.status === 0 ? 'ERREUR' : result.status.toString();
        const userAgent = result.userAgent.substring(0, 50) + '...';
        console.log(`   ${index + 1}. ${status} - ${userAgent}`);
      });
      
      // Trouver le meilleur User-Agent
      const bestResult = results.find(r => r.status === 200);
      if (bestResult) {
        console.log(`\n🎉 Meilleur User-Agent trouvé: ${bestResult.userAgent.substring(0, 50)}...`);
      } else {
        console.log('\n⚠️ Aucun User-Agent n\'a donné de réponse 200');
      }
    } catch (error) {
      console.log(`❌ Test des User-Agents échoué: ${(error as Error).message}`);
    }
    
    // Test 4: Statistiques de performance
    console.log('\n📋 Test 4: Statistiques de performance');
    const stats = httpClient.getPerformanceStats();
    console.log(`📊 Statistiques:`);
    console.log(`   - Requêtes totales: ${stats.totalRequests}`);
    console.log(`   - Taux de succès: ${stats.successRate}%`);
    console.log(`   - Requêtes récentes (5min): ${stats.recentRequests}`);
    console.log(`   - Empreinte de session: ${stats.sessionFingerprint}`);
    
    // Test 5: Test avec différents headers
    console.log('\n📋 Test 5: Test avec headers avancés');
    try {
      const response = await httpClient.get(testUrl, {
        headers: {
          'X-Custom-Header': 'test-value',
          'X-Forwarded-For': '192.168.1.1',
          'X-Real-IP': '192.168.1.1'
        }
      });
      console.log(`✅ Headers avancés: Status ${response.status}`);
    } catch (error) {
      console.log(`❌ Headers avancés échoués: ${(error as Error).message}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testAdvancedScraper().catch(console.error);
}
