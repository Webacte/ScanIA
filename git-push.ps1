# Script pour commit et push automatique
Write-Host "🚀 Commit et push vers GitHub..." -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est sur la branche main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "⚠️  Vous n'êtes pas sur la branche main (actuellement: $currentBranch)" -ForegroundColor Yellow
    $continue = Read-Host "Continuer quand même? (o/n)"
    if ($continue -ne "o") {
        exit 1
    }
}

# Ajouter tous les fichiers
Write-Host "Ajout des fichiers..." -ForegroundColor Yellow
git add -A

# Vérifier qu'aucun .env n'est dans le staging
$staged = git diff --cached --name-only
if ($staged -match "\.env$") {
    Write-Host "❌ ERREUR: Fichier .env détecté dans le staging!" -ForegroundColor Red
    Write-Host "   Retrait du staging..." -ForegroundColor Yellow
    git reset HEAD .env
}

# Afficher le statut
Write-Host ""
Write-Host "Fichiers à commiter:" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "Création du commit..." -ForegroundColor Yellow
git commit -m "fix: amélioration gestion erreurs DB, correction nom base de données (scania), ajout scripts démarrage local et documentation"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit créé avec succès" -ForegroundColor Green
    
    # Push
    Write-Host ""
    Write-Host "Push vers GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Push réussi!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors du push" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du commit (peut-être aucun changement?)" -ForegroundColor Red
    exit 1
}
