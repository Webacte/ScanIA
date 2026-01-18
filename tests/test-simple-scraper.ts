/**
 * Test du scraper Leboncoin simple et efficace
 */

import { SimpleLeboncoinScraper } from './src/scraper/SimpleLeboncoinScraper';

async function testSimpleScraper() {
  console.log('🚀 Test du scraper Leboncoin simple...');
  
  const scraper = new SimpleLeboncoinScraper();
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    
    // Test du scraping simple
    console.log('\n📋 Test du scraping simple');
    const listings = await scraper.scrapeSearchResultsSimple(testUrl, 1);
    
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
          const details = await scraper.scrapeListingDetailsSimple(listings[0].url);
          console.log('Détails de la première annonce:', details);
        } catch (detailError) {
          console.log('⚠️ Erreur lors du scraping des détails:', (detailError as Error).message);
        }
      }
      
    } else {
      console.log('❌ Aucune annonce trouvée');
    }
    
    // Statistiques
    const stats = scraper.getStats();
    console.log(`\n📊 Statistiques:`);
    console.log(`   - Requêtes effectuées: ${stats.requestCount}`);
    console.log(`   - Dernière requête: ${new Date(stats.lastRequestTime).toLocaleTimeString()}`);
    console.log(`   - Temps depuis dernière requête: ${Math.round(stats.timeSinceLastRequest / 1000)}s`);
    
    // Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid && listings.length > 0) {
      console.log('\n✅ Test réussi ! Le scraper simple fonctionne parfaitement');
      console.log('🎉 Solution opérationnelle trouvée !');
      console.log('\n💡 Recommandations:');
      console.log('   - Utiliser ce scraper simple pour la production');
      console.log('   - Éviter les proxies (bloqués par Leboncoin)');
      console.log('   - Maintenir des délais humains entre les requêtes');
      console.log('   - Surveiller les changements de structure de Leboncoin');
    } else if (listings.length === 0) {
      console.log('\n⚠️ Aucune annonce trouvée - possible changement de structure');
      console.log('💡 Suggestions:');
      console.log('   - Vérifier les sélecteurs CSS');
      console.log('   - Analyser le HTML de la page');
      console.log('   - Tester avec d\'autres URLs de recherche');
    } else {
      console.log('\n❌ Test échoué ! Certaines données sont manquantes');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test simple:', error);
    
    if ((error as Error).message.includes('403')) {
      console.log('\n🚫 Erreur 403: Accès interdit');
      console.log('💡 Solutions possibles:');
      console.log('   - Vérifier la connectivité internet');
      console.log('   - Tester avec un autre navigateur');
      console.log('   - Vérifier si Leboncoin a changé sa protection');
    } else if ((error as Error).message.includes('timeout')) {
      console.log('\n⏰ Timeout: Requête trop lente');
      console.log('💡 Solutions possibles:');
      console.log('   - Augmenter les timeouts');
      console.log('   - Vérifier la connexion internet');
    } else if ((error as Error).message.includes('ENOTFOUND') || (error as Error).message.includes('ECONNREFUSED')) {
      console.log('\n🌐 Erreur de connexion');
      console.log('💡 Solutions possibles:');
      console.log('   - Vérifier la connectivité internet');
      console.log('   - Vérifier les paramètres de proxy');
    }
  } finally {
    console.log('\n🏁 Test simple terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testSimpleScraper().catch(console.error);
}
