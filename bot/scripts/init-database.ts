/**
 * Script d'initialisation de la base de données
 * 
 * Ce script crée les données de base nécessaires :
 * - Source Leboncoin
 * - Conditions de produits
 * - Vérification de la structure
 */

import { DatabaseManager } from '../src/database/DatabaseManager';
import { productionConfig } from '../src/config/production';

async function initializeDatabase() {
  console.log('🗄️ Initialisation de la base de données...');
  console.log('=' .repeat(50));

  const dbManager = new DatabaseManager(productionConfig.database.config);

  try {
    const client = await dbManager.getClient();
    
    // 1. Créer la source Leboncoin si elle n'existe pas
    console.log('📋 Vérification de la source Leboncoin...');
    const sourceResult = await client.query(
      'SELECT id FROM marketplace.sources WHERE name = $1',
      ['Leboncoin']
    );

    let sourceId: number;
    if (sourceResult.rows.length === 0) {
      console.log('➕ Création de la source Leboncoin...');
      const insertResult = await client.query(
        'INSERT INTO marketplace.sources (name, base_url, is_active) VALUES ($1, $2, $3) RETURNING id',
        ['Leboncoin', 'https://www.leboncoin.fr', true]
      );
      sourceId = insertResult.rows[0].id;
      console.log(`✅ Source Leboncoin créée avec l'ID: ${sourceId}`);
    } else {
      sourceId = sourceResult.rows[0].id;
      console.log(`✅ Source Leboncoin trouvée avec l'ID: ${sourceId}`);
    }

    // 2. Créer les conditions de produits si elles n'existent pas
    console.log('📋 Vérification des conditions de produits...');
    const conditions = [
      { code: 'new', label: 'Neuf' },
      { code: 'like_new', label: 'Comme neuf' },
      { code: 'good', label: 'Bon état' },
      { code: 'fair', label: 'État correct' },
      { code: 'poor', label: 'Mauvais état' },
      { code: 'unknown', label: 'Non spécifié' }
    ];

    for (const condition of conditions) {
      const existingResult = await client.query(
        'SELECT code FROM marketplace.conditions WHERE code = $1',
        [condition.code]
      );

      if (existingResult.rows.length === 0) {
        await client.query(
          'INSERT INTO marketplace.conditions (code, label) VALUES ($1, $2)',
          [condition.code, condition.label]
        );
        console.log(`➕ Condition "${condition.label}" créée`);
      } else {
        console.log(`✅ Condition "${condition.label}" existe déjà`);
      }
    }

    // 3. Vérifier la structure des tables
    console.log('📋 Vérification de la structure des tables...');
    const tables = [
      'marketplace.sources',
      'marketplace.listings', 
      'marketplace.sellers',
      'marketplace.locations',
      'marketplace.listing_images',
      'marketplace.conditions'
    ];

    for (const table of tables) {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      console.log(`✅ Table ${table}: ${result.rows[0].count} enregistrements`);
    }

    client.release();

    console.log('');
    console.log('🎉 Initialisation de la base de données terminée !');
    console.log(`📊 Source Leboncoin ID: ${sourceId}`);
    console.log('✅ Toutes les tables sont prêtes');
    console.log('');
    console.log('🚀 Vous pouvez maintenant lancer le scraper :');
    console.log('   npm run production:test');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    await dbManager.close();
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('\n✅ Script d\'initialisation terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur lors de l\'initialisation:', error);
      process.exit(1);
    });
}
