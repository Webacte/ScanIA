import { Pool, PoolClient } from 'pg';
import { DatabaseConfig, ListingInsertData, SaveResult } from '../types';
import { ImageDownloader } from '../utils/ImageDownloader';

/**
 * Gestionnaire de base de données PostgreSQL
 * 
 * Cette classe gère toutes les opérations de base de données pour le projet ScanLeCoin,
 * incluant la vérification des doublons, la création de sellers/locations,
 * et l'insertion des annonces et images.
 */
export class DatabaseManager {
  private pool: Pool;
  private imageDownloader: ImageDownloader;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
    this.imageDownloader = new ImageDownloader();
  }

  /**
   * Obtient un client de connexion à la base de données
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Ferme le pool de connexions
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Vérifie si une annonce existe déjà dans la base
   * @param sourceId ID de la source (ex: Leboncoin)
   * @param externalId ID externe de l'annonce
   * @returns true si l'annonce existe déjà
   */
  async listingExists(sourceId: number, externalId: string): Promise<boolean> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT 1 FROM marketplace.listings WHERE source_id = $1 AND external_id = $2',
        [sourceId, externalId]
      );
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Obtient ou crée un vendeur
   * @param sourceId ID de la source
   * @param externalId ID externe du vendeur
   * @param displayName Nom d'affichage du vendeur
   * @param profileUrl URL du profil du vendeur (optionnel)
   * @returns ID du vendeur
   */
  async getOrCreateSeller(
    sourceId: number, 
    externalId: string, 
    displayName: string, 
    profileUrl?: string
  ): Promise<number> {
    const client = await this.getClient();
    try {
      // Vérifier si le vendeur existe déjà
      const existingResult = await client.query(
        'SELECT id FROM marketplace.sellers WHERE source_id = $1 AND external_id = $2',
        [sourceId, externalId]
      );

      if (existingResult.rows.length > 0) {
        return existingResult.rows[0].id;
      }

      // Créer un nouveau vendeur
      const insertResult = await client.query(
        'INSERT INTO marketplace.sellers (source_id, external_id, display_name, profile_url) VALUES ($1, $2, $3, $4) RETURNING id',
        [sourceId, externalId, displayName, profileUrl]
      );

      return insertResult.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Obtient ou crée une localisation
   * @param label Libellé de la localisation (ex: "Paris (75)")
   * @param countryCode Code pays (défaut: "FR")
   * @returns ID de la localisation
   */
  async getOrCreateLocation(label: string, countryCode: string = 'FR'): Promise<number> {
    const client = await this.getClient();
    try {
      // Vérifier si la localisation existe déjà
      const existingResult = await client.query(
        'SELECT id FROM marketplace.locations WHERE label = $1 AND country_code = $2',
        [label, countryCode]
      );

      if (existingResult.rows.length > 0) {
        return existingResult.rows[0].id;
      }

      // Créer une nouvelle localisation
      const insertResult = await client.query(
        'INSERT INTO marketplace.locations (label, country_code) VALUES ($1, $2) RETURNING id',
        [label, countryCode]
      );

      return insertResult.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Insère une annonce dans la base de données
   * @param listingData Données de l'annonce à insérer
   * @returns ID de l'annonce créée
   */
  async insertListing(listingData: ListingInsertData): Promise<number> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `INSERT INTO marketplace.listings (
          source_id, external_id, url, title, description, price_cents, currency,
          condition_code, has_shipping, shipping_cost_cents, seller_id, location_id,
          published_at, raw_payload
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING id`,
        [
          listingData.sourceId,
          listingData.externalId,
          listingData.url,
          listingData.title,
          listingData.description,
          listingData.priceCents,
          listingData.currency,
          listingData.conditionCode,
          listingData.hasShipping,
          listingData.shippingCostCents,
          listingData.sellerId,
          listingData.locationId,
          listingData.publishedAt,
          JSON.stringify(listingData.rawPayload)
        ]
      );

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Insère les images d'une annonce et les télécharge localement
   * @param listingId ID de l'annonce
   * @param images URLs des images
   */
  async insertListingImages(listingId: number, images: string[]): Promise<void> {
    if (images.length === 0) return;

    const client = await this.getClient();
    try {
      // Télécharger les images localement
      const downloadResults = await this.imageDownloader.downloadImagesForListing(images, listingId);
      
      // Créer une map URL -> localPath pour faciliter la recherche
      const urlToLocalPath = new Map<string, string>();
      downloadResults.downloaded.forEach((localPath, index) => {
        if (index < images.length) {
          urlToLocalPath.set(images[index], localPath);
        }
      });
      
      // Préparer les valeurs pour l'insertion
      const values: string[] = [];
      const params: any[] = [listingId];
      let paramIndex = 2;

      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        const localPath = urlToLocalPath.get(imageUrl) || null;
        
        values.push(`($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        params.push(imageUrl, i, localPath);
        paramIndex += 3;
      }

      // Insérer dans la base de données avec les chemins locaux
      await client.query(
        `INSERT INTO marketplace.listing_images (listing_id, image_url, position, local_path) VALUES ${values.join(', ')}`,
        params
      );

      if (downloadResults.failed.length > 0) {
        console.warn(`⚠️ ${downloadResults.failed.length} images n'ont pas pu être téléchargées pour l'annonce ${listingId}`);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Obtient l'ID de la source Leboncoin
   * @returns ID de la source Leboncoin
   * @throws Error si la source n'est pas trouvée
   */
  async getLeboncoinSourceId(): Promise<number> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        'SELECT id FROM marketplace.sources WHERE name = $1',
        ['Leboncoin']
      );

      if (result.rows.length === 0) {
        throw new Error('Source Leboncoin non trouvée dans la base de données');
      }

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Sauvegarde une liste d'annonces en base de données
   * @param listings Liste des annonces à sauvegarder
   * @returns Résultat de la sauvegarde (saved/skipped)
   */
  async saveListings(listings: any[]): Promise<SaveResult> {
    const sourceId = await this.getLeboncoinSourceId();
    let saved = 0;
    let skipped = 0;

    for (const listing of listings) {
      try {
        // Vérifier si l'annonce existe déjà
        const exists = await this.listingExists(sourceId, listing.external_id);
        if (exists) {
          console.log(`⏭️ Annonce ${listing.external_id} déjà existante, skip`);
          skipped++;
          continue;
        }

        // Gérer le vendeur
        let sellerId: number | undefined;
        if (listing.seller_name) {
          const sellerExternalId = listing.seller_name.toLowerCase().replace(/\s+/g, '_');
          sellerId = await this.getOrCreateSeller(
            sourceId,
            sellerExternalId,
            listing.seller_name,
            listing.seller_profile
          );
        }

        // Gérer la localisation
        let locationId: number | undefined;
        if (listing.location) {
          locationId = await this.getOrCreateLocation(listing.location);
        }

        // Insérer l'annonce
        const listingId = await this.insertListing({
          sourceId,
          externalId: listing.external_id,
          url: listing.url,
          title: listing.title,
          description: listing.description,
          priceCents: listing.price_cents,
          currency: 'EUR',
          conditionCode: listing.condition,
          hasShipping: listing.has_shipping,
          sellerId,
          locationId,
          rawPayload: listing
        });

        // Insérer les images (elles seront téléchargées automatiquement)
        const images = listing.images || (listing.image_url ? [listing.image_url] : []);
        if (images.length > 0) {
          await this.insertListingImages(listingId, images);
        }

        console.log(`💾 Annonce ${listing.external_id} sauvegardée avec l'ID ${listingId}`);
        saved++;

      } catch (error) {
        console.error(`❌ Erreur lors de la sauvegarde de l'annonce ${listing.external_id}:`, error);
      }
    }

    return { saved, skipped };
  }
}
