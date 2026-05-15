// ============================================================
// Organigramă Module — Portal Inginerie Creativă
// Ierarhie dinamică din DB (manager_id pe profiles)
// Admin poate edita: cine raportează cui, departament, funcție
// Card echipă de jos → click deschide profilul angajatului
// ============================================================

const Organigrama = {
  users: [],
  editMode: false,

  async render() {
    const isAdmin = Auth.currentProfile?.role === 'admin';
    const { data: users } = await DB.getUsers();
    this.users = (users || []).filter(u => !u.is_pre_created || u.id === Auth.currentUser?.id);

    document.getElementById('page-content').innerHTML = `
      <div style="max-width:1100px">
        <div class="page-header">
          <div>
            <h1 class="page-title">Organigramă</h1>
            <p class="page-subtitle">Structura organizatorică Inginerie Creativă</p>
          </div>
          ${isAdmin ? `
            <div style="display:flex;gap:8px">
              <button id="org-edit-btn" class="btn-secondary" onclick="Organigrama.toggleEdit()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editează ierarhia
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Org chart vizual -->
        <div class="card mb-4" style="overflow-x:auto;padding:24px">
          <div id="org-chart-container">
            ${this.renderOrgChart()}
          </div>
        </div>

        <!-- Editor ierarhie (admin) -->
        ${isAdmin ? `
          <div id="org-editor" style="display:none" class="card mb-4">
            <div class="card-header">
              <span class="card-title">Editare ierarhie</span>
              <span class="text-xs text-muted">Setează managerul direct pentru fiecare angajat</span>
            </div>
            <div style="padding:16px">
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">
                ${this.renderEditorRows()}
              </div>
              <div style="margin-top:16px;display:flex;gap:8px">
                <button class="btn-brand" onclick="Organigrama.saveHierarchy()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Salvează ierarhia
                </button>
                <button class="btn-secondary" onclick="Organigrama.toggleEdit()">Anulează</button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Lista echipă -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Echipa (${this.users.length} angajați)</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:16px">
            ${this.users.map(u => this.renderTeamCard(u)).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ── CONSTRUIEȘTE ARBORELE IERARHIC ────────────────────────────
  buildTree() {
    const map = {};
    const roots = [];

    // Indexează toți utilizatorii
    for (const u of this.users) {
      map[u.id] = { ...u, children: [] };
    }

    // Construiește arborele
    for (const u of this.users) {
      if (u.manager_id && map[u.manager_id]) {
        map[u.manager_id].children.push(map[u.id]);
      } else {
        roots.push(map[u.id]);
      }
    }

    // Dacă nu există ierarhie definită, grupează pe departamente
    if (roots.length === this.users.length) {
      return this.buildDeptTree();
    }

    // Dacă există mai mulți roots, înfășoară-i într-un nod companie
    if (roots.length > 1) {
      return [{
        id: '__company__',
        full_name: 'Inginerie Creativă',
        job_title: 'SRL',
        department: null,
        avatar_url: null,
        employee_code: 'IC',
        children: roots,
        isCompany: true,
      }];
    }

    return roots;
  },

  buildDeptTree() {
    // Grupare pe departamente când nu există ierarhie setată
    const depts = {};
    for (const u of this.users) {
      const dept = u.department || 'General';
      if (!depts[dept]) depts[dept] = [];
      depts[dept].push({ ...u, children: [] });
    }

    const companyNode = {
      id: '__company__',
      full_name: 'Inginerie Creativă',
      job_title: 'SRL',
      department: null,
      avatar_url: null,
      employee_code: 'IC',
      isCompany: true,
      children: Object.entries(depts).map(([dept, members]) => ({
        id: '__dept__' + dept,
        full_name: dept,
        job_title: 'Departament',
        department: dept,
        isDept: true,
        children: members,
      })),
    };

    return [companyNode];
  },

  renderOrgChart() {
    const tree = this.buildTree();
    if (!tree.length) return `<div style="text-align:center;color:var(--text-muted);padding:40px">Niciun angajat în organigramă</div>`;

    const hasHierarchy = this.users.some(u => u.manager_id);
    const hint = !hasHierarchy && Auth.currentProfile?.role === 'admin'
      ? `<div style="text-align:center;margin-bottom:16px;padding:10px 16px;background:var(--surface-2);border-radius:8px;font-size:12px;color:var(--text-muted)">
          💡 Ierarhia este grupată pe departamente. Apasă <strong>Editează ierarhia</strong> pentru a seta relațiile de subordonare.
        </div>`
      : '';

    return hint + `<div class="org-tree-wrap" style="display:flex;justify-content:center">
      ${tree.map(node => this.renderNode(node, true)).join('')}
    </div>`;
  },

  renderNode(node, isRoot = false) {
    const hasChildren = node.children && node.children.length > 0;
    const isClickable = !node.isCompany && !node.isDept;
    const initials = node.employee_code || (node.full_name || 'IC').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    const avatarEl = node.isCompany
      ? `<div style="width:44px;height:44px;border-radius:50%;background:var(--brand-dark);color:#000;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">IC</div>`
      : node.isDept
      ? `<div style="width:36px;height:36px;border-radius:8px;background:var(--surface-2);color:var(--text-muted);font-size:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px">🏢</div>`
      : node.avatar_url
      ? `<img src="${node.avatar_url}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--brand-dark);margin:0 auto 8px;display:block" />`
      : `<div style="width:44px;height:44px;border-radius:50%;background:var(--brand-dark);color:#000;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">${initials}</div>`;

    const nodeStyle = node.isCompany
      ? 'background:var(--brand-dark);color:#000;border:none'
      : node.isDept
      ? 'background:var(--surface-2);border:1px dashed var(--border)'
      : 'background:var(--surface);border:1px solid var(--border)';

    const nameColor = node.isCompany ? 'color:#000' : 'color:var(--text)';
    const subtitleColor = node.isCompany ? 'color:rgba(0,0,0,0.6)' : 'color:var(--text-muted)';

    return `
      <div class="org-node-wrap" style="display:inline-flex;flex-direction:column;align-items:center;margin:0 8px">
        <div class="org-node" style="padding:12px 14px;border-radius:10px;min-width:120px;max-width:160px;text-align:center;${nodeStyle};${isClickable ? 'cursor:pointer;transition:box-shadow 0.15s' : ''}"
          ${isClickable ? `onclick="Echipa.viewProfile('${node.id}')" onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'" onmouseleave="this.style.boxShadow=''"` : ''}>
          ${avatarEl}
          <div style="font-size:12px;font-weight:700;${nameColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${node.full_name || node.name || ''}</div>
          ${(node.job_title || node.position) ? `<div style="font-size:10px;${subtitleColor};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${node.job_title || node.position}</div>` : ''}
          ${node.department && !node.isDept ? `<div style="font-size:10px;color:var(--brand-dark);font-weight:600;margin-top:2px">${node.department}</div>` : ''}
        </div>
        ${hasChildren ? `
          <div style="width:2px;height:16px;background:var(--border)"></div>
          <div style="display:flex;align-items:flex-start;position:relative">
            ${node.children.length > 1 ? `<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);height:2px;background:var(--border);width:calc(100% - 32px)"></div>` : ''}
            ${node.children.map(child => `
              <div style="display:inline-flex;flex-direction:column;align-items:center">
                <div style="width:2px;height:16px;background:var(--border)"></div>
                ${this.renderNode(child)}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  // ── EDITOR IERARHIE (ADMIN) ───────────────────────────────────
  renderEditorRows() {
    return this.users.map(u => {
      const otherUsers = this.users.filter(other => other.id !== u.id);
      return `
        <div style="background:var(--surface-2);border-radius:8px;padding:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            ${avatarHtml(u.full_name, u.avatar_url, 'sm')}
            <div>
              <div style="font-size:13px;font-weight:700">${u.full_name}</div>
              <div class="text-xs text-muted">${u.job_title || u.position || 'fără funcție'}</div>
            </div>
          </div>
          <div>
            <label class="text-xs text-muted" style="display:block;margin-bottom:4px">Raportează la:</label>
            <select class="select" id="manager-${u.id}" style="font-size:12px">
              <option value="">— fără manager (root) —</option>
              ${otherUsers.map(m => `
                <option value="${m.id}" ${u.manager_id === m.id ? 'selected' : ''}>${m.full_name}${m.job_title || m.position ? ' · ' + (m.job_title || m.position) : ''}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    }).join('');
  },

  toggleEdit() {
    const editor = document.getElementById('org-editor');
    const btn = document.getElementById('org-edit-btn');
    if (!editor) return;
    const isVisible = editor.style.display !== 'none';
    editor.style.display = isVisible ? 'none' : 'block';
    if (btn) btn.textContent = isVisible ? '✏️ Editează ierarhia' : '✕ Închide editor';
    if (!isVisible) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async saveHierarchy() {
    const sb = getSupabase();
    if (!sb) { showToast('Supabase nu e conectat', 'error'); return; }

    const updates = [];
    for (const u of this.users) {
      const sel = document.getElementById('manager-' + u.id);
      if (!sel) continue;
      const newManagerId = sel.value || null;
      if (newManagerId !== (u.manager_id || null)) {
        updates.push({ id: u.id, manager_id: newManagerId });
      }
    }

    if (updates.length === 0) {
      showToast('Nicio modificare detectată', 'info');
      return;
    }

    // Verifică cicluri înainte de salvare
    const tempMap = {};
    for (const u of this.users) {
      const upd = updates.find(x => x.id === u.id);
      tempMap[u.id] = upd ? upd.manager_id : u.manager_id;
    }
    for (const u of this.users) {
      if (this.hasCycle(u.id, tempMap)) {
        showToast(`Ciclu detectat pentru ${u.full_name}! Verifică ierarhia.`, 'error');
        return;
      }
    }

    // Salvează în DB
    let errors = 0;
    for (const upd of updates) {
      const { error } = await sb.from('profiles').update({ manager_id: upd.manager_id }).eq('id', upd.id);
      if (error) { console.error('Error updating manager_id:', error); errors++; }
      else {
        const user = this.users.find(u => u.id === upd.id);
        if (user) user.manager_id = upd.manager_id;
      }
    }

    if (errors > 0) {
      showToast(`${errors} erori la salvare`, 'error');
    } else {
      showToast(`Ierarhia actualizată (${updates.length} modificări)`, 'success');
      // Reîncarcă organigrama
      const container = document.getElementById('org-chart-container');
      if (container) container.innerHTML = this.renderOrgChart();
      this.toggleEdit();
    }
  },

  hasCycle(userId, managerMap, visited = new Set()) {
    if (visited.has(userId)) return true;
    visited.add(userId);
    const managerId = managerMap[userId];
    if (!managerId) return false;
    return this.hasCycle(managerId, managerMap, visited);
  },

  // ── CARD ECHIPĂ ───────────────────────────────────────────────
  renderTeamCard(u) {
    const isSelf = u.id === Auth.currentUser?.id;
    const initials = u.employee_code || (u.full_name || 'IC').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    const avatarEl = u.avatar_url
      ? `<img src="${u.avatar_url}" alt="${u.full_name}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--brand-dark);flex-shrink:0" />`
      : `<div style="width:48px;height:48px;border-radius:50%;background:var(--brand-dark);color:#000;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${initials}</div>`;

    // Găsește managerul
    const manager = u.manager_id ? this.users.find(m => m.id === u.manager_id) : null;

    return `
      <div class="flex items-center gap-3 p-3 rounded cursor-pointer"
        style="background:var(--surface-2);transition:background 0.15s"
        onclick="Echipa.viewProfile('${u.id}')"
        onmouseenter="this.style.background='var(--surface-3,var(--border))'"
        onmouseleave="this.style.background='var(--surface-2)'">
        <div style="position:relative">
          ${avatarEl}
          ${isSelf ? `<span style="position:absolute;bottom:-2px;right:-2px;background:var(--brand-dark);color:#000;font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px">TU</span>` : ''}
        </div>
        <div style="min-width:0;flex:1">
          <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.full_name || 'Angajat'}</div>
          <div class="text-xs text-muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.job_title || u.position || ''}</div>
          ${u.department ? `<div style="font-size:10px;color:var(--brand-dark);font-weight:600">${u.department}</div>` : ''}
          ${manager ? `<div class="text-xs text-muted" style="font-size:10px">↑ ${manager.full_name}</div>` : ''}
        </div>
      </div>
    `;
  },
};
