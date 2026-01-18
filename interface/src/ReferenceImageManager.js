/**
 * Gestionnaire des photos de référence pour la reconnaissance d'images
 * 
 * Gère le stockage des photos de référence dans le système de fichiers local
 * Organisation : reference-images/{object-id}/photo-{n}.jpg
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

class ReferenceImageManager {
  constructor(dbConfig, basePath = null) {
    this.pool = new Pool(dbConfig);
    // Chemin de base pour le stockage des images
    this.basePath = basePath || path.join(__dirname, '..', 'reference-images');
    this.ensureBaseDirectory();
  }

  /**
   * S'assure que le répertoire de base existe
   */
  async ensureBaseDirectory() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du répertoire de base:', error);
    }
  }

  /**
   * Crée un nouvel objet de référence
   */
  async createReferenceObject(name, description = null, confidenceThreshold = 70.0) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO marketplace.reference_objects (name, description, confidence_threshold)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, description, confidenceThreshold]
      );
      
      // Créer le répertoire pour cet objet
      const objectDir = path.join(this.basePath, result.rows[0].id.toString());
      await fs.mkdir(objectDir, { recursive: true });
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Récupère tous les objets de référence
   */
  async getReferenceObjects(activeOnly = false) {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM marketplace.reference_objects';
      if (activeOnly) {
        query += ' WHERE is_active = true';
      }
      query += ' ORDER BY created_at DESC';
      
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des objets de référence:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère un objet de référence par ID
   */
  async getReferenceObject(objectId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM marketplace.reference_objects WHERE id = $1',
        [objectId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Met à jour un objet de référence
   */
  async updateReferenceObject(objectId, updates) {
    const client = await this.pool.connect();
    try {
      const allowedFields = ['name', 'description', 'confidence_threshold', 'is_active'];
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (setClauses.length === 0) {
        return await this.getReferenceObject(objectId);
      }

      values.push(objectId);
      const result = await client.query(
        `UPDATE marketplace.reference_objects 
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Supprime un objet de référence et toutes ses photos
   */
  async deleteReferenceObject(objectId) {
    const client = await this.pool.connect();
    try {
      // Supprimer les photos du système de fichiers
      await this.deleteAllImagesForObject(objectId);
      
      // Supprimer l'objet de la base de données (cascade supprimera les images)
      const result = await client.query(
        'DELETE FROM marketplace.reference_objects WHERE id = $1 RETURNING *',
        [objectId]
      );
      
      // Supprimer le répertoire
      const objectDir = path.join(this.basePath, objectId.toString());
      try {
        await fs.rmdir(objectDir, { recursive: true });
      } catch (error) {
        // Le répertoire peut déjà être supprimé ou ne pas exister
        console.warn(`Impossible de supprimer le répertoire ${objectDir}:`, error.message);
      }
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Sauvegarde une photo de référence sur le disque et dans la base de données
   */
  async saveReferenceImage(objectId, fileBuffer, fileName, mimeType = null) {
    const client = await this.pool.connect();
    try {
      // Vérifier que l'objet existe
      const object = await this.getReferenceObject(objectId);
      if (!object) {
        throw new Error(`Objet de référence ${objectId} introuvable`);
      }

      // Créer le répertoire pour cet objet s'il n'existe pas
      const objectDir = path.join(this.basePath, objectId.toString());
      await fs.mkdir(objectDir, { recursive: true });

      // Déterminer le nom de fichier et le chemin
      const fileExtension = path.extname(fileName) || '.jpg';
      const baseFileName = path.basename(fileName, fileExtension);
      const timestamp = Date.now();
      const finalFileName = `${baseFileName}-${timestamp}${fileExtension}`;
      const filePath = path.join(objectDir, finalFileName);
      const relativePath = path.join('reference-images', objectId.toString(), finalFileName);

      // Sauvegarder le fichier
      await fs.writeFile(filePath, fileBuffer);

      // Obtenir le nombre de photos existantes pour déterminer la position
      const existingImages = await client.query(
        'SELECT COUNT(*) as count FROM marketplace.reference_images WHERE object_id = $1',
        [objectId]
      );
      const position = parseInt(existingImages.rows[0].count);

      // Obtenir la taille du fichier
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      // Insérer dans la base de données
      const result = await client.query(
        `INSERT INTO marketplace.reference_images 
         (object_id, file_path, file_name, file_size, mime_type, position)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [objectId, relativePath, finalFileName, fileSize, mimeType, position]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Récupère toutes les photos de référence pour un objet
   */
  async getReferenceImages(objectId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM marketplace.reference_images 
         WHERE object_id = $1 
         ORDER BY position ASC, created_at ASC`,
        [objectId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère le chemin complet d'une photo de référence
   */
  getImageFullPath(relativePath) {
    // Si le chemin est déjà absolu, le retourner tel quel
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    // Sinon, le construire depuis le répertoire de base
    return path.join(__dirname, '..', relativePath);
  }

  /**
   * Lit une photo de référence depuis le disque
   */
  async readReferenceImage(relativePath) {
    const fullPath = this.getImageFullPath(relativePath);
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new Error(`Impossible de lire l'image ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Supprime une photo de référence
   */
  async deleteReferenceImage(imageId) {
    const client = await this.pool.connect();
    try {
      // Récupérer les informations de l'image
      const imageResult = await client.query(
        'SELECT * FROM marketplace.reference_images WHERE id = $1',
        [imageId]
      );

      if (imageResult.rows.length === 0) {
        return null;
      }

      const image = imageResult.rows[0];
      const fullPath = this.getImageFullPath(image.file_path);

      // Supprimer le fichier
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.warn(`Impossible de supprimer le fichier ${fullPath}:`, error.message);
      }

      // Supprimer de la base de données
      await client.query(
        'DELETE FROM marketplace.reference_images WHERE id = $1',
        [imageId]
      );

      return image;
    } finally {
      client.release();
    }
  }

  /**
   * Supprime toutes les photos d'un objet
   */
  async deleteAllImagesForObject(objectId) {
    const images = await this.getReferenceImages(objectId);
    for (const image of images) {
      await this.deleteReferenceImage(image.id);
    }
  }

  /**
   * Ferme la connexion à la base de données
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = ReferenceImageManager;


