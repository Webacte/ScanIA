/**
 * Configuration de l'interface ScanLeCoin
 */

module.exports = {
  // Configuration de la base de données
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'scania',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  },

  // Configuration du serveur
  server: {
    port: process.env.INTERFACE_PORT || 3000,
    host: process.env.INTERFACE_HOST || 'localhost'
  },

  // Configuration de l'environnement
  environment: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: (process.env.NODE_ENV || 'development') === 'production'
  },

  // Configuration des alertes
  alerts: {
    defaultKeywords: ['iphone 13', 'iphone 14', 'iphone 15'],
    defaultMaxPrice: 500,
    defaultMinPrice: 100,
    maxAlertsPerUser: 10
  },

  // Configuration de l'analyse de prix
  priceAnalysis: {
    defaultLimit: 50,
    goodDealThreshold: 0.8, // 20% en dessous de la moyenne
    excellentDealThreshold: 0.6, // 40% en dessous de la moyenne
    recentHoursBonus: 24 // Bonus pour les annonces récentes
  }
};
