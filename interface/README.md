# 🌐 Interface ScanLeCoin

Interface web locale pour visualiser les annonces scrapées et configurer des alertes de prix.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env

# Modifier la configuration dans .env
# (même base de données que le bot)
```

## 🎯 Utilisation

```bash
# Démarrer l'interface
npm start

# Mode développement (avec rechargement automatique)
npm run dev

# Compiler le CSS (si modifications)
npm run build:css
```

L'interface sera accessible sur : http://localhost:3000

## 📱 Fonctionnalités

### 🏠 Tableau de bord
- Statistiques en temps réel
- Bonnes affaires récentes
- Vue d'ensemble des données

### 📋 Annonces
- Liste des annonces scrapées
- Filtres par prix et recherche
- Pagination

### 🔔 Alertes
- Création d'alertes personnalisées
- Mots-clés et critères de prix
- Notifications en temps réel

### 📊 Analyse
- Analyse des prix par mots-clés
- Détection automatique des bonnes affaires
- Statistiques détaillées

## 🔧 Configuration

L'interface utilise la même base de données que le bot. Assurez-vous que :
1. Le bot a déjà scrapé des données
2. La base de données est accessible
3. Les paramètres de connexion sont corrects

## 📡 API Endpoints

- `GET /api/health` - Statut de l'API
- `GET /api/listings` - Liste des annonces
- `GET /api/stats` - Statistiques
- `GET /api/alerts` - Alertes configurées
- `POST /api/alerts` - Créer une alerte
- `DELETE /api/alerts/:id` - Supprimer une alerte
- `GET /api/analyze-prices` - Analyser les prix

## 🔄 WebSocket

L'interface utilise WebSocket pour :
- Notifications en temps réel
- Mise à jour automatique des données
- Alertes instantanées

## 🎨 Interface

- Design responsive (mobile/desktop)
- Thème moderne avec Tailwind CSS
- Notifications toast
- Animations fluides
