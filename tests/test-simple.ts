/**
 * Test simple du scraper sans Redis
 * 
 * Ce script teste uniquement le scraper sans le système de jobs BullMQ
 */

import { LeboncoinScraper, dbConfig } from './src';

/**
 * Test du scraper simple
 */
async function testSimpleScraper() {
  console.log('🧪 Test simple du scraper (sans Redis)...');
  
  const scraper = new LeboncoinScraper(dbConfig);
  
  try {
    await scraper.initialize();
    
    // URL de test
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🔍 Test sur l'URL: ${testUrl}`);
    
    // Test du scraping
    console.log('📄 Scraping de 1 page...');
    const listings = await scraper.scrapeSearchResults(testUrl, 1);
    
    console.log(`\n📊 Résultats:`);
    console.log(`   - Annonces trouvées: ${listings.length}`);
    
    if (listings.length > 0) {
      console.log('\n📋 Détails des annonces:');
      listings.forEach((listing, index) => {
        console.log(`\n--- Annonce ${index + 1} ---`);
        console.log(`ID: ${listing.external_id}`);
        console.log(`Titre: ${listing.title}`);
        console.log(`Prix: ${listing.price_cents / 100}€`);
        console.log(`Localisation: ${listing.location}`);
        console.log(`URL: ${listing.url}`);
        console.log(`Image: ${listing.image_url}`);
        console.log(`Livraison: ${listing.has_shipping ? 'Oui' : 'Non'}`);
      });
      
      // Test de la sauvegarde (si base de données disponible)
      try {
        console.log('\n💾 Test de la sauvegarde...');
        const { saved, skipped } = await scraper.saveListingsToDatabase(listings);
        console.log(`   - Sauvegardées: ${saved}`);
        console.log(`   - Ignorées: ${skipped}`);
      } catch (dbError) {
        console.log('⚠️ Base de données non disponible, test de sauvegarde ignoré');
        console.log(`   Erreur: ${dbError.message}`);
      }
      
      // Test du scraping des détails
      console.log('\n🔍 Test du scraping des détails...');
      try {
        const details = await scraper.scrapeListingDetails(listings[0].url);
        console.log('Détails de la première annonce:', details);
      } catch (detailError) {
        console.log('⚠️ Erreur lors du scraping des détails:', detailError.message);
      }
      
    } else {
      console.log('❌ Aucune annonce trouvée');
    }
    
    // Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid) {
      console.log('\n✅ Test réussi ! Tous les sélecteurs fonctionnent correctement');
    } else {
      console.log('\n❌ Test échoué ! Certains sélecteurs ne fonctionnent pas');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await scraper.close();
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testSimpleScraper().catch(console.error);
}
