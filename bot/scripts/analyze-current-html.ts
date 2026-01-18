/**
 * Analyse du HTML actuel de Leboncoin pour corriger les sélecteurs
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';

async function analyzeCurrentHTML() {
  console.log('🔍 Analyse du HTML actuel de Leboncoin...');
  
  const testUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
  
  try {
    // Récupérer le HTML
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
    console.log(`✅ HTML récupéré: ${html.length} caractères`);
    
    // Sauvegarder le HTML pour analyse
    fs.writeFileSync('current-leboncoin.html', html);
    console.log('💾 HTML sauvegardé dans current-leboncoin.html');
    
    // Analyser avec JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // 1. Rechercher les conteneurs d'annonces
    console.log('\n📋 Analyse des conteneurs d\'annonces:');
    
    const possibleSelectors = [
      '[data-qa-id="aditem_container"]',
      '[data-test-id="aditem_container"]',
      '.aditem_container',
      '.aditem',
      '.ad-card',
      '.listing-card',
      '.search-result',
      '.result-item',
      '[data-qa-id*="ad"]',
      '[data-test-id*="ad"]',
      '.ad',
      '.listing',
      '.item'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ ${selector}: ${elements.length} éléments trouvés`);
        
        // Analyser le premier élément
        const firstElement = elements[0];
        console.log(`   - Tag: ${firstElement.tagName}`);
        console.log(`   - Classes: ${firstElement.className}`);
        console.log(`   - ID: ${firstElement.id}`);
        console.log(`   - Data attributes: ${Array.from(firstElement.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}="${attr.value}"`).join(', ')}`);
      } else {
        console.log(`❌ ${selector}: 0 éléments`);
      }
    }
    
    // 2. Rechercher les titres d'annonces
    console.log('\n📋 Analyse des titres d\'annonces:');
    
    const titleSelectors = [
      '[data-qa-id="adcard-title"]',
      '[data-test-id="adcard-title"]',
      '.adcard-title',
      '.ad-title',
      '.listing-title',
      '.title',
      'h2',
      'h3',
      'h4',
      '[data-qa-id*="title"]',
      '[data-test-id*="title"]'
    ];
    
    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ ${selector}: ${elements.length} éléments trouvés`);
        if (elements.length > 0) {
          console.log(`   - Premier titre: "${elements[0].textContent?.trim()}"`);
        }
      } else {
        console.log(`❌ ${selector}: 0 éléments`);
      }
    }
    
    // 3. Rechercher les prix
    console.log('\n📋 Analyse des prix:');
    
    const priceSelectors = [
      '[data-qa-id="aditem_price"]',
      '[data-test-id="aditem_price"]',
      '.aditem_price',
      '.ad-price',
      '.listing-price',
      '.price',
      '[data-qa-id*="price"]',
      '[data-test-id*="price"]',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ ${selector}: ${elements.length} éléments trouvés`);
        if (elements.length > 0) {
          console.log(`   - Premier prix: "${elements[0].textContent?.trim()}"`);
        }
      } else {
        console.log(`❌ ${selector}: 0 éléments`);
      }
    }
    
    // 4. Rechercher les liens
    console.log('\n📋 Analyse des liens d\'annonces:');
    
    const linkSelectors = [
      'a[href*="/ad/"]',
      'a[href*="/annonce/"]',
      'a[href*="/listing/"]',
      'a[href*="/item/"]',
      'a[href*="leboncoin.fr"]',
      '.ad-link',
      '.listing-link'
    ];
    
    for (const selector of linkSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ ${selector}: ${elements.length} éléments trouvés`);
        if (elements.length > 0) {
          console.log(`   - Premier lien: "${elements[0].getAttribute('href')}"`);
        }
      } else {
        console.log(`❌ ${selector}: 0 éléments`);
      }
    }
    
    // 5. Rechercher des patterns génériques
    console.log('\n📋 Analyse des patterns génériques:');
    
    // Rechercher tous les éléments avec des classes contenant "ad", "listing", "item", "card"
    const genericPatterns = [
      '[class*="ad"]',
      '[class*="listing"]',
      '[class*="item"]',
      '[class*="card"]',
      '[class*="result"]',
      '[class*="search"]'
    ];
    
    for (const pattern of genericPatterns) {
      const elements = document.querySelectorAll(pattern);
      if (elements.length > 0) {
        console.log(`✅ ${pattern}: ${elements.length} éléments trouvés`);
        
        // Analyser les classes uniques
        const classes = new Set();
        elements.forEach(el => {
          if (el.className) {
            el.className.split(' ').forEach(cls => {
              if (cls.includes('ad') || cls.includes('listing') || cls.includes('item') || cls.includes('card')) {
                classes.add(cls);
              }
            });
          }
        });
        
        if (classes.size > 0) {
          console.log(`   - Classes intéressantes: ${Array.from(classes).slice(0, 10).join(', ')}`);
        }
      }
    }
    
    // 6. Rechercher du contenu textuel
    console.log('\n📋 Analyse du contenu textuel:');
    
    const bodyText = document.body.textContent || '';
    const keywords = ['iphone', '€', 'euros', 'prix', 'titre', 'annonce'];
    
    keywords.forEach(keyword => {
      const count = (bodyText.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      if (count > 0) {
        console.log(`✅ "${keyword}": ${count} occurrences`);
      }
    });
    
    // 7. Vérifier si c'est une page de résultats
    console.log('\n📋 Vérification du type de page:');
    
    const pageIndicators = [
      'Aucun résultat',
      'Aucune annonce',
      'Résultats de recherche',
      'annonces trouvées',
      'résultats trouvés',
      'Recherche',
      'Filtres'
    ];
    
    pageIndicators.forEach(indicator => {
      if (bodyText.includes(indicator)) {
        console.log(`✅ Indicateur trouvé: "${indicator}"`);
      }
    });
    
    console.log('\n🏁 Analyse terminée');
    console.log('💡 Vérifiez le fichier current-leboncoin.html pour une analyse manuelle');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter l'analyse si ce fichier est appelé directement
if (require.main === module) {
  analyzeCurrentHTML().catch(console.error);
}
