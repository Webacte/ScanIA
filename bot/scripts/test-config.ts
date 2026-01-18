/**
 * Script de test de la configuration
 * 
 * Ce script valide la configuration et teste la connexion à la base de données
 */

import { productionConfig, validateConfig, displayConfig } from '../src/config/production';
import { DatabaseManager } from '../src/database/DatabaseManager';

async function testConfiguration() {
  console.log('🧪 Test de la configuration de production...');
  console.log('=' .repeat(50));

  // 1. Afficher la configuration
  displayConfig();
  console.log('');

  // 2. Valider la configuration
  console.log('📋 Validation de la configuration...');
  const validation = validateConfig();
  
  if (!validation.isValid) {
    console.log('❌ Configuration invalide:');
    validation.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
    console.log('');
    console.log('💡 Solutions:');
    console.log('   1. Copiez examples/config.production.example.ts vers src/config/production.ts');
    console.log('   2. Modifiez les paramètres selon votre environnement');
    console.log('   3. Configurez votre base de données PostgreSQL');
    return false;
  }

  console.log('✅ Configuration valide');
  console.log('');

  // 3. Tester la connexion à la base de données
  if (productionConfig.database.enabled) {
    console.log('🗄️ Test de la connexion à la base de données...');
    
    try {
      const dbManager = new DatabaseManager(productionConfig.database.config);
      const client = await dbManager.getClient();
      
      // Test simple
      const result = await client.query('SELECT 1 as test');
      client.release();
      
      if (result.rows[0].test === 1) {
        console.log('✅ Connexion à la base de données réussie');
      } else {
        console.log('❌ Erreur inattendue lors du test de la base de données');
        return false;
      }
      
      await dbManager.close();
      
    } catch (error) {
      console.log('❌ Erreur de connexion à la base de données:');
      console.log(`   ${(error as Error).message}`);
      console.log('');
      console.log('💡 Solutions:');
      console.log('   1. Vérifiez que PostgreSQL est démarré');
      console.log('   2. Vérifiez les paramètres de connexion');
      console.log('   3. Créez la base de données: CREATE DATABASE scanlecoin;');
      return false;
    }
  } else {
    console.log('⚠️ Base de données désactivée - test ignoré');
  }

  console.log('');

  // 4. Tester les URLs de recherche
  console.log('🔍 Test des URLs de recherche...');
  if (productionConfig.searchUrls.length === 0) {
    console.log('❌ Aucune URL de recherche configurée');
    return false;
  }

  console.log(`✅ ${productionConfig.searchUrls.length} URLs de recherche configurées:`);
  productionConfig.searchUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });

  console.log('');

  // 5. Résumé
  console.log('📊 Résumé du test:');
  console.log('   ✅ Configuration valide');
  if (productionConfig.database.enabled) {
    console.log('   ✅ Base de données accessible');
  }
  console.log('   ✅ URLs de recherche configurées');
  console.log('   ✅ Prêt pour la production');
  console.log('');
  console.log('🚀 Vous pouvez maintenant lancer:');
  console.log('   npm run production:test     # Test avec base de données');
  console.log('   npm run production:start    # Démarrage en production');
  console.log('   npm run production:demo     # Démonstration sans base de données');

  return true;
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testConfiguration()
    .then(success => {
      if (success) {
        console.log('\n🎉 Test de configuration réussi !');
        process.exit(0);
      } else {
        console.log('\n❌ Test de configuration échoué !');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Erreur lors du test de configuration:', error);
      process.exit(1);
    });
}
