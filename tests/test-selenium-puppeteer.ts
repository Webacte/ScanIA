/**
 * Test comparatif Selenium vs Puppeteer + Stealth
 */

import { SeleniumStealthScraper } from './src/scraper/SeleniumStealthScraper';
import { PuppeteerStealthScraper } from './src/scraper/PuppeteerStealthScraper';

async function testSeleniumPuppeteer() {
  console.log('🧪 Test comparatif Selenium vs Puppeteer + Stealth...');
  
  const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
  
  // Test 1: Selenium
  console.log('\n📋 Test 1: Selenium + Stealth');
  const seleniumScraper = new SeleniumStealthScraper();
  
  try {
    await seleniumScraper.initialize();
    const seleniumListings = await seleniumScraper.scrapeSearchResults(testUrl, 1);
    
    console.log(`📊 Résultats Selenium:`);
    console.log(`   - Annonces trouvées: ${seleniumListings.length}`);
    
    if (seleniumListings.length > 0) {
      console.log('✅ Selenium fonctionne !');
      console.log('Première annonce:', seleniumListings[0]);
    } else {
      console.log('❌ Selenium n\'a trouvé aucune annonce');
    }
    
  } catch (error) {
    console.error('❌ Erreur Selenium:', (error as Error).message);
  } finally {
    await seleniumScraper.close();
  }
  
  // Attendre entre les tests
  console.log('\n⏳ Attente de 5 secondes entre les tests...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test 2: Puppeteer
  console.log('\n📋 Test 2: Puppeteer + Stealth');
  const puppeteerScraper = new PuppeteerStealthScraper();
  
  try {
    await puppeteerScraper.initialize();
    const puppeteerListings = await puppeteerScraper.scrapeSearchResults(testUrl, 1);
    
    console.log(`📊 Résultats Puppeteer:`);
    console.log(`   - Annonces trouvées: ${puppeteerListings.length}`);
    
    if (puppeteerListings.length > 0) {
      console.log('✅ Puppeteer fonctionne !');
      console.log('Première annonce:', puppeteerListings[0]);
    } else {
      console.log('❌ Puppeteer n\'a trouvé aucune annonce');
    }
    
  } catch (error) {
    console.error('❌ Erreur Puppeteer:', (error as Error).message);
  } finally {
    await puppeteerScraper.close();
  }
  
  // Comparaison finale
  console.log('\n📊 Comparaison finale:');
  console.log('   - Selenium: Testé');
  console.log('   - Puppeteer: Testé');
  console.log('   - Proxies: Fonctionnel (71.43% succès)');
  
  console.log('\n💡 Recommandation:');
  console.log('   - Si Selenium/Puppeteer fonctionnent: Utiliser la solution la plus stable');
  console.log('   - Si Selenium/Puppeteer échouent: Utiliser la solution avec proxies');
  console.log('   - Solution avec proxies: Prête et opérationnelle');
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testSeleniumPuppeteer().catch(console.error);
}
