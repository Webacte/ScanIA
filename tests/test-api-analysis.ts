/**
 * Test d'analyse de l'API interne de Leboncoin
 */

import { ApiAnalyzer } from './src/scraper/ApiAnalyzer';
import { writeFileSync } from 'fs';

async function testApiAnalysis() {
  console.log('🔍 Test d\'analyse de l\'API interne de Leboncoin...');
  
  const analyzer = new ApiAnalyzer();
  
  try {
    // 1. Analyser les endpoints connus
    console.log('\n📋 Phase 1: Analyse des endpoints connus');
    const endpoints = await analyzer.analyzeKnownEndpoints();
    
    // 2. Tester des variations d'endpoints prometteurs
    console.log('\n📋 Phase 2: Test de variations d\'endpoints');
    const promisingEndpoints = endpoints.filter(e => e.protection === 'none' || e.protection === 'low');
    
    for (const endpoint of promisingEndpoints) {
      if (endpoint.url.includes('api.leboncoin.fr')) {
        const variations = await analyzer.testEndpointVariations(endpoint.url);
        endpoints.push(...variations);
      }
    }
    
    // 3. Générer le rapport
    console.log('\n📋 Phase 3: Génération du rapport');
    const report = analyzer.generateReport();
    
    // 4. Sauvegarder le rapport
    const reportPath = 'API_ANALYSIS_REPORT.md';
    writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 Rapport sauvegardé: ${reportPath}`);
    
    // 5. Afficher un résumé
    console.log('\n📊 Résumé de l\'analyse:');
    const accessible = endpoints.filter(e => e.protection === 'none');
    const lowProtection = endpoints.filter(e => e.protection === 'low');
    const mediumProtection = endpoints.filter(e => e.protection === 'medium');
    const highProtection = endpoints.filter(e => e.protection === 'high');
    
    console.log(`   - Total testé: ${endpoints.length}`);
    console.log(`   - Accessible: ${accessible.length}`);
    console.log(`   - Protection faible: ${lowProtection.length}`);
    console.log(`   - Protection moyenne: ${mediumProtection.length}`);
    console.log(`   - Protection élevée: ${highProtection.length}`);
    
    if (accessible.length > 0) {
      console.log('\n🎉 Endpoints accessibles trouvés !');
      accessible.forEach(endpoint => {
        console.log(`   ✅ ${endpoint.url} (${endpoint.method})`);
      });
    } else if (lowProtection.length > 0) {
      console.log('\n🟡 Endpoints à protection faible trouvés !');
      lowProtection.forEach(endpoint => {
        console.log(`   🟡 ${endpoint.url} (${endpoint.method})`);
      });
    } else {
      console.log('\n❌ Aucun endpoint accessible trouvé');
      console.log('💡 Tous les endpoints ont une protection élevée');
    }
    
    // 6. Recommandations
    console.log('\n💡 Recommandations:');
    if (accessible.length > 0) {
      console.log('   - Utiliser les endpoints accessibles pour le scraping');
      console.log('   - Implémenter un client API dédié');
    } else if (lowProtection.length > 0) {
      console.log('   - Tester les endpoints à protection faible avec des headers avancés');
      console.log('   - Implémenter des techniques de contournement légères');
    } else {
      console.log('   - Passer à l\'implémentation de proxies rotatifs');
      console.log('   - Tester avec Selenium + Stealth');
      console.log('   - Développer des techniques de contournement avancées');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    console.log('\n🏁 Analyse terminée');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testApiAnalysis().catch(console.error);
}
