# Workout Journal

PWA для iPhone, разработка и деплой без Mac.

## Windows

1. Установить Node.js LTS.
2. Скачать/клонировать репозиторий.
3. В каталоге проекта:
   npm install
   npm run dev
4. Открыть адрес Vite в браузере.

## Production

npm run build

Готовая папка `dist/` может быть опубликована на GitHub Pages, Vercel или другом статическом хостинге.

## Supabase

1. Создать проект Supabase.
2. Выполнить `supabase/schema.sql` в SQL Editor.
3. Включить Email Auth.
4. Создать `.env.local` на основе `.env.example`.
5. Добавить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.

Важно: текущий интерфейс уже имеет локальный режим и экспорт/импорт JSON. Полная синхронизация с Supabase и экран регистрации требуют подключения Auth и переноса CRUD-операций на Supabase API.

## iPhone

Открыть опубликованный HTTPS-адрес в Safari → Поделиться → На экран «Домой».

Ограничение iOS/PWA: фоновые таймеры и звук при заблокированном экране зависят от политики Safari/iOS. В активном окне таймер работает через Web Audio API.