/**
 * Analyseur d'API pour découvrir les endpoints internes de Leboncoin
 * 
 * Cette classe analyse les requêtes réseau pour identifier
 * des endpoints API non protégés
 */

import { CustomHttpClient } from './CustomHttpClient';
import { HttpRequestOptions, HttpResponse } from './CustomHttpClient';

export interface ApiEndpoint {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  description: string;
  protection: 'none' | 'low' | 'medium' | 'high' | 'unknown';
}

export class ApiAnalyzer {
  private httpClient: CustomHttpClient;
  private discoveredEndpoints: ApiEndpoint[] = [];

  constructor() {
    this.httpClient = new CustomHttpClient();
  }

  /**
   * Analyse les endpoints API connus de Leboncoin
   */
  async analyzeKnownEndpoints(): Promise<ApiEndpoint[]> {
    console.log('🔍 Analyse des endpoints API connus de Leboncoin...');
    
    const knownEndpoints: ApiEndpoint[] = [
      {
        url: 'https://api.leboncoin.fr/finder/search',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: {
          filters: {
            category: { id: "17" },
            keywords: { text: "iphone 13" },
            phone_memory: { id: "128go" }
          },
          limit: 35,
          limit_alu: 3,
          filters_context: {
            origin: {
              name: "search_results"
            }
          }
        },
        description: 'API de recherche principale',
        protection: 'unknown'
      },
      {
        url: 'https://api.leboncoin.fr/finder/search',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        description: 'API de recherche GET',
        protection: 'unknown'
      },
      {
        url: 'https://www.leboncoin.fr/api/search',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          category: "17",
          text: "iphone 13",
          phone_memory: "128go"
        },
        description: 'API de recherche alternative',
        protection: 'unknown'
      },
      {
        url: 'https://api.leboncoin.fr/listing/search',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          filters: {
            category: { id: "17" },
            keywords: { text: "iphone 13" }
          }
        },
        description: 'API de recherche de listings',
        protection: 'unknown'
      },
      {
        url: 'https://www.leboncoin.fr/_next/data/9mJ8h0qC8yHJM0l4ANV30/recherche.json',
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        description: 'API Next.js de recherche',
        protection: 'unknown'
      },
      {
        url: 'https://api.leboncoin.fr/listing/123456',
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        description: 'API de détail d\'annonce',
        protection: 'unknown'
      },
      {
        url: 'https://www.leboncoin.fr/api/listing/123456',
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        description: 'API de détail d\'annonce alternative',
        protection: 'unknown'
      }
    ];

    console.log(`📋 Test de ${knownEndpoints.length} endpoints connus...`);

    for (const endpoint of knownEndpoints) {
      try {
        console.log(`\n🧪 Test de: ${endpoint.url}`);
        
        let response: HttpResponse;
        
        if (endpoint.method === 'POST') {
          response = await this.httpClient.post(endpoint.url, endpoint.body, {
            headers: endpoint.headers
          });
        } else {
          response = await this.httpClient.get(endpoint.url, {
            headers: endpoint.headers
          });
        }

        // Analyser la réponse
        const protection = this.analyzeResponse(response);
        endpoint.protection = protection;

        console.log(`   Status: ${response.status}`);
        console.log(`   Protection: ${protection}`);
        console.log(`   Taille: ${response.body.length} caractères`);

        if (response.status === 200) {
          console.log(`   ✅ SUCCÈS ! Endpoint accessible`);
          
          // Essayer de parser le JSON
          try {
            const jsonData = JSON.parse(response.body);
            console.log(`   📊 Données JSON reçues: ${Object.keys(jsonData).length} propriétés`);
          } catch (e) {
            console.log(`   📄 Réponse non-JSON`);
          }
        } else if (response.status === 403) {
          console.log(`   🚫 Accès interdit`);
        } else if (response.status === 404) {
          console.log(`   ❌ Endpoint non trouvé`);
        } else {
          console.log(`   ⚠️ Statut inattendu: ${response.status}`);
        }

        this.discoveredEndpoints.push(endpoint);

        // Attendre entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.log(`   ❌ Erreur: ${(error as Error).message}`);
        endpoint.protection = 'high';
        this.discoveredEndpoints.push(endpoint);
      }
    }

    return this.discoveredEndpoints;
  }

  /**
   * Analyse la réponse pour déterminer le niveau de protection
   */
  private analyzeResponse(response: HttpResponse): 'none' | 'low' | 'medium' | 'high' {
    if (response.status === 200) {
      // Vérifier si c'est du JSON valide
      try {
        JSON.parse(response.body);
        return 'none';
      } catch {
        return 'low';
      }
    } else if (response.status === 403) {
      return 'high';
    } else if (response.status === 429) {
      return 'medium';
    } else if (response.status === 404) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  /**
   * Teste des endpoints avec des paramètres variés
   */
  async testEndpointVariations(baseUrl: string): Promise<ApiEndpoint[]> {
    console.log(`\n🔄 Test de variations pour: ${baseUrl}`);
    
    const variations: ApiEndpoint[] = [
      {
        url: `${baseUrl}?category=17&text=iphone`,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        description: 'Variation avec paramètres GET',
        protection: 'unknown'
      },
      {
        url: `${baseUrl}?category=17&text=iphone&limit=10`,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        description: 'Variation avec limite',
        protection: 'unknown'
      },
      {
        url: `${baseUrl}?category=17&text=iphone&offset=0&limit=10`,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        description: 'Variation avec offset et limite',
        protection: 'unknown'
      }
    ];

    const results: ApiEndpoint[] = [];

    for (const variation of variations) {
      try {
        console.log(`   🧪 Test: ${variation.url}`);
        
        const response = await this.httpClient.get(variation.url, {
          headers: variation.headers
        });

        variation.protection = this.analyzeResponse(response);
        results.push(variation);

        console.log(`      Status: ${response.status}, Protection: ${variation.protection}`);

        if (response.status === 200) {
          console.log(`      ✅ SUCCÈS !`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`      ❌ Erreur: ${(error as Error).message}`);
        variation.protection = 'high';
        results.push(variation);
      }
    }

    return results;
  }

  /**
   * Génère un rapport des endpoints découverts
   */
  generateReport(): string {
    const report = [];
    
    report.push('# 📊 Rapport d\'Analyse API - Leboncoin\n');
    
    const accessible = this.discoveredEndpoints.filter(e => e.protection === 'none');
    const lowProtection = this.discoveredEndpoints.filter(e => e.protection === 'low');
    const mediumProtection = this.discoveredEndpoints.filter(e => e.protection === 'medium');
    const highProtection = this.discoveredEndpoints.filter(e => e.protection === 'high');

    report.push(`## 📈 Statistiques`);
    report.push(`- **Total testé**: ${this.discoveredEndpoints.length}`);
    report.push(`- **Accessible**: ${accessible.length}`);
    report.push(`- **Protection faible**: ${lowProtection.length}`);
    report.push(`- **Protection moyenne**: ${mediumProtection.length}`);
    report.push(`- **Protection élevée**: ${highProtection.length}\n`);

    if (accessible.length > 0) {
      report.push('## ✅ Endpoints Accessibles');
      accessible.forEach(endpoint => {
        report.push(`- **${endpoint.url}**`);
        report.push(`  - Méthode: ${endpoint.method}`);
        report.push(`  - Description: ${endpoint.description}\n`);
      });
    }

    if (lowProtection.length > 0) {
      report.push('## 🟡 Endpoints à Protection Faible');
      lowProtection.forEach(endpoint => {
        report.push(`- **${endpoint.url}**`);
        report.push(`  - Méthode: ${endpoint.method}`);
        report.push(`  - Description: ${endpoint.description}\n`);
      });
    }

    if (mediumProtection.length > 0) {
      report.push('## 🟠 Endpoints à Protection Moyenne');
      mediumProtection.forEach(endpoint => {
        report.push(`- **${endpoint.url}**`);
        report.push(`  - Méthode: ${endpoint.method}`);
        report.push(`  - Description: ${endpoint.description}\n`);
      });
    }

    if (highProtection.length > 0) {
      report.push('## 🔴 Endpoints à Protection Élevée');
      highProtection.forEach(endpoint => {
        report.push(`- **${endpoint.url}**`);
        report.push(`  - Méthode: ${endpoint.method}`);
        report.push(`  - Description: ${endpoint.description}\n`);
      });
    }

    return report.join('\n');
  }

  /**
   * Obtient les endpoints découverts
   */
  getDiscoveredEndpoints(): ApiEndpoint[] {
    return this.discoveredEndpoints;
  }
}
