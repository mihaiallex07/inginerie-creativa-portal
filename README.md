# Portal Inginerie Creativă

Portal intern pentru echipa Inginerie Creativă — HTML/CSS/JS pur + Supabase.

## Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla) — zero build tools
- **Backend:** [Supabase](https://supabase.com) (Auth, Database, Storage, Realtime)
- **Deploy:** GitHub Pages (automat la fiecare push pe `main`)

## Structură

```
portal-ic/
├── index.html              # Aplicația SPA principală
├── css/
│   └── styles.css          # Tema brand IC (navy/galben/alb)
├── js/
│   ├── config.js           # Configurare Supabase (editabil local)
│   ├── supabase-client.js  # Client Supabase + dbQuery helper
│   ├── app.js              # Router SPA + orchestrator
│   ├── services/
│   │   ├── auth.js         # Autentificare (email + Google OAuth)
│   │   └── data.js         # Servicii date + date demo
│   ├── ui/
│   │   └── components.js   # Utilitare UI reutilizabile
│   └── modules/
│       ├── dashboard.js    # Tablou de bord
│       ├── time-tracking.js
│       ├── proiecte.js
│       ├── stiri.js
│       ├── documente.js
│       ├── procese.js
│       ├── propuneri.js
│       ├── organigrama.js
│       ├── profil.js
│       ├── notificari.js
│       ├── process-overview.js
│       └── admin.js
└── .github/workflows/
    └── pages.yml           # Deploy automat GitHub Pages
```

## Deploy pe GitHub Pages

### 1. Activează GitHub Pages

În repository → **Settings** → **Pages** → Source: **GitHub Actions**

### 2. Adaugă variabilele Supabase (opțional)

În repository → **Settings** → **Variables** → **Actions** → New repository variable:

| Variabilă | Valoare |
|-----------|---------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> Fără variabile, aplicația rulează în **mod demo** cu date locale.

### 3. Push și deploy automat

```bash
git add -A
git commit -m "Update portal"
git push origin main
```

Deploy-ul durează ~1 minut. Site-ul va fi disponibil la:
`https://mihaiallex07.github.io/portal-ic`

## Configurare Supabase

### Schema bază de date

Rulează `supabase/schema.sql` în Supabase SQL Editor.

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. OAuth 2.0 Client ID → Authorized redirect URIs:
   - `https://[project-id].supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → activează

## Rulare locală

```bash
# Orice server HTTP static
python3 -m http.server 8080
# sau
npx serve .
```

Deschide `http://localhost:8080`

## Mod demo

Fără Supabase configurat, aplicația rulează cu date demo locale.
Poți testa toate funcționalitățile fără cont Supabase.
