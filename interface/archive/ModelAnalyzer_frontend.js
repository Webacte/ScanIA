/**
 * Analyseur de modèles pour identifier les variantes précises
 * 
 * Détecte automatiquement les modèles, variantes et spécifications
 * pour créer des alertes intelligentes
 */

class ModelAnalyzer {
  constructor() {
    // Patterns de détection des modèles iPhone (chargés depuis l'API)
    this.iphonePatterns = {
      models: {},
      storage: {},
      colors: {},
      conditions: {}
    };

    // Prix de référence calculés dynamiquement à partir de la base de données
    this.referencePrices = {};
    
    // Cache pour éviter de recharger les patterns à chaque analyse
    this.patternsLoaded = false;
    this.patternsLoading = false;
    this.patternsLoadAttempts = 0;
    this.maxLoadAttempts = 3;
  }

  /**
   * Charge les patterns de détection depuis l'API
   */
  async loadPatterns() {
    if (this.patternsLoaded || this.patternsLoading) {
      return;
    }

    // Éviter les tentatives infinies
    if (this.patternsLoadAttempts >= this.maxLoadAttempts) {
      console.warn('⚠️ Nombre maximum de tentatives de chargement atteint, utilisation des patterns par défaut');
      this.loadDefaultPatterns();
      return;
    }

    this.patternsLoading = true;
    this.patternsLoadAttempts++;
    
    try {
      console.log('📋 Chargement des patterns de détection depuis l\'API...');
      
      const response = await fetch('/api/patterns');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const patterns = await response.json();
      console.log('📋 Patterns reçus de l\'API:', patterns);
      
      // Convertir les patterns en objets RegExp
      this.iphonePatterns = {
        models: {},
        storage: {},
        colors: {},
        conditions: {}
      };

      // Traiter chaque catégorie de patterns
      Object.keys(patterns).forEach(category => {
        if (patterns[category]) {
          Object.keys(patterns[category]).forEach(name => {
            // Convertir le pattern string en RegExp
            const patternString = patterns[category][name];
            if (typeof patternString === 'string') {
              this.iphonePatterns[category][name] = new RegExp(patternString, 'i');
            } else {
              this.iphonePatterns[category][name] = patternString;
            }
          });
        }
      });

      this.patternsLoaded = true;
      console.log('✅ Patterns de détection chargés avec succès:', this.iphonePatterns);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des patterns:', error);
      
      // Fallback vers des patterns par défaut en cas d'erreur
      this.loadDefaultPatterns();
    } finally {
      this.patternsLoading = false;
    }
  }

  /**
   * Charge des patterns par défaut en cas d'erreur de chargement
   */
  loadDefaultPatterns() {
    console.log('⚠️ Utilisation des patterns par défaut...');
    
    this.iphonePatterns = {
      models: {
        'iPhone 15': /iphone\s*15(?!\s*(pro|mini|max))/i,
        'iPhone 15 Pro': /iphone\s*15\s*pro(?!\s*max)/i,
        'iPhone 15 Pro Max': /iphone\s*15\s*pro\s*max/i,
        'iPhone 15 mini': /iphone\s*15\s*mini/i,
        'iPhone 14': /iphone\s*14(?!\s*(pro|mini|max))/i,
        'iPhone 14 Pro': /iphone\s*14\s*pro(?!\s*max)/i,
        'iPhone 14 Pro Max': /iphone\s*14\s*pro\s*max/i,
        'iPhone 14 mini': /iphone\s*14\s*mini/i,
        'iPhone 13': /iphone\s*13(?!\s*(pro|mini|max))/i,
        'iPhone 13 Pro': /iphone\s*13\s*pro(?!\s*max)/i,
        'iPhone 13 Pro Max': /iphone\s*13\s*pro\s*max/i,
        'iPhone 13 mini': /iphone\s*13\s*mini/i,
        'iPhone 12': /iphone\s*12(?!\s*(pro|mini|max))/i,
        'iPhone 12 Pro': /iphone\s*12\s*pro(?!\s*max)/i,
        'iPhone 12 Pro Max': /iphone\s*12\s*pro\s*max/i,
        'iPhone 12 mini': /iphone\s*12\s*mini/i,
        'iPhone 11': /iphone\s*11(?!\s*(pro|max))/i,
        'iPhone 11 Pro': /iphone\s*11\s*pro(?!\s*max)/i,
        'iPhone 11 Pro Max': /iphone\s*11\s*pro\s*max/i,
        'iPhone XR': /iphone\s*xr/i,
        'iPhone XS': /iphone\s*xs(?!\s*max)/i,
        'iPhone XS Max': /iphone\s*xs\s*max/i,
        'iPhone X': /iphone\s*x(?![srm])/i,
        'iPhone 8': /iphone\s*8(?!\s*plus)/i,
        'iPhone 8 Plus': /iphone\s*8\s*plus/i,
        'iPhone 7': /iphone\s*7(?!\s*plus)/i,
        'iPhone 7 Plus': /iphone\s*7\s*plus/i,
        'iPhone 6s': /iphone\s*6s(?!\s*plus)/i,
        'iPhone 6s Plus': /iphone\s*6s\s*plus/i,
        'iPhone 6': /iphone\s*6(?!\s*(s|plus))/i,
        'iPhone 6 Plus': /iphone\s*6\s*plus/i,
        'iPhone SE': /iphone\s*se/i
      },
      storage: {
        '16GB': /16\s*gb|16\s*go/i,
        '32GB': /32\s*gb|32\s*go/i,
        '64GB': /64\s*gb|64\s*go/i,
        '128GB': /128\s*gb|128\s*go/i,
        '256GB': /256\s*gb|256\s*go/i,
        '512GB': /512\s*gb|512\s*go/i,
        '1TB': /1\s*tb|1000\s*gb|1000\s*go/i
      },
      colors: {
        'Noir': /noir|black/i,
        'Blanc': /blanc|white/i,
        'Rouge': /rouge|red/i,
        'Bleu': /bleu|blue/i,
        'Vert': /vert|green/i,
        'Rose': /rose|pink/i,
        'Violet': /violet|purple/i,
        'Argent': /argent|silver/i,
        'Or': /or|gold/i
      },
      conditions: {
        'Neuf': /neuf|new/i,
        'Comme neuf': /comme\s*neuf|like\s*new/i,
        'Bon état': /bon\s*état|good\s*condition/i,
        'État correct': /état\s*correct|fair\s*condition/i,
        'Mauvais état': /mauvais\s*état|poor\s*condition/i
      }
    };
    
    this.patternsLoaded = true;
  }

  /**
   * Calcule les prix de référence à partir des données reçues du serveur
   */
  calculateReferencePricesFromData(listings) {
    try {
      console.log('📊 Calcul des prix de référence côté client...');
      
      if (!listings || listings.length === 0) {
        console.log('⚠️ Aucune annonce disponible pour calculer les prix de référence');
        return;
      }

      console.log(`📊 Analyse de ${listings.length} annonces pour calculer les prix de référence`);

      // Analyser toutes les annonces
      const analysis = this.analyzeListings(listings);
      
      // Calculer les prix moyens par variante
      const variantPrices = {};
      
      Object.values(analysis.variants).forEach(variant => {
        if (variant.listings.length >= 3) { // Au moins 3 annonces pour être fiable
          const prices = variant.listings.map(l => l.price);
          const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          
          if (!variantPrices[variant.model]) {
            variantPrices[variant.model] = {};
          }
          
          variantPrices[variant.model][variant.storage] = Math.round(averagePrice);
        }
      });

      this.referencePrices = variantPrices;
      
      console.log('✅ Prix de référence calculés côté client:', this.referencePrices);
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul des prix de référence côté client:', error);
    }
  }

  /**
   * Vérifie si une annonce mentionne plusieurs appareils
   */
  hasMultipleDevices(text) {
    const multipleDevicePatterns = [
      // Patterns pour plusieurs modèles
      /iphone\s*\d+\s*et\s*iphone\s*\d+/i,
      /iphone\s*\d+\s*&\s*iphone\s*\d+/i,
      /iphone\s*\d+\s*\+?\s*iphone\s*\d+/i,
      /iphone\s*\d+\s*plus\s*iphone\s*\d+/i,
      
      // Patterns pour plusieurs capacités
      /\d+\s*go\s*et\s*\d+\s*go/i,
      /\d+\s*gb\s*et\s*\d+\s*gb/i,
      /\d+\s*go\s*&\s*\d+\s*go/i,
      /\d+\s*gb\s*&\s*\d+\s*gb/i,
      /\d+\s*go\s*\+?\s*\d+\s*go/i,
      /\d+\s*gb\s*\+?\s*\d+\s*gb/i,
      
      // Patterns pour lots/collections
      /lot\s*de\s*\d+/i,
      /collection\s*de\s*\d+/i,
      /ensemble\s*de\s*\d+/i,
      /pack\s*de\s*\d+/i,
      /\d+\s*iphone/i,
      /plusieurs\s*iphone/i,
      /multiples?\s*iphone/i,
      
      // Patterns pour vente groupée
      /vends?\s*plusieurs/i,
      /vends?\s*plusieurs\s*iphone/i,
      /vends?\s*\d+\s*iphone/i,
      
      // Patterns pour différents modèles dans le même titre
      /iphone\s*\d+\s*ou\s*iphone\s*\d+/i,
      /iphone\s*\d+\s*ou\s*autre/i,
      /iphone\s*\d+\s*ou\s*plus/i
    ];
    
    return multipleDevicePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Vérifie si une annonce est "pour pièces" (téléphone cassé)
   */
  isForPartsOnly(text) {
    const partsOnlyPatterns = [
      /pour\s*pièces/i,
      /pour\s*piece/i,
      /pour\s*pieces/i,
      /pièces\s*seulement/i,
      /piece\s*seulement/i,
      /pieces\s*seulement/i,
      /cassé/i,
      /casse/i,
      /hs\s*\(hors\s*service\)/i,
      /hors\s*service/i,
      /ne\s*marche\s*pas/i,
      /ne\s*fonctionne\s*pas/i,
      /écran\s*cassé/i,
      /ecran\s*casse/i,
      /batterie\s*morte/i,
      /ne\s*s\s*allume\s*pas/i,
      /ne\s*s\s*allume\s*plus/i,
      /défaillant/i,
      /defaillant/i,
      /en\s*panne/i,
      /réparation/i,
      /reparation/i
    ];
    
    return partsOnlyPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Analyse une annonce pour extraire les informations du modèle
   */
  async analyzeListing(listing) {
    // S'assurer que les patterns sont chargés
    await this.loadPatterns();
    const title = listing.title || '';
    const description = listing.description || '';
    const text = `${title} ${description}`.toLowerCase();

    // Vérifier si l'annonce mentionne plusieurs appareils
    if (this.hasMultipleDevices(text)) {
      return {
        originalTitle: listing.title,
        model: null,
        storage: null,
        color: null,
        condition: null,
        variant: null,
        confidence: 0,
        price: listing.price_euros || (listing.price_cents / 100),
        isGoodDeal: false,
        dealScore: 0,
        savings: 0,
        savingsPercent: 0,
        url: listing.url,
        location: listing.location,
        hoursSinceCreated: listing.hoursSinceCreated,
        isMultipleDevices: true,
        reason: 'Annonce mentionnant plusieurs appareils'
      };
    }

    // Vérifier si l'annonce est "pour pièces" (téléphone cassé)
    if (this.isForPartsOnly(text)) {
      return {
        originalTitle: listing.title,
        model: null,
        storage: null,
        color: null,
        condition: null,
        variant: null,
        confidence: 0,
        price: listing.price_euros || (listing.price_cents / 100),
        isGoodDeal: false,
        dealScore: 0,
        savings: 0,
        savingsPercent: 0,
        url: listing.url,
        location: listing.location,
        hoursSinceCreated: listing.hoursSinceCreated,
        isForPartsOnly: true,
        reason: 'Annonce pour pièces (téléphone cassé)'
      };
    }

    const analysis = {
      originalTitle: listing.title,
      model: null,
      storage: null,
      color: null,
      condition: null,
      variant: null,
      confidence: 0,
      price: listing.price_euros || (listing.price_cents / 100),
      isGoodDeal: false,
      dealScore: 0,
      savings: 0,
      savingsPercent: 0,
      url: listing.url,
      location: listing.location,
      hoursSinceCreated: listing.hoursSinceCreated
    };

    // Détecter le modèle
    for (const [modelName, pattern] of Object.entries(this.iphonePatterns.models)) {
      if (pattern.test(text)) {
        analysis.model = modelName;
        analysis.confidence += 30;
        break;
      }
    }

    // Détecter la capacité de stockage
    for (const [storage, pattern] of Object.entries(this.iphonePatterns.storage)) {
      if (pattern.test(text)) {
        analysis.storage = storage;
        analysis.confidence += 25;
        break;
      }
    }

    // Détecter la couleur
    for (const [color, pattern] of Object.entries(this.iphonePatterns.colors)) {
      if (pattern.test(text)) {
        analysis.color = color;
        analysis.confidence += 15;
        break;
      }
    }

    // Détecter l'état
    for (const [condition, pattern] of Object.entries(this.iphonePatterns.conditions)) {
      if (pattern.test(text)) {
        analysis.condition = condition;
        analysis.confidence += 10;
        break;
      }
    }

    // Créer la variante complète
    if (analysis.model && analysis.storage) {
      analysis.variant = `${analysis.model} ${analysis.storage}`;
      analysis.confidence += 20;
    }

    // Calculer les heures depuis la création
    if (listing.created_at) {
      const hoursSinceCreated = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
      analysis.hoursSinceCreated = Math.round(hoursSinceCreated);
    }

    // Analyser le prix si on a assez d'informations
    if (analysis.model && analysis.storage) {
      const priceAnalysis = this.analyzePrice(analysis.model, analysis.storage, analysis.price);
      analysis.isGoodDeal = priceAnalysis.isGoodDeal;
      analysis.dealScore = priceAnalysis.dealScore;
      analysis.savings = priceAnalysis.savings;
      analysis.savingsPercent = priceAnalysis.savingsPercent;
      
      // Bonus pour les annonces récentes
      if (analysis.hoursSinceCreated !== undefined) {
        if (analysis.hoursSinceCreated < 2) {
          analysis.dealScore += 10; // Bonus pour les annonces très récentes
        } else if (analysis.hoursSinceCreated < 24) {
          analysis.dealScore += 5; // Bonus pour les annonces du jour
        }
        analysis.dealScore = Math.min(analysis.dealScore, 100); // Limiter à 100
      }
    }

    return analysis;
  }

  /**
   * Analyse le prix par rapport aux prix de référence
   */
  analyzePrice(model, storage, currentPrice) {
    const referencePrice = this.referencePrices[model]?.[storage];
    
    if (!referencePrice) {
      return {
        isGoodDeal: false,
        dealScore: 0,
        savings: 0,
        savingsPercent: 0
      };
    }

    const savings = Math.round((referencePrice - currentPrice) * 100) / 100; // Arrondir à 2 décimales
    const savingsPercent = Math.round((savings / referencePrice) * 100);
    
    let dealScore = 0;
    let isGoodDeal = false;

    // Critères plus stricts pour les bonnes affaires
    // Seules les vraies bonnes affaires sont marquées comme telles
    if (savingsPercent >= 40) {
      dealScore = 95;
      isGoodDeal = true;
    } else if (savingsPercent >= 30) {
      dealScore = 85;
      isGoodDeal = true;
    } else if (savingsPercent >= 25) {
      dealScore = 75;
      isGoodDeal = true;
    } else if (savingsPercent >= 20) {
      dealScore = 65;
      isGoodDeal = true;
    } else if (savingsPercent >= 15) {
      dealScore = 55;
      // Pas de bonne affaire en dessous de 20%
    }

    return {
      isGoodDeal,
      dealScore,
      savings: Math.round(savings * 100) / 100, // Arrondir à 2 décimales
      savingsPercent: Math.round(savingsPercent)
    };
  }

  /**
   * Analyse une liste d'annonces et retourne les bonnes affaires par modèle
   */
  async analyzeListings(listings) {
    // Calculer les prix de référence si pas encore fait
    if (Object.keys(this.referencePrices).length === 0) {
      this.calculateReferencePricesFromData(listings);
    }
    
    const analyzedListings = await Promise.all(listings.map(listing => this.analyzeListing(listing)));
    
    // Filtrer les annonces avec plusieurs appareils et les annonces "pour pièces"
    const filteredListings = analyzedListings.filter(listing => 
      !listing.isMultipleDevices && !listing.isForPartsOnly
    );
    const multipleDevicesListings = analyzedListings.filter(listing => listing.isMultipleDevices);
    const partsOnlyListings = analyzedListings.filter(listing => listing.isForPartsOnly);
    
    console.log(`📊 Analyse terminée: ${analyzedListings.length} annonces analysées`);
    console.log(`✅ ${filteredListings.length} annonces valides (un seul appareil fonctionnel)`);
    console.log(`❌ ${multipleDevicesListings.length} annonces filtrées (plusieurs appareils)`);
    console.log(`🔧 ${partsOnlyListings.length} annonces filtrées (pour pièces/cassé)`);
    
    // Grouper par variante
    const variants = {};
    
    filteredListings.forEach(listing => {
      if (listing.variant) {
        if (!variants[listing.variant]) {
          variants[listing.variant] = {
            variant: listing.variant,
            model: listing.model,
            storage: listing.storage,
            listings: [],
            averagePrice: 0,
            minPrice: Infinity,
            maxPrice: 0,
            goodDeals: [],
            referencePrice: this.referencePrices[listing.model]?.[listing.storage] || 0
          };
        }
        
        variants[listing.variant].listings.push(listing);
        variants[listing.variant].minPrice = Math.min(variants[listing.variant].minPrice, listing.price);
        variants[listing.variant].maxPrice = Math.max(variants[listing.variant].maxPrice, listing.price);
        
        if (listing.isGoodDeal) {
          variants[listing.variant].goodDeals.push({
            ...listing,
            url: listing.url,
            title: listing.originalTitle,
            location: listing.location,
            hoursSinceCreated: listing.hoursSinceCreated
          });
        }
      }
    });

    // Calculer les prix moyens (les prix sont déjà en euros dans l'analyse)
    Object.values(variants).forEach(variant => {
      const totalPrice = variant.listings.reduce((sum, listing) => sum + listing.price, 0);
      variant.averagePrice = Math.round(totalPrice / variant.listings.length);
    });

    return {
      analyzedListings: filteredListings,
      variants,
      totalListings: analyzedListings.length,
      filteredListings: filteredListings.length,
      multipleDevicesListings: multipleDevicesListings.length,
      partsOnlyListings: partsOnlyListings.length,
      totalVariants: Object.keys(variants).length,
      totalGoodDeals: filteredListings.filter(l => l.isGoodDeal).length,
      filteredStats: {
        originalCount: analyzedListings.length,
        validCount: filteredListings.length,
        multipleDevicesCount: multipleDevicesListings.length,
        partsOnlyCount: partsOnlyListings.length,
        totalFilteredCount: multipleDevicesListings.length + partsOnlyListings.length,
        filterRate: Math.round(((multipleDevicesListings.length + partsOnlyListings.length) / analyzedListings.length) * 100)
      }
    };
  }

  /**
   * Génère des alertes automatiques basées sur l'analyse
   */
  generateAutoAlerts(analysis) {
    const alerts = [];

    Object.values(analysis.variants).forEach(variant => {
      if (variant.goodDeals.length > 0) {
        // Créer une alerte pour cette variante
        const bestDeal = variant.goodDeals.reduce((best, current) => 
          current.dealScore > best.dealScore ? current : best
        );

        alerts.push({
          id: `auto_${variant.variant.replace(/\s+/g, '_')}`,
          name: `🚨 ${variant.variant} - Bonne affaire détectée`,
          type: 'auto_good_deal',
          variant: variant.variant,
          model: variant.model,
          storage: variant.storage,
          trigger: {
            price: bestDeal.price,
            savings: bestDeal.savings,
            savingsPercent: bestDeal.savingsPercent,
            dealScore: bestDeal.dealScore,
            url: bestDeal.url,
            title: bestDeal.originalTitle,
            location: bestDeal.location,
            hoursSinceCreated: bestDeal.hoursSinceCreated
          },
          statistics: {
            averagePrice: variant.averagePrice,
            minPrice: variant.minPrice,
            maxPrice: variant.maxPrice,
            totalListings: variant.listings.length,
            goodDealsCount: variant.goodDeals.length,
            referencePrice: variant.referencePrice
          },
          bestDeal: bestDeal,
          createdAt: new Date(),
          active: true
        });
      }
    });

    return alerts;
  }

  /**
   * Met à jour les prix de référence basés sur les données actuelles
   */
  updateReferencePrices(analysis) {
    Object.values(analysis.variants).forEach(variant => {
      if (variant.listings.length >= 5) { // Au moins 5 annonces pour être fiable
        const currentRef = this.referencePrices[variant.model]?.[variant.storage];
        const newAverage = variant.averagePrice;
        
        // Mettre à jour progressivement (moyenne pondérée)
        if (currentRef) {
          this.referencePrices[variant.model][variant.storage] = Math.round(
            (currentRef * 0.7) + (newAverage * 0.3)
          );
        } else {
          if (!this.referencePrices[variant.model]) {
            this.referencePrices[variant.model] = {};
          }
          this.referencePrices[variant.model][variant.storage] = newAverage;
        }
      }
    });
  }
}

// Export pour le navigateur
window.ModelAnalyzer = ModelAnalyzer;
