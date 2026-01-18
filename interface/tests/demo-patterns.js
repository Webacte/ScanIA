/**
 * Script de démonstration de l'API des patterns
 * 
 * Ce script montre comment utiliser la nouvelle API pour gérer
 * dynamiquement les patterns de détection des modèles iPhone.
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function demoPatternsAPI() {
  console.log('🎯 Démonstration de l\'API des patterns de détection\n');
  
  try {
    // 1. Récupérer les patterns actuels
    console.log('1️⃣ Récupération des patterns actuels...');
    const response = await fetch(`${API_BASE_URL}/api/patterns`);
    const patterns = await response.json();
    
    console.log(`✅ ${Object.keys(patterns).length} catégories de patterns récupérées`);
    Object.keys(patterns).forEach(category => {
      const count = Object.keys(patterns[category]).length;
      console.log(`   📁 ${category}: ${count} patterns`);
    });
    
    // 2. Tester la détection avec quelques exemples
    console.log('\n2️⃣ Test de détection avec des exemples...');
    
    const testCases = [
      'iPhone 15 128GB Noir',
      'iPhone 14 Pro Max 256GB Bleu',
      'iPhone 13 mini 64GB Rose',
      'iPhone 12 Pro 512GB Argent'
    ];
    
    testCases.forEach(testText => {
      console.log(`\n   🔍 Test: "${testText}"`);
      
      // Test des modèles
      let detectedModel = null;
      for (const [name, pattern] of Object.entries(patterns.models)) {
        if (pattern.test(testText)) {
          detectedModel = name;
          break;
        }
      }
      console.log(`      📱 Modèle: ${detectedModel || 'Non détecté'}`);
      
      // Test du stockage
      let detectedStorage = null;
      for (const [name, pattern] of Object.entries(patterns.storage)) {
        if (pattern.test(testText)) {
          detectedStorage = name;
          break;
        }
      }
      console.log(`      💾 Stockage: ${detectedStorage || 'Non détecté'}`);
      
      // Test des couleurs
      let detectedColor = null;
      for (const [name, pattern] of Object.entries(patterns.colors)) {
        if (pattern.test(testText)) {
          detectedColor = name;
          break;
        }
      }
      console.log(`      🎨 Couleur: ${detectedColor || 'Non détecté'}`);
    });
    
    // 3. Ajouter un nouveau pattern (exemple)
    console.log('\n3️⃣ Ajout d\'un nouveau pattern (exemple)...');
    
    const newPattern = {
      category: 'models',
      name: 'iPhone 16 Demo',
      pattern: 'iphone\\s*16\\s*demo',
      priority: 50
    };
    
    const addResponse = await fetch(`${API_BASE_URL}/api/patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPattern)
    });
    
    if (addResponse.ok) {
      const addedPattern = await addResponse.json();
      console.log(`✅ Nouveau pattern ajouté: ${addedPattern.name} (ID: ${addedPattern.id})`);
      
      // Tester le nouveau pattern
      const testText = 'iPhone 16 Demo 128GB';
      const newPatternRegex = new RegExp(addedPattern.pattern, 'i');
      const matches = newPatternRegex.test(testText);
      console.log(`   🧪 Test: "${testText}" -> ${matches ? 'DÉTECTÉ' : 'NON DÉTECTÉ'}`);
      
      // Nettoyer: supprimer le pattern de démonstration
      console.log('\n4️⃣ Nettoyage: suppression du pattern de démonstration...');
      const deleteResponse = await fetch(`${API_BASE_URL}/api/patterns/${addedPattern.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Pattern de démonstration supprimé');
      } else {
        console.warn('⚠️ Impossible de supprimer le pattern de démonstration');
      }
    } else {
      console.warn('⚠️ Impossible d\'ajouter un nouveau pattern (tables peut-être non initialisées)');
    }
    
    // 4. Afficher les statistiques
    console.log('\n5️⃣ Statistiques des patterns...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/patterns`);
    const statsPatterns = await statsResponse.json();
    
    let totalPatterns = 0;
    Object.keys(statsPatterns).forEach(category => {
      const count = Object.keys(statsPatterns[category]).length;
      totalPatterns += count;
    });
    
    console.log(`📊 Total des patterns actifs: ${totalPatterns}`);
    console.log(`📊 Répartition par catégorie:`);
    Object.keys(statsPatterns).forEach(category => {
      const count = Object.keys(statsPatterns[category]).length;
      const percentage = Math.round((count / totalPatterns) * 100);
      console.log(`   ${category}: ${count} patterns (${percentage}%)`);
    });
    
    console.log('\n🎉 Démonstration terminée avec succès!');
    console.log('\n💡 Prochaines étapes:');
    console.log('   - Modifiez les patterns via l\'API pour améliorer la détection');
    console.log('   - Ajoutez de nouveaux modèles iPhone quand ils sortent');
    console.log('   - Ajustez les priorités pour optimiser les performances');
    
  } catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Conseil: Assurez-vous que le serveur est démarré:');
      console.log('   cd interface && npm run start');
    }
    
    process.exit(1);
  }
}

// Exécuter la démonstration si appelé directement
if (require.main === module) {
  demoPatternsAPI();
}

module.exports = { demoPatternsAPI };
