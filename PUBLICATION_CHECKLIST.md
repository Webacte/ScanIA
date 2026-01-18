# Checklist « prêt à push » et commandes Git

## Checklist avant push

- [ ] Aucun fichier `.env` ou variante dans le dépôt ; `.env.example` présent.
- [ ] Aucun `client_secret*`, `*credentials*.json`, `*service-account*.json`, `*.pem`, `*.key` ; `proxyServer/` et `ResidentialProxies.txt` dans `.gitignore`.
- [ ] Aucun mot de passe / secret en dur dans le code ; config via `process.env`.
- [ ] `.gitignore` à jour (`dist/`, `node_modules/`, `captcha-saves/`, `*.log`, etc.).
- [ ] `npm install` et `npm run interface:install` OK.
- [ ] `npm run build` OK.
- [ ] `npm run production:test` et `npm run interface` lançables avec un `.env` valide.
- [ ] README à jour (variables d’environnement, notes scraping).
- [ ] `LICENSE` (MIT) en place.
- [ ] Sur GitHub : Description et topics (leboncoin, scraper, alerts, puppeteer, postgresql, nodejs, typescript, express) dans Settings du dépôt.

## Commandes Git (à exécuter si les fichiers sont encore suivis)

Sous Git Bash / Linux / macOS : remplacer `2>nul` par `2>/dev/null`.

```bash
# Supprimer du suivi le fichier sensible (s’il a été commité)
git rm --cached "client_secret_293151053462-3cjailbd6p5rd8j27pp7l3jn8loaki0t.apps.googleusercontent.com.json" 2>nul

# Supprimer du suivi les dossiers/fichiers désormais ignorés
git rm -r --cached captcha-saves 2>nul
git rm --cached current-leboncoin.html 2>nul
git rm --cached .env 2>nul
git rm --cached .env.local 2>nul
git rm --cached .env.production 2>nul

# Ajouter les changements et commiter
git add .
git status
git commit -m "chore: préparation repo public - secrets, .env.example, README, LICENSE, nettoyage"
```

---

## Alerte : secrets dans l’historique Git

Le fichier  
`client_secret_293151053462-3cjailbd6p5rd8j27pp7l3jn8loaki0t.apps.googleusercontent.com.json`  
**a contenu un `client_secret` Google** (`GOCSPX-...`).

**Si ce fichier a déjà été commité**, il reste dans l’historique. Pour vérifier :

```bash
git log --all --oneline -- "client_secret*.json"
```

**Recommandations :**

1. **Révoquer** ce `client_secret` (et le `client_id` associé) dans [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Identifiants, et en créer de nouveaux pour la prod.
2. **Nettoyage d’historique** (optionnel) : avec `git filter-repo` ou `git filter-branch` pour supprimer le fichier de tout l’historique. Opération lourde (réécriture d’historique, force-push) ; à faire seulement si le dépôt n’est pas encore partagé ou après accord des contributeurs.
