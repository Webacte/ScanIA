# Script pour pousser les mises à jour sur GitHub
# Usage: .\push-updates.ps1

Write-Host "🚀 Préparation du push vers GitHub..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que .env n'est pas dans le staging
Write-Host "Vérification des fichiers sensibles..." -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only 2>$null
if ($stagedFiles -match "\.env$") {
    Write-Host "❌ ERREUR: Fichier .env détecté dans le staging!" -ForegroundColor Red
    Write-Host "   Exécutez: git reset .env" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Aucun fichier .env dans le staging" -ForegroundColor Green

# Ajouter tous les fichiers modifiés (sauf ceux dans .gitignore)
Write-Host ""
Write-Host "Ajout des fichiers modifiés..." -ForegroundColor Yellow
git add -A

# Afficher le statut
Write-Host ""
Write-Host "Fichiers à commiter:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "✅ Prêt pour le commit!" -ForegroundColor Green
Write-Host ""
Write-Host "Commandes à exécuter:" -ForegroundColor Yellow
Write-Host "  git commit -m 'fix: amélioration gestion erreurs DB, correction nom base de données (scania), ajout scripts démarrage local et documentation'" -ForegroundColor Cyan
Write-Host "  git push origin main" -ForegroundColor Cyan
Write-Host ""
