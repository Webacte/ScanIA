# Guide de démarrage local - ScanLeCoin

## Démarrage rapide

### Option 1 : Script PowerShell (Windows)
```powershell
.\start-local.ps1
```

### Option 2 : Commandes manuelles

1. **Installer les dépendances** (si pas déjà fait) :
```bash
# À la racine du projet
npm install

# Dans le dossier interface
cd interface
npm install
cd ..
```

2. **Configurer les variables d'environnement** :
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env et configurer au minimum :
# - DB_PASSWORD (si vous utilisez PostgreSQL)
# - INTERFACE_PORT (par défaut: 3000)
```

3. **Démarrer le serveur** :
```bash
npm run interface
```

Ou directement :
```bash
cd interface
npm start
```

## Accès à l'interface

Une fois le serveur démarré, ouvrez votre navigateur sur :
- **http://localhost:3000** (ou le port configuré dans INTERFACE_PORT)

## Configuration minimale

Pour démarrer sans base de données (mode développement) :
- Le serveur démarrera mais les fonctionnalités nécessitant la DB seront indisponibles
- Vous verrez des avertissements dans la console

Pour une utilisation complète :
- Configurez PostgreSQL
- Renseignez DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD dans .env
- Initialisez le schéma de base de données si nécessaire

## Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 3000 (ou celui configuré) n'est pas déjà utilisé
- Vérifiez que toutes les dépendances sont installées (`npm install` dans les deux dossiers)

### Erreurs de base de données
- Le serveur peut démarrer sans DB, mais certaines fonctionnalités seront limitées
- Vérifiez votre configuration PostgreSQL dans .env
- Assurez-vous que PostgreSQL est démarré

### Erreurs de dépendances
- Supprimez `node_modules` et `package-lock.json` dans les deux dossiers
- Réinstallez : `npm install` dans chaque dossier
