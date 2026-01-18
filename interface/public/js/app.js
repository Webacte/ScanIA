/**
 * Application principale pour l'interface ScanLeCoin
 * Version simplifiée - Focus sur la reconnaissance d'images
 * 
 * Gère uniquement :
 * - La connexion WebSocket
 * - Le statut de connexion
 * - Les notifications générales
 */

class ScanLeCoinApp {
  constructor() {
    this.socket = null;
    this.init();
  }

  init() {
    this.setupSocket();
    this.setupEventListeners();
  }

  setupSocket() {
    if (typeof io !== 'undefined') {
      this.socket = io();
      
      this.socket.on('connect', () => {
        this.updateConnectionStatus(true);
        console.log('✅ Connecté au serveur');
      });

      this.socket.on('disconnect', () => {
        this.updateConnectionStatus(false);
        console.log('❌ Déconnecté du serveur');
      });

      // Écouter les notifications de reconnaissance (gérées par search-tasks.js)
      // Les notifications spécifiques sont gérées par les managers respectifs
    }
  }

  setupEventListeners() {
    // Pas d'événements spécifiques à gérer ici
    // Les fonctionnalités sont dans reference-manager.js et search-tasks.js
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      if (connected) {
        statusElement.innerHTML = `
          <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span class="text-sm text-gray-600">Connecté</span>
        `;
      } else {
        statusElement.innerHTML = `
          <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span class="text-sm text-gray-600">Déconnecté</span>
        `;
      }
    }
  }

  showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    if (notifications) {
      const notification = document.createElement('div');
      notification.className = `px-4 py-2 rounded shadow-lg ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
      }`;
      
      notification.innerHTML = `
        <div class="flex items-center">
          <i class="fas ${
            type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
            type === 'warning' ? 'fa-exclamation-triangle' :
            'fa-info-circle'
          } mr-2"></i>
          <span>${this.escapeHtml(message)}</span>
        </div>
      `;
      
      notifications.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
    } else {
      alert(message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ScanLeCoinApp();
});
