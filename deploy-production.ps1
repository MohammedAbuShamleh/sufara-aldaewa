# PowerShell Script for deploying the application to production server
# Usage: .\deploy-production.ps1

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success {
    Write-Host "✅ $args" -ForegroundColor Green
}

function Write-Warning {
    Write-Host "⚠️  $args" -ForegroundColor Yellow
}

function Write-Error {
    Write-Host "❌ $args" -ForegroundColor Red
}

function Write-Info {
    Write-Host "ℹ️  $args" -ForegroundColor Cyan
}

# Check if running from project root
if (-not (Test-Path "backend\artisan")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting production deployment process..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# Backend deployment
# ============================================
Write-Info "📦 Deploying Backend (Laravel)..."
Set-Location backend

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Creating from .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Warning "Please update .env file with your production settings before continuing!"
        Write-Warning "Press Enter after updating .env file..."
        Read-Host
    } else {
        Write-Error ".env.example not found. Please create .env manually."
        exit 1
    }
}

# Install dependencies
Write-Info "Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction
if ($LASTEXITCODE -eq 0) {
    Write-Success "Composer dependencies installed"
} else {
    Write-Error "Failed to install Composer dependencies"
    exit 1
}

# Generate APP_KEY if not set
Write-Info "Checking APP_KEY..."
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "APP_KEY=base64:") {
    Write-Info "Generating APP_KEY..."
    php artisan key:generate --force
    Write-Success "APP_KEY generated"
} else {
    Write-Success "APP_KEY already exists"
}

# Run migrations
Write-Info "Running database migrations..."
php artisan migrate --force
if ($LASTEXITCODE -eq 0) {
    Write-Success "Database migrations completed"
} else {
    Write-Error "Database migrations failed. Please check your database configuration."
    exit 1
}

# Create storage link
Write-Info "Creating storage link..."
php artisan storage:link 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Storage link created"
} else {
    Write-Warning "Storage link may already exist"
}

# Clear and cache config
Write-Info "Optimizing Laravel..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

php artisan config:cache
php artisan route:cache
php artisan view:cache

Write-Success "Laravel optimized"

Set-Location ..

# ============================================
# Frontend deployment
# ============================================
Write-Info "📦 Deploying Frontend (React)..."
Set-Location frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Info "Installing npm dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install npm dependencies"
        exit 1
    }
    Write-Success "npm dependencies installed"
} else {
    Write-Info "Updating npm dependencies..."
    npm install
}

# Build for production
Write-Info "Building React application for production..."
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend built successfully"
} else {
    Write-Error "Frontend build failed"
    exit 1
}

# Check if dist directory exists
if (-not (Test-Path "dist")) {
    Write-Error "dist directory not found after build"
    exit 1
}

# Copy .htaccess to dist if it exists in public
if (Test-Path "public\.htaccess") {
    Copy-Item "public\.htaccess" "dist\.htaccess"
    Write-Success ".htaccess copied to dist"
}

Set-Location ..

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Success "✅ Deployment completed successfully!"
Write-Host ""
Write-Warning "⚠️  Important next steps:"
Write-Host ""
Write-Host "   1. ✅ Verify .env file has correct production settings"
Write-Host "   2. ✅ Update CORS_ALLOWED_ORIGINS in backend\.env"
Write-Host "   3. ✅ Configure web server (Apache/Nginx)"
Write-Host "   4. ✅ Set backend\public as document root for API"
Write-Host "   5. ✅ Set frontend\dist as document root for frontend"
Write-Host "   6. ✅ Test the application:"
Write-Host "      - Frontend: https://yourdomain.com"
Write-Host "      - API: https://api.yourdomain.com/api/forms"
Write-Host ""
Write-Info "📝 Check DEPLOY_CHECKLIST.md for detailed instructions"
Write-Host ""
