// ============================================================
// Echipă Module — Lista angajaților cu profiluri vizualizabile
// Toți angajații pot vedea: nume, funcție, departament, cod
// Navigare la profilul individual al oricărui angajat
// ============================================================

const Echipa = {
  searchQuery: '',

  async render() {
    const { data: users } = await DB.getUsers();
    const isAdmin = Auth.currentProfile?.role === 'admin';
    const allUsers = (users || []).filter(u => isAdmin || !u.is_pre_created || u.id === Auth.currentUser?.id);

    document.getElementById('page-content').innerHTML = `
      <div style="width:100%">
        <div class="page-header">
          <div>
            <h1 class="page-title">Echipa</h1>
            <p class="page-subtitle">${allUsers.length} angajat${allUsers.length !== 1 ? 'i' : ''} · Inginerie Creativă</p>
          </div>
        </div>

        <!-- Search -->
        <div class="card mb-4" style="padding:12px 16px">
          <div style="position:relative">
            <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="echipa-search" class="input" style="padding-left:34px"
              placeholder="Caută după nume, funcție sau departament..."
              oninput="Echipa.onSearch(this.value)"
              value="${this.searchQuery}" />
          </div>
        </div>

        <!-- Grid angajați -->
        <div id="echipa-grid">
          ${this.renderGrid(allUsers, this.searchQuery)}
        </div>
      </div>
    `;
  },

  renderGrid(users, query) {
    const q = (query || '').toLowerCase().trim();
    const filtered = q
      ? users.filter(u =>
          (u.full_name || '').toLowerCase().includes(q) ||
          (u.position || '').toLowerCase().includes(q) ||
          (u.department || '').toLowerCase().includes(q) ||
          (u.employee_code || '').toLowerCase().includes(q)
        )
      : users;

    if (filtered.length === 0) {
      return emptyState('Niciun angajat găsit');
    }

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px">
        ${filtered.map(u => this.renderCard(u)).join('')}
      </div>
    `;
  },

  renderCard(u) {
    const isSelf = u.id === Auth.currentUser?.id;
    const initials = (u.employee_code || (u.full_name || 'IC').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3));
    const avatarEl = u.avatar_url
      ? `<img src="${u.avatar_url}" alt="${u.full_name}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--brand-dark)" />`
      : `<div style="width:64px;height:64px;border-radius:50%;background:var(--brand-dark);color:#000;font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;border:3px solid var(--brand)">${initials}</div>`;

    const hireYear = u.hire_date ? new Date(u.hire_date).getFullYear() : null;
    const yearsWorked = hireYear ? (new Date().getFullYear() - hireYear) : null;

    return `
      <div class="card" style="padding:20px;text-align:center;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s"
        onclick="Echipa.viewProfile('${u.id}')"
        onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)'"
        onmouseleave="this.style.transform='';this.style.boxShadow=''">
        <div style="display:flex;justify-content:center;margin-bottom:12px;position:relative">
          ${avatarEl}
          ${isSelf ? `<span style="position:absolute;bottom:2px;right:calc(50% - 44px);background:var(--brand-dark);color:#000;font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px">TU</span>` : ''}
        </div>
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.full_name || 'Angajat'}</div>
        ${u.position ? `<div class="text-xs text-muted" style="margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.position}</div>` : ''}
        ${u.department ? `<div class="text-xs" style="color:var(--brand-dark);font-weight:600;margin-bottom:6px">${u.department}</div>` : ''}
        <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap">
          ${roleBadge(u.role)}
          ${yearsWorked !== null && yearsWorked > 0 ? `<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:var(--surface-2);color:var(--text-muted)">${yearsWorked} an${yearsWorked > 1 ? 'i' : ''}</span>` : ''}
        </div>
      </div>
    `;
  },

  onSearch(val) {
    this.searchQuery = val;
    DB.getUsers().then(({ data: users }) => {
      const isAdmin = Auth.currentProfile?.role === 'admin';
      const allUsers = (users || []).filter(u => isAdmin || !u.is_pre_created || u.id === Auth.currentUser?.id);
      const grid = document.getElementById('echipa-grid');
      if (grid) grid.innerHTML = this.renderGrid(allUsers, val);
    });
  },

  viewProfile(userId) {
    // Navighează la pagina de profil cu userId-ul selectat — preview implicit
    Profil.render(userId, false);
    window.location.hash = '/organigrama';
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === 'organigrama');
    });
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Profil angajat';
  },
};
