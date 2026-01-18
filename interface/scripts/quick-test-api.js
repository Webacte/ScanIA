/**
 * Test rapide de l'API des patterns
 */

const fetch = require('node-fetch');

async function quickTest() {
  try {
    console.log('🧪 Test rapide de l\'API...');
    
    const response = await fetch('http://localhost:3000/api/patterns');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const patterns = await response.json();
    
    console.log('✅ API accessible');
    console.log('📊 Catégories:', Object.keys(patterns));
    
    // Vérifier quelques patterns spécifiques
    if (patterns.storage && patterns.storage['128GB']) {
      console.log('✅ Pattern 128GB trouvé:', patterns.storage['128GB']);
    }
    
    if (patterns.models && patterns.models['iPhone 15']) {
      console.log('✅ Pattern iPhone 15 trouvé:', patterns.models['iPhone 15']);
    }
    
    console.log('🎉 Test réussi!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Le serveur n\'est pas démarré. Démarrez-le avec:');
      console.log('   npm run start');
    }
  }
}

quickTest();
