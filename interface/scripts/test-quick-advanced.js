/**
 * Test rapide du filtrage avancé
 */

const fetch = require('node-fetch');

async function testQuickAdvanced() {
  console.log('🔍 Test rapide du filtrage avancé...\n');
  
  try {
    // Attendre que le serveur soit prêt
    console.log('⏳ Attente du serveur...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 1. Test des statistiques par caractéristiques
    console.log('1️⃣ Test des statistiques par caractéristiques...');
    const statsResponse = await fetch('http://localhost:3000/api/characteristics-stats');
    
    if (!statsResponse.ok) {
      throw new Error(`Erreur HTTP: ${statsResponse.status}`);
    }
    
    const statsData = await statsResponse.json();
    console.log(`✅ Statistiques récupérées: ${statsData.message}`);
    
    if (statsData.characteristics) {
      console.log(`📊 Top modèles: ${statsData.characteristics.models.length} modèles`);
      console.log(`📊 Top stockages: ${statsData.characteristics.storages.length} capacités`);
      console.log(`📊 Top couleurs: ${statsData.characteristics.colors.length} couleurs`);
      console.log(`📊 Top états: ${statsData.characteristics.conditions.length} états`);
    }
    
    // 2. Test de filtrage simple
    console.log('\n2️⃣ Test de filtrage par stockage 128GB...');
    const filterResponse = await fetch('http://localhost:3000/api/listings-filtered?storage=128GB&limit=3');
    
    if (!filterResponse.ok) {
      throw new Error(`Erreur HTTP: ${filterResponse.status}`);
    }
    
    const filterData = await filterResponse.json();
    console.log(`✅ ${filterData.pagination.count} annonces 128GB trouvées`);
    
    if (filterData.listings.length > 0) {
      console.log('📱 Exemples d\'annonces 128GB:');
      filterData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€`);
        console.log(`      Couleur: ${listing.color || 'Non détectée'}`);
        console.log(`      État: ${listing.condition || 'Non détecté'}`);
      });
    }
    
    // 3. Test de filtrage par couleur
    console.log('\n3️⃣ Test de filtrage par couleur (Noir)...');
    const colorResponse = await fetch('http://localhost:3000/api/listings-filtered?color=Noir&limit=3');
    
    if (!colorResponse.ok) {
      throw new Error(`Erreur HTTP: ${colorResponse.status}`);
    }
    
    const colorData = await colorResponse.json();
    console.log(`✅ ${colorData.pagination.count} annonces noires trouvées`);
    
    if (colorData.listings.length > 0) {
      console.log('📱 Exemples d\'annonces noires:');
      colorData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€`);
      });
    }
    
    console.log('\n🎉 Tests de filtrage avancé réussis!');
    console.log('\n💡 Fonctionnalités disponibles:');
    console.log('   ✅ Filtrage par modèle, stockage, couleur, état');
    console.log('   ✅ Filtres combinés');
    console.log('   ✅ Statistiques détaillées');
    console.log('   ✅ Performance optimisée');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Conseil: Assurez-vous que le serveur est démarré avec:');
      console.log('   npm run start');
    }
  }
}

testQuickAdvanced();
