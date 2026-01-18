/**
 * Script pour initialiser les tables de patterns de détection
 * 
 * Ce script crée les tables nécessaires et insère les patterns par défaut
 * pour la détection des modèles iPhone.
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

async function initPatterns() {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initialisation des tables de patterns de détection...');
    
    // Lire et exécuter le script SQL
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '..', '..', 'shared', 'database', 'patterns_tables.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Fichier SQL non trouvé: ${sqlFile}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Exécuter le script SQL
    await client.query(sqlContent);
    
    console.log('✅ Tables de patterns créées avec succès');
    
    // Vérifier que les données ont été insérées
    const result = await client.query(`
      SELECT 
        pc.name as category,
        COUNT(dp.id) as pattern_count
      FROM marketplace.pattern_categories pc
      LEFT JOIN marketplace.detection_patterns dp ON pc.id = dp.category_id
      GROUP BY pc.id, pc.name
      ORDER BY pc.name
    `);
    
    console.log('\n📊 Résumé des patterns insérés:');
    result.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.pattern_count} patterns`);
    });
    
    console.log('\n🎉 Initialisation terminée avec succès!');
    
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
  initPatterns();
}

module.exports = { initPatterns };
