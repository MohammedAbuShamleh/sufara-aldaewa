#!/bin/bash

# Script for deploying the application to production server
# Usage: ./deploy-production.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on server
if [ ! -f "backend/artisan" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "🚀 Starting production deployment process..."
echo ""

# ============================================
# Backend deployment
# ============================================
print_info "📦 Deploying Backend (Laravel)..."
cd backend

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Please update .env file with your production settings before continuing!"
        print_warning "Press Enter after updating .env file..."
        read
    else
        print_error ".env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Install dependencies
print_info "Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction
if [ $? -eq 0 ]; then
    print_success "Composer dependencies installed"
else
    print_error "Failed to install Composer dependencies"
    exit 1
fi

# Generate APP_KEY if not set
print_info "Checking APP_KEY..."
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    print_info "Generating APP_KEY..."
    php artisan key:generate --force
    print_success "APP_KEY generated"
else
    print_success "APP_KEY already exists"
fi

# Run migrations
print_info "Running database migrations..."
php artisan migrate --force
if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed. Please check your database configuration."
    exit 1
fi

# Create storage link
print_info "Creating storage link..."
php artisan storage:link 2>/dev/null || print_warning "Storage link may already exist"
print_success "Storage link created"

# Clear and cache config
print_info "Optimizing Laravel..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

php artisan config:cache
php artisan route:cache
php artisan view:cache

print_success "Laravel optimized"

# Set permissions
print_info "Setting permissions..."
if [ -d "storage" ]; then
    chmod -R 775 storage
    print_success "Storage permissions set"
fi

if [ -d "bootstrap/cache" ]; then
    chmod -R 775 bootstrap/cache
    print_success "Bootstrap cache permissions set"
fi

# Try to set ownership (may require sudo)
if command -v www-data &> /dev/null; then
    sudo chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || print_warning "Could not change ownership (may require sudo)"
fi

cd ..

# ============================================
# Frontend deployment
# ============================================
print_info "📦 Deploying Frontend (React)..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing npm dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "npm dependencies installed"
    else
        print_error "Failed to install npm dependencies"
        exit 1
    fi
else
    print_info "Updating npm dependencies..."
    npm install
fi

# Build for production
print_info "Building React application for production..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    print_error "dist directory not found after build"
    exit 1
fi

# Copy .htaccess to dist if it exists in public
if [ -f "public/.htaccess" ]; then
    cp public/.htaccess dist/.htaccess
    print_success ".htaccess copied to dist"
fi

cd ..

# ============================================
# Summary
# ============================================
echo ""
print_success "✅ Deployment completed successfully!"
echo ""
print_warning "⚠️  Important next steps:"
echo ""
echo "   1. ✅ Verify .env file has correct production settings"
echo "   2. ✅ Update CORS_ALLOWED_ORIGINS in backend/.env"
echo "   3. ✅ Configure web server (Apache/Nginx)"
echo "   4. ✅ Set backend/public as document root for API"
echo "   5. ✅ Set frontend/dist as document root for frontend"
echo "   6. ✅ Test the application:"
echo "      - Frontend: https://yourdomain.com"
echo "      - API: https://api.yourdomain.com/api/forms"
echo ""
print_info "📝 Check DEPLOY_CHECKLIST.md for detailed instructions"
echo ""
