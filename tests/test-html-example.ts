/**
 * Test des sélecteurs sur l'exemple HTML fourni
 * 
 * Ce script teste les sélecteurs CSS sur le fichier HTML exemple
 * pour valider qu'ils fonctionnent correctement
 */

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

/**
 * Test des sélecteurs sur l'exemple HTML
 */
async function testHtmlExample() {
  console.log('🧪 Test des sélecteurs sur l\'exemple HTML...');
  
  try {
    // Lire le fichier HTML exemple
    console.log('📄 Lecture du fichier HTML exemple...');
    const htmlContent = readFileSync('./HTMLExemple/leboncoinHtmlExemple.html', 'utf-8');
    
    // Créer un DOM virtuel
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    console.log('🔍 Test des sélecteurs sur le DOM virtuel...');
    
    // Test des sélecteurs
    const results = {
      containers: document.querySelectorAll('[data-qa-id="aditem_container"]').length,
      titles: document.querySelectorAll('[data-test-id="adcard-title"]').length,
      prices: document.querySelectorAll('[data-qa-id="aditem_price"]').length,
      locations: document.querySelectorAll('p.text-caption.text-neutral').length,
      images: document.querySelectorAll('img[src*="img.leboncoin.fr"]').length,
      links: document.querySelectorAll('a[href*="/ad/"]').length
    };
    
    console.log('📊 Résultats des tests de sélecteurs:');
    console.log(`   - Containers aditem_container: ${results.containers}`);
    console.log(`   - Titres adcard-title: ${results.titles}`);
    console.log(`   - Prix aditem_price: ${results.prices}`);
    console.log(`   - Localisations text-caption: ${results.locations}`);
    console.log(`   - Images img.leboncoin.fr: ${results.images}`);
    console.log(`   - Liens /ad/: ${results.links}`);
    
    // Test d'extraction complète
    console.log('\n🔍 Test d\'extraction complète...');
    const listings = Array.from(document.querySelectorAll('[data-qa-id="aditem_container"]')).map((element, index) => {
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

        return {
          external_id,
          title,
          price_cents,
          url: url.startsWith('http') ? url : `https://www.leboncoin.fr${url}`,
          location,
          has_shipping: hasShipping,
          image_url
        };
      } catch (error) {
        console.error(`Erreur lors de l'extraction de l'annonce ${index + 1}:`, error);
        return null;
      }
    }).filter(Boolean);
    
    console.log(`\n📋 ${listings.length} annonces extraites:`);
    listings.forEach((listing, index) => {
      if (listing) {
        console.log(`\n--- Annonce ${index + 1} ---`);
        console.log(`ID: ${listing.external_id}`);
        console.log(`Titre: ${listing.title}`);
        console.log(`Prix: ${listing.price_cents / 100}€`);
        console.log(`Localisation: ${listing.location}`);
        console.log(`URL: ${listing.url}`);
        console.log(`Image: ${listing.image_url}`);
        console.log(`Livraison: ${listing.has_shipping ? 'Oui' : 'Non'}`);
      }
    });
    
    // Validation des résultats
    const isValid = listings.every(listing => 
      listing && listing.external_id && listing.title && listing.price_cents > 0
    );
    
    if (isValid && listings.length > 0) {
      console.log('\n✅ Test réussi ! Tous les sélecteurs fonctionnent correctement sur l\'exemple HTML');
      console.log('🎉 Le scraper est prêt à être utilisé !');
    } else {
      console.log('\n❌ Test échoué ! Certains sélecteurs ne fonctionnent pas');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test si ce fichier est appelé directement
if (require.main === module) {
  testHtmlExample().catch(console.error);
}
