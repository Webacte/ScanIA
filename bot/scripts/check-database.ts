/**
 * Script pour vérifier les données en base de données
 */

import { DatabaseManager } from '../src/database/DatabaseManager';
import { productionConfig } from '../src/config/production';

async function checkDatabase() {
  console.log('🔍 Vérification des données en base...');
  console.log('=' .repeat(50));

  const dbManager = new DatabaseManager(productionConfig.database.config);

  try {
    const client = await dbManager.getClient();
    
    // Compter les annonces
    const listingsResult = await client.query('SELECT COUNT(*) as count FROM marketplace.listings');
    console.log(`📊 Total annonces: ${listingsResult.rows[0].count}`);
    
    // Compter les vendeurs
    const sellersResult = await client.query('SELECT COUNT(*) as count FROM marketplace.sellers');
    console.log(`👥 Total vendeurs: ${sellersResult.rows[0].count}`);
    
    // Compter les localisations
    const locationsResult = await client.query('SELECT COUNT(*) as count FROM marketplace.locations');
    console.log(`📍 Total localisations: ${locationsResult.rows[0].count}`);
    
    // Compter les images
    const imagesResult = await client.query('SELECT COUNT(*) as count FROM marketplace.listing_images');
    console.log(`🖼️ Total images: ${imagesResult.rows[0].count}`);
    
    // Dernières annonces ajoutées
    const recentResult = await client.query(`
      SELECT title, price_cents, created_at 
      FROM marketplace.listings 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 5 dernières annonces ajoutées:');
    recentResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.title} - ${row.price_cents/100}€ (${row.created_at})`);
    });
    
    // Statistiques par source
    const sourceResult = await client.query(`
      SELECT s.name, COUNT(l.id) as count
      FROM marketplace.sources s
      LEFT JOIN marketplace.listings l ON s.id = l.source_id
      GROUP BY s.id, s.name
    `);
    
    console.log('\n📊 Annonces par source:');
    sourceResult.rows.forEach(row => {
      console.log(`   • ${row.name}: ${row.count} annonces`);
    });

    client.release();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await dbManager.close();
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  checkDatabase()
    .then(() => {
      console.log('\n✅ Vérification terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur lors de la vérification:', error);
      process.exit(1);
    });
}
