/**
 * Analyse de la pagination de Leboncoin
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

async function analyzePagination() {
  console.log('🔍 Analyse de la pagination de Leboncoin...');
  
  const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
  
  try {
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    });
    
    if (response.status !== 200) {
      console.log(`❌ Erreur: ${response.status}`);
      return;
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    console.log(`✅ HTML récupéré: ${html.length} caractères`);
    
    // 1. Rechercher tous les éléments de pagination
    console.log('\n📋 Analyse des éléments de pagination:');
    
    const paginationSelectors = [
      '[data-qa-id="pagination-next"]',
      '[data-test-id="pagination-next"]',
      '[data-spark-component="pagination-next-trigger"]',
      '.pagination-next',
      '.pagination',
      '[class*="pagination"]',
      'a[href*="page="]',
      'a[href*="&page="]',
      'a[href*="?page="]',
      '[aria-label*="suivante"]',
      '[aria-label*="next"]',
      'a:contains("suivante")',
      'a:contains("next")'
    ];
    
    for (const selector of paginationSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ ${selector}: ${elements.length} éléments trouvés`);
        
        elements.forEach((element, index) => {
          console.log(`   - Élément ${index + 1}:`);
          console.log(`     Tag: ${element.tagName}`);
          console.log(`     Classes: ${element.className}`);
          console.log(`     Href: ${element.getAttribute('href')}`);
          console.log(`     Aria-label: ${element.getAttribute('aria-label')}`);
          console.log(`     Data attributes: ${Array.from(element.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}="${attr.value}"`).join(', ')}`);
        });
      } else {
        console.log(`❌ ${selector}: 0 éléments`);
      }
    }
    
    // 2. Rechercher tous les liens contenant "page="
    console.log('\n📋 Analyse des liens avec "page=":');
    const allLinks = document.querySelectorAll('a[href*="page="]');
    console.log(`✅ ${allLinks.length} liens avec "page=" trouvés`);
    
    allLinks.forEach((link, index) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim();
      console.log(`   - Lien ${index + 1}: "${text}" -> ${href}`);
    });
    
    // 3. Rechercher les numéros de page
    console.log('\n📋 Analyse des numéros de page:');
    const pageNumbers = document.querySelectorAll('a[href*="page="], button[href*="page="], [data-page]');
    console.log(`✅ ${pageNumbers.length} éléments de numérotation trouvés`);
    
    pageNumbers.forEach((element, index) => {
      const href = element.getAttribute('href');
      const text = element.textContent?.trim();
      const dataPage = element.getAttribute('data-page');
      console.log(`   - Page ${index + 1}: "${text}" -> ${href} (data-page: ${dataPage})`);
    });
    
    // 4. Rechercher le bouton "suivante" spécifiquement
    console.log('\n📋 Recherche du bouton "suivante":');
    const nextButtons = document.querySelectorAll('a[aria-label*="suivante"], a[aria-label*="next"], a:contains("suivante"), a:contains("next")');
    console.log(`✅ ${nextButtons.length} boutons "suivante" trouvés`);
    
    nextButtons.forEach((button, index) => {
      const href = button.getAttribute('href');
      const ariaLabel = button.getAttribute('aria-label');
      const text = button.textContent?.trim();
      console.log(`   - Bouton ${index + 1}: "${text}" (${ariaLabel}) -> ${href}`);
    });
    
    // 5. Analyser la structure de pagination
    console.log('\n📋 Structure de pagination:');
    const paginationContainer = document.querySelector('.pagination, [class*="pagination"], nav[aria-label*="pagination"]');
    if (paginationContainer) {
      console.log('✅ Conteneur de pagination trouvé');
      console.log(`   - Classes: ${paginationContainer.className}`);
      console.log(`   - Contenu: ${paginationContainer.textContent?.trim()}`);
    } else {
      console.log('❌ Aucun conteneur de pagination trouvé');
    }
    
    // 6. Vérifier s'il y a une page suivante
    console.log('\n📋 Vérification page suivante:');
    const hasNextPage = document.querySelector('a[href*="page=2"], a[href*="&page=2"], a[href*="?page=2"]');
    if (hasNextPage) {
      console.log('✅ Page suivante détectée');
      console.log(`   - URL: ${hasNextPage.getAttribute('href')}`);
    } else {
      console.log('❌ Aucune page suivante détectée');
    }
    
    console.log('\n🏁 Analyse de pagination terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse si ce fichier est appelé directement
if (require.main === module) {
  analyzePagination().catch(console.error);
}
