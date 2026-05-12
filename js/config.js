// ============================================================
// Portal Inginerie Creativă — Configurare
// Înlocuiește valorile de mai jos cu datele tale Supabase
// ============================================================

const APP_CONFIG = {
  // Supabase — obține din: https://app.supabase.com → Project Settings → API
  supabase: {
    url: 'https://ofknvxwcqwgnthnvslfl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma252eHdjcXdnbnRobnZzbGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDIwNTcsImV4cCI6MjA5NDE3ODA1N30.HhI-MAeGlmFIIEfL1mDWxQhKBbCPDn3qgaSKBS9otS8',
  },

  // Modul demo — activ când Supabase nu este configurat
  // Setează pe false după ce ai configurat Supabase
  demoMode: false,

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
  // Restricție domeniu email
  allowedDomain: 'ingineriecreativa.ro',
};

// Auto-detectare: dacă URL-ul Supabase este setat, dezactivează demo mode
if (APP_CONFIG.supabase.url !== 'YOUR_SUPABASE_URL' &&
    APP_CONFIG.supabase.url.startsWith('https://')) {
  APP_CONFIG.demoMode = false;
}
