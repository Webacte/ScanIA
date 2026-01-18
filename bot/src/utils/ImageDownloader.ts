/**
 * Utilitaire pour télécharger et stocker les images des annonces
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';

export interface ImageDownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
}

export class ImageDownloader {
  private basePath: string;

  constructor(basePath: string = 'scraped-images') {
    this.basePath = basePath;
    this.ensureBaseDirectory();
  }

  /**
   * S'assure que le répertoire de base existe
   */
  private async ensureBaseDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du répertoire de base:', error);
    }
  }

  /**
   * Télécharge une image depuis une URL et la sauvegarde localement
   */
  async downloadImage(imageUrl: string, listingId: number, imageIndex: number): Promise<ImageDownloadResult> {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return { success: false, error: 'URL invalide' };
      }

      // Créer le répertoire pour cette annonce
      const listingDir = path.join(this.basePath, listingId.toString());
      await fs.mkdir(listingDir, { recursive: true });

      // Déterminer l'extension du fichier
      const urlPath = new URL(imageUrl).pathname;
      const extension = path.extname(urlPath) || '.jpg';
      const fileName = `photo-${imageIndex}${extension}`;
      const filePath = path.join(listingDir, fileName);

      // Télécharger l'image
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const buffer = await response.buffer();
      await fs.writeFile(filePath, buffer);

      // Retourner le chemin relatif
      const relativePath = path.join('scraped-images', listingId.toString(), fileName);

      return { success: true, localPath: relativePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Télécharge plusieurs images pour une annonce
   */
  async downloadImagesForListing(imageUrls: string[], listingId: number): Promise<{
    downloaded: string[];
    failed: Array<{ url: string; error: string }>;
  }> {
    const downloaded: string[] = [];
    const failed: Array<{ url: string; error: string }> = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const result = await this.downloadImage(url, listingId, i);
      
      if (result.success && result.localPath) {
        downloaded.push(result.localPath);
      } else {
        failed.push({ url, error: result.error || 'Erreur inconnue' });
      }
    }

    return { downloaded, failed };
  }

  /**
   * Obtient le chemin complet d'une image
   */
  getFullPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.join(process.cwd(), relativePath);
  }

  /**
   * Lit une image depuis le disque
   */
  async readImage(relativePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(relativePath);
    return await fs.readFile(fullPath);
  }
}







