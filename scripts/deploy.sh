#!/bin/bash
set -e

echo "🚀 Деплой FluffyCards..."

REPO_DIR="$HOME/fluffycards"
UPLOADS_DIR="/var/www/fluffycards/uploads"

cd $REPO_DIR
git pull origin main

# Проверка: не осталось ли http://...:5001 в коде
if grep -r ":5001" client/src/ 2>/dev/null; then
    echo "❌ Ошибка: найдены остатки :5001 в коде!"
    exit 1
fi

# Установка зависимостей сервера
cd server
npm install

# Сборка клиента
cd ../client
npm install
npm run build

# Деплой статики (ВАЖНО: содержимое build, а не саму папку)
sudo rm -rf /var/www/fluffycards/index.html /var/www/fluffycards/static /var/www/fluffycards/asset-manifest.json
sudo cp -r build/* /var/www/fluffycards/

# Создание папки uploads
sudo mkdir -p $UPLOADS_DIR
sudo chown -R $USER:$USER $UPLOADS_DIR

# Обновление nginx
sudo cp nginx/fluffycards.conf /etc/nginx/sites-available/fluffycards
sudo nginx -t && sudo systemctl reload nginx

# Перезапуск бэкенда
cd ../server
pkill -f "node index.js" || true
nohup npm start > server.log 2>&1 &

echo "✅ Деплой завершен!"
