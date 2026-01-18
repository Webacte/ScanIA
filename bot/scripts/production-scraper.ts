/**
 * Script de Production - Scraper Leboncoin Complet
 * 
 * Ce script lance le scraper de production avec toutes les fonctionnalités :
 * - Comportement humain réaliste
 * - Base de données PostgreSQL
 * - Planification automatique
 * - Monitoring et notifications
 * - Gestion des erreurs robuste
 */

import 'dotenv/config';
import { FinalProductionScraper, ProductionConfig } from '../src/scraper/FinalProductionScraper';
import { productionConfig, validateConfig } from '../src/config/production';

async function startProductionScraper() {
  console.log('🚀 Démarrage du Scraper Leboncoin de Production');
  console.log('=' .repeat(60));

  // Utiliser la configuration de production
  const config: ProductionConfig = productionConfig;

  const scraper = new FinalProductionScraper(config);

  try {
    // Démarrer le scraper
    await scraper.start();

    // Afficher le statut
    const status = scraper.getStatus();
    console.log('\n📊 Statut du scraper:');
    console.log(`   - En cours: ${status.isRunning ? '✅' : '❌'}`);
    console.log(`   - Session: ${status.currentSessionId}`);
    console.log(`   - URLs configurées: ${status.config.searchUrls.length}`);
    console.log(`   - Planification: ${status.config.scheduling.enabled ? '✅' : '❌'}`);
    console.log(`   - Base de données: ${status.config.database.enabled ? '✅' : '❌'}`);

    // Garder le processus en vie
    console.log('\n🔄 Scraper en cours d\'exécution...');
    console.log('💡 Appuyez sur Ctrl+C pour arrêter');

    // Gestion de l'arrêt propre
    process.on('SIGINT', async () => {
      console.log('\n🛑 Arrêt demandé...');
      await scraper.stop();
      console.log('✅ Arrêt terminé');
      process.exit(0);
    });

    // Garder le processus en vie
    setInterval(() => {
      // Vérifier le statut toutes les minutes
      const currentStatus = scraper.getStatus();
      if (!currentStatus.isRunning) {
        console.log('⚠️ Le scraper s\'est arrêté de manière inattendue');
        process.exit(1);
      }
    }, 60000); // Vérifier toutes les minutes

  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    await scraper.stop();
    process.exit(1);
  }
}

// Fonction pour exécuter une session unique (sans planification)
async function runSingleSession() {
  console.log('🎯 Exécution d\'une session unique');
  
  // Utiliser la configuration de production mais désactiver la planification
  const config: ProductionConfig = {
    ...productionConfig,
    scheduling: {
      ...productionConfig.scheduling,
      enabled: false // Pas de planification pour une session unique
    },
    searchUrls: [
      'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go'
    ]
  };

  const scraper = new FinalProductionScraper(config);

  try {
    await scraper.start();
    const stats = await scraper.executeScrapingSession();
    await scraper.stop();
    
    console.log('\n🎉 Session unique terminée avec succès !');
    return stats;
  } catch (error) {
    console.error('❌ Erreur lors de la session unique:', error);
    await scraper.stop();
    throw error;
  }
}

// Fonction pour tester la configuration
async function testConfiguration() {
  console.log('🧪 Test de la configuration de production...');
  
  try {
    const stats = await runSingleSession();
    
    if (stats.success && stats.newListings > 0) {
      console.log('✅ Configuration validée !');
      console.log(`📊 ${stats.newListings} nouvelles annonces trouvées`);
      return true;
    } else {
      console.log('⚠️ Configuration à ajuster');
      return false;
    }
  } catch (error) {
    console.error('❌ Configuration invalide:', error);
    return false;
  }
}

// Point d'entrée principal
async function main() {
  const { isValid, errors } = validateConfig();
  if (!isValid) {
    console.error('ERREUR de configuration:');
    errors.forEach((e) => console.error('  -', e));
    console.error('\nCopiez .env.example en .env et renseignez les variables requises.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      await startProductionScraper();
      break;
      
    case 'test':
      await testConfiguration();
      break;
      
    case 'session':
      await runSingleSession();
      break;
      
    default:
      console.log('🚀 Scraper Leboncoin de Production');
      console.log('');
      console.log('Usage:');
      console.log('  npm run production start    - Démarrer le scraper en mode production');
      console.log('  npm run production test     - Tester la configuration');
      console.log('  npm run production session  - Exécuter une session unique');
      console.log('');
      console.log('Exemples:');
      console.log('  npm run production start    # Démarre avec planification automatique');
      console.log('  npm run production test     # Teste la configuration');
      console.log('  npm run production session  # Une seule session de test');
      break;
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  main().catch(console.error);
}
