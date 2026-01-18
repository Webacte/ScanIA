/**
 * Script pour démarrer le serveur et tester l'API des patterns
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');

async function startAndTest() {
  console.log('🚀 Démarrage du serveur...');
  
  // Démarrer le serveur
  const server = spawn('node', ['server.js'], {
    cwd: __dirname + '/..',
    stdio: 'pipe'
  });

  // Attendre que le serveur démarre
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Interface ScanLeCoin démarrée')) {
        resolve();
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error('Erreur serveur:', data.toString());
    });
    
    // Timeout après 10 secondes
    setTimeout(() => {
      console.log('⏰ Timeout - serveur supposé démarré');
      resolve();
    }, 10000);
  });

  // Attendre un peu plus pour que le serveur soit prêt
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('\n🧪 Test de l\'API...');
    
    const response = await fetch('http://localhost:3000/api/patterns');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const patterns = await response.json();
    
    console.log('✅ API accessible');
    console.log('📊 Catégories:', Object.keys(patterns));
    
    // Compter les patterns
    let totalPatterns = 0;
    Object.keys(patterns).forEach(category => {
      const count = Object.keys(patterns[category]).length;
      totalPatterns += count;
      console.log(`   ${category}: ${count} patterns`);
    });
    
    console.log(`📊 Total: ${totalPatterns} patterns`);
    
    // Tester un pattern spécifique
    if (patterns.storage && patterns.storage['128GB']) {
      const testText = 'iPhone 15 128GB Noir';
      const pattern = new RegExp(patterns.storage['128GB'], 'i');
      const matches = pattern.test(testText);
      console.log(`🧪 Test détection: "${testText}" -> ${matches ? 'DÉTECTÉ' : 'NON DÉTECTÉ'}`);
    }
    
    console.log('\n🎉 Test réussi! Le serveur fonctionne correctement.');
    console.log('💡 Vous pouvez maintenant utiliser l\'interface à: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    // Arrêter le serveur
    console.log('\n🛑 Arrêt du serveur...');
    server.kill();
  }
}

startAndTest();
