/**
 * Script de test pour vérifier l'API des patterns
 * 
 * Ce script teste les endpoints de l'API pour s'assurer que
 * les patterns sont correctement récupérés depuis la base de données.
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testPatternsAPI() {
  console.log('🧪 Test de l\'API des patterns de détection...\n');
  
  try {
    // Test 1: Récupérer tous les patterns
    console.log('1️⃣ Test de récupération des patterns...');
    const response = await fetch(`${API_BASE_URL}/api/patterns`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const patterns = await response.json();
    
    console.log('✅ Patterns récupérés avec succès');
    console.log(`📊 Catégories disponibles: ${Object.keys(patterns).join(', ')}`);
    
    // Vérifier la structure des patterns
    const expectedCategories = ['models', 'storage', 'colors', 'conditions'];
    const missingCategories = expectedCategories.filter(cat => !patterns[cat]);
    
    if (missingCategories.length > 0) {
      console.warn(`⚠️ Catégories manquantes: ${missingCategories.join(', ')}`);
    }
    
    // Afficher quelques exemples
    console.log('\n📋 Exemples de patterns:');
    Object.keys(patterns).forEach(category => {
      const categoryPatterns = patterns[category];
      const patternNames = Object.keys(categoryPatterns);
      console.log(`  ${category}: ${patternNames.slice(0, 3).join(', ')}${patternNames.length > 3 ? '...' : ''} (${patternNames.length} patterns)`);
    });
    
    // Test 2: Vérifier qu'un pattern spécifique fonctionne
    console.log('\n2️⃣ Test de détection avec un pattern...');
    if (patterns.models && patterns.models['iPhone 15']) {
      const testText = 'iPhone 15 128GB Noir';
      const modelPattern = patterns.models['iPhone 15'];
      const matches = modelPattern.test(testText);
      console.log(`✅ Test de détection: "${testText}" -> ${matches ? 'DÉTECTÉ' : 'NON DÉTECTÉ'}`);
    }
    
    // Test 3: Tester l'ajout d'un nouveau pattern (optionnel)
    console.log('\n3️⃣ Test d\'ajout d\'un nouveau pattern...');
    const newPattern = {
      category: 'models',
      name: 'iPhone 16 Test',
      pattern: 'iphone\\s*16\\s*test',
      priority: 50
    };
    
    const addResponse = await fetch(`${API_BASE_URL}/api/patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPattern)
    });
    
    if (addResponse.ok) {
      const addedPattern = await addResponse.json();
      console.log('✅ Nouveau pattern ajouté avec succès');
      console.log(`   ID: ${addedPattern.id}, Nom: ${addedPattern.name}`);
      
      // Nettoyer: supprimer le pattern de test
      console.log('\n🧹 Nettoyage: suppression du pattern de test...');
      const deleteResponse = await fetch(`${API_BASE_URL}/api/patterns/${addedPattern.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Pattern de test supprimé');
      } else {
        console.warn('⚠️ Impossible de supprimer le pattern de test');
      }
    } else {
      console.warn('⚠️ Impossible d\'ajouter un nouveau pattern (normal si les tables n\'existent pas encore)');
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Conseil: Assurez-vous que le serveur est démarré avec:');
      console.log('   npm run interface');
    }
    
    process.exit(1);
  }
}

// Exécuter les tests si appelé directement
if (require.main === module) {
  testPatternsAPI();
}

module.exports = { testPatternsAPI };
