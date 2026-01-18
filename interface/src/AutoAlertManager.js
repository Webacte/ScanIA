/**
 * Gestionnaire d'alertes automatiques (version optimisée)
 * 
 * Crée et gère automatiquement les alertes basées sur l'analyse SQL optimisée
 */

class AutoAlertManager {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.autoAlerts = new Map();
    this.alertThresholds = {
      excellent: 30, // 30% d'économie = excellente affaire
      good: 20,      // 20% d'économie = bonne affaire
      fair: 15       // 15% d'économie = affaire correcte
    };
  }

  /**
   * Analyse les modèles et crée des alertes automatiques (version optimisée)
   */
  async analyzeAndCreateAlerts() {
    try {
      console.log('🔍 Démarrage de l\'analyse automatique des modèles (système optimisé)...');
      
      // Utiliser le nouveau système optimisé pour récupérer les bonnes affaires
      const goodDeals = await this.dbManager.getGoodDeals({
        minConfidence: 50,
        limit: 100
      });
      
      if (!goodDeals || goodDeals.length === 0) {
        console.log('⚠️ Aucune bonne affaire trouvée');
        return [];
      }

      console.log(`📊 Analyse de ${goodDeals.length} bonnes affaires...`);

      // Créer des alertes basées sur les bonnes affaires trouvées
      const autoAlerts = this.createAlertsFromGoodDeals(goodDeals);
      
      console.log(`🔔 ${autoAlerts.length} alertes automatiques générées`);

      // Sauvegarder les alertes
      await this.saveAutoAlerts(autoAlerts);
      
      return autoAlerts;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse automatique:', error);
      return [];
    }
  }

  /**
   * Crée des alertes à partir des bonnes affaires trouvées
   */
  createAlertsFromGoodDeals(goodDeals) {
    const alerts = [];
    const alertMap = new Map();

    goodDeals.forEach(deal => {
      const key = `${deal.model}_${deal.storage}`;
      
      if (!alertMap.has(key)) {
        const alert = {
          id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'auto',
          model: deal.model,
          storage: deal.storage,
          maxPrice: deal.price,
          minSavingsPercent: this.calculateSavingsPercent(deal),
          isActive: true,
          createdAt: new Date(),
          source: 'optimized_analysis',
          confidence: deal.confidence
        };
        
        alertMap.set(key, alert);
        alerts.push(alert);
      } else {
        // Mettre à jour le prix maximum si c'est une meilleure affaire
        const existingAlert = alertMap.get(key);
        if (deal.price < existingAlert.maxPrice) {
          existingAlert.maxPrice = deal.price;
          existingAlert.minSavingsPercent = this.calculateSavingsPercent(deal);
        }
      }
    });

    return alerts;
  }

  /**
   * Calcule le pourcentage d'économie (simulation)
   */
  calculateSavingsPercent(deal) {
    // Simulation basée sur le prix et la confiance
    if (deal.confidence >= 80) return 25;
    if (deal.confidence >= 60) return 20;
    if (deal.confidence >= 50) return 15;
    return 10;
  }

  /**
   * Sauvegarde les alertes automatiques
   */
  async saveAutoAlerts(alerts) {
    try {
      for (const alert of alerts) {
        this.autoAlerts.set(alert.id, alert);
      }
      console.log(`✅ ${alerts.length} alertes sauvegardées`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des alertes:', error);
    }
  }

  /**
   * Récupère toutes les alertes automatiques
   */
  getAutoAlerts() {
    return Array.from(this.autoAlerts.values());
  }

  /**
   * Supprime une alerte automatique
   */
  deleteAutoAlert(alertId) {
    if (this.autoAlerts.has(alertId)) {
      this.autoAlerts.delete(alertId);
      return true;
    }
    return false;
  }

  /**
   * Active/désactive une alerte automatique
   */
  toggleAutoAlert(alertId) {
    if (this.autoAlerts.has(alertId)) {
      const alert = this.autoAlerts.get(alertId);
      alert.isActive = !alert.isActive;
      return true;
    }
    return false;
  }

  /**
   * Vérifie si une annonce correspond à une alerte automatique
   */
  checkListingAgainstAlerts(listing) {
    const matchingAlerts = [];
    
    for (const alert of this.autoAlerts.values()) {
      if (!alert.isActive) continue;
      
      if (this.isListingMatchingAlert(listing, alert)) {
        matchingAlerts.push(alert);
      }
    }
    
    return matchingAlerts;
  }

  /**
   * Vérifie si une annonce correspond à une alerte spécifique
   */
  isListingMatchingAlert(listing, alert) {
    // Vérifier le modèle et le stockage
    if (listing.model !== alert.model || listing.storage !== alert.storage) {
      return false;
    }
    
    // Vérifier le prix
    if (listing.price > alert.maxPrice) {
      return false;
    }
    
    return true;
  }

  /**
   * Obtient les statistiques des alertes automatiques
   */
  getAlertStats() {
    const alerts = Array.from(this.autoAlerts.values());
    
    return {
      total: alerts.length,
      active: alerts.filter(a => a.isActive).length,
      inactive: alerts.filter(a => !a.isActive).length,
      byModel: this.groupAlertsByModel(alerts),
      byStorage: this.groupAlertsByStorage(alerts)
    };
  }

  /**
   * Groupe les alertes par modèle
   */
  groupAlertsByModel(alerts) {
    const groups = {};
    alerts.forEach(alert => {
      if (!groups[alert.model]) {
        groups[alert.model] = 0;
      }
      groups[alert.model]++;
    });
    return groups;
  }

  /**
   * Groupe les alertes par stockage
   */
  groupAlertsByStorage(alerts) {
    const groups = {};
    alerts.forEach(alert => {
      if (!groups[alert.storage]) {
        groups[alert.storage] = 0;
      }
      groups[alert.storage]++;
    });
    return groups;
  }
}

module.exports = AutoAlertManager;