/**
 * Test du scraper uniquement (sans Redis ni base de données)
 * 
 * Ce script teste uniquement le scraping Playwright sans aucune dépendance externe
 */

import { chromium, Browser, Page } from 'playwright';
import { RateLimiter } from './src/utils/RateLimiter';

/**
 * Test du scraper Playwright uniquement
 */
async function testScraperOnly() {
  console.log('🧪 Test du scraper Playwright uniquement...');
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Initialiser le navigateur avec des paramètres plus réalistes
    console.log('🌐 Initialisation du navigateur...');
    browser = await chromium.launch({ 
      headless: false, // Mode visible pour éviter la détection
      slowMo: 2000,   // Délai plus long pour paraître humain
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris'
    });
    
    page = await context.newPage();
    
    // Headers réalistes
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // URL de test
    const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log(`🔍 Navigation vers: ${testUrl}`);
    
    // Naviguer vers la page
    console.log('🌐 Navigation en cours...');
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    
    // Simuler un comportement humain
    console.log('👤 Simulation du comportement humain...');
    await page.waitForTimeout(2000);
    
    // Faire défiler un peu pour déclencher le chargement
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });
    await page.waitForTimeout(2000);
    
    // Attendre que les annonces se chargent
    console.log('⏳ Attente du chargement des annonces...');
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
    
    // Attendre un peu plus pour que le contenu dynamique se charge
    await page.waitForTimeout(5000);
    
    // Vérifier ce qui est présent sur la page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasAdContainer: !!document.querySelector('[data-qa-id="aditem_container"]'),
        hasAdItem: !!document.querySelector('[data-qa-id="aditem"]'),
        hasArticle: !!document.querySelector('article'),
        allDataQaIds: Array.from(document.querySelectorAll('[data-qa-id]')).map(el => el.getAttribute('data-qa-id')),
        allDataTestIds: Array.from(document.querySelectorAll('[data-test-id]')).map(el => el.getAttribute('data-test-id'))
      };
    });
    
    console.log('📄 Informations sur la page:');
    console.log(`   - Titre: ${pageContent.title}`);
    console.log(`   - URL: ${pageContent.url}`);
    console.log(`   - Container aditem_container: ${pageContent.hasAdContainer}`);
    console.log(`   - Container aditem: ${pageContent.hasAdItem}`);
    console.log(`   - Articles: ${pageContent.hasArticle}`);
    console.log(`   - data-qa-id trouvés: ${pageContent.allDataQaIds.slice(0, 10).join(', ')}`);
    console.log(`   - data-test-id trouvés: ${pageContent.allDataTestIds.slice(0, 10).join(', ')}`);
    
    if (!pageContent.hasAdContainer) {
      console.log('⚠️ Aucun container aditem_container trouvé, tentative avec d\'autres sélecteurs...');
      
      // Essayer d'autres sélecteurs possibles
      const alternativeSelectors = [
        '[data-qa-id="aditem"]',
        'article[data-test-id="ad"]',
        '.aditem',
        '[class*="ad"]',
        'article'
      ];
      
      for (const selector of alternativeSelectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`✅ Trouvé ${elements.length} éléments avec le sélecteur: ${selector}`);
          break;
        }
      }
    }
    
    // Tester les sélecteurs individuellement
    console.log('🔍 Test des sélecteurs...');
    const selectorsTest = await page.evaluate(() => {
      const results: any = {};
      
      // Test du container
      const containers = document.querySelectorAll('[data-qa-id="aditem_container"]');
      results.containers = containers.length;
      
      if (containers.length > 0) {
        const firstContainer = containers[0];
        
        // Test du titre
        const titleElement = firstContainer.querySelector('[data-test-id="adcard-title"]');
        results.title = titleElement?.textContent?.trim() || 'Non trouvé';
        
        // Test du prix
        const priceElement = firstContainer.querySelector('[data-qa-id="aditem_price"]');
        results.price = priceElement?.textContent?.trim() || 'Non trouvé';
        
        // Test de la localisation
        const locationElement = firstContainer.querySelector('p.text-caption.text-neutral');
        results.location = locationElement?.textContent?.trim() || 'Non trouvé';
        
        // Test de l'image
        const imageElement = firstContainer.querySelector('img[src*="img.leboncoin.fr"]') as HTMLImageElement;
        results.image = imageElement?.src || 'Non trouvée';
        
        // Test de l'URL
        const linkElement = firstContainer.querySelector('a');
        results.url = linkElement?.href || 'Non trouvée';
        
        // Test de l'ID externe
        const url = linkElement?.href || '';
        const external_id = url.match(/\/(\d+)$/)?.[1] || url.match(/\/(\d+)\.htm/)?.[1] || '';
        results.external_id = external_id || 'Non trouvé';
      }
      
      return results;
    });
    
    console.log('📊 Résultats des tests de sélecteurs:');
    console.log(`   - Containers trouvés: ${selectorsTest.containers}`);
    console.log(`   - Titre: ${selectorsTest.title}`);
    console.log(`   - Prix: ${selectorsTest.price}`);
    console.log(`   - Localisation: ${selectorsTest.location}`);
    console.log(`   - Image: ${selectorsTest.image}`);
    console.log(`   - URL: ${selectorsTest.url}`);
    console.log(`   - ID externe: ${selectorsTest.external_id}`);
    
    // Test complet du scraping
    console.log('\n🔍 Test complet du scraping...');
    const listings = await page.evaluate(() => {
      const listingElements = document.querySelectorAll('[data-qa-id="aditem_container"]');
      const results: any[] = [];

      listingElements.forEach((element) => {
        try {
          // Extraire l'ID externe depuis l'URL
          const linkElement = element.querySelector('a') as HTMLAnchorElement;
          const url = linkElement?.href || '';
          const external_id = url.match(/\/(\d+)$/)?.[1] || url.match(/\/(\d+)\.htm/)?.[1] || '';

          // Extraire le titre
          const titleElement = element.querySelector('[data-test-id="adcard-title"]') as HTMLElement;
          const title = titleElement?.textContent?.trim() || '';

          // Extraire le prix
          const priceElement = element.querySelector('[data-qa-id="aditem_price"]') as HTMLElement;
          const priceText = priceElement?.textContent?.trim() || '';
          const price_cents = parseInt(priceText.replace(/[^\d]/g, '')) * 100 || 0;

          // Extraire la localisation
          const locationElement = element.querySelector('p.text-caption.text-neutral') as HTMLElement;
          const location = locationElement?.textContent?.trim() || '';

          // Extraire l'image
          const imageElement = element.querySelector('img[src*="img.leboncoin.fr"]') as HTMLImageElement;
          const image_url = imageElement?.src || '';

          // Vérifier si livraison disponible
          const hasShipping = element.textContent?.toLowerCase().includes('livraison') || false;

          if (external_id && title && price_cents > 0) {
            results.push({
              external_id,
              title,
              price_cents,
              url: url.startsWith('http') ? url : `https://www.leboncoin.fr${url}`,
              location,
              has_shipping: hasShipping,
              image_url
            });
          }
        } catch (error) {
          console.error('Erreur lors de l\'extraction d\'une annonce:', error);
        }
      });

      return results;
    });
    
    console.log(`\n📋 ${listings.length} annonces extraites:`);
    listings.forEach((listing, index) => {
      console.log(`\n--- Annonce ${index + 1} ---`);
      console.log(`ID: ${listing.external_id}`);
      console.log(`Titre: ${listing.title}`);
      console.log(`Prix: ${listing.price_cents / 100}€`);
      console.log(`Localisation: ${listing.location}`);
      console.log(`URL: ${listing.url}`);
      console.log(`Image: ${listing.image_url}`);
      console.log(`Livraison: ${listing.has_shipping ? 'Oui' : 'Non'}`);
    });
    
    // Validation des résultats
    const isValid = listings.every(listing => 
      listing.external_id && 
      listing.title && 
      listing.price_cents > 0
    );
    
    if (isValid) {
      console.log('\n✅ Test réussi ! Tous les sélecteurs fonctionnent correctement');
      console.log('🎉 Le scraper est prêt à être utilisé !');
    } else {
      console.log('\n❌ Test échoué ! Certains sélecteurs ne fonctionnent pas');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    console.log('\n🏁 Test terminé');
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testScraperOnly().catch(console.error);
}
