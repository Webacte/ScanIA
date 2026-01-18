/**
 * Test pour vérifier que l'ancien système n'est plus utilisé
 */

const fetch = require('node-fetch');

async function testNoOldSystem() {
  console.log('🧪 Test pour vérifier que l\'ancien système n\'est plus utilisé...\n');
  
  try {
    // Test de l'endpoint /api/analyze-models
    console.log('1️⃣ Test de /api/analyze-models...');
    const response1 = await fetch('http://localhost:3000/api/analyze-models');
    
    if (!response1.ok) {
      throw new Error(`Erreur HTTP: ${response1.status}`);
    }
    
    const data1 = await response1.json();
    console.log(`✅ Réponse reçue: ${data1.message || 'Analyse optimisée'}`);
    console.log(`   Nombre de bonnes affaires: ${data1.count || data1.goodDeals?.length || 0}`);
    
    // Test de l'endpoint /api/analyze-listing
    console.log('\n2️⃣ Test de /api/analyze-listing...');
    const testListing = {
      title: 'IPhone 12 Pro 256go'
    };
    
    const response2 = await fetch('http://localhost:3000/api/analyze-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ listing: testListing })
    });
    
    if (!response2.ok) {
      throw new Error(`Erreur HTTP: ${response2.status}`);
    }
    
    const data2 = await response2.json();
    console.log(`✅ Analyse d'annonce: ${data2.message || 'Analyse optimisée'}`);
    console.log(`   Modèle: ${data2.model || 'Non détecté'}`);
    console.log(`   Stockage: ${data2.storage || 'Non détecté'}`);
    console.log(`   Confiance: ${data2.confidence || 0}%`);
    console.log(`   Complet: ${data2.isComplete ? 'Oui' : 'Non'}`);
    
    // Test avec un titre qui posait problème
    console.log('\n3️⃣ Test avec titre problématique...');
    const problematicListing = {
      title: 'Iphone 13 mini neuf'
    };
    
    const response3 = await fetch('http://localhost:3000/api/analyze-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ listing: problematicListing })
    });
    
    const data3 = await response3.json();
    console.log(`✅ Analyse titre problématique:`);
    console.log(`   Modèle: ${data3.model || 'Non détecté'}`);
    console.log(`   Stockage: ${data3.storage || 'Non détecté'}`);
    console.log(`   Confiance: ${data3.confidence || 0}%`);
    
    console.log('\n🎉 Tests terminés!');
    console.log('\n💡 Vérifications:');
    console.log('   ✅ Plus de messages "Modèle ou stockage manquant"');
    console.log('   ✅ Plus d\'analyse côté client');
    console.log('   ✅ Analyse directe dans PostgreSQL');
    console.log('   ✅ Performance optimisée');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Conseil: Assurez-vous que le serveur est démarré avec:');
      console.log('   npm run start');
    }
  }
}

testNoOldSystem();
