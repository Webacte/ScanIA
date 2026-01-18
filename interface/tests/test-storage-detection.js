/**
 * Test de la détection de stockage avec des exemples réels
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

async function testStorageDetection() {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();
  
  try {
    console.log('🧪 Test de la détection de stockage avec des exemples réels...\n');
    
    // Exemples de titres réels qui posent problème
    const testTitles = [
      'Iphone 13 mini neuf',
      'IPhone 12 Pro 256go',
      'IPhone 13 /128Go/ - Très bon état',
      'IPhone 12 Pro / 12 Pro Max 128GB Garantie 2 ANS',
      'IPhone 13 128GB GARANTIE 2 ANS',
      'IPhone 13 bleu 128 go',
      'IPhone 7 Plus 128 Go',
      'Apple iPhone 13 128G avec facturre + garantie',
      'IPhone 12 Pro Max neuf',
      'IPhone 13 Pro et iPhone 12 Pro GGARANTIE'
    ];
    
    console.log('📋 Test des titres problématiques:');
    
    for (const title of testTitles) {
      const modelResult = await client.query(`
        SELECT marketplace.extract_iphone_model($1) as model
      `, [title]);
      
      const storageResult = await client.query(`
        SELECT marketplace.extract_storage($1) as storage
      `, [title]);
      
      const model = modelResult.rows[0].model;
      const storage = storageResult.rows[0].storage;
      
      console.log(`\n📱 "${title}"`);
      console.log(`   Modèle: ${model || 'Non détecté'}`);
      console.log(`   Stockage: ${storage || 'Non détecté'}`);
      
      if (model && storage) {
        console.log(`   ✅ Détection complète`);
      } else if (model && !storage) {
        console.log(`   ⚠️ Modèle détecté mais stockage manquant`);
      } else {
        console.log(`   ❌ Aucune détection`);
      }
    }
    
    // Test avec des patterns améliorés
    console.log('\n🔧 Test des patterns améliorés:');
    
    const improvedTests = [
      '256go',
      '128go', 
      '64go',
      '32go',
      '16go',
      '256GB',
      '128GB',
      '64GB'
    ];
    
    for (const test of improvedTests) {
      const result = await client.query(`
        SELECT marketplace.extract_storage($1) as storage
      `, [test]);
      
      const storage = result.rows[0].storage;
      console.log(`   "${test}" -> ${storage || 'Non détecté'}`);
    }
    
    console.log('\n🎉 Test terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testStorageDetection();
