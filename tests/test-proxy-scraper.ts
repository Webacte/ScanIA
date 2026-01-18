/**
 * Test du scraper Leboncoin avec proxies rotatifs
 */

import { ProxyLeboncoinScraper } from './src/scraper/ProxyLeboncoinScraper';

async function testProxyScraper() {
  console.log('🔄 Test du scraper Leboncoin avec proxies rotatifs...');
  
  const scraper = new ProxyLeboncoinScraper();
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    
    // 1. Test du scraping avec proxies
    console.log('\n📋 Phase 1: Scraping avec proxies');
    const listings = await scraper.scrapeSearchResultsWithProxy(testUrl, 1);
    
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
          const details = await scraper.scrapeListingDetailsWithProxy(listings[0].url);
          console.log('Détails de la première annonce:', details);
        } catch (detailError) {
          console.log('⚠️ Erreur lors du scraping des détails:', (detailError as Error).message);
        }
      }
      
    } else {
      console.log('❌ Aucune annonce trouvée');
    }
    
    // 2. Statistiques des proxies
    console.log('\n📋 Phase 2: Statistiques des proxies');
    const proxyStats = scraper.getProxyStats();
    console.log(`📊 Statistiques des proxies:`);
    console.log(`   - Total: ${proxyStats.total}`);
    console.log(`   - Actifs: ${proxyStats.active}`);
    console.log(`   - Échoués: ${proxyStats.failed}`);
    console.log(`   - Taux de succès: ${proxyStats.successRate}%`);
    console.log(`   - Vitesse moyenne: ${proxyStats.averageSpeed}ms`);
    
    // 3. Afficher les proxies actifs
    const activeProxies = scraper.getActiveProxies();
    console.log(`\n📋 Proxies actifs (${activeProxies.length}):`);
    activeProxies.forEach(proxy => {
      console.log(`   ✅ ${proxy.host}:${proxy.port} (${proxy.protocol}) - ${proxy.successCount || 0} succès`);
    });
    
    // 4. Afficher les proxies échoués
    const failedProxies = scraper.getFailedProxies();
    console.log(`\n📋 Proxies échoués (${failedProxies.length}):`);
    failedProxies.forEach(proxy => {
      console.log(`   ❌ ${proxy.host}:${proxy.port} (${proxy.protocol}) - ${proxy.failureCount || 0} échecs`);
    });
    
    // 5. Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid && listings.length > 0) {
      console.log('\n✅ Test réussi ! Le scraper avec proxies fonctionne');
      console.log('🎉 Solution de contournement opérationnelle !');
    } else if (listings.length === 0) {
      console.log('\n⚠️ Aucune annonce trouvée - possible protection anti-bot');
      console.log('💡 Suggestions:');
      console.log('   - Vérifier les proxies disponibles');
      console.log('   - Tester avec différents proxies');
      console.log('   - Implémenter des techniques de contournement supplémentaires');
    } else {
      console.log('\n❌ Test échoué ! Certaines données sont manquantes');
    }
    
    // 6. Recommandations
    console.log('\n💡 Recommandations:');
    if (proxyStats.successRate > 50) {
      console.log('   - Le système de proxies fonctionne bien');
      console.log('   - Continuer avec cette approche');
      console.log('   - Optimiser les proxies les plus performants');
    } else if (proxyStats.successRate > 20) {
      console.log('   - Le système de proxies a des résultats mitigés');
      console.log('   - Améliorer la qualité des proxies');
      console.log('   - Tester avec des proxies premium');
    } else {
      console.log('   - Le système de proxies ne fonctionne pas bien');
      console.log('   - Passer à d\'autres techniques de contournement');
      console.log('   - Tester avec Selenium + Stealth');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    
    if ((error as Error).message.includes('403')) {
      console.log('\n🚫 Erreur 403: Accès interdit');
      console.log('💡 Solutions possibles:');
      console.log('   - Utiliser des proxies de meilleure qualité');
      console.log('   - Implémenter des techniques de contournement avancées');
      console.log('   - Tester avec Selenium + Stealth');
    } else if ((error as Error).message.includes('timeout')) {
      console.log('\n⏰ Timeout: Requête trop lente');
      console.log('💡 Solutions possibles:');
      console.log('   - Utiliser des proxies plus rapides');
      console.log('   - Augmenter le timeout');
      console.log('   - Optimiser les requêtes');
    }
  } finally {
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testProxyScraper().catch(console.error);
}
