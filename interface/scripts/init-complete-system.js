/**
 * Script pour initialiser complètement le système optimisé
 * 
 * Ce script initialise toutes les tables et fonctions nécessaires
 * pour le nouveau système d'analyse optimisé.
 */

const { spawn } = require('child_process');

async function runScript(scriptName, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 ${description}...`);
    
    const child = spawn('npm', ['run', scriptName], {
      cwd: __dirname + '/..',
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text.trim());
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(text.trim());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} terminé avec succès`);
        resolve();
      } else {
        console.error(`❌ ${description} échoué avec le code ${code}`);
        reject(new Error(`${description} échoué`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Erreur lors de ${description}:`, error.message);
      reject(error);
    });
  });
}

async function initCompleteSystem() {
  console.log('🚀 Initialisation complète du système optimisé...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Initialiser les patterns de détection
    await runScript('init-patterns', 'Initialisation des patterns de détection');
    
    // 2. Initialiser les fonctions d'analyse SQL
    await runScript('init-analysis', 'Initialisation des fonctions d\'analyse SQL');
    
    console.log('\n🎉 Initialisation complète terminée avec succès!');
    console.log('\n📋 Ce qui a été initialisé:');
    console.log('   ✅ Tables de patterns de détection (53 patterns)');
    console.log('   ✅ Fonctions SQL d\'analyse des modèles iPhone');
    console.log('   ✅ Fonctions de calcul des prix de référence');
    console.log('   ✅ Vue des annonces analysées');
    console.log('   ✅ Fonction de récupération des bonnes affaires');
    console.log('   ✅ Index optimisés pour les performances');
    
    console.log('\n🚀 Prochaines étapes:');
    console.log('   1. Démarrer le serveur: npm run start');
    console.log('   2. Tester le système: npm run test-optimized');
    console.log('   3. Accéder à l\'interface: http://localhost:3000');
    
    console.log('\n💡 Nouveaux endpoints disponibles:');
    console.log('   📊 GET /api/good-deals - Bonnes affaires analysées');
    console.log('   📈 GET /api/good-deals-stats - Statistiques des bonnes affaires');
    console.log('   💰 GET /api/reference-prices - Prix de référence calculés');
    console.log('   📋 GET /api/analyzed-listings - Toutes les annonces analysées');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error.message);
    console.log('\n🔧 Dépannage:');
    console.log('   - Vérifiez que PostgreSQL est démarré');
    console.log('   - Vérifiez la configuration de la base de données dans .env');
    console.log('   - Vérifiez que les tables marketplace existent');
    
    process.exit(1);
  }
}

// Exécuter l'initialisation si appelé directement
if (require.main === module) {
  initCompleteSystem();
}

module.exports = { initCompleteSystem };
