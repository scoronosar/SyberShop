## SyberShop

Полный стек по ТЗ: NestJS + Prisma (Postgres), Redis/BullMQ (пока заглушка), React/Vite/TS + Tailwind, i18n, моковые Taobao данные, ценообразование на сервере с наценкой и сервисным сбором, логистика (карго, arrival, начисление доставки), админ-панель.

### Быстрый старт
1. Поднять базы:
   ```bash
   docker-compose up -d
   ```
2. Backend:
   ```bash
   cd backend
   cp .env.example .env   # заполните при необходимости CURRENCY_API_URL/KEY
   npm install
   npm run prisma:migrate
   npm run start:dev
   ```
   Swagger: http://localhost:4000/api/docs
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
   Открыть: http://127.0.0.1:5173/

### Основные возможности
- Auth: JWT, роли user/admin. Админ создаётся через `/admin/create-admin` (форма в админке).
- Products: моковые товары Taobao, сортировка/фильтры на фронте, сервер считает final price (курс +5% + 3% fee).
- Currency: попытка забрать внешний курс (`CURRENCY_API_URL` + `CURRENCY_API_KEY`), кэш 5 мин; без ключей — мок rate=13.
- Cart/Orders: серверные цены, создание заказа, доставка начисляется при прибытии карго.
- Logistics: создание карго, arrival распределяет доставку по заказам; трекинг на странице заказа.
- Admin: таблица заказов, создание карго/arrival, создание админов.
- Frontend: i18n (RU/EN), цена в UI зависит от роли (user — только финал, admin — исходная и разбор), модал деталей цены, таймлайн доставки.

### Env (backend)
```
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sybershop
JWT_SECRET=supersecret
REDIS_URL=redis://localhost:6379
TAOBAO_MODE=MOCK
CURRENCY_API_URL=
CURRENCY_API_KEY=
```

### Что ещё можно улучшить
- Реализовать настоящие фильтры/сортировки на бэке, кеширование продуктов.
- Полный перевод UI.
- Настоящие уведомления/почта.
- Тесты (unit/e2e), CI.

