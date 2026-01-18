// Configuration d'exemple pour le scraper worker
// Copiez ce fichier vers config.ts et ajustez les valeurs

export const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'marketplace',
  user: 'postgres',
  password: 'password'
};

export const redisConfig = {
  host: 'localhost',
  port: 6379
};

export const scrapingConfig = {
  headless: true,
  slowMo: 100,
  maxPages: 2,
  cronExpression: '*/10 * * * *', // Toutes les 10 minutes
  searchUrls: [
    'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go',
    'https://www.leboncoin.fr/recherche?category=17&text=iphone%2014&phone_memory=128go',
    'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015&phone_memory=128go'
  ]
};

export const rateLimitConfig = {
  minDelay: 3000,  // 3 secondes minimum entre les requêtes
  maxDelay: 5000,  // 5 secondes maximum entre les requêtes
  maxRetries: 3,   // Nombre maximum de tentatives
  backoffBaseDelay: 1000 // Délai de base pour le backoff exponentiel
};