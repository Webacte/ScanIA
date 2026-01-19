# Script de démarrage local pour ScanLeCoin
# Démarre le serveur backend et frontend

Write-Host "🌐 Démarrage de ScanLeCoin en mode local..." -ForegroundColor Cyan
Write-Host "=" * 50

# Vérifier si .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Fichier .env non trouvé" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "📋 Copie de .env.example vers .env..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Fichier .env créé. Veuillez le configurer avec vos paramètres." -ForegroundColor Green
        Write-Host "   Au minimum, configurez DB_PASSWORD si vous utilisez la base de données." -ForegroundColor Yellow
        Write-Host "   ⚠️  Si votre mot de passe contient des espaces, mettez-le entre guillemets:" -ForegroundColor Yellow
        Write-Host "      DB_PASSWORD=`"mon mot de passe`"" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Fichier .env.example non trouvé!" -ForegroundColor Red
        exit 1
    }
} else {
    # Vérifier le format de DB_PASSWORD
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DB_PASSWORD=.*\s.*" -and $envContent -notmatch 'DB_PASSWORD=".*"') {
        Write-Host "⚠️  ATTENTION: DB_PASSWORD semble contenir des espaces sans guillemets" -ForegroundColor Yellow
        Write-Host "   Si votre mot de passe contient des espaces, utilisez:" -ForegroundColor Yellow
        Write-Host "   DB_PASSWORD=`"votre mot de passe`"" -ForegroundColor Cyan
    }
}

# Vérifier les dépendances
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installation des dépendances racine..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "interface\node_modules")) {
    Write-Host "   Installation des dépendances interface..." -ForegroundColor Yellow
    Set-Location interface
    npm install
    Set-Location ..
}

Write-Host "✅ Dépendances vérifiées" -ForegroundColor Green

# Démarrer le serveur
Write-Host ""
Write-Host "🚀 Démarrage du serveur..." -ForegroundColor Cyan
Write-Host "   Le serveur sera accessible sur http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

Set-Location interface
npm start
