/**
 * Script de test pour le système de détection de doublons
 */

import { HumanLikeLeboncoinScraper } from '../src/scraper/HumanLikeLeboncoinScraper';
import { DatabaseManager } from '../src/database/DatabaseManager';
import { productionConfig } from '../src/config/production';

async function testDuplicateDetection() {
  console.log('🧪 Test du système de détection de doublons\n');

  try {
    // Initialiser le DatabaseManager
    const dbManager = new DatabaseManager(productionConfig.database.config);
    console.log('💾 DatabaseManager initialisé');

    // Créer le scraper avec configuration de test
    const scraper = new HumanLikeLeboncoinScraper({
      ...productionConfig.humanBehavior,
      duplicateThreshold: 0.7,  // 70% pour le test
      minListingsToCheck: 5     // 5 annonces minimum pour le test
    });

    // Configurer le DatabaseManager
    scraper.setDatabaseManager(dbManager);

    console.log('🔧 Configuration de test:');
    console.log(`   - Seuil de doublons: ${Math.round(0.7 * 100)}%`);
    console.log(`   - Annonces minimum: 5`);
    console.log('');

    // Test avec une URL iPhone 15 (probablement beaucoup de doublons)
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015';
    
    console.log(`🔍 Test avec: ${testUrl}`);
    console.log('');

    const startTime = Date.now();
    const listings = await scraper.scrapeWithHumanBehavior(testUrl);
    const duration = Date.now() - startTime;

    console.log('');
    console.log('📊 Résultats du test:');
    console.log(`   - Annonces extraites: ${listings.length}`);
    console.log(`   - Durée: ${Math.round(duration / 1000)}s`);
    
    // Afficher les statistiques de détection de doublons
    scraper.displayDuplicateDetectionStats();

    // Afficher les statistiques de session
    const sessionStats = scraper.getSessionStats();
    console.log('');
    console.log('📈 Statistiques de session:');
    console.log(`   - Pages scrapées: ${sessionStats.pagesScraped}`);
    console.log(`   - Requêtes effectuées: ${sessionStats.requestsMade}`);
    console.log(`   - Durée de session: ${Math.round(sessionStats.sessionDuration / 1000)}s`);

    console.log('');
    console.log('✅ Test terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testDuplicateDetection().catch(console.error);
