# FluffyCards - Инструкция по деплою

## Структура архивов

### 1. fluffycards-server.zip
Содержит Node.js backend:
- `index.js` - точка входа сервера
- `models/` - модели MongoDB
- `routes/` - API роуты
- `middleware/` - middleware (auth)
- `package.json` - зависимости

### 2. fluffycards-client-build.zip
Содержит собранный React frontend (папка build)

---

## Требования

- Node.js 18+
- MongoDB (локальная или Atlas)
- Сервер с доступом к интернету

---

## Шаги деплоя

### 1. Развертывание Backend

```bash
# Распакуйте архив
unzip fluffycards-server.zip -d fluffycards-server
cd fluffycards-server

# Установите зависимости
npm install

# Создайте файл .env
nano .env
```

### 2. Настройка .env файла

```env
# Обязательные переменные
PORT=5001
MONGODB_URI=mongodb://localhost:27017/fluffycards
JWT_SECRET=your-super-secret-key-change-this

# Опционально
NODE_ENV=production
CLIENT_URL=https://your-domain.com
```

### 3. Настройка MongoDB

**Вариант A - MongoDB Atlas (облако):**
1. Зарегистрируйтесь на https://cloud.mongodb.com
2. Создайте кластер
3. Получите URI подключения
4. Укажите в MONGODB_URI

**Вариант B - Локальная MongoDB:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo service mongodb start

# Или используйте Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Запуск сервера

```bash
# Для разработки
npm start

# Для production (с pm2)
npm install -g pm2
pm2 start index.js --name fluffycards-server
pm2 save
pm2 startup
```

---

### 5. Развертывание Frontend

**Вариант A - Сервер раздает статику:**
```bash
# Распакуйте build в папку сервера
mkdir -p fluffycards-server/public
unzip fluffycards-client-build.zip -d fluffycards-server/public

# Или настройте nginx/apache
```

**Вариант B - Отдельный хостинг (Netlify/Vercel):**
1. Загрузите содержимое `build` папки
2. Укажите API URL в переменных окружения
3. Настройте CORS на сервере

---

## Настройка CORS

Если фронтенд и бэкенд на разных доменах, отредактируйте `server/index.js`:

```javascript
const corsOptions = {
  origin: 'https://your-frontend-domain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

## Проверка работы

1. **API Health Check:**
   ```
   GET http://your-server:5001/api/health
   ```

2. **Регистрация:**
   ```
   POST http://your-server:5001/api/auth/register
   Body: { "username": "test", "email": "test@test.com", "password": "123456", "role": "student" }
   ```

3. **Вход:**
   ```
   POST http://your-server:5001/api/auth/login
   Body: { "email": "test@test.com", "password": "123456" }
   ```

---

## Устранение неполадок

### Проблема: "Не удается подключиться к MongoDB"
**Решение:** Проверьте строку подключения в MONGODB_URI

### Проблема: "CORS error"
**Решение:** Убедитесь что origin в corsOptions совпадает с доменом фронтенда

### Проблема: "Порт занят"
**Решение:** Измените PORT в .env или освободите порт 5001

---

## Контакты

При возникновении проблем проверьте:
1. Логи сервера: `pm2 logs fluffycards-server`
2. Доступность MongoDB: `mongo --eval "db.adminCommand('ping')"`
3. Открыт ли порт: `netstat -tlnp | grep 5001`
