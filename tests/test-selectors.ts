/**
 * Script de test pour valider les sélecteurs CSS
 * 
 * Ce script permet de tester les sélecteurs sur une page réelle de Leboncoin
 * pour s'assurer qu'ils fonctionnent correctement.
 */

import { LeboncoinScraper, dbConfig } from './src';

/**
 * Test des sélecteurs sur une page de recherche
 */
async function testSelectors() {
  console.log('🧪 Test des sélecteurs CSS...');
  
  const scraper = new LeboncoinScraper(dbConfig);
  
  try {
    await scraper.initialize();
    
    // URL de test
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🔍 Test sur l'URL: ${testUrl}`);
    
    // Naviguer vers la page
    await scraper['page']!.goto(testUrl, { waitUntil: 'networkidle' });
    
    // Attendre que les annonces se chargent
    await scraper['page']!.waitForSelector('[data-qa-id="aditem_container"]', { timeout: 10000 });
    
    // Tester les sélecteurs individuellement
    const selectorsTest = await scraper['page']!.evaluate(() => {
      const results: any = {};
      
      // Test du container
      const containers = document.querySelectorAll('[data-qa-id="aditem_container"]');
      results.containers = containers.length;
      
      if (containers.length > 0) {
        const firstContainer = containers[0];
        
        // Test du titre
        const titleElement = firstContainer.querySelector('[data-test-id="adcard-title"]');
        results.title = titleElement?.textContent?.trim() || 'Non trouvé';
        
        // Test du prix
        const priceElement = firstContainer.querySelector('[data-qa-id="aditem_price"]');
        results.price = priceElement?.textContent?.trim() || 'Non trouvé';
        
        // Test de la localisation
        const locationElement = firstContainer.querySelector('p.text-caption.text-neutral');
        results.location = locationElement?.textContent?.trim() || 'Non trouvé';
        
        // Test de l'image
        const imageElement = firstContainer.querySelector('img[src*="img.leboncoin.fr"]');
        results.image = imageElement?.src || 'Non trouvée';
        
        // Test de l'URL
        const linkElement = firstContainer.querySelector('a');
        results.url = linkElement?.href || 'Non trouvée';
        
        // Test de l'ID externe
        const url = linkElement?.href || '';
        const external_id = url.match(/\/(\d+)$/)?.[1] || url.match(/\/(\d+)\.htm/)?.[1] || '';
        results.external_id = external_id || 'Non trouvé';
      }
      
      return results;
    });
    
    console.log('📊 Résultats des tests de sélecteurs:');
    console.log(`   - Containers trouvés: ${selectorsTest.containers}`);
    console.log(`   - Titre: ${selectorsTest.title}`);
    console.log(`   - Prix: ${selectorsTest.price}`);
    console.log(`   - Localisation: ${selectorsTest.location}`);
    console.log(`   - Image: ${selectorsTest.image}`);
    console.log(`   - URL: ${selectorsTest.url}`);
    console.log(`   - ID externe: ${selectorsTest.external_id}`);
    
    // Test complet du scraping
    console.log('\n🔍 Test complet du scraping...');
    const listings = await scraper.scrapeSearchResults(testUrl, 1);
    
    console.log(`📋 ${listings.length} annonces extraites:`);
    listings.forEach((listing, index) => {
      console.log(`\n--- Annonce ${index + 1} ---`);
      console.log(`ID: ${listing.external_id}`);
      console.log(`Titre: ${listing.title}`);
      console.log(`Prix: ${listing.price_cents / 100}€`);
      console.log(`Localisation: ${listing.location}`);
      console.log(`URL: ${listing.url}`);
      console.log(`Image: ${listing.image_url}`);
    });
    
    // Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid) {
      console.log('\n✅ Tous les sélecteurs fonctionnent correctement !');
    } else {
      console.log('\n❌ Certains sélecteurs ne fonctionnent pas correctement');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await scraper.close();
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testSelectors().catch(console.error);
}
