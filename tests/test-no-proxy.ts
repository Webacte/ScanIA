/**
 * Test sans proxies pour isoler la cause du 403
 */

import { UltraAdvancedLeboncoinScraper } from './src/scraper/UltraAdvancedLeboncoinScraper';
import { UltraAdvancedConfig } from './src/scraper/UltraAdvancedHttpClient';

async function testWithoutProxies() {
  console.log('🔍 Test sans proxies pour isoler la cause du 403...');
  
  // Configuration SANS proxies
  const config: UltraAdvancedConfig = {
    useProxies: false,  // DÉSACTIVER les proxies
    useAdvancedHeaders: true,
    useHumanBehavior: true,
    maxRetries: 3,
    retryDelay: 2000,
    sessionDuration: 30 * 60 * 1000
  };
  
  const scraper = new UltraAdvancedLeboncoinScraper(config);
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    console.log(`🔧 Configuration: Proxies=${config.useProxies}, Headers=${config.useAdvancedHeaders}, Comportement=${config.useHumanBehavior}`);
    
    // Test 1: Page d'accueil
    console.log('\n📋 Test 1: Page d\'accueil');
    try {
      const homeResponse = await scraper['ultraClient'].get('https://www.leboncoin.fr');
      console.log(`✅ Page d'accueil: ${homeResponse.status} (${homeResponse.body.length} caractères)`);
      
      // Analyser le contenu
      if (homeResponse.body.includes('captcha') || homeResponse.body.includes('blocked')) {
        console.log('🚫 Page de blocage détectée');
      } else {
        console.log('✅ Page d\'accueil accessible');
      }
    } catch (error) {
      console.log(`❌ Erreur page d'accueil: ${(error as Error).message}`);
    }
    
    // Test 2: Page de recherche
    console.log('\n📋 Test 2: Page de recherche');
    try {
      const searchResponse = await scraper['ultraClient'].get(testUrl);
      console.log(`✅ Page de recherche: ${searchResponse.status} (${searchResponse.body.length} caractères)`);
      
      // Analyser le contenu
      if (searchResponse.body.includes('captcha') || searchResponse.body.includes('blocked')) {
        console.log('🚫 Page de blocage détectée');
      } else if (searchResponse.body.includes('aditem_container')) {
        console.log('✅ Page de recherche accessible avec annonces');
      } else {
        console.log('⚠️ Page accessible mais sans annonces détectées');
      }
    } catch (error) {
      console.log(`❌ Erreur page de recherche: ${(error as Error).message}`);
    }
    
    // Test 3: Headers simples vs avancés
    console.log('\n📋 Test 3: Comparaison headers simples vs avancés');
    
    // Test avec headers simples
    console.log('🔧 Test avec headers simples...');
    try {
      const simpleResponse = await scraper['ultraClient'].get('https://www.leboncoin.fr', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });
      console.log(`✅ Headers simples: ${simpleResponse.status}`);
    } catch (error) {
      console.log(`❌ Erreur headers simples: ${(error as Error).message}`);
    }
    
    // Test avec headers avancés
    console.log('🔧 Test avec headers avancés...');
    try {
      const advancedResponse = await scraper['ultraClient'].get('https://www.leboncoin.fr');
      console.log(`✅ Headers avancés: ${advancedResponse.status}`);
    } catch (error) {
      console.log(`❌ Erreur headers avancés: ${(error as Error).message}`);
    }
    
    // Test 4: Différents User-Agents
    console.log('\n📋 Test 4: Différents User-Agents');
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    for (let i = 0; i < userAgents.length; i++) {
      try {
        const response = await scraper['ultraClient'].get('https://www.leboncoin.fr', {
          headers: {
            'User-Agent': userAgents[i],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
          }
        });
        console.log(`✅ User-Agent ${i + 1}: ${response.status}`);
      } catch (error) {
        console.log(`❌ User-Agent ${i + 1}: ${(error as Error).message}`);
      }
      
      // Délai entre les tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test 5: Analyse des réponses
    console.log('\n📋 Test 5: Analyse des réponses');
    try {
      const response = await scraper['ultraClient'].get('https://www.leboncoin.fr');
      console.log(`📊 Analyse de la réponse:`);
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Taille: ${response.body.length} caractères`);
      console.log(`   - Headers: ${JSON.stringify(response.headers, null, 2)}`);
      
      // Vérifier les indicateurs de blocage
      const body = response.body.toLowerCase();
      const indicators = [
        'captcha', 'blocked', 'access denied', 'forbidden',
        'cloudflare', 'ddos protection', 'rate limit',
        'temporarily unavailable', 'maintenance'
      ];
      
      const foundIndicators = indicators.filter(indicator => body.includes(indicator));
      if (foundIndicators.length > 0) {
        console.log(`🚫 Indicateurs de blocage trouvés: ${foundIndicators.join(', ')}`);
      } else {
        console.log('✅ Aucun indicateur de blocage détecté');
      }
      
    } catch (error) {
      console.log(`❌ Erreur lors de l'analyse: ${(error as Error).message}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test sans proxies:', error);
  } finally {
    console.log('\n🏁 Test sans proxies terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testWithoutProxies().catch(console.error);
}
