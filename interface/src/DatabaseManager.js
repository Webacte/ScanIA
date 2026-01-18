/**
 * Gestionnaire de base de données pour l'interface web
 * 
 * Fournit des méthodes optimisées pour l'affichage des données
 * dans l'interface utilisateur
 */

const { Pool } = require('pg');

class DatabaseManager {
  constructor(config) {
    this.pool = new Pool(config);
  }

  /**
   * Récupère les annonces avec filtres et pagination
   */
  async getListings(options = {}) {
    const {
      offset = 0,
      limit = 20,
      minPrice = null,
      maxPrice = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT 
          l.id,
          l.external_id,
          l.title,
          l.description,
          l.price_cents,
          l.currency,
          l.url,
          l.has_shipping,
          l.created_at,
          l.raw_payload,
          loc.label as location,
          s.name as source_name
        FROM marketplace.listings l
        LEFT JOIN marketplace.locations loc ON l.location_id = loc.id
        LEFT JOIN marketplace.sources s ON l.source_id = s.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      // Filtres
      if (minPrice !== null) {
        query += ` AND l.price_cents >= $${paramIndex}`;
        params.push(minPrice * 100); // Convertir en centimes
        paramIndex++;
      }

      if (maxPrice !== null) {
        query += ` AND l.price_cents <= $${paramIndex}`;
        params.push(maxPrice * 100); // Convertir en centimes
        paramIndex++;
      }

      if (search) {
        query += ` AND (l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Tri
      const validSortColumns = ['created_at', 'price_cents', 'title'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY l.${sortColumn} ${sortDirection}`;
      
      // Pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);
      
      // Convertir les prix de centimes en euros
      return result.rows.map(row => ({
        ...row,
        price_cents: row.price_cents,
        price_euros: row.price_cents / 100
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Compte le nombre total d'annonces avec filtres
   */
  async getListingsCount(options = {}) {
    const { minPrice = null, maxPrice = null, search = null } = options;

    const client = await this.pool.connect();
    
    try {
      let query = 'SELECT COUNT(*) as count FROM marketplace.listings l WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (minPrice !== null) {
        query += ` AND l.price_cents >= $${paramIndex}`;
        params.push(minPrice * 100);
        paramIndex++;
      }

      if (maxPrice !== null) {
        query += ` AND l.price_cents <= $${paramIndex}`;
        params.push(maxPrice * 100);
        paramIndex++;
      }

      if (search) {
        query += ` AND (l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const result = await client.query(query, params);
      return parseInt(result.rows[0].count);
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les statistiques générales
   */
  async getStats() {
    const client = await this.pool.connect();
    
    try {
      // Statistiques générales
      const totalListings = await client.query('SELECT COUNT(*) as count FROM marketplace.listings');
      const totalSellers = await client.query('SELECT COUNT(*) as count FROM marketplace.sellers');
      const totalLocations = await client.query('SELECT COUNT(*) as count FROM marketplace.locations');
      
      // Statistiques par prix
      const priceStats = await client.query(`
        SELECT 
          MIN(price_cents) as min_price,
          MAX(price_cents) as max_price,
          AVG(price_cents) as avg_price,
          COUNT(*) as total_count
        FROM marketplace.listings 
        WHERE price_cents > 0
      `);

      // Annonces récentes (dernières 24h)
      const recentListings = await client.query(`
        SELECT COUNT(*) as count 
        FROM marketplace.listings 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);

      // Top 5 des localisations
      const topLocations = await client.query(`
        SELECT loc.label, COUNT(l.id) as count
        FROM marketplace.locations loc
        LEFT JOIN marketplace.listings l ON loc.id = l.location_id
        GROUP BY loc.id, loc.label
        ORDER BY count DESC
        LIMIT 5
      `);

      return {
        totalListings: parseInt(totalListings.rows[0].count),
        totalSellers: parseInt(totalSellers.rows[0].count),
        totalLocations: parseInt(totalLocations.rows[0].count),
        recentListings: parseInt(recentListings.rows[0].count),
        priceStats: {
          min: priceStats.rows[0].min_price ? priceStats.rows[0].min_price / 100 : 0,
          max: priceStats.rows[0].max_price ? priceStats.rows[0].max_price / 100 : 0,
          average: priceStats.rows[0].avg_price ? Math.round(priceStats.rows[0].avg_price / 100) : 0,
          total: parseInt(priceStats.rows[0].total_count)
        },
        topLocations: topLocations.rows
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les annonces par mots-clés pour l'analyse de prix
   */
  async getListingsByKeywords(keywords, limit = 50) {
    const client = await this.pool.connect();
    
    try {
      const keywordConditions = keywords.map((_, index) => 
        `(l.title ILIKE $${index + 1} OR l.description ILIKE $${index + 1})`
      ).join(' OR ');

      const params = keywords.map(keyword => `%${keyword}%`);

      const query = `
        SELECT 
          l.id,
          l.external_id,
          l.title,
          l.description,
          l.price_cents,
          l.currency,
          l.url,
          l.has_shipping,
          l.created_at,
          l.raw_payload,
          loc.label as location
        FROM marketplace.listings l
        LEFT JOIN marketplace.locations loc ON l.location_id = loc.id
        WHERE (${keywordConditions})
        AND l.price_cents > 0
        ORDER BY l.price_cents ASC
        LIMIT $${params.length + 1}
      `;

      params.push(limit);
      const result = await client.query(query, params);
      
      // Convertir les prix de centimes en euros et formater les données
      return result.rows.map(row => ({
        ...row,
        price_cents: row.price_cents,
        price_euros: row.price_cents / 100,
        price: row.price_cents / 100, // Alias pour compatibilité
        location: row.location
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère tous les patterns de détection organisés par catégorie
   */
  async getDetectionPatterns() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          pc.name as category,
          dp.name,
          dp.pattern,
          dp.priority,
          dp.is_active
        FROM marketplace.detection_patterns dp
        JOIN marketplace.pattern_categories pc ON dp.category_id = pc.id
        WHERE dp.is_active = true
        ORDER BY pc.name, dp.priority DESC
      `;

      const result = await client.query(query);
      
      // Organiser les patterns par catégorie
      const patterns = {
        models: {},
        storage: {},
        colors: {},
        conditions: {}
      };

      result.rows.forEach(row => {
        if (patterns[row.category]) {
          patterns[row.category][row.name] = row.pattern; // Garder comme string, sera converti côté client
        }
      });

      return patterns;
      
    } finally {
      client.release();
    }
  }

  /**
   * Met à jour un pattern de détection
   */
  async updateDetectionPattern(id, updates) {
    const client = await this.pool.connect();
    
    try {
      const allowedFields = ['name', 'pattern', 'priority', 'is_active'];
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(field => {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = $${paramIndex}`);
          params.push(updates[field]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('Aucun champ valide à mettre à jour');
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(id);

      const query = `
        UPDATE marketplace.detection_patterns 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, params);
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  /**
   * Ajoute un nouveau pattern de détection
   */
  async addDetectionPattern(categoryName, name, pattern, priority = 0) {
    const client = await this.pool.connect();
    
    try {
      // Récupérer l'ID de la catégorie
      const categoryQuery = 'SELECT id FROM marketplace.pattern_categories WHERE name = $1';
      const categoryResult = await client.query(categoryQuery, [categoryName]);
      
      if (categoryResult.rows.length === 0) {
        throw new Error(`Catégorie '${categoryName}' non trouvée`);
      }

      const categoryId = categoryResult.rows[0].id;

      const insertQuery = `
        INSERT INTO marketplace.detection_patterns (category_id, name, pattern, priority)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [categoryId, name, pattern, priority]);
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les bonnes affaires analysées directement depuis PostgreSQL (version simplifiée)
   */
  async getGoodDeals(options = {}) {
    const {
      minConfidence = 50,
      limit = 50,
      minPrice = null,
      maxPrice = null,
      model = null,
      storage = null
    } = options;

    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT 
          id, title, price_euros, url, location, created_at,
          detected_model, detected_storage, confidence_score
        FROM marketplace.analyzed_listings_simple
        WHERE detected_model IS NOT NULL 
          AND detected_storage IS NOT NULL 
          AND confidence_score >= $1
          AND NOT is_multiple_devices
          AND NOT is_for_parts_only
      `;
      
      const params = [minConfidence];
      let paramIndex = 2;

      // Filtres additionnels
      if (minPrice !== null) {
        query += ` AND price_euros >= $${paramIndex}`;
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice !== null) {
        query += ` AND price_euros <= $${paramIndex}`;
        params.push(maxPrice);
        paramIndex++;
      }

      if (model) {
        query += ` AND detected_model = $${paramIndex}`;
        params.push(model);
        paramIndex++;
      }

      if (storage) {
        query += ` AND detected_storage = $${paramIndex}`;
        params.push(storage);
        paramIndex++;
      }

      query += ` ORDER BY confidence_score DESC, price_euros ASC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        price: row.price_euros,
        price_euros: row.price_euros,
        url: row.url,
        location: row.location,
        created_at: row.created_at,
        model: row.detected_model,
        storage: row.detected_storage,
        confidence: row.confidence_score,
        is_good_deal: true
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les statistiques des bonnes affaires
   */
  async getGoodDealsStats() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        WITH good_deals AS (
          SELECT * FROM marketplace.get_good_deals(15, 30, 1000)
        ),
        stats AS (
          SELECT 
            COUNT(*) as total_good_deals,
            AVG(savings_percent) as avg_savings_percent,
            MAX(savings_percent) as max_savings_percent,
            MIN(savings_percent) as min_savings_percent,
            AVG(deal_score) as avg_deal_score,
            COUNT(DISTINCT detected_model) as unique_models,
            COUNT(DISTINCT detected_storage) as unique_storages
          FROM good_deals
        ),
        model_stats AS (
          SELECT 
            detected_model,
            COUNT(*) as count,
            AVG(savings_percent) as avg_savings
          FROM good_deals
          GROUP BY detected_model
          ORDER BY count DESC
          LIMIT 5
        )
        SELECT 
          s.*,
          json_agg(
            json_build_object(
              'model', ms.detected_model,
              'count', ms.count,
              'avg_savings', ROUND(ms.avg_savings)
            )
          ) as top_models
        FROM stats s
        CROSS JOIN model_stats ms
        GROUP BY s.total_good_deals, s.avg_savings_percent, s.max_savings_percent, 
                 s.min_savings_percent, s.avg_deal_score, s.unique_models, s.unique_storages
      `;

      const result = await client.query(query);
      
      if (result.rows.length > 0) {
        const stats = result.rows[0];
        return {
          total_good_deals: parseInt(stats.total_good_deals),
          avg_savings_percent: Math.round(stats.avg_savings_percent),
          max_savings_percent: parseInt(stats.max_savings_percent),
          min_savings_percent: parseInt(stats.min_savings_percent),
          avg_deal_score: Math.round(stats.avg_deal_score),
          unique_models: parseInt(stats.unique_models),
          unique_storages: parseInt(stats.unique_storages),
          top_models: stats.top_models
        };
      }
      
      return {
        total_good_deals: 0,
        avg_savings_percent: 0,
        max_savings_percent: 0,
        min_savings_percent: 0,
        avg_deal_score: 0,
        unique_models: 0,
        unique_storages: 0,
        top_models: []
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les prix de référence calculés
   */
  async getReferencePrices() {
    const client = await this.pool.connect();
    
    try {
      const query = `SELECT * FROM marketplace.calculate_reference_prices()`;
      const result = await client.query(query);
      
      // Organiser les prix par modèle et stockage
      const referencePrices = {};
      
      result.rows.forEach(row => {
        if (!referencePrices[row.model_name]) {
          referencePrices[row.model_name] = {};
        }
        referencePrices[row.model_name][row.storage_name] = {
          price: parseFloat(row.reference_price),
          sample_count: parseInt(row.sample_count)
        };
      });
      
      return referencePrices;
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les annonces analysées (toutes, pas seulement les bonnes affaires) - version simplifiée
   */
  async getAnalyzedListings(options = {}) {
    const {
      limit = 100,
      offset = 0,
      minConfidence = 30,
      model = null,
      storage = null,
      minPrice = null,
      maxPrice = null
    } = options;

    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT 
          id, title, price_euros, url, location, created_at,
          detected_model, detected_storage, confidence_score,
          is_multiple_devices, is_for_parts_only
        FROM marketplace.analyzed_listings_simple
        WHERE confidence_score >= $1
        AND NOT is_multiple_devices
        AND NOT is_for_parts_only
      `;
      
      const params = [minConfidence];
      let paramIndex = 2;

      // Filtres
      if (model) {
        query += ` AND detected_model = $${paramIndex}`;
        params.push(model);
        paramIndex++;
      }

      if (storage) {
        query += ` AND detected_storage = $${paramIndex}`;
        params.push(storage);
        paramIndex++;
      }

      if (minPrice !== null) {
        query += ` AND price_euros >= $${paramIndex}`;
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice !== null) {
        query += ` AND price_euros <= $${paramIndex}`;
        params.push(maxPrice);
        paramIndex++;
      }

      query += ` ORDER BY confidence_score DESC, created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        price: row.price_euros,
        price_euros: row.price_euros,
        url: row.url,
        location: row.location,
        created_at: row.created_at,
        model: row.detected_model,
        storage: row.detected_storage,
        confidence: row.confidence_score,
        is_multiple_devices: row.is_multiple_devices,
        is_for_parts_only: row.is_for_parts_only
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les annonces avec stockage spécifique (recherche filtrée)
   */
  async getListingsWithStorage(options = {}) {
    const {
      storage = null,
      model = null,
      minPrice = null,
      maxPrice = null,
      limit = 50,
      offset = 0,
      minConfidence = 30
    } = options;

    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT 
          id, title, price_euros, url, location, created_at,
          detected_model, detected_storage, confidence_score
        FROM marketplace.listings_with_storage
        WHERE confidence_score >= $1
      `;
      
      const params = [minConfidence];
      let paramIndex = 2;

      // Filtres obligatoires
      if (storage) {
        query += ` AND detected_storage = $${paramIndex}`;
        params.push(storage);
        paramIndex++;
      }

      if (model) {
        query += ` AND detected_model = $${paramIndex}`;
        params.push(model);
        paramIndex++;
      }

      if (minPrice !== null) {
        query += ` AND price_euros >= $${paramIndex}`;
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice !== null) {
        query += ` AND price_euros <= $${paramIndex}`;
        params.push(maxPrice);
        paramIndex++;
      }

      query += ` ORDER BY confidence_score DESC, price_euros ASC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        price: row.price_euros,
        price_euros: row.price_euros,
        url: row.url,
        location: row.location,
        created_at: row.created_at,
        model: row.detected_model,
        storage: row.detected_storage,
        confidence: row.confidence_score,
        hasStorage: true // Garantie que toutes les annonces ont un stockage
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les statistiques par stockage
   */
  async getStorageStats() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          detected_storage,
          COUNT(*) as count,
          AVG(price_euros) as avg_price,
          MIN(price_euros) as min_price,
          MAX(price_euros) as max_price
        FROM marketplace.listings_with_storage
        WHERE detected_storage IS NOT NULL
        GROUP BY detected_storage
        ORDER BY count DESC
      `;

      const result = await client.query(query);
      
      return result.rows.map(row => ({
        storage: row.detected_storage,
        count: parseInt(row.count),
        avg_price: Math.round(row.avg_price),
        min_price: Math.round(row.min_price),
        max_price: Math.round(row.max_price)
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les annonces avec filtres avancés (toutes les caractéristiques)
   */
  async getListingsWithFilters(options = {}) {
    const {
      model = null,
      storage = null,
      color = null,
      condition = null,
      minPrice = null,
      maxPrice = null,
      limit = 50,
      offset = 0,
      minConfidence = 30,
      excludeMultipleDevices = true,
      excludeForParts = true
    } = options;

    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT 
          id, title, price_euros, url, location, created_at,
          detected_model, detected_storage, detected_color, detected_condition,
          confidence_score, is_multiple_devices, is_for_parts_only
        FROM marketplace.listings_with_characteristics
        WHERE confidence_score >= $1
      `;
      
      const params = [minConfidence];
      let paramIndex = 2;

      // Filtres par caractéristiques
      if (model) {
        query += ` AND detected_model = $${paramIndex}`;
        params.push(model);
        paramIndex++;
      }

      if (storage) {
        query += ` AND detected_storage = $${paramIndex}`;
        params.push(storage);
        paramIndex++;
      }

      if (color) {
        query += ` AND detected_color = $${paramIndex}`;
        params.push(color);
        paramIndex++;
      }

      if (condition) {
        query += ` AND detected_condition = $${paramIndex}`;
        params.push(condition);
        paramIndex++;
      }

      // Filtres de prix
      if (minPrice !== null) {
        query += ` AND price_euros >= $${paramIndex}`;
        params.push(minPrice);
        paramIndex++;
      }

      if (maxPrice !== null) {
        query += ` AND price_euros <= $${paramIndex}`;
        params.push(maxPrice);
        paramIndex++;
      }

      // Filtres d'exclusion
      if (excludeMultipleDevices) {
        query += ` AND NOT is_multiple_devices`;
      }

      if (excludeForParts) {
        query += ` AND NOT is_for_parts_only`;
      }

      query += ` ORDER BY confidence_score DESC, price_euros ASC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        price: row.price_euros,
        price_euros: row.price_euros,
        url: row.url,
        location: row.location,
        created_at: row.created_at,
        model: row.detected_model,
        storage: row.detected_storage,
        color: row.detected_color,
        condition: row.detected_condition,
        confidence: row.confidence_score,
        is_multiple_devices: row.is_multiple_devices,
        is_for_parts_only: row.is_for_parts_only
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les statistiques par caractéristique
   */
  async getCharacteristicsStats() {
    const client = await this.pool.connect();
    
    try {
      // Statistiques par modèle
      const modelStats = await client.query(`
        SELECT 
          detected_model,
          COUNT(*) as count,
          AVG(price_euros) as avg_price,
          MIN(price_euros) as min_price,
          MAX(price_euros) as max_price
        FROM marketplace.listings_with_characteristics
        WHERE detected_model IS NOT NULL
        GROUP BY detected_model
        ORDER BY count DESC
        LIMIT 10
      `);

      // Statistiques par stockage
      const storageStats = await client.query(`
        SELECT 
          detected_storage,
          COUNT(*) as count,
          AVG(price_euros) as avg_price,
          MIN(price_euros) as min_price,
          MAX(price_euros) as max_price
        FROM marketplace.listings_with_characteristics
        WHERE detected_storage IS NOT NULL
        GROUP BY detected_storage
        ORDER BY count DESC
      `);

      // Statistiques par couleur
      const colorStats = await client.query(`
        SELECT 
          detected_color,
          COUNT(*) as count,
          AVG(price_euros) as avg_price
        FROM marketplace.listings_with_characteristics
        WHERE detected_color IS NOT NULL
        GROUP BY detected_color
        ORDER BY count DESC
      `);

      // Statistiques par état
      const conditionStats = await client.query(`
        SELECT 
          detected_condition,
          COUNT(*) as count,
          AVG(price_euros) as avg_price
        FROM marketplace.listings_with_characteristics
        WHERE detected_condition IS NOT NULL
        GROUP BY detected_condition
        ORDER BY count DESC
      `);

      return {
        models: modelStats.rows.map(row => ({
          model: row.detected_model,
          count: parseInt(row.count),
          avg_price: Math.round(row.avg_price),
          min_price: Math.round(row.min_price),
          max_price: Math.round(row.max_price)
        })),
        storages: storageStats.rows.map(row => ({
          storage: row.detected_storage,
          count: parseInt(row.count),
          avg_price: Math.round(row.avg_price),
          min_price: Math.round(row.min_price),
          max_price: Math.round(row.max_price)
        })),
        colors: colorStats.rows.map(row => ({
          color: row.detected_color,
          count: parseInt(row.count),
          avg_price: Math.round(row.avg_price)
        })),
        conditions: conditionStats.rows.map(row => ({
          condition: row.detected_condition,
          count: parseInt(row.count),
          avg_price: Math.round(row.avg_price)
        }))
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Ferme le pool de connexions
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseManager;
