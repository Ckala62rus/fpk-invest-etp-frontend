# SPA ЭТП ФПК «Инвест»

Отдельный фронтенд (Vue 3 Composition API + Pinia + Element Plus + Vue Router).
Свой Docker Compose, не зависит от backend compose.
Репозиторий: https://github.com/Ckala62rus/fpk-invest-etp-frontend.git

## Локально (без Docker)

Нужен поднятый бэк: `http://localhost:8200` (см. backend `docker/scripts/dev-up.ps1`).

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Открыть: http://localhost:5173  
Vite проксирует `/api` и `/sanctum` на `VITE_API_PROXY_TARGET`.

Вход super_admin (из сидера бэка): ИНН `770000000000`, пароль `password`.

Пошаговая инструкция (гость → регистрация → админка → аукцион в двух браузерах → MailHog):  
`documentation/agent-notes/13-portal-user-guide.md` (в корне монорепо `etp`, не в этом git).

## Docker

```bash
# Dev с HMR
docker compose --profile dev up

# После npm run build — статика через nginx
npm run build
docker compose --profile prod up
```

## Что не в git

Каталог `frontend/` (вложенный): `demo1` (шаблон), `example` (Laravel+Inertia), старый `src` — только локальный reference. В `.gitignore`.

## Структура (как в reference axios/api/store)

```
src/
  api/axios.js          — клиент + CSRF Sanctum
  api/urls.js           — константы путей
  api/modules/*         — методы API по доменам
  stores/auth.js        — Pinia (вместо Vuex), Composition API
  constants/roles.js    — RBAC slug’и
  helpers/              — localStorage, cookies
  router/               — маршруты + guards
  layouts/              — public / cabinet / admin
  pages/
```

## Поддомены на Ubuntu

- `api.domain.ru` → backend compose  
- `etp.domain.ru` → этот фронт  
- На бэке: `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN=.domain.ru`
