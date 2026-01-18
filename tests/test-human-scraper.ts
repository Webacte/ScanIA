/**
 * Test du scraper Leboncoin avec comportement humain
 */

import { HumanLikeLeboncoinScraper, HumanBehaviorConfig } from './src/scraper/HumanLikeLeboncoinScraper';

async function testHumanScraper() {
  console.log('👤 Test du scraper Leboncoin avec comportement humain...');
  
  // Configuration pour comportement humain réaliste
  const config: HumanBehaviorConfig = {
    minDelayBetweenRequests: 3000,  // 3 secondes minimum
    maxDelayBetweenRequests: 8000,  // 8 secondes maximum
    minDelayBetweenPages: 5000,     // 5 secondes minimum entre pages
    maxDelayBetweenPages: 15000,    // 15 secondes maximum entre pages
    maxPagesPerSession: 3,          // Maximum 3 pages par session
    sessionBreakDuration: 30000,    // 30 secondes de pause entre sessions (réduit pour le test)
    randomScrollBehavior: true,
    randomClickBehavior: true,
    realisticUserAgent: true
  };
  
  const scraper = new HumanLikeLeboncoinScraper(config);
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    console.log(`🔧 Configuration comportement humain:`);
    console.log(`   - Délais requêtes: ${config.minDelayBetweenRequests}-${config.maxDelayBetweenRequests}ms`);
    console.log(`   - Délais pages: ${config.minDelayBetweenPages}-${config.maxDelayBetweenPages}ms`);
    console.log(`   - Pages max/session: ${config.maxPagesPerSession}`);
    console.log(`   - Pause session: ${config.sessionBreakDuration / 1000}s`);
    console.log(`   - Comportements aléatoires: ${config.randomScrollBehavior ? 'Oui' : 'Non'}`);
    
    // Test du scraping avec comportement humain
    console.log('\n📋 Test du scraping avec comportement humain');
    const startTime = Date.now();
    
    const listings = await scraper.scrapeWithHumanBehavior(testUrl);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n📊 Résultats:`);
    console.log(`   - Annonces trouvées: ${listings.length}`);
    console.log(`   - Durée totale: ${Math.round(duration / 1000)}s`);
    console.log(`   - Taux: ${(listings.length / (duration / 1000)).toFixed(2)} annonces/seconde`);
    
    if (listings.length > 0) {
      console.log('\n📋 Détails des annonces:');
      listings.slice(0, 5).forEach((listing, index) => {
        console.log(`\n--- Annonce ${index + 1} ---`);
        console.log(`ID: ${listing.external_id}`);
        console.log(`Titre: ${listing.title}`);
        console.log(`Prix: ${listing.price_cents / 100}€`);
        console.log(`Localisation: ${listing.location}`);
        console.log(`URL: ${listing.url}`);
        console.log(`Livraison: ${listing.has_shipping ? 'Oui' : 'Non'}`);
      });
      
      if (listings.length > 5) {
        console.log(`\n... et ${listings.length - 5} autres annonces`);
      }
    }
    
    // Statistiques de session
    const sessionStats = scraper.getSessionStats();
    console.log(`\n📊 Statistiques de session:`);
    console.log(`   - Pages scrapées: ${sessionStats.pagesScraped}`);
    console.log(`   - Requêtes effectuées: ${sessionStats.requestsMade}`);
    console.log(`   - Durée de session: ${Math.round(sessionStats.sessionDuration / 1000)}s`);
    console.log(`   - Temps depuis dernière requête: ${Math.round(sessionStats.timeSinceLastRequest / 1000)}s`);
    
    // Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid && listings.length > 0) {
      console.log('\n✅ Test réussi ! Le scraper avec comportement humain fonctionne');
      console.log('🎉 Solution prête pour la production avec crédibilité humaine !');
      
      console.log('\n💡 Avantages du comportement humain:');
      console.log('   - Délais variables et réalistes');
      console.log('   - Simulation de navigation humaine');
      console.log('   - User-Agents variés');
      console.log('   - Pauses de session automatiques');
      console.log('   - Comportements aléatoires');
      console.log('   - Pagination intelligente');
      
      console.log('\n🚀 Recommandations pour la production:');
      console.log('   - Utiliser cette configuration pour éviter la détection');
      console.log('   - Ajuster les délais selon vos besoins');
      console.log('   - Surveiller les performances');
      console.log('   - Planifier des sessions régulières');
      
    } else if (listings.length === 0) {
      console.log('\n⚠️ Aucune annonce trouvée');
      console.log('💡 Vérifiez la configuration ou les sélecteurs');
    } else {
      console.log('\n❌ Test échoué ! Certaines données sont manquantes');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test avec comportement humain:', error);
    
    if ((error as Error).message.includes('403')) {
      console.log('\n🚫 Erreur 403: Accès interdit');
      console.log('💡 Solutions possibles:');
      console.log('   - Augmenter les délais entre requêtes');
      console.log('   - Réduire le nombre de pages par session');
      console.log('   - Vérifier les User-Agents');
    } else if ((error as Error).message.includes('timeout')) {
      console.log('\n⏰ Timeout: Requête trop lente');
      console.log('💡 Solutions possibles:');
      console.log('   - Augmenter les timeouts');
      console.log('   - Réduire les délais');
    }
  } finally {
    console.log('\n🏁 Test avec comportement humain terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testHumanScraper().catch(console.error);
}
