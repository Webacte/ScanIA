/**
 * Simulateur de comportement humain avancé
 * 
 * Cette classe simule un comportement humain réaliste
 * pour éviter la détection anti-bot
 */

export interface HumanBehaviorConfig {
  minDelay: number;
  maxDelay: number;
  mouseMovements: boolean;
  scrollBehavior: boolean;
  typingSpeed: number;
  readingTime: number;
}

export class HumanBehaviorSimulator {
  private config: HumanBehaviorConfig;
  private lastActionTime: number = 0;
  private sessionStartTime: number = Date.now();

  constructor(config: HumanBehaviorConfig = {
    minDelay: 1000,
    maxDelay: 5000,
    mouseMovements: true,
    scrollBehavior: true,
    typingSpeed: 150,
    readingTime: 2000
  }) {
    this.config = config;
  }

  /**
   * Simule un délai humain aléatoire
   */
  async humanDelay(customDelay?: number): Promise<void> {
    const delay = customDelay || this.generateRandomDelay();
    console.log(`👤 Simulation comportement humain: attente de ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    this.lastActionTime = Date.now();
  }

  /**
   * Génère un délai aléatoire basé sur la configuration
   */
  private generateRandomDelay(): number {
    // Délai de base
    let delay = Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay;
    
    // Ajuster selon le temps depuis la dernière action
    const timeSinceLastAction = Date.now() - this.lastActionTime;
    if (timeSinceLastAction < 1000) {
      // Si la dernière action était récente, augmenter le délai
      delay *= 1.5;
    }
    
    // Ajuster selon l'heure de la journée (simulation d'activité humaine)
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      // Nuit : délais plus longs
      delay *= 1.3;
    } else if (hour >= 12 && hour <= 14) {
      // Pause déjeuner : délais plus courts
      delay *= 0.8;
    }
    
    return Math.round(delay);
  }

  /**
   * Simule une pause de lecture
   */
  async simulateReading(contentLength: number): Promise<void> {
    // Temps de lecture basé sur la longueur du contenu
    const readingTime = Math.min(
      contentLength * 0.01, // 10ms par caractère
      this.config.readingTime * 2 // Maximum 2x le temps de lecture configuré
    );
    
    console.log(`📖 Simulation lecture: ${Math.round(readingTime)}ms`);
    await new Promise(resolve => setTimeout(resolve, readingTime));
  }

  /**
   * Simule des mouvements de souris
   */
  async simulateMouseMovements(): Promise<void> {
    if (!this.config.mouseMovements) return;
    
    // Simuler plusieurs mouvements de souris
    const movements = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < movements; i++) {
      const movementDelay = Math.random() * 200 + 100; // 100-300ms
      await new Promise(resolve => setTimeout(resolve, movementDelay));
    }
  }

  /**
   * Simule un comportement de scroll
   */
  async simulateScrollBehavior(): Promise<void> {
    if (!this.config.scrollBehavior) return;
    
    // Simuler un scroll vers le bas
    const scrollDelay = Math.random() * 500 + 200; // 200-700ms
    await new Promise(resolve => setTimeout(resolve, scrollDelay));
    
    // Simuler une pause pour "lire"
    const pauseDelay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, pauseDelay));
    
    // Simuler un scroll vers le haut
    const scrollBackDelay = Math.random() * 300 + 100; // 100-400ms
    await new Promise(resolve => setTimeout(resolve, scrollBackDelay));
  }

  /**
   * Simule un comportement de navigation
   */
  async simulateNavigationBehavior(): Promise<void> {
    console.log('🧭 Simulation comportement de navigation...');
    
    // Délai initial
    await this.humanDelay();
    
    // Mouvements de souris
    await this.simulateMouseMovements();
    
    // Comportement de scroll
    await this.simulateScrollBehavior();
    
    // Délai final
    await this.humanDelay();
  }

  /**
   * Simule un comportement de recherche
   */
  async simulateSearchBehavior(): Promise<void> {
    console.log('🔍 Simulation comportement de recherche...');
    
    // Délai avant de commencer la recherche
    await this.humanDelay(2000);
    
    // Simuler la saisie (temps de frappe)
    const typingDelay = this.config.typingSpeed * (Math.random() * 10 + 5); // 5-15 caractères
    await new Promise(resolve => setTimeout(resolve, typingDelay));
    
    // Délai avant de soumettre
    await this.humanDelay(1000);
    
    // Mouvements de souris
    await this.simulateMouseMovements();
  }

  /**
   * Simule un comportement de lecture d'annonce
   */
  async simulateAdReadingBehavior(adLength: number): Promise<void> {
    console.log('📄 Simulation lecture d\'annonce...');
    
    // Temps de lecture basé sur la longueur
    await this.simulateReading(adLength);
    
    // Mouvements de souris
    await this.simulateMouseMovements();
    
    // Scroll pour voir plus de détails
    await this.simulateScrollBehavior();
    
    // Délai final
    await this.humanDelay();
  }

  /**
   * Simule un comportement de clic
   */
  async simulateClickBehavior(): Promise<void> {
    console.log('🖱️ Simulation clic...');
    
    // Délai avant le clic
    await this.humanDelay(500);
    
    // Mouvement de souris vers l'élément
    const moveDelay = Math.random() * 200 + 100; // 100-300ms
    await new Promise(resolve => setTimeout(resolve, moveDelay));
    
    // Délai après le clic
    await this.humanDelay(300);
  }

  /**
   * Simule un comportement de retour en arrière
   */
  async simulateBackBehavior(): Promise<void> {
    console.log('⬅️ Simulation retour en arrière...');
    
    // Délai avant de revenir en arrière
    await this.humanDelay(1000);
    
    // Mouvements de souris
    await this.simulateMouseMovements();
    
    // Délai après le retour
    await this.humanDelay(800);
  }

  /**
   * Simule un comportement de session complète
   */
  async simulateSessionBehavior(): Promise<void> {
    console.log('🔄 Simulation comportement de session...');
    
    // Temps de session basé sur l'heure
    const sessionTime = this.getSessionTime();
    const elapsedTime = Date.now() - this.sessionStartTime;
    
    if (elapsedTime > sessionTime) {
      // Simuler une pause de session
      const breakTime = Math.random() * 30000 + 10000; // 10-40 secondes
      console.log(`☕ Pause de session: ${Math.round(breakTime / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, breakTime));
      
      // Redémarrer la session
      this.sessionStartTime = Date.now();
    }
  }

  /**
   * Obtient le temps de session recommandé selon l'heure
   */
  private getSessionTime(): number {
    const hour = new Date().getHours();
    
    if (hour >= 22 || hour <= 6) {
      return 5 * 60 * 1000; // 5 minutes la nuit
    } else if (hour >= 12 && hour <= 14) {
      return 3 * 60 * 1000; // 3 minutes à midi
    } else if (hour >= 18 && hour <= 20) {
      return 8 * 60 * 1000; // 8 minutes le soir
    } else {
      return 6 * 60 * 1000; // 6 minutes en journée
    }
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<HumanBehaviorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Configuration du comportement humain mise à jour');
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): HumanBehaviorConfig {
    return { ...this.config };
  }

  /**
   * Réinitialise le simulateur
   */
  reset(): void {
    this.lastActionTime = 0;
    this.sessionStartTime = Date.now();
    console.log('🔄 Simulateur de comportement humain réinitialisé');
  }
}
