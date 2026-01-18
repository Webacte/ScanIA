/**
 * Analyseur de prix pour détecter les bonnes affaires
 * 
 * Utilise des algorithmes pour identifier les annonces
 * avec un excellent rapport qualité/prix
 */

class PriceAnalyzer {
  constructor() {
    this.priceHistory = new Map(); // Historique des prix par mot-clé
    this.marketAverages = new Map(); // Moyennes de marché
  }

  /**
   * Trouve les bonnes affaires basées sur des mots-clés
   */
  async findGoodDeals(keywords, limit = 50) {
    try {
      // Simuler l'accès aux données (dans la vraie version, on utiliserait dbManager)
      const listings = await this.getListingsByKeywords(keywords, limit);
      
      if (listings.length === 0) {
        return {
          totalListings: 0,
          goodDeals: [],
          statistics: null
        };
      }

      // Analyser les prix
      const analysis = this.analyzePrices(listings);
      
      // Identifier les bonnes affaires
      const goodDeals = this.identifyGoodDeals(listings, analysis);

      return {
        totalListings: listings.length,
        goodDeals: goodDeals,
        statistics: analysis,
        keywords: keywords
      };

    } catch (error) {
      console.error('Erreur recherche bonnes affaires:', error);
      return {
        totalListings: 0,
        goodDeals: [],
        statistics: null,
        error: error.message
      };
    }
  }

  /**
   * Analyse les prix d'une liste d'annonces
   */
  analyzePrices(listings) {
    const prices = listings
      .map(l => l.price_cents / 100)
      .filter(price => price > 0);

    if (prices.length === 0) {
      return null;
    }

    // Calculs statistiques
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const count = prices.length;
    const sum = prices.reduce((a, b) => a + b, 0);
    const average = sum / count;
    
    // Médiane
    const median = count % 2 === 0 
      ? (sortedPrices[count / 2 - 1] + sortedPrices[count / 2]) / 2
      : sortedPrices[Math.floor(count / 2)];

    // Quartiles
    const q1Index = Math.floor(count * 0.25);
    const q3Index = Math.floor(count * 0.75);
    const q1 = sortedPrices[q1Index];
    const q3 = sortedPrices[q3Index];

    // Écart-type
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - average, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);

    // Seuils de bonne affaire
    const excellentDealThreshold = q1; // Premier quartile
    const goodDealThreshold = average * 0.85; // 15% en dessous de la moyenne
    const fairDealThreshold = average * 0.95; // 5% en dessous de la moyenne

    return {
      count,
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(average),
      median: Math.round(median),
      q1: Math.round(q1),
      q3: Math.round(q3),
      standardDeviation: Math.round(standardDeviation),
      thresholds: {
        excellent: Math.round(excellentDealThreshold),
        good: Math.round(goodDealThreshold),
        fair: Math.round(fairDealThreshold)
      }
    };
  }

  /**
   * Identifie les bonnes affaires dans une liste d'annonces
   */
  identifyGoodDeals(listings, analysis) {
    if (!analysis) return [];

    return listings
      .map(listing => {
        const price = listing.price_cents / 100;
        
        // Calculer le score de bonne affaire
        let dealScore = 0;
        let dealType = 'normal';
        let savings = 0;
        let savingsPercent = 0;

        if (price <= analysis.thresholds.excellent) {
          dealScore = 95;
          dealType = 'excellent';
          savings = Math.round(analysis.average - price);
          savingsPercent = Math.round(((analysis.average - price) / analysis.average) * 100);
        } else if (price <= analysis.thresholds.good) {
          dealScore = 80;
          dealType = 'good';
          savings = Math.round(analysis.average - price);
          savingsPercent = Math.round(((analysis.average - price) / analysis.average) * 100);
        } else if (price <= analysis.thresholds.fair) {
          dealScore = 65;
          dealType = 'fair';
          savings = Math.round(analysis.average - price);
          savingsPercent = Math.round(((analysis.average - price) / analysis.average) * 100);
        }

        // Bonus pour les annonces récentes
        const hoursSinceCreated = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreated < 2) {
          dealScore += 10; // Bonus pour les annonces très récentes
        } else if (hoursSinceCreated < 24) {
          dealScore += 5; // Bonus pour les annonces du jour
        }

        // Bonus pour les annonces avec livraison
        if (listing.has_shipping) {
          dealScore += 5;
        }

        return {
          ...listing,
          price,
          dealScore: Math.min(dealScore, 100),
          dealType,
          savings,
          savingsPercent,
          hoursSinceCreated: Math.round(hoursSinceCreated),
          isGoodDeal: dealScore >= 65
        };
      })
      .filter(listing => listing.isGoodDeal)
      .sort((a, b) => b.dealScore - a.dealScore); // Trier par score décroissant
  }

  /**
   * Simule la récupération des annonces par mots-clés
   * (Dans la vraie version, on utiliserait dbManager.getListingsByKeywords)
   */
  async getListingsByKeywords(keywords, limit) {
    // Simulation de données pour les tests
    const mockListings = [
      {
        id: 1,
        title: 'iPhone 13 128GB - Excellent état',
        price_cents: 25000,
        url: 'https://example.com/1',
        has_shipping: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
        location: 'Paris'
      },
      {
        id: 2,
        title: 'iPhone 13 Pro - Très bon état',
        price_cents: 35000,
        url: 'https://example.com/2',
        has_shipping: false,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
        location: 'Lyon'
      },
      {
        id: 3,
        title: 'iPhone 13 Mini - Bon état',
        price_cents: 20000,
        url: 'https://example.com/3',
        has_shipping: true,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
        location: 'Marseille'
      }
    ];

    // Filtrer par mots-clés
    const filtered = mockListings.filter(listing => 
      keywords.some(keyword => 
        listing.title.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    return filtered.slice(0, limit);
  }

  /**
   * Met à jour l'historique des prix
   */
  updatePriceHistory(keyword, price) {
    if (!this.priceHistory.has(keyword)) {
      this.priceHistory.set(keyword, []);
    }
    
    const history = this.priceHistory.get(keyword);
    history.push({
      price,
      timestamp: new Date()
    });

    // Garder seulement les 100 derniers prix
    if (history.length > 100) {
      history.shift();
    }

    // Recalculer la moyenne de marché
    const average = history.reduce((sum, entry) => sum + entry.price, 0) / history.length;
    this.marketAverages.set(keyword, average);
  }

  /**
   * Récupère la moyenne de marché pour un mot-clé
   */
  getMarketAverage(keyword) {
    return this.marketAverages.get(keyword) || null;
  }
}

module.exports = PriceAnalyzer;
