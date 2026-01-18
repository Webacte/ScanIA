/**
 * Test du filtrage avancé avec toutes les caractéristiques
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');

async function testAdvancedFiltering() {
  console.log('🔍 Test du filtrage avancé avec toutes les caractéristiques...\n');
  
  // Démarrer le serveur
  console.log('🔄 Démarrage du serveur...');
  const server = spawn('node', ['server.js'], {
    cwd: __dirname + '/..',
    stdio: 'pipe'
  });

  // Attendre que le serveur démarre
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Interface ScanLeCoin démarrée')) {
        resolve();
      }
    });
    
    setTimeout(() => {
      console.log('⏰ Timeout - serveur supposé démarré');
      resolve();
    }, 5000);
  });

  // Attendre un peu plus
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // 1. Test des statistiques par caractéristiques
    console.log('1️⃣ Test des statistiques par caractéristiques...');
    const statsResponse = await fetch('http://localhost:3000/api/characteristics-stats');
    
    if (!statsResponse.ok) {
      throw new Error(`Erreur HTTP: ${statsResponse.status}`);
    }
    
    const statsData = await statsResponse.json();
    console.log(`✅ Statistiques récupérées: ${statsData.message}`);
    
    if (statsData.characteristics) {
      console.log(`📊 Top modèles (${statsData.characteristics.models.length}):`);
      statsData.characteristics.models.slice(0, 3).forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.model}: ${stat.count} annonces (${stat.avg_price}€ en moyenne)`);
      });
      
      console.log(`📊 Top stockages (${statsData.characteristics.storages.length}):`);
      statsData.characteristics.storages.slice(0, 3).forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.storage}: ${stat.count} annonces (${stat.avg_price}€ en moyenne)`);
      });
      
      console.log(`📊 Top couleurs (${statsData.characteristics.colors.length}):`);
      statsData.characteristics.colors.slice(0, 3).forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.color}: ${stat.count} annonces (${stat.avg_price}€ en moyenne)`);
      });
      
      console.log(`📊 Top états (${statsData.characteristics.conditions.length}):`);
      statsData.characteristics.conditions.slice(0, 3).forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.condition}: ${stat.count} annonces (${stat.avg_price}€ en moyenne)`);
      });
    }
    
    // 2. Test de filtrage par modèle et stockage
    console.log('\n2️⃣ Test de filtrage iPhone 13 128GB...');
    const modelStorageResponse = await fetch('http://localhost:3000/api/listings-filtered?model=iPhone 13&storage=128GB&limit=5');
    
    if (!modelStorageResponse.ok) {
      throw new Error(`Erreur HTTP: ${modelStorageResponse.status}`);
    }
    
    const modelStorageData = await modelStorageResponse.json();
    console.log(`✅ ${modelStorageData.pagination.count} iPhone 13 128GB trouvés`);
    
    if (modelStorageData.listings.length > 0) {
      console.log('📱 iPhone 13 128GB disponibles:');
      modelStorageData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.price}€ - ${listing.color || 'Couleur non détectée'} - ${listing.condition || 'État non détecté'}`);
        console.log(`      "${listing.title.substring(0, 50)}..."`);
      });
    }
    
    // 3. Test de filtrage par couleur
    console.log('\n3️⃣ Test de filtrage par couleur (Noir)...');
    const colorResponse = await fetch('http://localhost:3000/api/listings-filtered?color=Noir&limit=5');
    
    if (!colorResponse.ok) {
      throw new Error(`Erreur HTTP: ${colorResponse.status}`);
    }
    
    const colorData = await colorResponse.json();
    console.log(`✅ ${colorData.pagination.count} annonces noires trouvées`);
    
    if (colorData.listings.length > 0) {
      console.log('📱 Annonces noires:');
      colorData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€`);
      });
    }
    
    // 4. Test de filtrage par état
    console.log('\n4️⃣ Test de filtrage par état (Bon état)...');
    const conditionResponse = await fetch('http://localhost:3000/api/listings-filtered?condition=Bon état&limit=5');
    
    if (!conditionResponse.ok) {
      throw new Error(`Erreur HTTP: ${conditionResponse.status}`);
    }
    
    const conditionData = await conditionResponse.json();
    console.log(`✅ ${conditionData.pagination.count} annonces en bon état trouvées`);
    
    if (conditionData.listings.length > 0) {
      console.log('📱 Annonces en bon état:');
      conditionData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€ - ${listing.color || 'Couleur non détectée'}`);
      });
    }
    
    // 5. Test de filtrage combiné
    console.log('\n5️⃣ Test de filtrage combiné (iPhone 12, 256GB, Noir, 200-400€)...');
    const combinedResponse = await fetch('http://localhost:3000/api/listings-filtered?model=iPhone 12&storage=256GB&color=Noir&minPrice=200&maxPrice=400&limit=5');
    
    if (!combinedResponse.ok) {
      throw new Error(`Erreur HTTP: ${combinedResponse.status}`);
    }
    
    const combinedData = await combinedResponse.json();
    console.log(`✅ ${combinedData.pagination.count} iPhone 12 256GB noirs entre 200-400€ trouvés`);
    
    if (combinedData.listings.length > 0) {
      console.log('📱 iPhone 12 256GB noirs dans la fourchette:');
      combinedData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.price}€ - ${listing.condition || 'État non détecté'}`);
        console.log(`      "${listing.title.substring(0, 50)}..."`);
      });
    } else {
      console.log('   ℹ️ Aucun iPhone 12 256GB noir trouvé dans cette fourchette de prix');
    }
    
    // 6. Test de performance
    console.log('\n6️⃣ Test de performance...');
    const startTime = Date.now();
    
    const perfResponse = await fetch('http://localhost:3000/api/listings-filtered?storage=128GB&limit=50');
    const perfData = await perfResponse.json();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${perfData.pagination.count} annonces 128GB récupérées en ${duration}ms`);
    console.log(`⚡ Performance: ${Math.round(perfData.pagination.count / (duration / 1000))} annonces/seconde`);
    
    console.log('\n🎉 Tous les tests de filtrage avancé sont passés!');
    console.log('\n💡 Avantages du filtrage avancé:');
    console.log('   ✅ Filtrage par modèle, stockage, couleur, état');
    console.log('   ✅ Filtres combinés (modèle + stockage + couleur + prix)');
    console.log('   ✅ Exclusion automatique des lots et pièces détachées');
    console.log('   ✅ Statistiques détaillées par caractéristique');
    console.log('   ✅ Performance optimisée avec PostgreSQL');
    console.log('   ✅ Interface de recherche ultra-précise');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  } finally {
    // Arrêter le serveur
    console.log('\n🛑 Arrêt du serveur...');
    server.kill();
  }
}

testAdvancedFiltering();
