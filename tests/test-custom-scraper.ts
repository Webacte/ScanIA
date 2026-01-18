/**
 * Test du scraper personnalisé HTTP
 * 
 * Ce script teste notre solution personnalisée pour contourner
 * la détection de Leboncoin
 */

import { CustomLeboncoinScraper } from './src/scraper/CustomLeboncoinScraper';

/**
 * Test du scraper personnalisé
 */
async function testCustomScraper() {
  console.log('🧪 Test du scraper personnalisé HTTP...');
  
  const scraper = new CustomLeboncoinScraper();
  
  try {
    // URL de test
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🔍 Test sur l'URL: ${testUrl}`);
    
    // Afficher les statistiques de session
    const stats = scraper.getSessionStats();
    console.log(`📊 Session: ${stats.cookieCount} cookies, UA: ${stats.userAgent.substring(0, 50)}...`);
    
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
      
      // Test du scraping des détails sur la première annonce
      if (listings[0]) {
        console.log('\n🔍 Test du scraping des détails...');
        try {
          const details = await scraper.scrapeListingDetails(listings[0].url);
          console.log('Détails de la première annonce:', details);
        } catch (detailError) {
          console.log('⚠️ Erreur lors du scraping des détails:', (detailError as Error).message);
        }
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
    
    if (isValid && listings.length > 0) {
      console.log('\n✅ Test réussi ! Le scraper personnalisé fonctionne');
      console.log('🎉 Solution de contournement opérationnelle !');
    } else if (listings.length === 0) {
      console.log('\n⚠️ Aucune annonce trouvée - possible protection anti-bot');
      console.log('💡 Suggestions:');
      console.log('   - Vérifier les headers HTTP');
      console.log('   - Tester avec différents User-Agents');
      console.log('   - Utiliser des proxies');
    } else {
      console.log('\n❌ Test échoué ! Certaines données sont manquantes');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    
    const errorMessage = (error as Error).message;
    
    if (errorMessage.includes('403')) {
      console.log('\n🚫 Erreur 403: Accès interdit');
      console.log('💡 Solutions possibles:');
      console.log('   - Modifier les headers HTTP');
      console.log('   - Utiliser des proxies rotatifs');
      console.log('   - Implémenter une rotation d\'IP');
      console.log('   - Simuler un comportement plus humain');
    } else if (errorMessage.includes('timeout')) {
      console.log('\n⏰ Timeout: Requête trop lente');
      console.log('💡 Solutions possibles:');
      console.log('   - Augmenter le timeout');
      console.log('   - Optimiser les requêtes');
      console.log('   - Utiliser des proxies plus rapides');
    }
  } finally {
    // Nettoyer la session
    scraper.clearSession();
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testCustomScraper().catch(console.error);
}
