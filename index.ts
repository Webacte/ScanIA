/**
 * Script principal pour le scraping ponctuel de Leboncoin
 * 
 * Ce fichier permet d'exécuter un scraping simple sans le système de jobs.
 * Pour un scraping continu, utilisez le worker (npm run worker).
 */

import { LeboncoinScraper, DatabaseConfig } from './src';

/**
 * Fonction principale d'exemple
 */
async function main() {
  // Configuration de la base de données
  const dbConfig: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'marketplace',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  };

  const scraper = new LeboncoinScraper(dbConfig);
  
  try {
    await scraper.initialize();
    
    // URL de recherche pour iPhone 13
    const searchUrl = 'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go';
    
    console.log('Début du scraping...');
    const listings = await scraper.scrapeSearchResults(searchUrl, 2);
    
    console.log(`\n=== RÉSULTATS ===`);
    console.log(`Total d'annonces trouvées: ${listings.length}`);
    
    // Afficher les annonces trouvées
    listings.forEach((listing, index) => {
      console.log(`\n--- Annonce ${index + 1} ---`);
      console.log(`ID: ${listing.external_id}`);
      console.log(`Titre: ${listing.title}`);
      console.log(`Prix: ${listing.price_cents / 100}€`);
      console.log(`Localisation: ${listing.location}`);
      console.log(`URL: ${listing.url}`);
      console.log(`Livraison: ${listing.has_shipping ? 'Oui' : 'Non'}`);
      if (listing.image_url) console.log(`Image: ${listing.image_url}`);
      if (listing.seller_name) console.log(`Vendeur: ${listing.seller_name}`);
    });

    // Sauvegarder en base de données
    console.log('\n=== SAUVEGARDE EN BASE ===');
    const { saved, skipped } = await scraper.saveListingsToDatabase(listings);
    console.log(`Annonces sauvegardées: ${saved}`);
    console.log(`Annonces ignorées (déjà existantes): ${skipped}`);

    // Optionnel: scraper les détails d'une annonce spécifique
    if (listings.length > 0) {
      console.log('\n=== SCRAPING DES DÉTAILS ===');
      const details = await scraper.scrapeListingDetails(listings[0].url);
      console.log('Détails de la première annonce:', details);
    }
    
  } catch (error) {
    console.error('Erreur dans le script principal:', error);
  } finally {
    await scraper.close();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(console.error);
}
