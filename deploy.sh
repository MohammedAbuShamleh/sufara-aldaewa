#!/bin/bash

# Script for deploying the application to production server

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backend deployment
echo -e "${YELLOW}📦 Building Backend...${NC}"
cd backend

# Install dependencies
echo "Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Clear and cache config
echo "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
echo "Setting permissions..."
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chown -R www-data:www-data storage
chown -R www-data:www-data bootstrap/cache

cd ..

# Frontend deployment
echo -e "${YELLOW}📦 Building Frontend...${NC}"
cd frontend

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Build for production
echo "Building React application..."
npm run build

cd ..

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "   1. Update .env file with production settings"
echo "   2. Set APP_KEY in backend/.env"
echo "   3. Configure database connection"
echo "   4. Update CORS settings in backend/config/cors.php"
echo "   5. Upload dist/ folder to web server"
echo "   6. Configure web server (Apache/Nginx)"
