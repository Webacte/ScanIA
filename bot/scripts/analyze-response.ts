/**
 * Analyseur de réponse pour comprendre la protection de Leboncoin
 */

import { CustomHttpClient } from './src/scraper/CustomHttpClient';

async function analyzeResponse() {
  console.log('🔍 Analyse de la réponse de Leboncoin...');
  
  const httpClient = new CustomHttpClient();
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🌐 Requête vers: ${testUrl}`);
    
    const response = await httpClient.get(testUrl);
    
    console.log('\n📊 Analyse de la réponse:');
    console.log(`   - Statut: ${response.status}`);
    console.log(`   - Taille: ${response.body.length} caractères`);
    console.log(`   - URL finale: ${response.url}`);
    
    console.log('\n📋 Headers de réponse:');
    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
    console.log('\n📄 Contenu de la réponse:');
    console.log('--- DÉBUT ---');
    console.log(response.body);
    console.log('--- FIN ---');
    
    // Analyser le contenu
    if (response.body.includes('captcha')) {
      console.log('\n🤖 CAPTCHA détecté dans la réponse');
    }
    
    if (response.body.includes('blocked')) {
      console.log('\n🚫 BLOCK détecté dans la réponse');
    }
    
    if (response.body.includes('cloudflare')) {
      console.log('\n☁️ Cloudflare détecté dans la réponse');
    }
    
    if (response.body.includes('403')) {
      console.log('\n🚫 Page d\'erreur 403 détectée');
    }
    
    // Chercher des indices sur la protection
    const protectionIndicators = [
      'bot',
      'robot',
      'scraper',
      'automated',
      'suspicious',
      'rate limit',
      'too many requests'
    ];
    
    const foundIndicators = protectionIndicators.filter(indicator => 
      response.body.toLowerCase().includes(indicator)
    );
    
    if (foundIndicators.length > 0) {
      console.log('\n🔍 Indicateurs de protection trouvés:');
      foundIndicators.forEach(indicator => {
        console.log(`   - ${indicator}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

if (require.main === module) {
  analyzeResponse().catch(console.error);
}
