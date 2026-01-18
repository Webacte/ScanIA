/**
 * Configuration centralisée du projet ScanLeCoin
 */

import { DatabaseConfig, RedisConfig, ScrapingConfig, RateLimitConfig } from '../types';

/**
 * Configuration de la base de données PostgreSQL
 */
export const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'marketplace',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
};

/**
 * Configuration Redis pour BullMQ
 */
export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

/**
 * Configuration du scraping
 */
export const scrapingConfig: ScrapingConfig = {
  headless: process.env.HEADLESS === 'true' || true,
  slowMo: parseInt(process.env.SLOW_MO || '100'),
  maxPages: parseInt(process.env.MAX_PAGES || '2'),
  cronExpression: process.env.CRON_EXPRESSION || '*/10 * * * *', // Toutes les 10 minutes
  searchUrls: process.env.SEARCH_URLS 
    ? process.env.SEARCH_URLS.split(',')
    : [
        'https://www.leboncoin.fr/recherche?category=17&text=iphone%2013&phone_memory=128go',
        'https://www.leboncoin.fr/recherche?category=17&text=iphone%2014&phone_memory=128go',
        'https://www.leboncoin.fr/recherche?category=17&text=iphone%2015&phone_memory=128go'
      ]
};

/**
 * Configuration du rate limiting
 */
export const rateLimitConfig: RateLimitConfig = {
  minDelay: parseInt(process.env.MIN_DELAY || '3000'),  // 3 secondes minimum
  maxDelay: parseInt(process.env.MAX_DELAY || '5000'),  // 5 secondes maximum
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'), // 3 tentatives maximum
  backoffBaseDelay: parseInt(process.env.BACKOFF_BASE_DELAY || '1000') // 1 seconde de base
};
