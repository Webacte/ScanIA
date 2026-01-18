/**
 * Gestionnaire de tâches de recherche pour la reconnaissance d'images
 */

class SearchTasksManager {
  constructor() {
    this.tasks = [];
    this.referenceObjects = [];
    this.socket = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupWebSocket();
    await this.loadReferenceObjects();
    await this.loadTasks(); // loadTasks() appelle maintenant renderTasksList() automatiquement
  }

  setupEventListeners() {
    const createBtn = document.getElementById('create-search-task-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateForm());
    }

    const createForm = document.getElementById('create-search-task-form');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
    }
  }

  setupWebSocket() {
    if (typeof io !== 'undefined') {
      this.socket = io();
      
      this.socket.on('recognition-update', (data) => {
        this.handleRecognitionUpdate(data);
      });
    }
  }

  handleRecognitionUpdate(data) {
    const { taskId, type } = data;
    
    if (type === 'match-found') {
      this.showNotification(`Match trouvé: ${data.match.objectName} (${data.match.confidenceScore}%)`, 'success');
      // Recharger la tâche
      this.viewTask(taskId);
    } else if (type === 'progress') {
      // Mettre à jour la barre de progression
      this.updateTaskProgress(taskId, data.processed, data.total, data.matches);
    } else if (type === 'completed') {
      this.showNotification(`Tâche terminée: ${data.matches} match(s) trouvé(s)`, 'success');
      this.loadTasks();
      this.viewTask(taskId);
    }
  }

  async loadReferenceObjects() {
    try {
      const response = await fetch('/api/reference-objects?active_only=true');
      this.referenceObjects = await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des objets:', error);
    }
  }

  async loadTasks() {
    try {
      const response = await fetch('/api/search-tasks');
      if (!response.ok) {
        throw new Error('Erreur HTTP: ' + response.status);
      }
      this.tasks = await response.json();
      this.renderTasksList();
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      this.showNotification('Erreur lors du chargement des tâches', 'error');
      const container = document.getElementById('search-tasks-list');
      if (container) {
        container.innerHTML = '<p class="text-red-500 text-center py-4">Erreur lors du chargement des tâches</p>';
      }
    }
  }

  renderTasksList() {
    const container = document.getElementById('search-tasks-list');
    if (!container) return;

    if (!this.tasks || this.tasks.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <i class="fas fa-search text-4xl mb-4 text-gray-300"></i>
          <p class="text-lg font-medium">Aucune tâche de recherche</p>
          <p class="text-sm mt-2">Cliquez sur "Créer une tâche" pour commencer</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.tasks.map(task => `
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold">Recherche: ${this.escapeHtml(task.search_url)}</h3>
            <div class="mt-2 flex items-center space-x-4 text-sm">
              <span class="px-2 py-1 rounded ${
                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                task.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }">
                ${this.getStatusLabel(task.status)}
              </span>
              ${task.total_listings > 0 ? `<span>${task.processed_listings || 0}/${task.total_listings} annonces</span>` : ''}
              ${task.matches_found > 0 ? `<span class="text-green-600 font-semibold">${task.matches_found} match(s)</span>` : ''}
            </div>
            ${task.status === 'running' && task.total_listings > 0 ? `
              <div class="mt-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" 
                       style="width: ${(task.processed_listings / task.total_listings) * 100}%"></div>
                </div>
              </div>
            ` : ''}
          </div>
          <div class="flex space-x-2">
            <button onclick="searchTasksManager.viewTask(${task.id})" 
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
              Voir résultats
            </button>
            <button onclick="searchTasksManager.deleteTask(${task.id})" 
                    class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  getStatusLabel(status) {
    const labels = {
      'pending': 'En attente',
      'running': 'En cours',
      'completed': 'Terminée',
      'failed': 'Échouée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  showCreateForm() {
    const modal = document.getElementById('create-search-task-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.renderReferenceObjectsSelect();
    }
  }

  hideCreateForm() {
    const modal = document.getElementById('create-search-task-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  renderReferenceObjectsSelect() {
    const container = document.getElementById('reference-objects-select');
    if (!container) return;

    container.innerHTML = this.referenceObjects.map(obj => `
      <label class="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
        <input type="checkbox" name="object_ids" value="${obj.id}" class="rounded">
        <span>${this.escapeHtml(obj.name)} (seuil: ${obj.confidence_threshold}%)</span>
      </label>
    `).join('');
  }

  async handleCreateSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const searchUrl = formData.get('search_url');
    const objectIds = Array.from(formData.getAll('object_ids')).map(id => parseInt(id));

    if (!searchUrl || objectIds.length === 0) {
      this.showNotification('URL de recherche et au moins un objet requis', 'error');
      return;
    }

    try {
      const response = await fetch('/api/search-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_url: searchUrl,
          object_ids: objectIds
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const newTask = await response.json();
      
      // Recharger les tâches depuis le serveur pour garantir la synchronisation
      await this.loadTasks();
      this.hideCreateForm();
      e.target.reset();
      this.showNotification('Tâche créée avec succès', 'success');
      
      // Rejoindre le canal WebSocket pour cette tâche
      if (this.socket) {
        this.socket.emit('join-recognition', newTask.id);
      }
      
      // Afficher les détails de la tâche
      setTimeout(() => this.viewTask(newTask.id), 1000);
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification(error.message || 'Erreur lors de la création', 'error');
    }
  }

  async viewTask(taskId) {
    try {
      const response = await fetch(`/api/search-tasks/${taskId}`);
      if (!response.ok) throw new Error('Tâche non trouvée');
      
      const task = await response.json();
      this.renderTaskDetail(task);
      
      // Rejoindre le canal WebSocket
      if (this.socket) {
        this.socket.emit('join-recognition', taskId);
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors du chargement', 'error');
    }
  }

  renderTaskDetail(task) {
    let modal = document.getElementById('task-detail-modal');
    if (!modal) {
      modal = this.createTaskDetailModal();
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    
    const content = modal.querySelector('.modal-content');
    content.innerHTML = `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">Résultats de la recherche</h2>
        <p class="text-gray-600 mb-4">URL: <a href="${this.escapeHtml(task.search_url)}" target="_blank" class="text-blue-500">${this.escapeHtml(task.search_url)}</a></p>
        
        <div class="mb-4">
          <span class="px-3 py-1 rounded ${
            task.status === 'completed' ? 'bg-green-100 text-green-800' :
            task.status === 'running' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }">
            ${this.getStatusLabel(task.status)}
          </span>
        </div>

        ${task.status === 'running' && task.total_listings > 0 ? `
          <div class="mb-4">
            <div class="flex justify-between text-sm mb-1">
              <span>Progression</span>
              <span>${task.processed_listings || 0}/${task.total_listings}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-blue-600 h-3 rounded-full transition-all" 
                   style="width: ${((task.processed_listings || 0) / task.total_listings) * 100}%"></div>
            </div>
          </div>
        ` : ''}

        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Objets recherchés:</h3>
          <div class="flex flex-wrap gap-2">
            ${(task.reference_objects || []).map(obj => `
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">${this.escapeHtml(obj.name)}</span>
            `).join('')}
          </div>
        </div>

        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Matches trouvés (${task.matches?.length || 0}):</h3>
          <div id="task-matches-list" class="space-y-2 max-h-96 overflow-y-auto">
            ${this.renderMatches(task.matches || [])}
          </div>
        </div>

        <div class="flex justify-end">
          <button onclick="searchTasksManager.hideTaskDetail()" 
                  class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Fermer
          </button>
        </div>
      </div>
    `;
  }

  renderMatches(matches) {
    if (matches.length === 0) {
      return '<p class="text-gray-500">Aucun match trouvé</p>';
    }
    return matches.map(match => `
      <div class="bg-gray-50 rounded p-3 border">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h4 class="font-semibold">
              <a href="${this.escapeHtml(match.listing_url)}" target="_blank" class="text-blue-500 hover:underline">
                ${this.escapeHtml(match.listing_title)}
              </a>
            </h4>
            <p class="text-sm text-gray-600 mt-1">
              Objet: <span class="font-semibold">${this.escapeHtml(match.object_name)}</span> | 
              Confiance: <span class="font-semibold">${match.confidence_score}%</span> |
              Prix: <span class="font-semibold">${(match.price_cents / 100).toFixed(2)}€</span>
            </p>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateTaskProgress(taskId, processed, total, matches) {
    const modal = document.getElementById('task-detail-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    // Mettre à jour la barre de progression si visible
    const progressBar = modal.querySelector('.bg-blue-600');
    if (progressBar) {
      progressBar.style.width = `${(processed / total) * 100}%`;
    }

    const progressText = modal.querySelector('.text-sm span');
    if (progressText) {
      progressText.textContent = `${processed}/${total}`;
    }
  }

  async deleteTask(taskId) {
    if (!confirm('Supprimer cette tâche de recherche ? Les résultats seront également supprimés.')) return;

    try {
      const response = await fetch(`/api/search-tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      // Recharger les tâches depuis le serveur pour garantir la synchronisation
      await this.loadTasks();
      this.showNotification('Tâche supprimée', 'success');
      
      // Fermer la modal de détail si elle est ouverte pour cette tâche
      this.hideTaskDetail();
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors de la suppression', 'error');
    }
  }

  hideTaskDetail() {
    const modal = document.getElementById('task-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  createTaskDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'task-detail-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    modal.innerHTML = `
      <div class="modal-content bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      </div>
    `;
    return modal;
  }

  showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    if (notifications) {
      const notification = document.createElement('div');
      notification.className = `px-4 py-2 rounded shadow-lg ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
      } text-white`;
      notification.textContent = message;
      notifications.appendChild(notification);
      
      setTimeout(() => notification.remove(), 3000);
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

// Initialiser le gestionnaire quand le DOM est prêt
let searchTasksManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    searchTasksManager = new SearchTasksManager();
    window.searchTasksManager = searchTasksManager;
  });
} else {
  searchTasksManager = new SearchTasksManager();
  window.searchTasksManager = searchTasksManager;
}


