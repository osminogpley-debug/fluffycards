#!/bin/bash
set -e

echo "🚀 Деплой FluffyCards..."

REPO_DIR="$HOME/fluffycards"

cd $REPO_DIR
git pull origin main

# Check for leftover :5001
if grep -r ":5001" client/src/ 2>/dev/null; then
    echo "❌ Ошибка: найдены остатки :5001 в коде!"
    exit 1
fi

# Server
cd server
npm install

# Client
cd ../client
npm install
npm run build

# Деплой (ВАЖНО: НЕ удаляем uploads!)
sudo rm -rf /var/www/fluffycards/index.html /var/www/fluffycards/static /var/www/fluffycards/asset-manifest.json 2>/dev/null || true
sudo cp -r build/* /var/www/fluffycards/

# Права на uploads
sudo chown -R www-data:www-data /var/www/fluffycards/uploads 2>/dev/null || true
sudo chmod 755 /var/www/fluffycards/uploads 2>/dev/null || true

# Nginx
sudo nginx -t && sudo systemctl reload nginx

# Restart backend
cd ../server
pkill -f "node index.js" || true
sleep 2
nohup npm start > server.log 2>&1 &

echo "✅ Деплой завершен!"
