# Guide de dépannage - ScanLeCoin

## Problème : Erreur 500 lors de la création d'objets

### Si votre mot de passe PostgreSQL contient des espaces

Dans le fichier `.env`, vous devez mettre le mot de passe entre **guillemets** :

```env
# ❌ INCORRECT (si le mot de passe contient des espaces)
DB_PASSWORD=mon mot de passe avec espaces

# ✅ CORRECT
DB_PASSWORD="mon mot de passe avec espaces"
```

### Vérification de la configuration

1. **Vérifier que le fichier .env existe** :
   ```bash
   # À la racine du projet
   cat .env
   # ou sur Windows
   type .env
   ```

2. **Vérifier que les variables sont bien chargées** :
   - Redémarrez le serveur après modification de `.env`
   - Regardez les logs au démarrage : vous devriez voir "✅ DB_PASSWORD détecté"

3. **Tester la connexion à la base de données** :
   - Ouvrez http://localhost:3000/api/db-test dans votre navigateur
   - Cela vous dira exactement quelle erreur se produit

### Erreurs courantes et solutions

#### Erreur 28P01 : Erreur d'authentification
- **Cause** : Mot de passe ou nom d'utilisateur incorrect
- **Solution** : 
  - Vérifiez `DB_USER` et `DB_PASSWORD` dans `.env`
  - Si le mot de passe contient des espaces, mettez-le entre guillemets
  - Vérifiez que vous n'avez pas d'espaces avant/après les valeurs

#### Erreur 42P01 : Table n'existe pas
- **Cause** : Le schéma de base de données n'a pas été initialisé
- **Solution** :
  ```bash
  npm run db:init-recognition
  ```

#### Erreur ECONNREFUSED : Impossible de se connecter
- **Cause** : PostgreSQL n'est pas démarré ou mauvais host/port
- **Solution** :
  - Vérifiez que PostgreSQL est démarré
  - Vérifiez `DB_HOST` (par défaut: localhost) et `DB_PORT` (par défaut: 5432)

#### Erreur 3D000 : Base de données non trouvée
- **Cause** : La base de données spécifiée dans `DB_NAME` n'existe pas
- **Solution** :
  - Créez la base de données : `CREATE DATABASE scania;`
  - Ou modifiez `DB_NAME` dans `.env` pour pointer vers une base existante

### Format correct du fichier .env

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scania
DB_USER=postgres
DB_PASSWORD="mon mot de passe avec espaces"  # ← Guillemets si espaces

# Interface
INTERFACE_PORT=3000
INTERFACE_HOST=localhost
```

### Commandes utiles

```bash
# Tester la connexion PostgreSQL directement
psql -h localhost -U postgres -d scania

# Vérifier que les tables existent
psql -h localhost -U postgres -d scania -c "\dt marketplace.*"

# Initialiser le schéma de reconnaissance d'images
npm run db:init-recognition
```
