/**
 * Gestionnaire d'objets de référence pour la reconnaissance d'images
 */

class ReferenceManager {
  constructor() {
    this.objects = [];
    this.currentObject = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadObjects(); // loadObjects() appelle maintenant renderObjectsList() automatiquement
  }

  setupEventListeners() {
    // Bouton pour créer un nouvel objet
    const createBtn = document.getElementById('create-reference-object-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateForm());
    }

    // Formulaire de création
    const createForm = document.getElementById('create-reference-object-form');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
    }
  }

  async loadObjects() {
    try {
      const response = await fetch('/api/reference-objects');
      if (!response.ok) {
        throw new Error('Erreur HTTP: ' + response.status);
      }
      this.objects = await response.json();
      this.renderObjectsList();
    } catch (error) {
      console.error('Erreur lors du chargement des objets:', error);
      this.showNotification('Erreur lors du chargement des objets', 'error');
      const container = document.getElementById('reference-objects-list');
      if (container) {
        container.innerHTML = '<p class="text-red-500 text-center py-4">Erreur lors du chargement des objets</p>';
      }
    }
  }

  renderObjectsList() {
    const container = document.getElementById('reference-objects-list');
    if (!container) return;

    if (!this.objects || this.objects.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <i class="fas fa-box text-4xl mb-4 text-gray-300"></i>
          <p class="text-lg font-medium">Aucun objet de référence</p>
          <p class="text-sm mt-2">Cliquez sur "Créer un objet" pour commencer</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.objects.map(obj => `
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold">${this.escapeHtml(obj.name)}</h3>
            ${obj.description ? `<p class="text-gray-600 text-sm mt-1">${this.escapeHtml(obj.description)}</p>` : ''}
            <div class="mt-2 flex items-center space-x-4 text-sm">
              <span class="text-gray-500">Seuil: ${obj.confidence_threshold}%</span>
              <span class="px-2 py-1 rounded ${obj.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                ${obj.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button onclick="referenceManager.viewObject(${obj.id})" 
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
              Voir
            </button>
            <button onclick="referenceManager.deleteObject(${obj.id})" 
                    class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  showCreateForm() {
    const modal = document.getElementById('create-reference-object-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  hideCreateForm() {
    const modal = document.getElementById('create-reference-object-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  async handleCreateSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      confidence_threshold: parseFloat(formData.get('confidence_threshold')) || 70.0
    };

    try {
      const response = await fetch('/api/reference-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }

      const newObject = await response.json();
      this.objects.push(newObject);
      this.renderObjectsList();
      this.hideCreateForm();
      e.target.reset();
      this.showNotification('Objet créé avec succès', 'success');
      
      // Rediriger vers la page de gestion de l'objet pour uploader des images
      this.viewObject(newObject.id);
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors de la création', 'error');
    }
  }

  async viewObject(objectId) {
    try {
      const response = await fetch(`/api/reference-objects/${objectId}`);
      if (!response.ok) throw new Error('Objet non trouvé');
      
      const object = await response.json();
      this.currentObject = object;
      this.renderObjectDetail(object);
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors du chargement', 'error');
    }
  }

  renderObjectDetail(object) {
    // Créer ou afficher la modal de détail
    let modal = document.getElementById('object-detail-modal');
    if (!modal) {
      modal = this.createObjectDetailModal();
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    
    const content = modal.querySelector('.modal-content');
    content.innerHTML = `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">${this.escapeHtml(object.name)}</h2>
        ${object.description ? `<p class="text-gray-600 mb-4">${this.escapeHtml(object.description)}</p>` : ''}
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Seuil de confiance</label>
          <input type="number" id="confidence-threshold" value="${object.confidence_threshold}" 
                 min="0" max="100" step="0.1" 
                 class="w-full px-3 py-2 border rounded">
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Photos de référence</label>
          <div id="reference-images-container" class="grid grid-cols-3 gap-4 mb-4">
            ${this.renderImages(object.images || [])}
          </div>
          <input type="file" id="image-upload" multiple accept="image/*" 
                 class="hidden" onchange="referenceManager.handleImageUpload(${object.id})">
          <button onclick="document.getElementById('image-upload').click()" 
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Ajouter des photos
          </button>
        </div>

        <div class="flex justify-end space-x-2">
          <button onclick="referenceManager.hideObjectDetail()" 
                  class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Fermer
          </button>
          <button onclick="referenceManager.updateObject(${object.id})" 
                  class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Enregistrer
          </button>
        </div>
      </div>
    `;
  }

  renderImages(images) {
    if (images.length === 0) {
      return '<p class="text-gray-500 col-span-3">Aucune photo de référence</p>';
    }
    return images.map(img => `
      <div class="relative">
        <img src="/api/reference-images/${img.id}/file" alt="${this.escapeHtml(img.file_name)}" 
             class="w-full h-32 object-cover rounded">
        <button onclick="referenceManager.deleteImage(${img.id})" 
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
          ×
        </button>
      </div>
    `).join('');
  }

  async handleImageUpload(objectId) {
    const input = document.getElementById('image-upload');
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    for (const file of input.files) {
      formData.append('images', file);
    }

    try {
      const response = await fetch(`/api/reference-objects/${objectId}/images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Erreur lors de l\'upload');

      const result = await response.json();
      this.showNotification(`${result.images.length} photo(s) uploadée(s)`, 'success');
      
      // Recharger l'objet
      await this.viewObject(objectId);
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors de l\'upload', 'error');
    }
  }

  async deleteImage(imageId) {
    if (!confirm('Supprimer cette photo ?')) return;

    try {
      const response = await fetch(`/api/reference-images/${imageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      this.showNotification('Photo supprimée', 'success');
      if (this.currentObject) {
        await this.viewObject(this.currentObject.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors de la suppression', 'error');
    }
  }

  async updateObject(objectId) {
    const threshold = document.getElementById('confidence-threshold').value;
    
    try {
      const response = await fetch(`/api/reference-objects/${objectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confidence_threshold: parseFloat(threshold) })
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      this.showNotification('Objet mis à jour', 'success');
      await this.loadObjects();
      await this.viewObject(objectId);
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors de la mise à jour', 'error');
    }
  }

  async deleteObject(objectId) {
    if (!confirm('Supprimer cet objet et toutes ses photos ?')) return;

    try {
      const response = await fetch(`/api/reference-objects/${objectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      // Recharger les objets depuis le serveur pour garantir la synchronisation
      await this.loadObjects();
      this.showNotification('Objet supprimé', 'success');
      
      // Fermer la modal de détail si elle est ouverte pour cet objet
      if (this.currentObject && this.currentObject.id === objectId) {
        this.hideObjectDetail();
        this.currentObject = null;
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors de la suppression', 'error');
    }
  }

  hideObjectDetail() {
    const modal = document.getElementById('object-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  createObjectDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'object-detail-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    modal.innerHTML = `
      <div class="modal-content bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
      </div>
    `;
    return modal;
  }

  showNotification(message, type = 'info') {
    // Utiliser le système de notifications existant si disponible
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
let referenceManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    referenceManager = new ReferenceManager();
    window.referenceManager = referenceManager;
  });
} else {
  referenceManager = new ReferenceManager();
  window.referenceManager = referenceManager;
}


