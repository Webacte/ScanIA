/**
 * Test avec un client HTTP basique pour isoler le problème
 */

import fetch from 'node-fetch';

async function testBasicHttp() {
  console.log('🔍 Test avec client HTTP basique...');
  
  const testUrl = 'https://www.leboncoin.fr';
  
  // Test 1: Requête HTTP basique
  console.log('\n📋 Test 1: Requête HTTP basique');
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    const body = await response.text();
    console.log(`✅ Body length: ${body.length} caractères`);
    
    if (response.status === 200) {
      console.log('🎉 SUCCÈS ! La requête basique fonctionne');
      if (body.includes('leboncoin')) {
        console.log('✅ Contenu Leboncoin détecté');
      }
    } else {
      console.log(`❌ Échec: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${(error as Error).message}`);
  }
  
  // Test 2: Différents User-Agents
  console.log('\n📋 Test 2: Différents User-Agents');
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  
  for (let i = 0; i < userAgents.length; i++) {
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgents[i],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });
      
      console.log(`✅ User-Agent ${i + 1}: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`🎉 User-Agent ${i + 1} fonctionne !`);
        break;
      }
      
    } catch (error) {
      console.log(`❌ User-Agent ${i + 1}: ${(error as Error).message}`);
    }
    
    // Délai entre les tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test 3: Page de recherche
  console.log('\n📋 Test 3: Page de recherche');
  const searchUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
  
  try {
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Referer': 'https://www.leboncoin.fr',
      }
    });
    
    console.log(`✅ Page de recherche: ${response.status}`);
    
    if (response.status === 200) {
      const body = await response.text();
      console.log(`✅ Body length: ${body.length} caractères`);
      
      if (body.includes('aditem_container')) {
        console.log('🎉 Annonces détectées !');
      } else {
        console.log('⚠️ Aucune annonce détectée');
      }
    }
    
  } catch (error) {
    console.log(`❌ Erreur page de recherche: ${(error as Error).message}`);
  }
  
  // Test 4: Test de connectivité générale
  console.log('\n📋 Test 4: Test de connectivité générale');
  const testUrls = [
    'https://httpbin.org/ip',
    'https://httpbin.org/headers',
    'https://www.google.com',
    'https://www.leboncoin.fr'
  ];
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
      
      console.log(`✅ ${url}: ${response.status}`);
      
    } catch (error) {
      console.log(`❌ ${url}: ${(error as Error).message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Test HTTP basique terminé');
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testBasicHttp().catch(console.error);
}
