# ScanIA

Scraper Leboncoin avec interface web d’alertes de prix. Projet personnel à but éducatif pour faire de la veille sur les annonces et repérer les bonnes affaires.

## Fonctionnalités

- **Scraping** : extraction d’annonces, pagination, délais pour limiter la détection
- **Détection des doublons** : évite les reprises en base
- **Base PostgreSQL** : schéma `marketplace`, sauvegarde des annonces
- **Interface web** : tableau de bord, liste, alertes, analyse de prix
- **Reconnaissance d’images** (optionnelle) : Google Vision pour comparer des images de référence

## Stack

Node.js, TypeScript, Puppeteer, PostgreSQL, Express, Socket.IO. Optionnel : Google Cloud Vision, Redis/BullMQ.

## Architecture

```
[Bot / Scraper]  -->  [PostgreSQL]
       |                     ^
       |                     |
[Interface Express] ---------+
       |
  [Frontend public/]
```

- **bot/** : scraper (Puppeteer), config, scripts de prod
- **interface/** : serveur Express, API, frontend (HTML/CSS/JS)
- **shared/database/** : schémas et scripts SQL

## Prérequis

- Node.js (v18+), npm
- PostgreSQL
- (Optionnel) Clé Google Vision pour la reconnaissance d’images

## Installation et lancement

```bash
# 1. Dépendances
npm install
npm run interface:install

# 2. Configuration
cp .env.example .env
# Éditer .env et renseigner au minimum DB_PASSWORD (et DB_* si différent de localhost/postgres/scania)

# 3. Base de données
npm run db:init

# 4. Lancer
npm run production:test    # test du bot (1 session)
npm run interface          # interface sur http://localhost:3000
```

**Production (scraper en continu)** : `npm run production:start`

## Variables d’environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `DB_HOST` | | Hébergement PostgreSQL (défaut: localhost) |
| `DB_PORT` | | Port PostgreSQL (défaut: 5432) |
| `DB_NAME` | | Nom de la base (défaut: scania) |
| `DB_USER` | | Utilisateur (défaut: postgres) |
| `DB_PASSWORD` | **Oui** | Mot de passe PostgreSQL |
| `INTERFACE_PORT` | | Port de l’interface (défaut: 3000) |
| `GOOGLE_VISION_API_KEY` | | Clé API Vision (reconnaissance d’images) |
| `GOOGLE_APPLICATION_CREDENTIALS` | | Chemin vers un JSON de service-account (alternative à la clé) |
| `REDIS_HOST`, `REDIS_PORT` | | Redis si usage de BullMQ |

Voir `.env.example` pour une liste complète.

## Notes sur le scraping

- **Projet personnel / éducatif** : usage à titre d’apprentissage, pas de garantie de conformité légale.
- **Respect des CGU et de robots.txt** : à vérifier selon votre usage.
- **Fréquence** : délais volontairement longs entre requêtes pour limiter la charge et les blocages.
- En l’état, le bot peut être détecté (403, captchas) ; à adapter selon votre contexte.

## Google Vision (optionnel)

Sans `GOOGLE_VISION_API_KEY` ni `GOOGLE_APPLICATION_CREDENTIALS`, la reconnaissance d’images est désactivée. L’interface et le bot fonctionnent ; seules les fonctions qui s’appuient sur Vision ne sont pas disponibles. Aucun mock n’est fourni : laisser ces variables vides suffit pour ignorer la feature.

## Commandes utiles

```bash
npm run production:start   # Bot en continu
npm run production:test    # Test bot (1 session)
npm run production:demo    # Démo sans DB
npm run interface          # Démarrer l’interface
npm run db:init            # Init schéma DB
npm run db:check           # Vérifier la DB
npm run config:test        # Tester la config
```

## Dépannage

- **DB_PASSWORD requis** : copier `.env.example` en `.env` et remplir `DB_PASSWORD`.
- **403 / captchas** : le site peut bloquer ; augmenter les délais dans la config du bot.
- **Interface** : s’assurer que le port 3000 (ou `INTERFACE_PORT`) est libre.

## Licence

MIT – voir [LICENSE](LICENSE).
