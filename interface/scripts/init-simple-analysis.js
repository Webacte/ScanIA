/**
 * Script pour initialiser les fonctions d'analyse SQL simplifiées
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scania',
  user: process.env.DB_USER || 'ben',
  password: process.env.DB_PASSWORD || 'suis-je le gardien de Stage1'
};

async function initSimpleAnalysis() {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initialisation des fonctions d\'analyse SQL simplifiées...');
    
    // Lire et exécuter le script SQL
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '..', '..', 'shared', 'database', 'simple_analysis_functions.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Fichier SQL non trouvé: ${sqlFile}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Exécuter le script SQL
    await client.query(sqlContent);
    
    console.log('✅ Fonctions d\'analyse SQL simplifiées créées avec succès');
    
    // Tester les fonctions créées
    console.log('\n🧪 Test des fonctions créées...');
    
    // Test de la fonction extract_iphone_model
    const modelTest = await client.query(`
      SELECT marketplace.extract_iphone_model('iPhone 15 Pro Max 256GB Noir') as model
    `);
    console.log(`✅ extract_iphone_model: "${modelTest.rows[0].model}"`);
    
    // Test de la fonction extract_storage
    const storageTest = await client.query(`
      SELECT marketplace.extract_storage('iPhone 15 Pro Max 256GB Noir') as storage
    `);
    console.log(`✅ extract_storage: "${storageTest.rows[0].storage}"`);
    
    // Test de la vue analyzed_listings_simple
    const viewTest = await client.query(`
      SELECT COUNT(*) as count FROM marketplace.analyzed_listings_simple LIMIT 1
    `);
    console.log(`✅ analyzed_listings_simple: ${viewTest.rows[0].count} annonces analysées`);
    
    // Test d'une requête simple pour les bonnes affaires
    const dealsTest = await client.query(`
      SELECT 
        id, title, price_euros, detected_model, detected_storage, confidence_score
      FROM marketplace.analyzed_listings_simple 
      WHERE detected_model IS NOT NULL 
        AND detected_storage IS NOT NULL 
        AND confidence_score >= 50
        AND NOT is_multiple_devices
        AND NOT is_for_parts_only
      ORDER BY confidence_score DESC, price_euros ASC
      LIMIT 5
    `);
    console.log(`✅ Test requête bonnes affaires: ${dealsTest.rows.length} résultats`);
    
    if (dealsTest.rows.length > 0) {
      console.log('📋 Exemples de bonnes affaires détectées:');
      dealsTest.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.detected_model} ${row.detected_storage} - ${row.price_euros}€ (confiance: ${row.confidence_score}%)`);
      });
    }
    
    console.log('\n🎉 Initialisation simplifiée terminée avec succès!');
    console.log('\n💡 Fonctions disponibles:');
    console.log('   - marketplace.extract_iphone_model(title)');
    console.log('   - marketplace.extract_storage(title)');
    console.log('   - marketplace.analyzed_listings_simple (vue)');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initSimpleAnalysis();
}

module.exports = { initSimpleAnalysis };
