/**
 * Script de démarrage de l'interface ScanLeCoin
 * 
 * Démarre l'interface web depuis la racine du projet
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🌐 Démarrage de l\'interface ScanLeCoin...');
console.log('=' .repeat(50));

// Changer vers le dossier interface
process.chdir(path.join(__dirname, 'interface'));

// Démarrer le serveur
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage:', error);
});

server.on('close', (code) => {
  console.log(`\n🛑 Interface arrêtée avec le code: ${code}`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de l\'interface...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt de l\'interface...');
  server.kill('SIGTERM');
});
