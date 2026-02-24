# Supabase Auth Setup Guide

## ✅ Що е направено

- ✅ Supabase client library инсталиран (`@supabase/supabase-js`)
- ✅ Supabase client инициализиран (`src/utils/supabase.js`)
- ✅ Auth utility обновь с Supabase (`src/utils/auth.js`)
- ✅ Register компонент с Supabase signup
- ✅ Login компонент с Supabase signin
- ✅ Route guards за protected pages
- ✅ Email верификация в регистрацията

## 📋 Конфигурация

### 1. Създай `.env` файл в root (копирай от `.env.example`)

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Намери своите Supabase credentials

1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`  
   - **anon (public) key** → `VITE_SUPABASE_ANON_KEY`

### 3. Email Verification (Опционално)

По подразбиране Supabase изпраща потвърждаване на email при регистрация.
Потребителите трябва да кликнат на линка преди да могат да влязат.

**Конфигурирай в Supabase Dashboard:**
- Authentication → Providers → Email
- Enable Email Provider
- Custom SMTP (опционално за production)

### 4. Callback URL

Когато потребителят кликне на email линка, той е редиректнат към:
```
https://your-domain.com/auth/callback
```

**Трябва да го добавиш в Supabase:**
- Authentication → URL Configuration → Redirect URLs
- Add: `http://localhost:3000/auth/callback` (development)
- Add: `https://your-domain.com/auth/callback` (production)

## 🔄 User Flow

### Registration
1. User попълва Email + Password 
2. Кликва "Регистрация"
3. Supabase изпраща потвърждаване на email
4. User видит "✅ Регистрация успешна!"
5. User отива към Login след потвърждение на email

### Login
1. User попълва Email + Password
2. Кликва "Вход"
3. **Ако email не е потвърден** → Error: "Email not confirmed"
4. **Ако успешен** → Редирект към `/dashboard`

### Protected Routes
Следните маршрути изискват login:
- `/dashboard`
- `/polls`
- `/polls/new`
- `/polls/:id`
- `/admin`

Ако неаутентициран user опита да влезе → Редирект към `/login`

## 🧪 Testing

```javascript
// Test в console браузърa:
import { getCurrentUser, isLoggedIn } from './utils/auth.js';

getCurrentUser();  // Returns user object or null
isLoggedIn();      // Returns true/false
```

## 📱 Database Setup (后续)

След като регистрацията е working, ще трябва:

```sql
-- Create profiles table (Role: postgres or service_role)
create table profiles (
  id uuid primary key references auth.users(id),
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamp default now()
);

-- Enable RLS (Row Level Security)
alter table profiles enable row level security;

-- Users могат да видят только своя profile
create policy "Users can view their own profile"
  on profiles
  for select
  using (auth.uid() = id);
```

## 🚀 Deploy

При deploy на production:
1. Set environment variables в вашия hosting (Vercel, Netlify, etc.)
2. Добави production domain към Supabase Redirect URLs
3. Тестирай регистрация и login на staging

## ❓ Troubleshooting

**"Missing Supabase credentials"**
- Check `.env` file exists
- Restart dev server: `npm run dev`

**"Email not confirmed"**
- User трябва да потвърди email от потвърждаващия линк
- Check spam folder

**Email не стига?**
- Enable Email Provider в Supabase Dashboard
- Check email configuration in Authentication → Providers
- Per default Supabase използва Resend за emails

## 📚 Next Steps

1. ✅ Test registration & login в `npm run dev`
2. ⏭️ Направи profiles таблица
3. ⏭️ Направи Profile Settings page (за username)
4. ⏭️ Добави social OAuth (Google, GitHub) - PHASE 2
