/**
 * Script de test pour le système de gestion des captchas
 * 
 * Ce script teste les différentes fonctionnalités :
 * - Détection de captcha
 * - Stratégies de contournement
 * - Résolution manuelle
 */

import { HumanLikeLeboncoinScraper } from '../src/scraper/HumanLikeLeboncoinScraper';
import { CaptchaDetector } from '../src/scraper/CaptchaDetector';
import { CaptchaManager } from '../src/scraper/CaptchaManager';

async function testCaptchaDetection() {
  console.log('🔍 Test de détection de captcha...');
  
  // HTML avec captcha hCaptcha
  const htmlWithCaptcha = `
    <html>
      <body>
        <h1>Vérification de sécurité</h1>
        <div class="h-captcha" data-sitekey="test-sitekey"></div>
        <iframe src="https://hcaptcha.com/1/api.js"></iframe>
        <p>Veuillez compléter la vérification pour continuer</p>
      </body>
    </html>
  `;

  // HTML normal
  const htmlNormal = `
    <html>
      <body>
        <h1>Résultats de recherche</h1>
        <div class="listing">iPhone 13 Pro Max - 800€</div>
        <div class="listing">iPhone 14 - 600€</div>
      </body>
    </html>
  `;

  // Test avec captcha
  const detector1 = new CaptchaDetector(htmlWithCaptcha, 'https://test.com');
  const captcha1 = detector1.detectCaptcha();
  console.log('📊 Détection avec captcha:', captcha1);
  console.log('📋 Rapport:', detector1.generateReport());

  // Test sans captcha
  const detector2 = new CaptchaDetector(htmlNormal, 'https://test.com');
  const captcha2 = detector2.detectCaptcha();
  console.log('📊 Détection sans captcha:', captcha2);
  console.log('📋 Rapport:', detector2.generateReport());
}

async function testCaptchaManager() {
  console.log('\n🛡️ Test du gestionnaire de captcha...');
  
  const manager = new CaptchaManager({
    manualMode: true,
    savePages: true,
    autoOpenBrowser: false, // Désactiver pour les tests
    retryDelay: 5000,
    maxRetries: 2
  });

  // Test avec captcha
  const htmlWithCaptcha = `
    <html>
      <body>
        <h1>Accès bloqué</h1>
        <p>Votre activité semble suspecte. Veuillez compléter la vérification.</p>
        <div class="captcha">Vérification requise</div>
      </body>
    </html>
  `;

  console.log('🔄 Test de gestion de captcha...');
  try {
    const solution = await manager.handleCaptcha(
      htmlWithCaptcha, 
      'https://test.com',
      { 'content-type': 'text/html' }
    );
    console.log('✅ Solution:', solution);
  } catch (error) {
    console.log('❌ Erreur:', error);
  }
}

async function testScraperWithCaptcha() {
  console.log('\n🚀 Test du scraper avec gestion de captcha...');
  
  const scraper = new HumanLikeLeboncoinScraper({
    minDelayBetweenRequests: 2000,
    maxDelayBetweenRequests: 5000,
    minDelayBetweenPages: 3000,
    maxDelayBetweenPages: 8000,
    maxPagesPerSession: 1,
    sessionBreakDuration: 10000,
    randomScrollBehavior: true,
    randomClickBehavior: true,
    realisticUserAgent: true
  });

  // Test avec une URL qui pourrait avoir un captcha
  const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013';
  
  console.log(`🔍 Test de scraping: ${testUrl}`);
  try {
    const listings = await scraper.scrapeWithHumanBehavior(testUrl);
    console.log(`✅ Scraping réussi: ${listings.length} annonces trouvées`);
    
    // Afficher les statistiques
    const stats = scraper.getSessionStats();
    console.log('📊 Statistiques de session:', stats);
    scraper.displayCaptchaStats();
    
  } catch (error) {
    console.log('❌ Erreur de scraping:', error);
    
    // Afficher les statistiques même en cas d'erreur
    const stats = scraper.getSessionStats();
    console.log('📊 Statistiques de session:', stats);
    scraper.displayCaptchaStats();
  }
}

async function main() {
  console.log('🧪 Tests du système de gestion des captchas');
  console.log('==================================================');
  
  try {
    await testCaptchaDetection();
    await testCaptchaManager();
    await testScraperWithCaptcha();
    
    console.log('\n✅ Tous les tests terminés');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
if (require.main === module) {
  main().catch(console.error);
}

export { testCaptchaDetection, testCaptchaManager, testScraperWithCaptcha };

