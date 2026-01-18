/**
 * Test du scraper Leboncoin avec proxies Webshare
 */

import { WebshareLeboncoinScraper } from './src/scraper/WebshareLeboncoinScraper';

async function testWebshareProxies() {
  console.log('🔄 Test du scraper Leboncoin avec proxies Webshare...');
  
  const scraper = new WebshareLeboncoinScraper();
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    
    // 1. Test du scraping avec proxies Webshare
    console.log('\n📋 Phase 1: Scraping avec proxies Webshare');
    const listings = await scraper.scrapeSearchResultsWithWebshareProxy(testUrl, 1);
    
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
          const details = await scraper.scrapeListingDetailsWithWebshareProxy(listings[0].url);
          console.log('Détails de la première annonce:', details);
        } catch (detailError) {
          console.log('⚠️ Erreur lors du scraping des détails:', (detailError as Error).message);
        }
      }
      
    } else {
      console.log('❌ Aucune annonce trouvée');
    }
    
    // 2. Statistiques des proxies
    console.log('\n📋 Phase 2: Statistiques des proxies Webshare');
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
    activeProxies.slice(0, 5).forEach(proxy => {
      console.log(`   ✅ ${proxy.host}:${proxy.port} (${proxy.username}) - ${proxy.successCount || 0} succès`);
    });
    if (activeProxies.length > 5) {
      console.log(`   ... et ${activeProxies.length - 5} autres proxies`);
    }
    
    // 4. Afficher les proxies échoués
    const failedProxies = scraper.getFailedProxies();
    console.log(`\n📋 Proxies échoués (${failedProxies.length}):`);
    failedProxies.slice(0, 5).forEach(proxy => {
      console.log(`   ❌ ${proxy.host}:${proxy.port} (${proxy.username}) - ${proxy.failureCount || 0} échecs`);
    });
    if (failedProxies.length > 5) {
      console.log(`   ... et ${failedProxies.length - 5} autres proxies`);
    }
    
    // 5. Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid && listings.length > 0) {
      console.log('\n✅ Test réussi ! Le scraper avec proxies Webshare fonctionne');
      console.log('🎉 Solution de contournement opérationnelle !');
    } else if (listings.length === 0) {
      console.log('\n⚠️ Aucune annonce trouvée - possible protection anti-bot');
      console.log('💡 Suggestions:');
      console.log('   - Vérifier les proxies Webshare disponibles');
      console.log('   - Tester avec différents proxies');
      console.log('   - Implémenter des techniques de contournement supplémentaires');
    } else {
      console.log('\n❌ Test échoué ! Certaines données sont manquantes');
    }
    
    // 6. Recommandations
    console.log('\n💡 Recommandations:');
    if (proxyStats.successRate > 50) {
      console.log('   - Le système de proxies Webshare fonctionne bien');
      console.log('   - Continuer avec cette approche');
      console.log('   - Optimiser les proxies les plus performants');
    } else if (proxyStats.successRate > 20) {
      console.log('   - Le système de proxies Webshare a des résultats mitigés');
      console.log('   - Améliorer la qualité des proxies');
      console.log('   - Tester avec des proxies premium');
    } else {
      console.log('   - Le système de proxies Webshare ne fonctionne pas bien');
      console.log('   - Passer à d\'autres techniques de contournement');
      console.log('   - Vérifier la configuration des proxies');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    
    if ((error as Error).message.includes('403')) {
      console.log('\n🚫 Erreur 403: Accès interdit');
      console.log('💡 Solutions possibles:');
      console.log('   - Utiliser des proxies Webshare de meilleure qualité');
      console.log('   - Implémenter des techniques de contournement avancées');
      console.log('   - Tester avec différents serveurs proxy');
    } else if ((error as Error).message.includes('timeout')) {
      console.log('\n⏰ Timeout: Requête trop lente');
      console.log('💡 Solutions possibles:');
      console.log('   - Utiliser des proxies Webshare plus rapides');
      console.log('   - Augmenter le timeout');
      console.log('   - Optimiser les requêtes');
    } else if ((error as Error).message.includes('ENOTFOUND') || (error as Error).message.includes('ECONNREFUSED')) {
      console.log('\n🌐 Erreur de connexion: Proxy non accessible');
      console.log('💡 Solutions possibles:');
      console.log('   - Vérifier la configuration des proxies Webshare');
      console.log('   - Tester la connectivité des proxies');
      console.log('   - Utiliser des proxies alternatifs');
    }
  } finally {
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testWebshareProxies().catch(console.error);
}
