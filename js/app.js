// ============================================================
// App.js — Portal Inginerie Creativă
// Orchestrator principal: auth, routing, sidebar, UI
// NOTE: getTodayStr, getDateStr, formatDate, timeAgo, updateNotifBadge
//       sunt definite în data.js / notificari.js — nu le redefinim aici
// ============================================================

// ── ROUTES ──────────────────────────────────────────────────
const ROUTES = {
  'dashboard':         { label: 'Tablou de bord',       module: () => Dashboard.render() },
  'stiri':             { label: 'Știri & Anunțuri',      module: () => Stiri.render() },
  'time-tracking':     { label: 'Time-Tracking',         module: () => TimeTracking.render() },
  'process-overview':  { label: 'Process Overview',      module: () => ProcessOverview.render() },
  'proiecte':          { label: 'Proiecte',              module: () => Proiecte.render() },
  'formulare':         { label: 'Formulare & Cereri',    module: () => Placeholder.render('Formulare & Cereri', 'Formularele și cererile interne vor fi disponibile în curând.', 'file-text') },
  'viziune':           { label: 'Viziune & Valori',      module: () => Placeholder.render('Viziune & Valori', 'Misiunea, viziunea și valorile companiei Inginerie Creativă.', 'home') },
  'regulament':        { label: 'Regulament intern',     module: () => Placeholder.render('Regulament intern', 'Regulamentul intern al companiei va fi disponibil în curând.', 'book') },
  'procese-proceduri': { label: 'Procese & Proceduri',   module: () => Procese.render() },
  'biblioteca':        { label: 'Bibliotecă tehnică',    module: () => Placeholder.render('Bibliotecă tehnică', 'Biblioteca de standarde, normative și detalii tehnice.', 'book-open') },
  'organigrama':       { label: 'Organigramă',           module: () => Organigrama.render() },
  'documente':         { label: 'Documentele mele',      module: () => Documente.render() },
  'propuneri':         { label: 'Propunerile mele',      module: () => Propuneri.render() },
  'notificari':        { label: 'Notificări',            module: () => Notificari.render() },
  'profil':            { label: 'Profilul meu',          module: () => Profil.render() },
  'admin-utilizatori': { label: 'Utilizatori',           module: () => Admin.render(), adminOnly: true },
  'evenimente':        { label: 'Evenimente Firmă',      module: () => Placeholder.render('Evenimente Firmă', 'Calendarul evenimentelor companiei va fi disponibil în curând.', 'calendar') },
};

let currentRoute = 'dashboard';
let sidebarCollapsed = false;

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  const profile = await Auth.init();

  if (profile) {
    showApp(Auth.currentUser, profile);
  } else if (!APP_CONFIG.demoMode) {
    const sb = getSupabase();
    if (sb) {
      sb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          Auth.currentUser = session.user;
          await Auth.loadProfile(session.user.id);
          showApp(session.user, Auth.currentProfile);
        } else if (event === 'SIGNED_OUT') {
          Auth.currentUser = null;
          Auth.currentProfile = null;
          showLogin();
        }
      });
    }
  }
});

// ── SHOW APP ──────────────────────────────────────────────────
function showApp(user, profile) {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.body.classList.remove('auth-bg');
  document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;width:100%;height:100%';

  // Update topbar avatar initials
  const topbarAvatar = document.getElementById('topbar-avatar');
  if (topbarAvatar) topbarAvatar.textContent = Auth.getInitials(profile?.full_name);

  // Update sidebar user block
  updateSidebarUser();

  // Show/hide admin section
  const adminSection = document.getElementById('admin-section');
  if (adminSection) adminSection.style.display = Auth.isAdmin() ? 'block' : 'none';

  // Update notification badge (defined in notificari.js)
  if (typeof updateNotifBadge === 'function') updateNotifBadge();

  // Hash routing
  const hash = window.location.hash.replace('#/', '');
  const route = ROUTES[hash] ? hash : 'dashboard';
  navigate(route, null);

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#/', '');
    if (ROUTES[h]) navigate(h, null, true);
  });
}

// ── SHOW LOGIN ────────────────────────────────────────────────
function showLogin() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-page').style.display = 'flex';
  document.body.classList.add('auth-bg');
  document.body.style.cssText = '';
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  if (emailEl) emailEl.value = '';
  if (passEl) passEl.value = '';
  ['login-error', 'register-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  });
}

// ── NAVIGATION ────────────────────────────────────────────────
async function navigate(route, linkEl, fromHash = false) {
  if (!ROUTES[route]) return;
  currentRoute = route;

  if (!fromHash) window.location.hash = '/' + route;

  // Active state in sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === route);
  });

  // Page title
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = ROUTES[route].label;

  // Show loading
  setPageLoading(true);

  try {
    await ROUTES[route].module();
  } catch (err) {
    console.error('[Navigate] Error:', err);
    document.getElementById('page-content').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:300px">
        <div style="text-align:center">
          <div style="font-size:40px;margin-bottom:12px">⚠️</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:6px">Eroare la încărcare</div>
          <div style="font-size:13px;color:var(--text-muted)">${err.message || 'Eroare necunoscută'}</div>
          <button class="btn-primary" style="margin-top:16px" onclick="navigate('${route}', null)">Reîncearcă</button>
        </div>
      </div>
    `;
  }

  // Close mobile sidebar
  if (window.innerWidth < 768) {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
  }
}

// ── SIDEBAR ───────────────────────────────────────────────────
function updateSidebarUser() {
  const profile = Auth.currentProfile;
  if (!profile) return;
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  if (avatarEl) avatarEl.textContent = Auth.getInitials(profile.full_name);
  if (nameEl) nameEl.textContent = profile.full_name || 'Utilizator';
  if (roleEl) {
    const roleMap = { admin: 'Administrator', angajat: 'Angajat' };
    roleEl.textContent = roleMap[profile.role] || profile.role || 'Angajat';
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainWrapper = document.getElementById('main-wrapper');
  if (!sidebar) return;
  sidebarCollapsed = !sidebarCollapsed;
  sidebar.classList.toggle('collapsed', sidebarCollapsed);
  if (mainWrapper) mainWrapper.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = sidebarCollapsed
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>`;
  }
}

function toggleMobileSidebar() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
}

// ── AUTH FORM HANDLERS ────────────────────────────────────────
function switchTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
  }
  ['login-error', 'register-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const btnText = btn?.querySelector('.btn-text');
  const btnSpinner = btn?.querySelector('.btn-spinner');

  if (!email || !password) { showAuthError('login-error', 'Completează email și parola.'); return; }

  if (btn) btn.disabled = true;
  if (btnText) btnText.style.display = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline';

  const result = await Auth.loginWithEmail(email, password);

  if (btn) btn.disabled = false;
  if (btnText) btnText.style.display = 'inline';
  if (btnSpinner) btnSpinner.style.display = 'none';

  if (result.error) {
    showAuthError('login-error', result.error);
  } else {
    showApp(Auth.currentUser, Auth.currentProfile);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('register-btn');
  const btnText = btn?.querySelector('.btn-text');
  const btnSpinner = btn?.querySelector('.btn-spinner');

  if (!name || !email || !password) { showAuthError('register-error', 'Completează toate câmpurile.'); return; }

  if (btn) btn.disabled = true;
  if (btnText) btnText.style.display = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline';

  const result = await Auth.registerWithEmail(email, password, name);

  if (btn) btn.disabled = false;
  if (btnText) btnText.style.display = 'inline';
  if (btnSpinner) btnSpinner.style.display = 'none';

  if (result.error) {
    showAuthError('register-error', result.error);
  } else if (result.needsConfirmation) {
    const el = document.getElementById('register-error');
    if (el) { el.style.display = 'block'; el.style.color = 'var(--success)'; el.textContent = '✅ Cont creat! Verifică email-ul pentru confirmare.'; }
  } else {
    showApp(Auth.currentUser, Auth.currentProfile);
  }
}

async function handleGoogleLogin() {
  const result = await Auth.loginWithGoogle();
  if (result?.error) {
    showAuthError('login-error', result.error);
  } else if (APP_CONFIG.demoMode) {
    showApp(Auth.currentUser, Auth.currentProfile);
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  if (!email) { showAuthError('login-error', 'Introdu email-ul pentru resetare parolă.'); return; }
  const result = await Auth.forgotPassword(email);
  const errEl = document.getElementById('login-error');
  if (result.error) {
    showAuthError('login-error', result.error);
  } else if (errEl) {
    errEl.style.display = 'block';
    errEl.style.color = 'var(--success)';
    errEl.textContent = APP_CONFIG.demoMode
      ? '(Demo) Email de resetare simulat trimis.'
      : 'Email de resetare trimis. Verifică inbox-ul.';
  }
}

async function handleLogout() {
  await Auth.logout();
  showLogin();
}

function showAuthError(elId, message) {
  const el = document.getElementById(elId);
  if (el) { el.style.display = 'block'; el.style.color = ''; el.textContent = message; }
}
