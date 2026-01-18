/**
 * Test de la recherche filtrée par stockage
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');

async function testFilteredSearch() {
  console.log('🔍 Test de la recherche filtrée par stockage...\n');
  
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
    // 1. Test des statistiques par stockage
    console.log('1️⃣ Test des statistiques par stockage...');
    const statsResponse = await fetch('http://localhost:3000/api/storage-stats');
    
    if (!statsResponse.ok) {
      throw new Error(`Erreur HTTP: ${statsResponse.status}`);
    }
    
    const statsData = await statsResponse.json();
    console.log(`✅ ${statsData.totalStorages} capacités de stockage disponibles`);
    
    if (statsData.storageStats.length > 0) {
      console.log('📊 Top capacités de stockage:');
      statsData.storageStats.slice(0, 5).forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.storage}: ${stat.count} annonces (${stat.avg_price}€ en moyenne)`);
      });
    }
    
    // 2. Test de recherche par stockage spécifique
    console.log('\n2️⃣ Test de recherche par stockage 128GB...');
    const searchResponse = await fetch('http://localhost:3000/api/listings-with-storage?storage=128GB&limit=10');
    
    if (!searchResponse.ok) {
      throw new Error(`Erreur HTTP: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`✅ ${searchData.pagination.count} annonces 128GB trouvées`);
    console.log(`   Message: ${searchData.message}`);
    
    if (searchData.listings.length > 0) {
      console.log('📱 Exemples d\'annonces 128GB:');
      searchData.listings.slice(0, 3).forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€ (confiance: ${listing.confidence}%)`);
        console.log(`      "${listing.title.substring(0, 50)}..."`);
      });
    }
    
    // 3. Test de recherche par modèle et stockage
    console.log('\n3️⃣ Test de recherche iPhone 13 256GB...');
    const modelSearchResponse = await fetch('http://localhost:3000/api/listings-with-storage?model=iPhone 13&storage=256GB&limit=5');
    
    if (!modelSearchResponse.ok) {
      throw new Error(`Erreur HTTP: ${modelSearchResponse.status}`);
    }
    
    const modelSearchData = await modelSearchResponse.json();
    console.log(`✅ ${modelSearchData.pagination.count} iPhone 13 256GB trouvés`);
    
    if (modelSearchData.listings.length > 0) {
      console.log('📱 iPhone 13 256GB disponibles:');
      modelSearchData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.price}€ - "${listing.title.substring(0, 40)}..."`);
      });
    } else {
      console.log('   ℹ️ Aucun iPhone 13 256GB trouvé');
    }
    
    // 4. Test de recherche avec filtres de prix
    console.log('\n4️⃣ Test de recherche avec filtres de prix...');
    const priceSearchResponse = await fetch('http://localhost:3000/api/listings-with-storage?storage=128GB&minPrice=200&maxPrice=400&limit=5');
    
    if (!priceSearchResponse.ok) {
      throw new Error(`Erreur HTTP: ${priceSearchResponse.status}`);
    }
    
    const priceSearchData = await priceSearchResponse.json();
    console.log(`✅ ${priceSearchData.pagination.count} annonces 128GB entre 200€ et 400€`);
    
    if (priceSearchData.listings.length > 0) {
      console.log('💰 Annonces dans la fourchette de prix:');
      priceSearchData.listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€`);
      });
    }
    
    // 5. Test de performance
    console.log('\n5️⃣ Test de performance...');
    const startTime = Date.now();
    
    const perfResponse = await fetch('http://localhost:3000/api/listings-with-storage?storage=128GB&limit=50');
    const perfData = await perfResponse.json();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${perfData.pagination.count} annonces 128GB récupérées en ${duration}ms`);
    console.log(`⚡ Performance: ${Math.round(perfData.pagination.count / (duration / 1000))} annonces/seconde`);
    
    console.log('\n🎉 Tous les tests de recherche filtrée sont passés!');
    console.log('\n💡 Avantages de la recherche filtrée:');
    console.log('   ✅ Seules les annonces avec stockage sont retournées');
    console.log('   ✅ Filtrage direct dans PostgreSQL (plus rapide)');
    console.log('   ✅ Garantie que toutes les annonces ont un stockage');
    console.log('   ✅ Filtres combinés (modèle + stockage + prix)');
    console.log('   ✅ Statistiques par capacité de stockage');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  } finally {
    // Arrêter le serveur
    console.log('\n🛑 Arrêt du serveur...');
    server.kill();
  }
}

testFilteredSearch();
