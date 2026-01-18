/**
 * Test du scraper Leboncoin de production
 */

import { ProductionLeboncoinScraper, ScrapingConfig } from './src/scraper/ProductionLeboncoinScraper';

async function testProductionScraper() {
  console.log('🚀 Test du scraper Leboncoin de production...');
  
  // Configuration de production
  const config: ScrapingConfig = {
    maxPages: 2, // Limiter à 2 pages pour le test
    delayBetweenRequests: 2000, // 2 secondes entre les requêtes
    delayBetweenPages: 3000, // 3 secondes entre les pages
    retryAttempts: 3,
    retryDelay: 5000
  };
  
  const scraper = new ProductionLeboncoinScraper(config);
  
  try {
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🎯 URL de test: ${testUrl}`);
    console.log(`🔧 Configuration: ${JSON.stringify(config, null, 2)}`);
    
    // Test du scraping complet avec base de données
    console.log('\n📋 Test du scraping de production');
    const stats = await scraper.scrapeAndSave(testUrl);
    
    console.log('\n📊 Résultats finaux:');
    console.log(`   - Annonces totales: ${stats.totalListings}`);
    console.log(`   - Nouvelles annonces: ${stats.newListings}`);
    console.log(`   - Doublons ignorés: ${stats.duplicateListings}`);
    console.log(`   - Erreurs: ${stats.errorListings}`);
    console.log(`   - Pages scrapées: ${stats.pagesScraped}`);
    console.log(`   - Requêtes effectuées: ${stats.requestsMade}`);
    console.log(`   - Durée: ${Math.round((stats.duration || 0) / 1000)}s`);
    
    // Validation des résultats
    if (stats.newListings > 0) {
      console.log('\n✅ Test réussi ! Le scraper de production fonctionne');
      console.log('🎉 Solution prête pour la production !');
      
      console.log('\n💡 Recommandations pour la production:');
      console.log('   - Configurer la base de données PostgreSQL');
      console.log('   - Ajuster les délais selon vos besoins');
      console.log('   - Mettre en place un monitoring');
      console.log('   - Planifier des exécutions régulières');
      
    } else if (stats.duplicateListings > 0) {
      console.log('\n⚠️ Toutes les annonces étaient déjà en base');
      console.log('💡 C\'est normal si vous avez déjà testé le scraper');
      console.log('✅ Le système de détection des doublons fonctionne');
      
    } else {
      console.log('\n❌ Aucune nouvelle annonce trouvée');
      console.log('💡 Vérifiez la configuration de la base de données');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de production:', error);
    
    if ((error as Error).message.includes('ECONNREFUSED')) {
      console.log('\n🌐 Erreur de connexion à la base de données');
      console.log('💡 Solutions possibles:');
      console.log('   - Démarrer PostgreSQL');
      console.log('   - Vérifier les paramètres de connexion');
      console.log('   - Créer la base de données et les tables');
    } else if ((error as Error).message.includes('ENOTFOUND')) {
      console.log('\n🔍 Erreur de résolution DNS');
      console.log('💡 Solutions possibles:');
      console.log('   - Vérifier la connectivité internet');
      console.log('   - Vérifier l\'URL de test');
    } else if ((error as Error).message.includes('timeout')) {
      console.log('\n⏰ Timeout');
      console.log('💡 Solutions possibles:');
      console.log('   - Augmenter les timeouts');
      console.log('   - Vérifier la connexion internet');
    }
  } finally {
    console.log('\n🏁 Test de production terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testProductionScraper().catch(console.error);
}
