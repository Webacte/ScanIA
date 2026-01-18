/**
 * Détecteur de Captcha pour Leboncoin
 * 
 * Ce module détecte les différents types de captchas
 * et propose des solutions de contournement
 */

import { JSDOM } from 'jsdom';

export interface CaptchaInfo {
  type: 'hcaptcha' | 'recaptcha' | 'cloudflare' | 'custom' | 'none';
  detected: boolean;
  element?: Element;
  iframe?: string;
  challenge?: string;
  sitekey?: string;
  action?: string;
  message?: string;
}

export interface CaptchaSolution {
  solved: boolean;
  method: 'automatic' | 'manual' | 'bypass' | 'retry';
  token?: string;
  cookies?: string[];
  headers?: Record<string, string>;
  error?: string;
}

export class CaptchaDetector {
  private dom: JSDOM;
  private html: string;
  private url: string;

  constructor(html: string, url: string) {
    this.html = html;
    this.url = url;
    this.dom = new JSDOM(html);
  }

  /**
   * Détecte la présence d'un captcha dans la page
   */
  detectCaptcha(): CaptchaInfo {
    const document = this.dom.window.document;
    
    // Vérifier les patterns de captcha communs
    const captchaPatterns = [
      // hCaptcha
      {
        type: 'hcaptcha' as const,
        selectors: [
          'iframe[src*="hcaptcha"]',
          '.h-captcha',
          '[data-sitekey]',
          'div[class*="hcaptcha"]'
        ],
        keywords: ['hcaptcha', 'h-captcha', 'human verification']
      },
      
      // reCAPTCHA
      {
        type: 'recaptcha' as const,
        selectors: [
          'iframe[src*="recaptcha"]',
          '.g-recaptcha',
          '[data-sitekey]',
          'div[class*="recaptcha"]'
        ],
        keywords: ['recaptcha', 'g-recaptcha', 'i\'m not a robot']
      },
      
      // Cloudflare
      {
        type: 'cloudflare' as const,
        selectors: [
          'iframe[src*="cloudflare"]',
          '.cf-challenge',
          '#cf-challenge-running',
          '[data-ray]'
        ],
        keywords: ['cloudflare', 'checking your browser', 'ddos protection']
      },
      
      // Captcha personnalisé
      {
        type: 'custom' as const,
        selectors: [
          'input[name*="captcha"]',
          'img[src*="captcha"]',
          '.captcha',
          '[class*="captcha"]'
        ],
        keywords: ['captcha', 'verification', 'security check']
      }
    ];

    // Vérifier le contenu HTML pour des mots-clés
    const htmlLower = this.html.toLowerCase();
    
    for (const pattern of captchaPatterns) {
      // Vérifier les sélecteurs CSS
      for (const selector of pattern.selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return this.createCaptchaInfo(pattern.type, element);
        }
      }
      
      // Vérifier les mots-clés dans le HTML
      for (const keyword of pattern.keywords) {
        if (htmlLower.includes(keyword)) {
          return this.createCaptchaInfo(pattern.type);
        }
      }
    }

    // Vérifier les messages d'erreur spécifiques
    const errorMessages = [
      'captcha',
      'verification',
      'robot',
      'spam',
      'blocked',
      'suspicious activity',
      'too many requests',
      'rate limit',
      'access denied'
    ];

    for (const message of errorMessages) {
      if (htmlLower.includes(message)) {
        return {
          type: 'custom',
          detected: true,
          message: `Détection basée sur le mot-clé: ${message}`
        };
      }
    }

    return {
      type: 'none',
      detected: false
    };
  }

  /**
   * Crée les informations de captcha
   */
  private createCaptchaInfo(type: CaptchaInfo['type'], element?: Element): CaptchaInfo {
    const info: CaptchaInfo = {
      type,
      detected: true,
      element
    };

    if (element) {
      // Extraire les attributs utiles
      const sitekey = element.getAttribute('data-sitekey');
      if (sitekey) {
        info.sitekey = sitekey;
      }

      // Chercher des iframes
      const iframe = element.querySelector('iframe');
      if (iframe) {
        info.iframe = iframe.getAttribute('src') || '';
      }

      // Extraire le texte du challenge
      const text = element.textContent || '';
      if (text.trim()) {
        info.challenge = text.trim();
      }
    }

    return info;
  }

  /**
   * Analyse les headers HTTP pour détecter des captchas
   */
  static detectCaptchaInHeaders(headers: Record<string, string>): CaptchaInfo {
    const headerString = JSON.stringify(headers).toLowerCase();
    
    if (headerString.includes('cloudflare')) {
      return {
        type: 'cloudflare',
        detected: true,
        message: 'Détection Cloudflare dans les headers'
      };
    }

    if (headerString.includes('captcha') || headerString.includes('challenge')) {
      return {
        type: 'custom',
        detected: true,
        message: 'Détection captcha dans les headers'
      };
    }

    return {
      type: 'none',
      detected: false
    };
  }

  /**
   * Analyse le code de statut HTTP
   */
  static detectCaptchaInStatus(status: number, statusText: string): CaptchaInfo {
    // Codes de statut qui peuvent indiquer un captcha
    if (status === 403 || status === 429) {
      return {
        type: 'custom',
        detected: true,
        message: `Statut HTTP ${status}: ${statusText}`
      };
    }

    return {
      type: 'none',
      detected: false
    };
  }

  /**
   * Génère un rapport de détection
   */
  generateReport(): string {
    const captcha = this.detectCaptcha();
    
    if (!captcha.detected) {
      return '✅ Aucun captcha détecté';
    }

    let report = `🚨 CAPTCHA DÉTECTÉ\n`;
    report += `Type: ${captcha.type}\n`;
    
    if (captcha.message) {
      report += `Message: ${captcha.message}\n`;
    }
    
    if (captcha.sitekey) {
      report += `Site Key: ${captcha.sitekey}\n`;
    }
    
    if (captcha.iframe) {
      report += `Iframe: ${captcha.iframe}\n`;
    }
    
    if (captcha.challenge) {
      report += `Challenge: ${captcha.challenge}\n`;
    }

    return report;
  }

  /**
   * Sauvegarde la page HTML pour analyse manuelle
   */
  savePageForManualReview(filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `captcha-page-${timestamp}.html`;
    const finalFilename = filename || defaultFilename;
    
    // Créer le dossier de sauvegarde s'il n'existe pas
    const fs = require('fs');
    const path = require('path');
    const saveDir = path.join(process.cwd(), 'captcha-saves');
    
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    
    const filePath = path.join(saveDir, finalFilename);
    fs.writeFileSync(filePath, this.html);
    
    return filePath;
  }
}

