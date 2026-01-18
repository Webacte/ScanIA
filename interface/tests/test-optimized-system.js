/**
 * Test du nouveau système optimisé avec analyse SQL
 * 
 * Ce script teste les nouveaux endpoints qui utilisent l'analyse
 * directement dans PostgreSQL pour de meilleures performances.
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testOptimizedSystem() {
  console.log('🚀 Test du système optimisé avec analyse SQL...\n');
  
  try {
    // 1. Test des bonnes affaires
    console.log('1️⃣ Test des bonnes affaires...');
    const goodDealsResponse = await fetch(`${API_BASE_URL}/api/good-deals?limit=10&minSavingsPercent=15`);
    
    if (!goodDealsResponse.ok) {
      throw new Error(`Erreur HTTP: ${goodDealsResponse.status}`);
    }
    
    const goodDealsData = await goodDealsResponse.json();
    console.log(`✅ ${goodDealsData.count} bonnes affaires trouvées`);
    
    if (goodDealsData.goodDeals.length > 0) {
      const bestDeal = goodDealsData.goodDeals[0];
      console.log(`🏆 Meilleure affaire: ${bestDeal.model} ${bestDeal.storage} - ${bestDeal.savings_percent}% d'économie (${bestDeal.savings}€)`);
      console.log(`   Prix: ${bestDeal.price}€ (référence: ${bestDeal.reference_price}€)`);
      console.log(`   Score: ${bestDeal.deal_score}/100`);
    }
    
    // 2. Test des statistiques des bonnes affaires
    console.log('\n2️⃣ Test des statistiques...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/good-deals-stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`Erreur HTTP: ${statsResponse.status}`);
    }
    
    const stats = await statsResponse.json();
    console.log(`✅ Statistiques récupérées:`);
    console.log(`   📊 Total bonnes affaires: ${stats.total_good_deals}`);
    console.log(`   💰 Économie moyenne: ${stats.avg_savings_percent}%`);
    console.log(`   🎯 Score moyen: ${stats.avg_deal_score}/100`);
    console.log(`   📱 Modèles uniques: ${stats.unique_models}`);
    console.log(`   💾 Stockages uniques: ${stats.unique_storages}`);
    
    if (stats.top_models && stats.top_models.length > 0) {
      console.log(`   🏆 Top modèles:`);
      stats.top_models.slice(0, 3).forEach((model, index) => {
        console.log(`      ${index + 1}. ${model.model}: ${model.count} affaires (${model.avg_savings}% économie)`);
      });
    }
    
    // 3. Test des prix de référence
    console.log('\n3️⃣ Test des prix de référence...');
    const pricesResponse = await fetch(`${API_BASE_URL}/api/reference-prices`);
    
    if (!pricesResponse.ok) {
      throw new Error(`Erreur HTTP: ${pricesResponse.status}`);
    }
    
    const referencePrices = await pricesResponse.json();
    const modelCount = Object.keys(referencePrices).length;
    console.log(`✅ Prix de référence pour ${modelCount} modèles`);
    
    // Afficher quelques exemples
    let count = 0;
    for (const [model, storages] of Object.entries(referencePrices)) {
      if (count >= 3) break;
      console.log(`   📱 ${model}:`);
      for (const [storage, data] of Object.entries(storages)) {
        console.log(`      ${storage}: ${data.price}€ (${data.sample_count} échantillons)`);
      }
      count++;
    }
    
    // 4. Test des annonces analysées
    console.log('\n4️⃣ Test des annonces analysées...');
    const analyzedResponse = await fetch(`${API_BASE_URL}/api/analyzed-listings?limit=5&minConfidence=50`);
    
    if (!analyzedResponse.ok) {
      throw new Error(`Erreur HTTP: ${analyzedResponse.status}`);
    }
    
    const analyzedData = await analyzedResponse.json();
    console.log(`✅ ${analyzedData.pagination.count} annonces analysées récupérées`);
    
    if (analyzedData.listings.length > 0) {
      console.log(`📋 Exemples d'annonces analysées:`);
      analyzedData.listings.slice(0, 3).forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€ (confiance: ${listing.confidence}%)`);
        console.log(`      "${listing.title.substring(0, 50)}..."`);
      });
    }
    
    // 5. Test de performance
    console.log('\n5️⃣ Test de performance...');
    const startTime = Date.now();
    
    const perfResponse = await fetch(`${API_BASE_URL}/api/good-deals?limit=50&minSavingsPercent=20`);
    const perfData = await perfResponse.json();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${perfData.count} bonnes affaires récupérées en ${duration}ms`);
    console.log(`⚡ Performance: ${Math.round(perfData.count / (duration / 1000))} affaires/seconde`);
    
    // 6. Test des filtres
    console.log('\n6️⃣ Test des filtres...');
    const filterResponse = await fetch(`${API_BASE_URL}/api/good-deals?model=iPhone 15&storage=128GB&limit=5`);
    
    if (!filterResponse.ok) {
      throw new Error(`Erreur HTTP: ${filterResponse.status}`);
    }
    
    const filterData = await filterResponse.json();
    console.log(`✅ Filtres appliqués: ${filterData.count} iPhone 15 128GB trouvés`);
    
    if (filterData.goodDeals.length > 0) {
      const filteredDeal = filterData.goodDeals[0];
      console.log(`   📱 ${filteredDeal.model} ${filteredDeal.storage}: ${filteredDeal.price}€ (${filteredDeal.savings_percent}% économie)`);
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès!');
    console.log('\n💡 Avantages du nouveau système:');
    console.log('   ✅ Analyse directement dans PostgreSQL (plus rapide)');
    console.log('   ✅ Seules les bonnes affaires sont retournées');
    console.log('   ✅ Calculs de prix de référence optimisés');
    console.log('   ✅ Filtres avancés disponibles');
    console.log('   ✅ Statistiques en temps réel');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Conseil: Assurez-vous que le serveur est démarré avec:');
      console.log('   npm run start');
    }
    
    process.exit(1);
  }
}

// Exécuter les tests si appelé directement
if (require.main === module) {
  testOptimizedSystem();
}

module.exports = { testOptimizedSystem };
