# Script PowerShell pour preparer et pousser le projet sur GitHub
# Usage: .\PUSH_TO_GITHUB.ps1

$ErrorActionPreference = "Stop"

Write-Host "Preparation du push vers GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verifications prealables
Write-Host "Verifications prealables..." -ForegroundColor Yellow

if (-not (Test-Path ".env.example")) {
    Write-Host "ERREUR: .env.example manquant!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: .env.example present" -ForegroundColor Green

if (-not (Test-Path "LICENSE")) {
    Write-Host "ERREUR: LICENSE manquant!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: LICENSE present" -ForegroundColor Green

if (-not (Test-Path "README.md")) {
    Write-Host "ERREUR: README.md manquant!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: README.md present" -ForegroundColor Green

# Verifier si Git est initialise
if (-not (Test-Path ".git")) {
    Write-Host ""
    Write-Host "Initialisation du depot Git..." -ForegroundColor Yellow
    git init
    Write-Host "OK: Depot Git initialise" -ForegroundColor Green
}

# Verifier si le remote existe
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Ajout du remote GitHub..." -ForegroundColor Yellow
    git remote add origin https://github.com/Webacte/ScanLeCoin.git
    Write-Host "OK: Remote ajoute" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "OK: Remote GitHub deja configure: $remoteExists" -ForegroundColor Green
}

# Supprimer du suivi les fichiers sensibles (si trackes)
Write-Host ""
Write-Host "Nettoyage des fichiers sensibles du suivi Git..." -ForegroundColor Yellow

$filesToRemove = @(
    "client_secret_293151053462-3cjailbd6p5rd8j27pp7l3jn8loaki0t.apps.googleusercontent.com.json",
    "captcha-saves",
    "current-leboncoin.html",
    ".env",
    ".env.local",
    ".env.production"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        git rm --cached $file 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK: Retire du suivi: $file" -ForegroundColor Green
        }
    }
}

# Ajouter tous les fichiers
Write-Host ""
Write-Host "Ajout des fichiers au staging..." -ForegroundColor Yellow
git add .
Write-Host "OK: Fichiers ajoutes" -ForegroundColor Green

# Afficher le statut
Write-Host ""
Write-Host "Statut Git:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "VERIFICATIONS FINALES:" -ForegroundColor Yellow
Write-Host "  1. Verifiez qu'aucun fichier .env n'est dans le staging (ci-dessus)"
Write-Host "  2. Verifiez qu'aucun client_secret*.json n'est dans le staging"
Write-Host "  3. Verifiez que .env.example est present"
Write-Host ""
Write-Host "Commandes suivantes (a executer manuellement):" -ForegroundColor Cyan
Write-Host "  git commit -m 'chore: preparation repo public - secrets, .env.example, README, LICENSE, nettoyage'"
Write-Host "  git branch -M main"
Write-Host "  git push -u origin main"
Write-Host ""
Write-Host "IMPORTANT: Si client_secret*.json a ete commite avant, revocation dans Google Cloud Console!" -ForegroundColor Red
