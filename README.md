# FluffyCards

Платформа для изучения и запоминания информации с помощью карточек, тестов и игр.

## Функции

- **Карточки** — классический режим с 3D-переворотом и озвучкой
- **Заучивание** — адаптивный режим с множественным выбором
- **Письмо** — ввод терминов с проверкой
- **Правописание** — аудио-режим с озвучкой
- **Игры** — Match, Gravity, Live
- **Тесты** — конструктор с разными типами вопросов
- **AI** — подсказки определений и подбор изображений
- **Библиотека** — публичные наборы карточек
- **Социальное** — друзья, челленджи, рейтинги

## Стек

**Frontend:** React 18, React Router, Styled Components  
**Backend:** Node.js, Express, MongoDB, Mongoose  
**AI:** OpenAI API, Unsplash API, Web Speech API

## Установка

```bash
# Клонировать
git clone [url]
cd fluffycards

# Backend
cd server
npm install
```

### Деплой на production

1. Создать папку uploads:
   ```bash
   sudo mkdir -p /var/www/fluffycards/uploads
   sudo chown -R www-data:www-data /var/www/fluffycards/uploads
   sudo chmod -R 755 /var/www/fluffycards/uploads
   ```

2. Установить зависимости сервера:
   ```bash
   cd server && npm install && cd ..
   ```

3. Собрать клиент:
   ```bash
   cd client && npm run build && cd ..
   ```

4. Копировать билд:
   ```bash
   sudo rm -rf /var/www/fluffycards/*
   sudo cp -r client/build/* /var/www/fluffycards/
   sudo chown -R www-data:www-data /var/www/fluffycards
   ```

5. Настроить nginx (см. конфиг в nginx/fluffycards.conf) и перезагрузить:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. Запустить API сервер:
   ```bash
   sudo systemctl restart fluffycards-api
   ```
