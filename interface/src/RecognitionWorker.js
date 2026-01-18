/**
 * Worker de reconnaissance d'images
 * 
 * Traite les tâches de recherche en arrière-plan :
 * - Scrape les annonces depuis l'URL de recherche
 * - Télécharge les photos si nécessaire
 * - Compare avec les photos de référence
 * - Enregistre les matches trouvés
 */

const { Pool } = require('pg');
const ReferenceImageManager = require('./ReferenceImageManager');
const ImageRecognitionService = require('./ImageRecognitionService');
const DatabaseManager = require('./DatabaseManager');
const config = require('../config');

class RecognitionWorker {
  constructor(dbConfig, imageRecognitionConfig = {}) {
    this.pool = new Pool(dbConfig);
    this.referenceImageManager = new ReferenceImageManager(dbConfig);
    this.imageRecognitionService = new ImageRecognitionService(imageRecognitionConfig);
    this.dbManager = new DatabaseManager(dbConfig);
    this.isProcessing = false;
    this.currentTaskId = null;
    this.notificationCallback = null;
  }

  /**
   * Définit le callback pour les notifications
   */
  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  /**
   * Envoie une notification si le callback est défini
   */
  notify(taskId, notification) {
    if (this.notificationCallback) {
      this.notificationCallback(taskId, notification);
    }
  }

  /**
   * Démarre le traitement d'une tâche de recherche
   */
  async processSearchTask(taskId) {
    if (this.isProcessing) {
      console.log('⚠️ Un traitement est déjà en cours');
      return;
    }

    this.isProcessing = true;
    this.currentTaskId = taskId;

    try {
      console.log(`🚀 Démarrage du traitement de la tâche ${taskId}`);
      
      // Récupérer la tâche
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error(`Tâche ${taskId} introuvable`);
      }

      // Mettre à jour le statut
      await this.updateTaskStatus(taskId, 'running', { started_at: new Date() });

      // Récupérer les objets de référence à chercher
      const referenceObjects = await this.getTaskReferenceObjects(taskId);
      if (referenceObjects.length === 0) {
        throw new Error('Aucun objet de référence configuré pour cette tâche');
      }

      console.log(`📋 ${referenceObjects.length} objets de référence à chercher`);

      // Scraper les annonces depuis l'URL de recherche
      const listings = await this.scrapeSearchUrl(task.search_url);
      console.log(`📊 ${listings.length} annonces trouvées`);

      await this.updateTaskStatus(taskId, 'running', { 
        total_listings: listings.length 
      });

      // Traiter chaque annonce
      let processedCount = 0;
      let matchesFound = 0;

      for (const listing of listings) {
        try {
          const matches = await this.processListing(listing, referenceObjects, taskId);
          if (matches.length > 0) {
            matchesFound += matches.length;
            console.log(`✅ ${matches.length} match(s) trouvé(s) pour l'annonce ${listing.id}`);
          }
          processedCount++;

          // Mettre à jour la progression
          if (processedCount % 10 === 0) {
            await this.updateTaskStatus(taskId, 'running', {
              processed_listings: processedCount,
              matches_found: matchesFound
            });
            
            // Envoyer une notification de progression
            this.notify(taskId, {
              type: 'progress',
              processed: processedCount,
              total: listings.length,
              matches: matchesFound
            });
          }
        } catch (error) {
          console.error(`❌ Erreur lors du traitement de l'annonce ${listing.id}:`, error);
        }
      }

      // Finaliser la tâche
      await this.updateTaskStatus(taskId, 'completed', {
        processed_listings: processedCount,
        matches_found: matchesFound,
        completed_at: new Date()
      });

      // Envoyer une notification de complétion
      this.notify(taskId, {
        type: 'completed',
        processed: processedCount,
        total: listings.length,
        matches: matchesFound
      });

      console.log(`✅ Tâche ${taskId} terminée: ${matchesFound} match(s) trouvé(s)`);
      
      return {
        success: true,
        totalListings: listings.length,
        processedListings: processedCount,
        matchesFound: matchesFound
      };

    } catch (error) {
      console.error(`❌ Erreur lors du traitement de la tâche ${taskId}:`, error);
      await this.updateTaskStatus(taskId, 'failed', {
        error_message: error.message
      });
      throw error;
    } finally {
      this.isProcessing = false;
      this.currentTaskId = null;
    }
  }

  /**
   * Traite une annonce : télécharge les images et les compare avec les références
   */
  async processListing(listing, referenceObjects, taskId) {
    const matches = [];

    // Récupérer les images de l'annonce
    const listingImages = await this.getListingImages(listing.id);
    if (listingImages.length === 0) {
      return matches; // Pas d'images à comparer
    }

    // Pour chaque objet de référence
    for (const refObject of referenceObjects) {
      try {
        // Récupérer les photos de référence pour cet objet
        const referenceImages = await this.referenceImageManager.getReferenceImages(refObject.id);
        if (referenceImages.length === 0) {
          continue; // Pas de photos de référence
        }

        // Charger les buffers des images de référence
        const referenceBuffers = [];
        for (const refImage of referenceImages) {
          try {
            const buffer = await this.referenceImageManager.readReferenceImage(refImage.file_path);
            referenceBuffers.push(buffer);
          } catch (error) {
            console.warn(`⚠️ Impossible de charger l'image de référence ${refImage.id}:`, error.message);
          }
        }

        if (referenceBuffers.length === 0) {
          continue;
        }

        // Comparer chaque image de l'annonce avec les images de référence
        for (const listingImage of listingImages) {
          try {
            // Charger l'image de l'annonce
            let scrapedImageBuffer;
            if (listingImage.local_path) {
              // Lire depuis le disque local
              const fs = require('fs').promises;
              const path = require('path');
              // Le chemin local est relatif au workspace root
              const fullPath = path.isAbsolute(listingImage.local_path) 
                ? listingImage.local_path 
                : path.join(process.cwd(), listingImage.local_path);
              scrapedImageBuffer = await fs.readFile(fullPath);
            } else if (listingImage.image_url) {
              // Télécharger depuis l'URL
              const fetch = require('node-fetch');
              const response = await fetch(listingImage.image_url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              scrapedImageBuffer = await response.buffer();
            } else {
              continue; // Pas d'image disponible
            }

            // Comparer avec les images de référence
            const bestMatch = await this.imageRecognitionService.findBestMatch(
              scrapedImageBuffer,
              referenceBuffers,
              refObject.confidence_threshold
            );

            if (bestMatch) {
              // Enregistrer le match
              const match = await this.saveMatch({
                listingId: listing.id,
                objectId: refObject.id,
                taskId: taskId,
                referenceImageId: referenceImages[bestMatch.referenceIndex].id,
                matchedImageUrl: listingImage.image_url,
                confidenceScore: bestMatch.score
              });

              matches.push(match);
              console.log(`🎯 Match trouvé: ${refObject.name} dans l'annonce ${listing.id} (confiance: ${bestMatch.score}%)`);
              
              // Envoyer une notification
              if (taskId) {
                this.notify(taskId, {
                  type: 'match-found',
                  match: {
                    listingId: listing.id,
                    listingTitle: listing.title,
                    listingUrl: listing.url,
                    objectName: refObject.name,
                    confidenceScore: bestMatch.score
                  }
                });
              }
            }
          } catch (error) {
            console.error(`❌ Erreur lors de la comparaison d'image:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de l'objet ${refObject.name}:`, error);
      }
    }

    return matches;
  }

  /**
   * Scrape les annonces depuis une URL de recherche Leboncoin
   * Note: Cette fonction devrait utiliser le scraper existant
   */
  async scrapeSearchUrl(searchUrl) {
    // Pour l'instant, on récupère les annonces existantes dans la base
    // qui correspondent à l'URL de recherche
    // TODO: Intégrer le scraper réel pour scraper dynamiquement
    
    const client = await this.pool.connect();
    try {
      // Récupérer les annonces récentes (dans les 7 derniers jours)
      const result = await client.query(
        `SELECT l.* 
         FROM marketplace.listings l
         JOIN marketplace.sources s ON l.source_id = s.id
         WHERE s.name = 'Leboncoin'
           AND l.fetched_at >= NOW() - INTERVAL '7 days'
         ORDER BY l.fetched_at DESC
         LIMIT 100`,
        []
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère une tâche par ID
   */
  async getTask(taskId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM marketplace.search_tasks WHERE id = $1',
        [taskId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les objets de référence associés à une tâche
   */
  async getTaskReferenceObjects(taskId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ro.* 
         FROM marketplace.reference_objects ro
         JOIN marketplace.search_task_objects sto ON ro.id = sto.object_id
         WHERE sto.task_id = $1 AND ro.is_active = true
         ORDER BY ro.name`,
        [taskId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Met à jour le statut d'une tâche
   */
  async updateTaskStatus(taskId, status, updates = {}) {
    const client = await this.pool.connect();
    try {
      const allowedFields = ['status', 'total_listings', 'processed_listings', 'matches_found', 'started_at', 'completed_at', 'error_message'];
      const setClauses = ['status = $1'];
      const values = [status];
      let paramIndex = 2;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      values.push(taskId);
      await client.query(
        `UPDATE marketplace.search_tasks 
         SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex}`,
        values
      );
    } finally {
      client.release();
    }
  }

  /**
   * Récupère les images d'une annonce
   */
  async getListingImages(listingId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM marketplace.listing_images WHERE listing_id = $1 ORDER BY position ASC',
        [listingId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Enregistre un match trouvé
   */
  async saveMatch(matchData) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO marketplace.image_matches 
         (listing_id, object_id, task_id, reference_image_id, matched_image_url, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [
          matchData.listingId,
          matchData.objectId,
          matchData.taskId,
          matchData.referenceImageId,
          matchData.matchedImageUrl,
          matchData.confidenceScore
        ]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Vérifie si le worker est disponible
   */
  isAvailable() {
    return this.imageRecognitionService.isAvailable() && !this.isProcessing;
  }

  /**
   * Ferme les connexions
   */
  async close() {
    await this.pool.end();
    await this.referenceImageManager.close();
  }
}

module.exports = RecognitionWorker;

