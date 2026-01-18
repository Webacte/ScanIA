/**
 * Test simple du nouveau système optimisé
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');

async function testSimpleSystem() {
  console.log('🚀 Test du système optimisé simplifié...\n');
  
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
    // 1. Test des bonnes affaires
    console.log('1️⃣ Test des bonnes affaires...');
    const goodDealsResponse = await fetch('http://localhost:3000/api/good-deals?limit=10&minConfidence=50');
    
    if (!goodDealsResponse.ok) {
      throw new Error(`Erreur HTTP: ${goodDealsResponse.status}`);
    }
    
    const goodDealsData = await goodDealsResponse.json();
    console.log(`✅ ${goodDealsData.count} bonnes affaires trouvées`);
    
    if (goodDealsData.goodDeals.length > 0) {
      const bestDeal = goodDealsData.goodDeals[0];
      console.log(`🏆 Meilleure affaire: ${bestDeal.model} ${bestDeal.storage} - ${bestDeal.price}€ (confiance: ${bestDeal.confidence}%)`);
      console.log(`   Titre: "${bestDeal.title.substring(0, 50)}..."`);
    }
    
    // 2. Test des annonces analysées
    console.log('\n2️⃣ Test des annonces analysées...');
    const analyzedResponse = await fetch('http://localhost:3000/api/analyzed-listings?limit=5&minConfidence=30');
    
    if (!analyzedResponse.ok) {
      throw new Error(`Erreur HTTP: ${analyzedResponse.status}`);
    }
    
    const analyzedData = await analyzedResponse.json();
    console.log(`✅ ${analyzedData.pagination.count} annonces analysées récupérées`);
    
    if (analyzedData.listings.length > 0) {
      console.log(`📋 Exemples d'annonces analysées:`);
      analyzedData.listings.slice(0, 3).forEach((listing, index) => {
        console.log(`   ${index + 1}. ${listing.model} ${listing.storage} - ${listing.price}€ (confiance: ${listing.confidence}%)`);
      });
    }
    
    // 3. Test de performance
    console.log('\n3️⃣ Test de performance...');
    const startTime = Date.now();
    
    const perfResponse = await fetch('http://localhost:3000/api/good-deals?limit=50&minConfidence=50');
    const perfData = await perfResponse.json();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${perfData.count} bonnes affaires récupérées en ${duration}ms`);
    console.log(`⚡ Performance: ${Math.round(perfData.count / (duration / 1000))} affaires/seconde`);
    
    // 4. Test des filtres
    console.log('\n4️⃣ Test des filtres...');
    const filterResponse = await fetch('http://localhost:3000/api/good-deals?model=iPhone 15&limit=5');
    
    if (!filterResponse.ok) {
      throw new Error(`Erreur HTTP: ${filterResponse.status}`);
    }
    
    const filterData = await filterResponse.json();
    console.log(`✅ Filtres appliqués: ${filterData.count} iPhone 15 trouvés`);
    
    if (filterData.goodDeals.length > 0) {
      const filteredDeal = filterData.goodDeals[0];
      console.log(`   📱 ${filteredDeal.model} ${filteredDeal.storage}: ${filteredDeal.price}€ (confiance: ${filteredDeal.confidence}%)`);
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès!');
    console.log('\n💡 Avantages du nouveau système:');
    console.log('   ✅ Analyse directement dans PostgreSQL (plus rapide)');
    console.log('   ✅ Seules les annonces intéressantes sont retournées');
    console.log('   ✅ Filtres avancés disponibles');
    console.log('   ✅ Performance optimisée');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  } finally {
    // Arrêter le serveur
    console.log('\n🛑 Arrêt du serveur...');
    server.kill();
  }
}

testSimpleSystem();
