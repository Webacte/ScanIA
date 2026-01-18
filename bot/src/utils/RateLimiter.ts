/**
 * Gestionnaire de rate limiting pour éviter la détection de bot
 */

/**
 * Classe pour gérer les délais entre les requêtes
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private readonly minDelay: number = 3000; // 3 secondes minimum
  private readonly maxDelay: number = 5000; // 5 secondes maximum

  /**
   * Attend le délai approprié avant la prochaine requête
   */
  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const randomDelay = Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;
    
    if (timeSinceLastRequest < randomDelay) {
      const waitTime = randomDelay - timeSinceLastRequest;
      console.log(`⏳ Attente de ${Math.round(waitTime)}ms pour éviter le spam...`);
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fonction utilitaire pour attendre un délai
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Gestionnaire de backoff exponentiel pour les erreurs de rate limiting
 */
export class BackoffManager {
  private attemptCount: number = 0;
  private readonly maxAttempts: number = 5;
  private readonly baseDelay: number = 1000; // 1 seconde

  /**
   * Gère le backoff exponentiel en cas de rate limiting
   * @returns true si on peut réessayer, false si on a atteint le maximum
   */
  async handleRateLimit(): Promise<boolean> {
    if (this.attemptCount >= this.maxAttempts) {
      console.error('❌ Nombre maximum de tentatives atteint pour le backoff');
      return false;
    }

    this.attemptCount++;
    const delay = this.baseDelay * Math.pow(2, this.attemptCount - 1);
    const jitter = Math.random() * 1000; // Ajouter du jitter
    const totalDelay = delay + jitter;

    console.log(`🔄 Backoff exponentiel: tentative ${this.attemptCount}/${this.maxAttempts}, attente de ${Math.round(totalDelay)}ms`);
    await this.sleep(totalDelay);
    return true;
  }

  /**
   * Remet à zéro le compteur de tentatives
   */
  reset(): void {
    this.attemptCount = 0;
  }

  /**
   * Fonction utilitaire pour attendre un délai
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
