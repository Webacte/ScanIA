/**
 * Test du ModelAnalyzer avec les patterns de l'API
 */

const fetch = require('node-fetch');

// Simulation du ModelAnalyzer côté client
class TestModelAnalyzer {
  constructor() {
    this.iphonePatterns = {
      models: {},
      storage: {},
      colors: {},
      conditions: {}
    };
    this.patternsLoaded = false;
  }

  async loadPatterns() {
    try {
      console.log('📋 Chargement des patterns depuis l\'API...');
      
      const response = await fetch('http://localhost:3000/api/patterns');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const patterns = await response.json();
      console.log('📋 Patterns reçus:', Object.keys(patterns));
      
      // Convertir les patterns en objets RegExp
      Object.keys(patterns).forEach(category => {
        if (patterns[category]) {
          Object.keys(patterns[category]).forEach(name => {
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
      console.log('✅ Patterns chargés avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des patterns:', error);
    }
  }

  analyzeListing(listing) {
    const title = listing.title || '';
    const description = listing.description || '';
    const text = `${title} ${description}`.toLowerCase();

    const analysis = {
      originalTitle: listing.title,
      model: null,
      storage: null,
      color: null,
      condition: null,
      confidence: 0
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

    return analysis;
  }
}

async function testModelAnalyzer() {
  console.log('🧪 Test du ModelAnalyzer avec l\'API...\n');
  
  const analyzer = new TestModelAnalyzer();
  await analyzer.loadPatterns();
  
  if (!analyzer.patternsLoaded) {
    console.error('❌ Impossible de charger les patterns');
    return;
  }

  // Tests avec des annonces réelles
  const testListings = [
    {
      title: 'IPhone 15 – 256 Go – Noir',
      description: 'iPhone 15 en excellent état'
    },
    {
      title: 'IPhone 14 Pro Max 128go - Très bon état',
      description: 'iPhone 14 Pro Max 128GB en très bon état'
    },
    {
      title: 'IPhone 15 Pro 512 Go Titane Naturel',
      description: 'iPhone 15 Pro 512GB en parfait état'
    },
    {
      title: 'Iphone 13 mini 64GB Rose',
      description: 'iPhone 13 mini 64GB rose en bon état'
    }
  ];

  console.log('🔍 Tests d\'analyse:');
  testListings.forEach((listing, index) => {
    console.log(`\n${index + 1}. "${listing.title}"`);
    const analysis = analyzer.analyzeListing(listing);
    
    console.log(`   📱 Modèle: ${analysis.model || 'Non détecté'}`);
    console.log(`   💾 Stockage: ${analysis.storage || 'Non détecté'}`);
    console.log(`   🎨 Couleur: ${analysis.color || 'Non détecté'}`);
    console.log(`   📊 État: ${analysis.condition || 'Non détecté'}`);
    console.log(`   🎯 Confiance: ${analysis.confidence}%`);
  });

  console.log('\n🎉 Test terminé!');
}

testModelAnalyzer();
