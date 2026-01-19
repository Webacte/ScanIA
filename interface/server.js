/**
 * Serveur Express pour l'interface web ScanLeCoin
 * 
 * Fournit une interface web locale pour :
 * - Visualiser les annonces scrapées
 * - Configurer les alertes de prix
 * - Recevoir des notifications en temps réel
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

// Vérification de la configuration de la base de données
// En mode développement, on peut démarrer sans DB (mais certaines fonctionnalités seront limitées)
// Note: Si le mot de passe contient des espaces, mettez-le entre guillemets dans .env: DB_PASSWORD="mon mot de passe"
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const HAS_DB_CONFIG = !!DB_PASSWORD;

if (!HAS_DB_CONFIG) {
  console.warn('⚠️  ATTENTION: DB_PASSWORD n\'est pas défini.');
  console.warn('   Le serveur démarrera mais les fonctionnalités nécessitant la base de données ne fonctionneront pas.');
  console.warn('   Pour configurer: copiez .env.example en .env et renseignez DB_PASSWORD');
  console.warn('   Si le mot de passe contient des espaces, utilisez des guillemets: DB_PASSWORD="mon mot de passe"');
} else {
  console.log('✅ DB_PASSWORD détecté (longueur: ' + DB_PASSWORD.length + ' caractères)');
}

// Import des modules locaux
const DatabaseManager = require('./src/DatabaseManager');
// Anciens managers (désactivés - conservés pour référence)
// const AlertManager = require('./src/AlertManager');
// const PriceAnalyzer = require('./src/PriceAnalyzer');
// const AutoAlertManager = require('./src/AutoAlertManager');
const ReferenceImageManager = require('./src/ReferenceImageManager');
const RecognitionWorker = require('./src/RecognitionWorker');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuration
const PORT = process.env.INTERFACE_PORT || 3000;
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scania',
  user: process.env.DB_USER || 'postgres',
  password: DB_PASSWORD
};

// Initialiser le DatabaseManager (peut échouer si DB non configurée, mais le serveur continuera)
let dbManager;
try {
  dbManager = new DatabaseManager(DB_CONFIG);
  console.log('✅ DatabaseManager initialisé');
  
  // Tester la connexion
  if (HAS_DB_CONFIG) {
    dbManager.pool.query('SELECT NOW()').then(() => {
      console.log('✅ Connexion à la base de données réussie');
    }).catch((err) => {
      console.error('❌ Erreur de connexion à la base de données:', err.message);
      console.error('   Code:', err.code);
      if (err.code === '28P01') {
        console.error('   → Erreur d\'authentification. Vérifiez DB_USER et DB_PASSWORD dans .env');
        console.error('   → Si le mot de passe contient des espaces, utilisez des guillemets: DB_PASSWORD="mon mot de passe"');
      } else if (err.code === 'ECONNREFUSED') {
        console.error('   → Impossible de se connecter. Vérifiez que PostgreSQL est démarré et que DB_HOST/DB_PORT sont corrects');
      } else if (err.code === '3D000') {
        console.error('   → Base de données non trouvée. Vérifiez DB_NAME dans .env');
      }
    });
  }
} catch (error) {
  console.warn('⚠️  DatabaseManager non initialisé:', error.message);
  console.warn('   Le serveur continuera mais les fonctionnalités DB seront indisponibles');
}

// Initialiser les analyseurs avec le dbManager (ancien système - désactivé)
// const modelAnalyzer = new ModelAnalyzer(dbManager); // Remplacé par l'analyse SQL optimisée
// const autoAlertManager = new AutoAlertManager(dbManager); // Ancien système

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Désactivé pour le développement local
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialisation des managers pour la reconnaissance d'images
// const alertManager = new AlertManager(dbManager); // Ancien système
// const priceAnalyzer = new PriceAnalyzer(); // Ancien système
// const autoAlertManager = new AutoAlertManager(dbManager); // Ancien système
let referenceImageManager;
let recognitionWorker;

try {
  if (HAS_DB_CONFIG) {
    referenceImageManager = new ReferenceImageManager(DB_CONFIG);
    recognitionWorker = new RecognitionWorker(DB_CONFIG, {
      apiKey: process.env.GOOGLE_VISION_API_KEY,
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    console.log('✅ Managers de reconnaissance d\'images initialisés');
    
    // Tester l'accès aux tables
    referenceImageManager.getReferenceObjects().then(() => {
      console.log('✅ Tables de reconnaissance d\'images accessibles');
    }).catch((err) => {
      console.error('❌ Erreur d\'accès aux tables de reconnaissance:', err.message);
      console.error('   Code:', err.code);
      if (err.code === '42P01') {
        console.error('   → Les tables n\'existent pas. Exécutez: npm run db:init-recognition');
      }
    });
  } else {
    console.warn('⚠️  Managers de reconnaissance non initialisés: DB_PASSWORD non configuré');
  }
} catch (error) {
  console.warn('⚠️  Managers de reconnaissance non initialisés:', error.message);
  console.warn('   Le serveur continuera mais les fonctionnalités de reconnaissance seront indisponibles');
  console.warn('   Vérifiez votre configuration de base de données dans .env');
  if (error.code) {
    console.warn('   Code d\'erreur:', error.code);
  }
}

// Configuration multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, GIF ou WebP.'));
    }
  }
});

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    mode: 'image-recognition',
    db_configured: HAS_DB_CONFIG,
    db_connected: !!dbManager
  });
});

// Endpoint de test de connexion à la base de données
app.get('/api/db-test', async (req, res) => {
  if (!dbManager) {
    return res.status(503).json({ 
      error: 'DatabaseManager non initialisé',
      message: 'DB_PASSWORD n\'est pas configuré dans .env',
      config: {
        has_password: HAS_DB_CONFIG,
        db_host: DB_CONFIG.host,
        db_port: DB_CONFIG.port,
        db_name: DB_CONFIG.database,
        db_user: DB_CONFIG.user
      }
    });
  }
  
  try {
    const result = await dbManager.pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    // Vérifier si les tables de reconnaissance existent
    const tablesCheck = await dbManager.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'marketplace' 
      AND table_name IN ('reference_objects', 'reference_images', 'search_tasks', 'image_matches')
      ORDER BY table_name
    `);
    
    const existingTables = tablesCheck.rows.map(r => r.table_name);
    const requiredTables = ['reference_objects', 'reference_images', 'search_tasks', 'image_matches'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    res.json({ 
      status: 'connected',
      current_time: result.rows[0].current_time,
      pg_version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1],
      tables: {
        existing: existingTables,
        missing: missingTables,
        all_present: missingTables.length === 0
      },
      hint: missingTables.length > 0 ? 'Les tables de reconnaissance d\'images n\'existent pas. Exécutez: npm run db:init-recognition' : undefined
    });
  } catch (error) {
    console.error('❌ Erreur test DB:', error);
    res.status(500).json({ 
      error: 'Erreur de connexion',
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.code === '28P01' ? 'Erreur d\'authentification. Vérifiez DB_USER et DB_PASSWORD. Si le mot de passe contient des espaces, utilisez des guillemets dans .env' :
             error.code === 'ECONNREFUSED' ? 'Impossible de se connecter. Vérifiez que PostgreSQL est démarré' :
             error.code === '3D000' ? 'Base de données non trouvée. Vérifiez DB_NAME' :
             undefined
    });
  }
});

// ============================================
// ANCIENS ENDPOINTS - DÉSACTIVÉS
// Ces endpoints sont conservés pour référence mais ne sont plus utilisés
// ============================================

/*
// Récupérer les bonnes affaires (ancien système iPhone)
app.get('/api/good-deals', async (req, res) => {
  try {
    const { 
      minConfidence = 50,
      limit = 50,
      minPrice, 
      maxPrice,
      model,
      storage
    } = req.query;

    const goodDeals = await dbManager.getGoodDeals({
      minConfidence: parseInt(minConfidence),
      limit: parseInt(limit),
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      model: model || null,
      storage: storage || null
    });

    res.json({
      goodDeals,
      count: goodDeals.length,
      filters: {
        minConfidence: parseInt(minConfidence),
        minPrice: minPrice ? parseInt(minPrice) : null,
        maxPrice: maxPrice ? parseInt(maxPrice) : null,
        model: model || null,
        storage: storage || null
      }
    });
  } catch (error) {
    console.error('Erreur API good-deals:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les annonces analysées (toutes, pas seulement les bonnes affaires)
app.get('/api/analyzed-listings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      minPrice, 
      maxPrice, 
      model,
      storage,
      minConfidence = 30
    } = req.query;

    const offset = (page - 1) * limit;
    const listings = await dbManager.getAnalyzedListings({
      offset: parseInt(offset),
      limit: parseInt(limit),
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      model: model || null,
      storage: storage || null,
      minConfidence: parseInt(minConfidence)
    });

    res.json({
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        count: listings.length
      }
    });
  } catch (error) {
    console.error('Erreur API analyzed-listings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les annonces avec filtres (endpoint legacy pour compatibilité)
app.get('/api/listings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      minPrice, 
      maxPrice, 
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const listings = await dbManager.getListings({
      offset: parseInt(offset),
      limit: parseInt(limit),
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      search: search || null,
      sortBy,
      sortOrder: sortOrder.toUpperCase()
    });

    const total = await dbManager.getListingsCount({
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      search: search || null
    });

    res.json({
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur API listings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des bonnes affaires
app.get('/api/good-deals-stats', async (req, res) => {
  try {
    const stats = await dbManager.getGoodDealsStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur API good-deals-stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les prix de référence
app.get('/api/reference-prices', async (req, res) => {
  try {
    const referencePrices = await dbManager.getReferencePrices();
    res.json(referencePrices);
  } catch (error) {
    console.error('Erreur API reference-prices:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les annonces avec stockage spécifique (recherche filtrée)
app.get('/api/listings-with-storage', async (req, res) => {
  try {
    const { 
      storage,
      model,
      minPrice, 
      maxPrice,
      limit = 50,
      page = 1,
      minConfidence = 30
    } = req.query;

    const offset = (page - 1) * limit;
    
    const listings = await dbManager.getListingsWithStorage({
      storage: storage || null,
      model: model || null,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      limit: parseInt(limit),
      offset: parseInt(offset),
      minConfidence: parseInt(minConfidence)
    });

    res.json({
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        count: listings.length
      },
      filters: {
        storage: storage || null,
        model: model || null,
        minPrice: minPrice ? parseInt(minPrice) : null,
        maxPrice: maxPrice ? parseInt(maxPrice) : null,
        minConfidence: parseInt(minConfidence)
      },
      message: 'Annonces avec stockage garanti'
    });
  } catch (error) {
    console.error('Erreur API listings-with-storage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques par stockage
app.get('/api/storage-stats', async (req, res) => {
  try {
    const stats = await dbManager.getStorageStats();
    res.json({
      storageStats: stats,
      totalStorages: stats.length,
      message: 'Statistiques par capacité de stockage'
    });
  } catch (error) {
    console.error('Erreur API storage-stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les annonces avec filtres avancés (toutes les caractéristiques)
app.get('/api/listings-filtered', async (req, res) => {
  try {
    const { 
      model,
      storage,
      color,
      condition,
      minPrice, 
      maxPrice,
      limit = 50,
      page = 1,
      minConfidence = 30,
      excludeMultipleDevices = 'true',
      excludeForParts = 'true'
    } = req.query;

    const offset = (page - 1) * limit;
    
    const listings = await dbManager.getListingsWithFilters({
      model: model || null,
      storage: storage || null,
      color: color || null,
      condition: condition || null,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      limit: parseInt(limit),
      offset: parseInt(offset),
      minConfidence: parseInt(minConfidence),
      excludeMultipleDevices: excludeMultipleDevices === 'true',
      excludeForParts: excludeForParts === 'true'
    });

    res.json({
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        count: listings.length
      },
      filters: {
        model: model || null,
        storage: storage || null,
        color: color || null,
        condition: condition || null,
        minPrice: minPrice ? parseInt(minPrice) : null,
        maxPrice: maxPrice ? parseInt(maxPrice) : null,
        minConfidence: parseInt(minConfidence),
        excludeMultipleDevices: excludeMultipleDevices === 'true',
        excludeForParts: excludeForParts === 'true'
      },
      message: 'Annonces filtrées par toutes les caractéristiques'
    });
  } catch (error) {
    console.error('Erreur API listings-filtered:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques par caractéristiques
app.get('/api/characteristics-stats', async (req, res) => {
  try {
    const stats = await dbManager.getCharacteristicsStats();
    res.json({
      characteristics: stats,
      message: 'Statistiques par toutes les caractéristiques'
    });
  } catch (error) {
    console.error('Erreur API characteristics-stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques (endpoint legacy pour compatibilité)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await dbManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur API stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les alertes configurées
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await alertManager.getAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Erreur API alerts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle alerte
app.post('/api/alerts', async (req, res) => {
  try {
    const { name, keywords, maxPrice, minPrice, categories } = req.body;
    
    if (!name || !keywords) {
      return res.status(400).json({ error: 'Nom et mots-clés requis' });
    }

    const alert = await alertManager.createAlert({
      name,
      keywords: Array.isArray(keywords) ? keywords : [keywords],
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      minPrice: minPrice ? parseInt(minPrice) : null,
      categories: categories || []
    });

    res.json(alert);
  } catch (error) {
    console.error('Erreur création alerte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une alerte
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await alertManager.deleteAlert(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression alerte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Analyser les prix pour détecter les bonnes affaires
app.get('/api/analyze-prices', async (req, res) => {
  try {
    const { keywords, limit = 50 } = req.query;
    
    if (!keywords) {
      return res.status(400).json({ error: 'Mots-clés requis' });
    }

    const keywordList = Array.isArray(keywords) ? keywords : [keywords];
    const goodDeals = await priceAnalyzer.findGoodDeals(keywordList, parseInt(limit));
    
    res.json(goodDeals);
  } catch (error) {
    console.error('Erreur analyse prix:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer l'analyse des modèles existante
app.get('/api/analyze-models', async (req, res) => {
  try {
    console.log('📊 Récupération de l\'analyse des modèles (système optimisé)...');
    
    // Utiliser le nouveau système optimisé
    const goodDeals = await dbManager.getGoodDeals({
      minConfidence: 30,
      limit: 100
    });
    
    res.json({
      goodDeals,
      count: goodDeals.length,
      message: 'Analyse optimisée avec PostgreSQL'
    });
  } catch (error) {
    console.error('Erreur récupération analyse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Analyser les modèles et créer des alertes automatiques
app.post('/api/analyze-models', async (req, res) => {
  try {
    console.log('🔍 Démarrage de l\'analyse des modèles...');
    const autoAlerts = await autoAlertManager.analyzeAndCreateAlerts();
    
    res.json({
      success: true,
      alertsCreated: autoAlerts.length,
      alerts: autoAlerts
    });
  } catch (error) {
    console.error('Erreur analyse modèles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les alertes automatiques
app.get('/api/auto-alerts', async (req, res) => {
  try {
    const alerts = await autoAlertManager.getAutoAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Erreur récupération alertes auto:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer le rapport d'analyse détaillé
app.get('/api/analysis-report', async (req, res) => {
  try {
    const report = await autoAlertManager.generateAnalysisReport();
    res.json(report);
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Analyser une annonce spécifique (nouveau système optimisé)
app.post('/api/analyze-listing', async (req, res) => {
  try {
    const { listing } = req.body;
    
    if (!listing || !listing.title) {
      return res.status(400).json({ error: 'Annonce avec titre requis' });
    }

    // Utiliser les fonctions SQL pour analyser l'annonce
    const client = await dbManager.pool.connect();
    
    try {
      const modelResult = await client.query(`
        SELECT marketplace.extract_iphone_model($1) as model
      `, [listing.title]);
      
      const storageResult = await client.query(`
        SELECT marketplace.extract_storage($1) as storage
      `, [listing.title]);
      
      const model = modelResult.rows[0].model;
      const storage = storageResult.rows[0].storage;
      
      const analysis = {
        model: model,
        storage: storage,
        confidence: (model ? 30 : 0) + (storage ? 25 : 0),
        isComplete: !!(model && storage),
        message: 'Analyse optimisée avec PostgreSQL'
      };
      
      res.json(analysis);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erreur analyse annonce:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une alerte automatique
app.delete('/api/auto-alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await autoAlertManager.deleteAutoAlert(id);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Alerte non trouvée' });
    }
  } catch (error) {
    console.error('Erreur suppression alerte auto:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les patterns de détection
app.get('/api/patterns', async (req, res) => {
  try {
    const patterns = await dbManager.getDetectionPatterns();
    res.json(patterns);
  } catch (error) {
    console.error('Erreur récupération patterns:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un pattern de détection
app.put('/api/patterns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedPattern = await dbManager.updateDetectionPattern(parseInt(id), updates);
    res.json(updatedPattern);
  } catch (error) {
    console.error('Erreur mise à jour pattern:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un nouveau pattern de détection (ancien système)
app.post('/api/patterns', async (req, res) => {
  try {
    const { category, name, pattern, priority = 0 } = req.body;
    
    if (!category || !name || !pattern) {
      return res.status(400).json({ error: 'Catégorie, nom et pattern requis' });
    }

    const newPattern = await dbManager.addDetectionPattern(category, name, pattern, priority);
    res.json(newPattern);
  } catch (error) {
    console.error('Erreur ajout pattern:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
*/

// ============================================
// API RECONNAISSANCE D'IMAGES
// ============================================

// Récupérer tous les objets de référence
app.get('/api/reference-objects', async (req, res) => {
  try {
    if (!referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée. Veuillez configurer DB_PASSWORD dans .env'
      });
    }
    const { active_only } = req.query;
    const objects = await referenceImageManager.getReferenceObjects(active_only === 'true');
    res.json(objects);
  } catch (error) {
    console.error('❌ Erreur récupération objets de référence:', error);
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Detail:', error.detail);
    console.error('   Stack:', error.stack);
    
    let hint = undefined;
    if (error.code === '42P01') {
      hint = 'Les tables de la base de données n\'existent pas. Exécutez: npm run db:init-recognition';
    } else if (error.code === '28P01') {
      hint = 'Erreur d\'authentification. Vérifiez DB_USER et DB_PASSWORD dans .env. Si le mot de passe contient des espaces, utilisez des guillemets.';
    } else if (error.code === 'ECONNREFUSED') {
      hint = 'Impossible de se connecter à PostgreSQL. Vérifiez que PostgreSQL est démarré et que DB_HOST/DB_PORT sont corrects.';
    } else if (error.code === '3D000') {
      hint = 'Base de données non trouvée. Vérifiez DB_NAME dans .env ou créez la base de données.';
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message || 'Erreur lors de la récupération des objets',
      code: error.code,
      detail: error.detail,
      hint: hint
    });
  }
});

// Récupérer un objet de référence par ID
app.get('/api/reference-objects/:id', async (req, res) => {
  try {
    if (!referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    const object = await referenceImageManager.getReferenceObject(parseInt(id));
    if (!object) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }
    
    // Récupérer aussi les images
    const images = await referenceImageManager.getReferenceImages(parseInt(id));
    res.json({ ...object, images });
  } catch (error) {
    console.error('Erreur récupération objet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouvel objet de référence
app.post('/api/reference-objects', async (req, res) => {
  try {
    if (!referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { name, description, confidence_threshold } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nom requis' });
    }

    const object = await referenceImageManager.createReferenceObject(
      name,
      description || null,
      parseFloat(confidence_threshold) || 70.0
    );
    res.json(object);
  } catch (error) {
    console.error('❌ Erreur création objet:', error);
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Detail:', error.detail);
    console.error('   Stack:', error.stack);
    
    let hint = undefined;
    if (error.code === '42P01') {
      hint = 'Les tables de la base de données n\'existent pas. Exécutez: npm run db:init-recognition';
    } else if (error.code === '28P01') {
      hint = 'Erreur d\'authentification à la base de données. Vérifiez DB_PASSWORD dans .env. Si le mot de passe contient des espaces, utilisez des guillemets: DB_PASSWORD="mon mot de passe"';
    } else if (error.code === 'ECONNREFUSED') {
      hint = 'Impossible de se connecter à la base de données. Vérifiez que PostgreSQL est démarré et que DB_HOST/DB_PORT sont corrects';
    } else if (error.code === '3D000') {
      hint = 'Base de données non trouvée. Vérifiez DB_NAME dans .env ou créez la base de données';
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message || 'Erreur lors de la création de l\'objet',
      code: error.code,
      detail: error.detail,
      hint: hint
    });
  }
});

// Mettre à jour un objet de référence
app.put('/api/reference-objects/:id', async (req, res) => {
  try {
    if (!referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    const updates = req.body;
    
    const updated = await referenceImageManager.updateReferenceObject(parseInt(id), updates);
    if (!updated) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Erreur mise à jour objet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un objet de référence
app.delete('/api/reference-objects/:id', async (req, res) => {
  try {
    if (!referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    const deleted = await referenceImageManager.deleteReferenceObject(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression objet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Upload des photos de référence pour un objet
app.post('/api/reference-objects/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const savedImages = [];
    for (const file of req.files) {
      const saved = await referenceImageManager.saveReferenceImage(
        parseInt(id),
        file.buffer,
        file.originalname,
        file.mimetype
      );
      savedImages.push(saved);
    }

    res.json({ success: true, images: savedImages });
  } catch (error) {
    console.error('Erreur upload images:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une photo de référence
app.delete('/api/reference-images/:id', async (req, res) => {
  try {
    if (!referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    const deleted = await referenceImageManager.deleteReferenceImage(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Servir une image de référence
app.get('/api/reference-images/:id/file', async (req, res) => {
  try {
    if (!dbManager || !referenceImageManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    const client = await dbManager.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM marketplace.reference_images WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Image non trouvée' });
      }

      const image = result.rows[0];
      const imageBuffer = await referenceImageManager.readReferenceImage(image.file_path);
      
      res.setHeader('Content-Type', image.mime_type || 'image/jpeg');
      res.send(imageBuffer);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur récupération image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle tâche de recherche
app.post('/api/search-tasks', async (req, res) => {
  try {
    if (!dbManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée. Veuillez configurer DB_PASSWORD dans .env'
      });
    }
    const { search_url, object_ids } = req.body;
    
    if (!search_url || !object_ids || !Array.isArray(object_ids) || object_ids.length === 0) {
      return res.status(400).json({ error: 'URL de recherche et objets de référence requis' });
    }

    const client = await dbManager.pool.connect();
    try {
      // Créer la tâche
      const taskResult = await client.query(
        `INSERT INTO marketplace.search_tasks (search_url, status)
         VALUES ($1, 'pending')
         RETURNING *`,
        [search_url]
      );
      const task = taskResult.rows[0];

      // Associer les objets de référence
      for (const objectId of object_ids) {
        await client.query(
          `INSERT INTO marketplace.search_task_objects (task_id, object_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [task.id, objectId]
        );
      }

      // Démarrer le traitement en arrière-plan
      if (recognitionWorker) {
        recognitionWorker.processSearchTask(task.id).catch(error => {
          console.error('Erreur lors du traitement de la tâche:', error);
        });
      } else {
        console.warn('⚠️  RecognitionWorker non disponible, la tâche ne sera pas traitée automatiquement');
      }

      res.json(task);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur création tâche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer toutes les tâches
app.get('/api/search-tasks', async (req, res) => {
  try {
    if (!dbManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const client = await dbManager.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM marketplace.search_tasks ORDER BY created_at DESC LIMIT 50'
      );
      res.json(result.rows);
    } finally {
      client.release();
    }
    } catch (error) {
      console.error('❌ Erreur récupération tâches:', error);
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);
      console.error('   Detail:', error.detail);
      console.error('   Stack:', error.stack);
      
      let hint = undefined;
      if (error.code === '42P01') {
        hint = 'Les tables de la base de données n\'existent pas. Exécutez: npm run db:init-recognition';
      } else if (error.code === '28P01') {
        hint = 'Erreur d\'authentification. Vérifiez DB_USER et DB_PASSWORD dans .env. Si le mot de passe contient des espaces, utilisez des guillemets.';
      } else if (error.code === 'ECONNREFUSED') {
        hint = 'Impossible de se connecter à PostgreSQL. Vérifiez que PostgreSQL est démarré et que DB_HOST/DB_PORT sont corrects.';
      } else if (error.code === '3D000') {
        hint = 'Base de données non trouvée. Vérifiez DB_NAME dans .env ou créez la base de données.';
      }
      
      res.status(500).json({ 
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération des tâches',
        code: error.code,
        detail: error.detail,
        hint: hint
      });
    }
});

// Récupérer une tâche par ID avec ses résultats
app.get('/api/search-tasks/:id', async (req, res) => {
  try {
    if (!dbManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    const client = await dbManager.pool.connect();
    try {
      const taskResult = await client.query(
        'SELECT * FROM marketplace.search_tasks WHERE id = $1',
        [id]
      );
      
      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Tâche non trouvée' });
      }

      const task = taskResult.rows[0];

      // Récupérer les objets associés
      const objectsResult = await client.query(
        `SELECT ro.* FROM marketplace.reference_objects ro
         JOIN marketplace.search_task_objects sto ON ro.id = sto.object_id
         WHERE sto.task_id = $1`,
        [id]
      );

      // Récupérer les matches
      const matchesResult = await client.query(
        `SELECT 
           im.*,
           l.title as listing_title,
           l.url as listing_url,
           l.price_cents,
           ro.name as object_name
         FROM marketplace.image_matches im
         JOIN marketplace.listings l ON im.listing_id = l.id
         JOIN marketplace.reference_objects ro ON im.object_id = ro.id
         WHERE im.task_id = $1
         ORDER BY im.confidence_score DESC`,
        [id]
      );

      res.json({
        ...task,
        reference_objects: objectsResult.rows,
        matches: matchesResult.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur récupération tâche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une tâche de recherche
app.delete('/api/search-tasks/:id', async (req, res) => {
  try {
    if (!dbManager) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données n\'est pas configurée'
      });
    }
    const { id } = req.params;
    const client = await dbManager.pool.connect();
    try {
      // Vérifier que la tâche existe
      const taskResult = await client.query(
        'SELECT * FROM marketplace.search_tasks WHERE id = $1',
        [id]
      );
      
      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Tâche non trouvée' });
      }

      // Supprimer la tâche (les relations seront supprimées en cascade)
      await client.query(
        'DELETE FROM marketplace.search_tasks WHERE id = $1',
        [id]
      );

      res.json({ success: true, message: 'Tâche supprimée' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur suppression tâche:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message,
      code: error.code
    });
  }
});

// Lancer la reconnaissance sur une annonce spécifique
app.post('/api/recognize', async (req, res) => {
  try {
    if (!dbManager || !recognitionWorker) {
      return res.status(503).json({ 
        error: 'Service indisponible',
        message: 'La base de données ou le service de reconnaissance n\'est pas configuré'
      });
    }
    const { listing_id, object_ids } = req.body;
    
    if (!listing_id || !object_ids || !Array.isArray(object_ids)) {
      return res.status(400).json({ error: 'listing_id et object_ids requis' });
    }

    // Récupérer l'annonce
    const client = await dbManager.pool.connect();
    try {
      const listingResult = await client.query(
        'SELECT * FROM marketplace.listings WHERE id = $1',
        [listing_id]
      );
      
      if (listingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Annonce non trouvée' });
      }

      const listing = listingResult.rows[0];
      const referenceObjects = await client.query(
        `SELECT * FROM marketplace.reference_objects 
         WHERE id = ANY($1::bigint[]) AND is_active = true`,
        [object_ids]
      );

      // Traiter l'annonce
      const matches = await recognitionWorker.processListing(
        listing,
        referenceObjects.rows,
        null // pas de task_id pour une reconnaissance manuelle
      );

      res.json({ success: true, matches });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur reconnaissance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route principale - servir l'interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket pour les notifications en temps réel
io.on('connection', (socket) => {
  console.log('👤 Client connecté:', socket.id);

  socket.on('join-alerts', () => {
    socket.join('alerts');
    console.log('🔔 Client rejoint le canal des alertes');
  });

  socket.on('join-recognition', (taskId) => {
    socket.join(`recognition-${taskId}`);
    console.log(`🔍 Client rejoint le canal de reconnaissance pour la tâche ${taskId}`);
  });

  socket.on('disconnect', () => {
    console.log('👋 Client déconnecté:', socket.id);
  });
});

// Fonction pour envoyer des notifications via WebSocket
function sendAlert(alertData) {
  io.to('alerts').emit('new-alert', {
    type: 'good-deal',
    data: alertData,
    timestamp: new Date().toISOString()
  });
}

// Fonction pour envoyer des notifications de reconnaissance
function sendRecognitionNotification(taskId, notification) {
  io.to(`recognition-${taskId}`).emit('recognition-update', {
    taskId: taskId,
    ...notification,
    timestamp: new Date().toISOString()
  });
}

// Exporter la fonction pour le RecognitionWorker (si initialisé)
if (recognitionWorker) {
  recognitionWorker.setNotificationCallback((taskId, notification) => {
    sendRecognitionNotification(taskId, notification);
  });
}

// Démarrer le serveur
server.listen(PORT, () => {
  console.log('🌐 Interface ScanLeCoin démarrée');
  console.log(`📱 URL: http://localhost:${PORT}`);
  console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log('=' .repeat(50));
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée:', reason);
});

// Export pour les tests
module.exports = { app, server, io, sendAlert };
