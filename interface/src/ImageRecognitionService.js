/**
 * Service de reconnaissance d'images
 * 
 * Utilise Google Cloud Vision API pour comparer des images
 * et détecter la similarité entre une image scrapée et des images de référence
 */

// Note: L'utilisateur devra installer @google-cloud/vision
// npm install @google-cloud/vision
let vision = null;
try {
  vision = require('@google-cloud/vision');
} catch (error) {
  console.warn('@google-cloud/vision non installé. Utilisez: npm install @google-cloud/vision');
}

class ImageRecognitionService {
  constructor(config = {}) {
    this.config = {
      // Chemin vers le fichier de credentials Google Cloud (optionnel si GOOGLE_APPLICATION_CREDENTIALS est défini)
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || config.credentialsPath,
      // Clé API alternative (moins sécurisé mais plus simple)
      apiKey: process.env.GOOGLE_VISION_API_KEY || config.apiKey,
      // Seuil de confiance par défaut
      defaultConfidenceThreshold: config.defaultConfidenceThreshold || 70.0,
      // Cache des résultats pour éviter les re-analyses
      enableCache: config.enableCache !== false,
      ...config
    };

    this.cache = new Map();
    this.client = null;

    if (vision) {
      this.initializeClient();
    }
  }

  /**
   * Initialise le client Google Vision
   */
  initializeClient() {
    try {
      if (this.config.apiKey) {
        // Utilisation avec clé API (plus simple)
        this.client = new vision.ImageAnnotatorClient({
          apiKey: this.config.apiKey
        });
      } else if (this.config.credentialsPath) {
        // Utilisation avec fichier de credentials
        this.client = new vision.ImageAnnotatorClient({
          keyFilename: this.config.credentialsPath
        });
      } else {
        // Utilisation des credentials par défaut (variable d'environnement GOOGLE_APPLICATION_CREDENTIALS)
        this.client = new vision.ImageAnnotatorClient();
      }
      console.log('✅ Client Google Vision initialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du client Google Vision:', error);
      this.client = null;
    }
  }

  /**
   * Extrait les features d'une image (vecteur de caractéristiques)
   * Utilise la détection d'objets et de labels pour créer une signature
   */
  async extractImageFeatures(imageBuffer) {
    if (!this.client) {
      throw new Error('Client Google Vision non initialisé. Vérifiez vos credentials.');
    }

    try {
      // Utiliser plusieurs types d'analyse pour une meilleure précision
      const [result] = await this.client.annotateImage({
        image: { content: imageBuffer },
        features: [
          { type: 'OBJECT_LOCALIZATION', maxResults: 50 },
          { type: 'LABEL_DETECTION', maxResults: 50 },
          { type: 'IMAGE_PROPERTIES', maxResults: 1 },
          { type: 'WEB_DETECTION', maxResults: 10 }
        ]
      });

      // Créer une signature basée sur les résultats
      const signature = {
        objects: (result.localizedObjectAnnotations || []).map(obj => ({
          name: obj.name,
          score: obj.score,
          boundingPoly: obj.boundingPoly
        })),
        labels: (result.labelAnnotations || []).map(label => ({
          description: label.description,
          score: label.score
        })),
        colors: result.imagePropertiesAnnotation?.dominantColors?.colors || [],
        webEntities: (result.webDetection?.webEntities || []).map(entity => ({
          description: entity.description,
          score: entity.score
        }))
      };

      return signature;
    } catch (error) {
      console.error('Erreur lors de l\'extraction des features:', error);
      throw error;
    }
  }

  /**
   * Compare deux images et retourne un score de similarité (0-100)
   */
  async compareImages(image1Buffer, image2Buffer) {
    if (!this.client) {
      throw new Error('Client Google Vision non initialisé. Vérifiez vos credentials.');
    }

    try {
      // Extraire les features des deux images
      const [features1, features2] = await Promise.all([
        this.extractImageFeatures(image1Buffer),
        this.extractImageFeatures(image2Buffer)
      ]);

      // Calculer la similarité
      const similarity = this.calculateSimilarity(features1, features2);
      
      return {
        similarity: similarity,
        features1: features1,
        features2: features2
      };
    } catch (error) {
      console.error('Erreur lors de la comparaison d\'images:', error);
      throw error;
    }
  }

  /**
   * Calcule un score de similarité entre deux signatures d'images
   */
  calculateSimilarity(signature1, signature2) {
    let totalScore = 0;
    let weightSum = 0;

    // Comparaison des objets détectés (poids: 40%)
    const objectScore = this.compareObjects(signature1.objects, signature2.objects);
    totalScore += objectScore * 0.4;
    weightSum += 0.4;

    // Comparaison des labels (poids: 30%)
    const labelScore = this.compareLabels(signature1.labels, signature2.labels);
    totalScore += labelScore * 0.3;
    weightSum += 0.3;

    // Comparaison des couleurs dominantes (poids: 15%)
    const colorScore = this.compareColors(signature1.colors, signature2.colors);
    totalScore += colorScore * 0.15;
    weightSum += 0.15;

    // Comparaison des entités web (poids: 15%)
    const webScore = this.compareWebEntities(signature1.webEntities, signature2.webEntities);
    totalScore += webScore * 0.15;
    weightSum += 0.15;

    // Normaliser le score (0-100)
    const normalizedScore = weightSum > 0 ? (totalScore / weightSum) * 100 : 0;
    
    return Math.round(normalizedScore * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * Compare les objets détectés dans deux images
   */
  compareObjects(objects1, objects2) {
    if (objects1.length === 0 && objects2.length === 0) return 1.0;
    if (objects1.length === 0 || objects2.length === 0) return 0.0;

    const names1 = new Set(objects1.map(obj => obj.name.toLowerCase()));
    const names2 = new Set(objects2.map(obj => obj.name.toLowerCase()));

    const intersection = [...names1].filter(name => names2.has(name)).length;
    const union = new Set([...names1, ...names2]).size;

    return union > 0 ? intersection / union : 0.0;
  }

  /**
   * Compare les labels détectés dans deux images
   */
  compareLabels(labels1, labels2) {
    if (labels1.length === 0 && labels2.length === 0) return 1.0;
    if (labels1.length === 0 || labels2.length === 0) return 0.0;

    // Créer des maps avec scores pondérés
    const map1 = new Map();
    labels1.forEach(label => {
      const key = label.description.toLowerCase();
      map1.set(key, Math.max(map1.get(key) || 0, label.score));
    });

    const map2 = new Map();
    labels2.forEach(label => {
      const key = label.description.toLowerCase();
      map2.set(key, Math.max(map2.get(key) || 0, label.score));
    });

    // Calculer la similarité cosinus
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allKeys = new Set([...map1.keys(), ...map2.keys()]);
    for (const key of allKeys) {
      const val1 = map1.get(key) || 0;
      const val2 = map2.get(key) || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0.0;
  }

  /**
   * Compare les couleurs dominantes
   */
  compareColors(colors1, colors2) {
    if (colors1.length === 0 && colors2.length === 0) return 1.0;
    if (colors1.length === 0 || colors2.length === 0) return 0.0;

    // Prendre les 3 premières couleurs dominantes
    const topColors1 = colors1.slice(0, 3).map(c => ({
      r: c.color.red || 0,
      g: c.color.green || 0,
      b: c.color.blue || 0,
      score: c.score || 0
    }));

    const topColors2 = colors2.slice(0, 3).map(c => ({
      r: c.color.red || 0,
      g: c.color.green || 0,
      b: c.color.blue || 0,
      score: c.score || 0
    }));

    // Calculer la distance moyenne entre les couleurs
    let totalDistance = 0;
    const minLength = Math.min(topColors1.length, topColors2.length);
    
    for (let i = 0; i < minLength; i++) {
      const c1 = topColors1[i];
      const c2 = topColors2[i];
      const distance = Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
      );
      // Normaliser la distance (0-255 pour chaque composante, max distance = sqrt(3*255^2))
      const normalizedDistance = 1 - (distance / (255 * Math.sqrt(3)));
      totalDistance += normalizedDistance * (c1.score + c2.score) / 2;
    }

    return Math.max(0, Math.min(1, totalDistance / minLength));
  }

  /**
   * Compare les entités web détectées
   */
  compareWebEntities(entities1, entities2) {
    if (entities1.length === 0 && entities2.length === 0) return 1.0;
    if (entities1.length === 0 || entities2.length === 0) return 0.0;

    const descriptions1 = new Set(entities1.map(e => e.description?.toLowerCase()).filter(Boolean));
    const descriptions2 = new Set(entities2.map(e => e.description?.toLowerCase()).filter(Boolean));

    const intersection = [...descriptions1].filter(d => descriptions2.has(d)).length;
    const union = new Set([...descriptions1, ...descriptions2]).size;

    return union > 0 ? intersection / union : 0.0;
  }

  /**
   * Vérifie si une image correspond à au moins une image de référence
   * Retourne le meilleur match avec son score
   */
  async findBestMatch(scrapedImageBuffer, referenceImageBuffers, confidenceThreshold = null) {
    if (!this.client) {
      throw new Error('Client Google Vision non initialisé.');
    }

    const threshold = confidenceThreshold !== null ? confidenceThreshold : this.config.defaultConfidenceThreshold;
    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < referenceImageBuffers.length; i++) {
      const refBuffer = referenceImageBuffers[i];
      
      try {
        const comparison = await this.compareImages(scrapedImageBuffer, refBuffer);
        const score = comparison.similarity;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            referenceIndex: i,
            score: score,
            features: comparison
          };
        }
      } catch (error) {
        console.error(`Erreur lors de la comparaison avec l'image de référence ${i}:`, error);
        // Continuer avec les autres images
      }
    }

    // Retourner le match seulement si le score dépasse le seuil
    if (bestMatch && bestMatch.score >= threshold) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Vérifie si le service est disponible
   */
  isAvailable() {
    return this.client !== null;
  }
}

module.exports = ImageRecognitionService;







