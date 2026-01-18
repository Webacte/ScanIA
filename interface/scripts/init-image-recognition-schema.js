/**
 * Script d'initialisation du schéma de reconnaissance d'images
 * 
 * Exécute le script SQL pour créer les tables nécessaires à la reconnaissance d'images
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();

if (!process.env.DB_PASSWORD) {
  console.error('ERREUR: DB_PASSWORD est requis. Copiez .env.example en .env et renseignez les variables.');
  process.exit(1);
}

// Configuration de la base de données
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scania',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
};

async function initImageRecognitionSchema() {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initialisation du schéma de reconnaissance d\'images...');
    
    // Lire et exécuter le script SQL
    const sqlFile = path.join(__dirname, '..', '..', 'shared', 'database', 'image_recognition_schema.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Fichier SQL non trouvé: ${sqlFile}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Exécuter le script SQL
    await client.query(sqlContent);
    
    console.log('✅ Schéma de reconnaissance d\'images créé avec succès');
    
    // Vérifier que les tables existent
    console.log('\n🧪 Vérification des tables créées...');
    
    const tables = [
      'marketplace.reference_objects',
      'marketplace.reference_images',
      'marketplace.search_tasks',
      'marketplace.search_task_objects',
      'marketplace.image_matches'
    ];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        ) as exists
      `, [table.split('.')[0], table.split('.')[1]]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table ${table} existe`);
      } else {
        console.log(`❌ Table ${table} n'existe pas`);
      }
    }
    
    console.log('\n✅ Initialisation terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  initImageRecognitionSchema()
    .then(() => {
      console.log('\n🎉 Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { initImageRecognitionSchema };






