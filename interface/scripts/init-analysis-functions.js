/**
 * Script pour initialiser les fonctions d'analyse SQL
 * 
 * Ce script crée les fonctions SQL pour analyser et trier les annonces
 * directement dans PostgreSQL, optimisant ainsi les performances.
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

async function initAnalysisFunctions() {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initialisation des fonctions d\'analyse SQL...');
    
    // Lire et exécuter le script SQL
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '..', '..', 'shared', 'database', 'analysis_functions.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Fichier SQL non trouvé: ${sqlFile}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Exécuter le script SQL
    await client.query(sqlContent);
    
    console.log('✅ Fonctions d\'analyse SQL créées avec succès');
    
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
    
    // Test de la vue analyzed_listings
    const viewTest = await client.query(`
      SELECT COUNT(*) as count FROM marketplace.analyzed_listings LIMIT 1
    `);
    console.log(`✅ analyzed_listings: ${viewTest.rows[0].count} annonces analysées`);
    
    // Test de la fonction get_good_deals
    const dealsTest = await client.query(`
      SELECT COUNT(*) as count FROM marketplace.get_good_deals(15, 30, 10)
    `);
    console.log(`✅ get_good_deals: ${dealsTest.rows[0].count} bonnes affaires trouvées`);
    
    console.log('\n🎉 Initialisation terminée avec succès!');
    console.log('\n💡 Les fonctions SQL sont maintenant disponibles pour:');
    console.log('   - Analyser les modèles iPhone automatiquement');
    console.log('   - Calculer les prix de référence');
    console.log('   - Identifier les bonnes affaires');
    console.log('   - Optimiser les performances côté base de données');
    
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
  initAnalysisFunctions();
}

module.exports = { initAnalysisFunctions };
