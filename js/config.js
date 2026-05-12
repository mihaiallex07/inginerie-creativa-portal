// ============================================================
// Portal Inginerie Creativă — Configurare
// Înlocuiește valorile de mai jos cu datele tale Supabase
// ============================================================

const APP_CONFIG = {
  // Supabase — obține din: https://app.supabase.com → Project Settings → API
  supabase: {
    url: 'YOUR_SUPABASE_URL',          // ex: https://xxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY', // cheia publică anon
  },

  // Modul demo — activ când Supabase nu este configurat
  // Setează pe false după ce ai configurat Supabase
  demoMode: true,

  // Setări aplicație
  app: {
    name: 'Inginerie Creativă',
    subtitle: 'Design & Build — Inginerie Construcții',
    version: '2.0.0',
  },

  // Roluri disponibile
  roles: {
    admin: 'admin',
    coordonator: 'coordonator',
    angajat: 'angajat',
  },
};

// Auto-detectare: dacă URL-ul Supabase este setat, dezactivează demo mode
if (APP_CONFIG.supabase.url !== 'YOUR_SUPABASE_URL' &&
    APP_CONFIG.supabase.url.startsWith('https://')) {
  APP_CONFIG.demoMode = false;
}
