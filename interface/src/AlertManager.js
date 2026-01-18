/**
 * Gestionnaire d'alertes pour les bonnes affaires
 * 
 * Gère la création, suppression et vérification des alertes
 * basées sur les critères de prix et mots-clés
 */

class AlertManager {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.alerts = new Map(); // Cache des alertes en mémoire
    this.loadAlerts();
  }

  /**
   * Charge les alertes depuis la base de données
   */
  async loadAlerts() {
    try {
      // Pour l'instant, on utilise un système simple en mémoire
      // Dans une version complète, on stockerait en base
      this.alerts.clear();
      
      // Exemple d'alertes par défaut
      this.alerts.set(1, {
        id: 1,
        name: 'iPhone 13 - Bonnes affaires',
        keywords: ['iphone 13', 'iphone13'],
        maxPrice: 300,
        minPrice: 100,
        categories: ['telephones'],
        active: true,
        createdAt: new Date()
      });

      this.alerts.set(2, {
        id: 2,
        name: 'iPhone 14 - Prix intéressants',
        keywords: ['iphone 14', 'iphone14'],
        maxPrice: 400,
        minPrice: 200,
        categories: ['telephones'],
        active: true,
        createdAt: new Date()
      });

      console.log(`📋 ${this.alerts.size} alertes chargées`);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    }
  }

  /**
   * Récupère toutes les alertes
   */
  async getAlerts() {
    return Array.from(this.alerts.values());
  }

  /**
   * Crée une nouvelle alerte
   */
  async createAlert(alertData) {
    const id = Date.now(); // ID simple basé sur le timestamp
    
    const alert = {
      id,
      name: alertData.name,
      keywords: alertData.keywords,
      maxPrice: alertData.maxPrice,
      minPrice: alertData.minPrice,
      categories: alertData.categories || [],
      active: true,
      createdAt: new Date()
    };

    this.alerts.set(id, alert);
    
    console.log(`✅ Alerte créée: ${alert.name}`);
    return alert;
  }

  /**
   * Supprime une alerte
   */
  async deleteAlert(id) {
    if (this.alerts.has(id)) {
      const alert = this.alerts.get(id);
      this.alerts.delete(id);
      console.log(`🗑️ Alerte supprimée: ${alert.name}`);
      return true;
    }
    return false;
  }

  /**
   * Vérifie les alertes contre les nouvelles annonces
   */
  async checkAlerts(newListings) {
    const triggeredAlerts = [];

    for (const [alertId, alert] of this.alerts) {
      if (!alert.active) continue;

      const matchingListings = newListings.filter(listing => {
        // Vérifier les mots-clés
        const titleMatch = alert.keywords.some(keyword => 
          listing.title.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (!titleMatch) return false;

        // Vérifier le prix
        const price = listing.price_cents / 100;
        
        if (alert.maxPrice && price > alert.maxPrice) return false;
        if (alert.minPrice && price < alert.minPrice) return false;

        return true;
      });

      if (matchingListings.length > 0) {
        triggeredAlerts.push({
          alert,
          listings: matchingListings,
          count: matchingListings.length
        });
      }
    }

    return triggeredAlerts;
  }

  /**
   * Analyse les annonces pour détecter les bonnes affaires
   */
  async analyzeGoodDeals(keywords, limit = 50) {
    try {
      const listings = await this.dbManager.getListingsByKeywords(keywords, limit);
      
      if (listings.length === 0) {
        return [];
      }

      // Calculer les statistiques de prix
      const prices = listings.map(l => l.price_cents / 100);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Définir le seuil de "bonne affaire" (20% en dessous de la moyenne)
      const goodDealThreshold = avgPrice * 0.8;

      // Identifier les bonnes affaires
      const goodDeals = listings
        .filter(listing => {
          const price = listing.price_cents / 100;
          return price <= goodDealThreshold && price > 0;
        })
        .map(listing => ({
          ...listing,
          price: listing.price_cents / 100,
          isGoodDeal: true,
          savings: Math.round(avgPrice - (listing.price_cents / 100)),
          savingsPercent: Math.round(((avgPrice - (listing.price_cents / 100)) / avgPrice) * 100)
        }))
        .sort((a, b) => a.price - b.price); // Trier par prix croissant

      return {
        totalListings: listings.length,
        goodDeals: goodDeals,
        statistics: {
          averagePrice: Math.round(avgPrice),
          minPrice: Math.round(minPrice),
          maxPrice: Math.round(maxPrice),
          goodDealThreshold: Math.round(goodDealThreshold)
        }
      };

    } catch (error) {
      console.error('Erreur analyse bonnes affaires:', error);
      return [];
    }
  }

  /**
   * Génère une notification pour une bonne affaire
   */
  generateNotification(alert, listing) {
    const price = listing.price_cents / 100;
    const savings = alert.maxPrice ? alert.maxPrice - price : 0;
    
    return {
      type: 'good-deal',
      title: `🎯 Bonne affaire détectée: ${listing.title}`,
      message: `Prix: ${price}€ (${savings > 0 ? `Économie: ${savings}€` : 'Prix intéressant'})`,
      listing: {
        id: listing.id,
        title: listing.title,
        price: price,
        url: listing.url,
        location: listing.location
      },
      alert: {
        name: alert.name,
        keywords: alert.keywords
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AlertManager;
