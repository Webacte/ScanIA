/**
 * Test du scraper Leboncoin ultra-avancé
 */

import { UltraAdvancedLeboncoinScraper } from './src/scraper/UltraAdvancedLeboncoinScraper';
import { UltraAdvancedConfig } from './src/scraper/UltraAdvancedHttpClient';

async function testUltraAdvanced() {
  console.log('🚀 Test du scraper Leboncoin ultra-avancé...');
  
  // Configuration ultra-avancée
  const config: UltraAdvancedConfig = {
    useProxies: true,
    useAdvancedHeaders: true,
    useHumanBehavior: true,
    maxRetries: 5,
    retryDelay: 2000,
    sessionDuration: 30 * 60 * 1000 // 30 minutes
  };
  
  const scraper = new UltraAdvancedLeboncoinScraper(config);
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    console.log(`🔧 Configuration: Proxies=${config.useProxies}, Headers=${config.useAdvancedHeaders}, Comportement=${config.useHumanBehavior}`);
    
    // 1. Test du scraping ultra-avancé
    console.log('\n📋 Phase 1: Scraping ultra-avancé');
    const listings = await scraper.scrapeSearchResultsUltraAdvanced(testUrl, 1);
    
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
        console.log('\n🔍 Test du scraping des détails ultra-avancé...');
        try {
          const details = await scraper.scrapeListingDetailsUltraAdvanced(listings[0].url);
          console.log('Détails de la première annonce:', details);
        } catch (detailError) {
          console.log('⚠️ Erreur lors du scraping des détails:', (detailError as Error).message);
        }
      }
      
    } else {
      console.log('❌ Aucune annonce trouvée');
    }
    
    // 2. Statistiques ultra-avancées
    console.log('\n📋 Phase 2: Statistiques ultra-avancées');
    const ultraStats = scraper.getUltraStats();
    console.log(`📊 Statistiques ultra-avancées:`);
    console.log(`   - Requêtes effectuées: ${ultraStats.requestCount}`);
    console.log(`   - Temps de session: ${Math.round(ultraStats.sessionTime / 1000)}s`);
    console.log(`   - Profil actuel: ${ultraStats.currentProfile}`);
    console.log(`   - Configuration comportement: ${JSON.stringify(ultraStats.behaviorConfig, null, 2)}`);
    
    // 3. Statistiques des proxies
    const proxyStats = scraper.getProxyStats();
    console.log(`\n📊 Statistiques des proxies:`);
    console.log(`   - Total: ${proxyStats.total}`);
    console.log(`   - Actifs: ${proxyStats.active}`);
    console.log(`   - Échoués: ${proxyStats.failed}`);
    console.log(`   - Taux de succès: ${proxyStats.successRate}%`);
    
    // 4. Afficher les proxies actifs
    const activeProxies = scraper.getActiveProxies();
    console.log(`\n📋 Proxies actifs (${activeProxies.length}):`);
    activeProxies.slice(0, 5).forEach(proxy => {
      console.log(`   ✅ ${proxy.host}:${proxy.port} (${proxy.username}) - ${proxy.successCount || 0} succès`);
    });
    if (activeProxies.length > 5) {
      console.log(`   ... et ${activeProxies.length - 5} autres proxies`);
    }
    
    // 5. Afficher les proxies échoués
    const failedProxies = scraper.getFailedProxies();
    console.log(`\n📋 Proxies échoués (${failedProxies.length}):`);
    failedProxies.slice(0, 5).forEach(proxy => {
      console.log(`   ❌ ${proxy.host}:${proxy.port} (${proxy.username}) - ${proxy.failureCount || 0} échecs`);
    });
    if (failedProxies.length > 5) {
      console.log(`   ... et ${failedProxies.length - 5} autres proxies`);
    }
    
    // 6. Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid && listings.length > 0) {
      console.log('\n✅ Test réussi ! Le scraper ultra-avancé fonctionne');
      console.log('🎉 Solution de contournement ultra-avancée opérationnelle !');
    } else if (listings.length === 0) {
      console.log('\n⚠️ Aucune annonce trouvée - possible protection anti-bot');
      console.log('💡 Suggestions:');
      console.log('   - Vérifier les proxies Webshare disponibles');
      console.log('   - Tester avec différents profils de navigateur');
      console.log('   - Ajuster les paramètres de comportement humain');
    } else {
      console.log('\n❌ Test échoué ! Certaines données sont manquantes');
    }
    
    // 7. Recommandations
    console.log('\n💡 Recommandations:');
    if (proxyStats.successRate > 50) {
      console.log('   - Le système ultra-avancé fonctionne bien');
      console.log('   - Continuer avec cette approche');
      console.log('   - Optimiser les paramètres de comportement humain');
    } else if (proxyStats.successRate > 20) {
      console.log('   - Le système ultra-avancé a des résultats mitigés');
      console.log('   - Améliorer la qualité des proxies');
      console.log('   - Ajuster les techniques de contournement');
    } else {
      console.log('   - Le système ultra-avancé ne fonctionne pas bien');
      console.log('   - Vérifier la configuration des proxies');
      console.log('   - Tester avec des proxies premium');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test ultra-avancé:', error);
    
    if ((error as Error).message.includes('403')) {
      console.log('\n🚫 Erreur 403: Accès interdit');
      console.log('💡 Solutions possibles:');
      console.log('   - Utiliser des proxies Webshare de meilleure qualité');
      console.log('   - Ajuster les paramètres de comportement humain');
      console.log('   - Tester avec différents profils de navigateur');
    } else if ((error as Error).message.includes('timeout')) {
      console.log('\n⏰ Timeout: Requête trop lente');
      console.log('💡 Solutions possibles:');
      console.log('   - Augmenter les timeouts');
      console.log('   - Optimiser les requêtes');
      console.log('   - Utiliser des proxies plus rapides');
    } else if ((error as Error).message.includes('ENOTFOUND') || (error as Error).message.includes('ECONNREFUSED')) {
      console.log('\n🌐 Erreur de connexion: Proxy non accessible');
      console.log('💡 Solutions possibles:');
      console.log('   - Vérifier la configuration des proxies Webshare');
      console.log('   - Tester la connectivité des proxies');
      console.log('   - Utiliser des proxies alternatifs');
    }
  } finally {
    console.log('\n🏁 Test ultra-avancé terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testUltraAdvanced().catch(console.error);
}
