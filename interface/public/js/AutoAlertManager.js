/**
 * Gestionnaire d'alertes automatiques
 * 
 * Crée et gère automatiquement les alertes basées sur l'analyse des modèles
 */

class AutoAlertManager {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.modelAnalyzer = new ModelAnalyzer();
    this.autoAlerts = new Map();
    this.alertThresholds = {
      excellent: 30, // 30% d'économie = excellente affaire
      good: 20,      // 20% d'économie = bonne affaire
      fair: 15       // 15% d'économie = affaire correcte
    };
  }

  /**
   * Analyse toutes les annonces et génère des alertes automatiques
   */
  async analyzeAndCreateAlerts() {
    try {
      console.log('🔍 Analyse des annonces pour créer des alertes automatiques...');
      
      // Récupérer toutes les annonces iPhone (tous modèles)
      const listings = await this.dbManager.getListingsByKeywords([
        'iphone', 'iphone 15', 'iphone 14', 'iphone 13', 'iphone 12', 
        'iphone 11', 'iphone x', 'iphone 8', 'iphone 7', 'iphone 6', 'iphone se'
      ], 2000);
      
      if (listings.length === 0) {
        console.log('⚠️ Aucune annonce trouvée pour l\'analyse');
        return [];
      }

      console.log(`📊 Analyse de ${listings.length} annonces...`);

      // Analyser les annonces
      const analysis = this.modelAnalyzer.analyzeListings(listings);
      
      console.log(`📱 ${analysis.totalVariants} variantes de modèles identifiées`);
      console.log(`🎯 ${analysis.totalGoodDeals} bonnes affaires détectées`);

      // Mettre à jour les prix de référence
      this.modelAnalyzer.updateReferencePrices(analysis);

      // Générer les alertes automatiques
      const autoAlerts = this.modelAnalyzer.generateAutoAlerts(analysis);
      
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
   * Sauvegarde les alertes automatiques
   */
  async saveAutoAlerts(alerts) {
    for (const alert of alerts) {
      this.autoAlerts.set(alert.id, alert);
    }
  }

  /**
   * Récupère toutes les alertes automatiques
   */
  async getAutoAlerts() {
    return Array.from(this.autoAlerts.values());
  }

  /**
   * Récupère les alertes pour un modèle spécifique
   */
  async getAlertsForModel(model, storage = null) {
    const alerts = Array.from(this.autoAlerts.values());
    
    return alerts.filter(alert => {
      if (storage) {
        return alert.model === model && alert.storage === storage;
      }
      return alert.model === model;
    });
  }

  /**
   * Vérifie les nouvelles annonces contre les alertes existantes
   */
  async checkNewListingsAgainstAlerts(newListings) {
    const triggeredAlerts = [];

    for (const listing of newListings) {
      const analysis = this.modelAnalyzer.analyzeListing(listing);
      
      if (analysis.isGoodDeal && analysis.variant) {
        // Vérifier si on a déjà une alerte pour cette variante
        const existingAlert = this.autoAlerts.get(`auto_${analysis.variant.replace(/\s+/g, '_')}`);
        
        if (existingAlert) {
          // Vérifier si cette nouvelle annonce est encore meilleure
          if (analysis.dealScore > existingAlert.trigger.dealScore) {
            triggeredAlerts.push({
              alert: existingAlert,
              listing: analysis,
              type: 'improved_deal',
              message: `🚀 Meilleure affaire détectée pour ${analysis.variant}: ${analysis.price}€ (${analysis.savingsPercent}% d'économie)`
            });
          }
        } else {
          // Nouvelle alerte à créer
          triggeredAlerts.push({
            alert: null,
            listing: analysis,
            type: 'new_good_deal',
            message: `🎯 Nouvelle bonne affaire pour ${analysis.variant}: ${analysis.price}€ (${analysis.savingsPercent}% d'économie)`
          });
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Génère un rapport d'analyse détaillé
   */
  async generateAnalysisReport() {
    try {
      const listings = await this.dbManager.getListingsByKeywords([
        'iphone', 'iphone 15', 'iphone 14', 'iphone 13', 'iphone 12', 
        'iphone 11', 'iphone x', 'iphone 8', 'iphone 7', 'iphone 6', 'iphone se'
      ], 2000);
      const analysis = this.modelAnalyzer.analyzeListings(listings);
      
      const report = {
        summary: {
          totalListings: analysis.totalListings,
          totalVariants: analysis.totalVariants,
          totalGoodDeals: analysis.totalGoodDeals,
          goodDealsPercentage: Math.round((analysis.totalGoodDeals / analysis.totalListings) * 100)
        },
        variants: Object.values(analysis.variants).map(variant => ({
          variant: variant.variant,
          model: variant.model,
          storage: variant.storage,
          statistics: {
            totalListings: variant.listings.length,
            averagePrice: variant.averagePrice,
            minPrice: variant.minPrice,
            maxPrice: variant.maxPrice,
            referencePrice: variant.referencePrice,
            goodDealsCount: variant.goodDeals.length
          },
          bestDeals: variant.goodDeals
            .sort((a, b) => b.dealScore - a.dealScore)
            .slice(0, 3) // Top 3 des meilleures affaires
            .map(deal => ({
              title: deal.originalTitle,
              price: deal.price,
              savings: deal.savings,
              savingsPercent: deal.savingsPercent,
              dealScore: deal.dealScore,
              url: deal.url,
              location: deal.location,
              hoursSinceCreated: deal.hoursSinceCreated
            }))
        })),
        priceRanges: this.generatePriceRanges(analysis.variants),
        recommendations: this.generateRecommendations(analysis)
      };

      return report;

    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      return null;
    }
  }

  /**
   * Génère des plages de prix par modèle
   */
  generatePriceRanges(variants) {
    const ranges = {};
    
    Object.values(variants).forEach(variant => {
      if (!ranges[variant.model]) {
        ranges[variant.model] = {
          model: variant.model,
          variants: [],
          overallStats: {
            minPrice: Infinity,
            maxPrice: 0,
            totalListings: 0
          }
        };
      }
      
      ranges[variant.model].variants.push({
        storage: variant.storage,
        averagePrice: variant.averagePrice,
        minPrice: variant.minPrice,
        maxPrice: variant.maxPrice,
        goodDealsCount: variant.goodDeals.length
      });
      
      ranges[variant.model].overallStats.minPrice = Math.min(
        ranges[variant.model].overallStats.minPrice, 
        variant.minPrice
      );
      ranges[variant.model].overallStats.maxPrice = Math.max(
        ranges[variant.model].overallStats.maxPrice, 
        variant.maxPrice
      );
      ranges[variant.model].overallStats.totalListings += variant.listings.length;
    });

    return ranges;
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    Object.values(analysis.variants).forEach(variant => {
      if (variant.goodDeals.length > 0) {
        const bestDeal = variant.goodDeals.reduce((best, current) => 
          current.dealScore > best.dealScore ? current : best
        );

        if (bestDeal.savingsPercent >= this.alertThresholds.excellent) {
          recommendations.push({
            type: 'excellent_deal',
            priority: 'high',
            variant: variant.variant,
            message: `🚨 Excellente affaire: ${bestDeal.price}€ pour ${variant.variant} (${bestDeal.savingsPercent}% d'économie)`,
            deal: bestDeal
          });
        } else if (bestDeal.savingsPercent >= this.alertThresholds.good) {
          recommendations.push({
            type: 'good_deal',
            priority: 'medium',
            variant: variant.variant,
            message: `✅ Bonne affaire: ${bestDeal.price}€ pour ${variant.variant} (${bestDeal.savingsPercent}% d'économie)`,
            deal: bestDeal
          });
        }
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Met à jour les seuils d'alerte
   */
  updateAlertThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Supprime une alerte automatique
   */
  async deleteAutoAlert(alertId) {
    if (this.autoAlerts.has(alertId)) {
      this.autoAlerts.delete(alertId);
      return true;
    }
    return false;
  }

  /**
   * Active/désactive une alerte automatique
   */
  async toggleAutoAlert(alertId, active) {
    const alert = this.autoAlerts.get(alertId);
    if (alert) {
      alert.active = active;
      return true;
    }
    return false;
  }
}

// Export pour le navigateur
window.AutoAlertManager = AutoAlertManager;
