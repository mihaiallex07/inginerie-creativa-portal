// ============================================================
// Proiecte Module — Portal Inginerie Creativă
// ============================================================

const Proiecte = {
  projects: [],
  search: '',
  filter: 'toate',

  async render() {
    const { data } = await DB.getProjects();
    this.projects = data || [];
    this.renderPage();
  },

  renderPage() {
    const canManage = Auth.isCoordinator();
    let filtered = this.projects;
    if (this.filter !== 'toate') filtered = filtered.filter(p => p.status === this.filter);
    if (this.search) filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(this.search.toLowerCase()) ||
      (p.client_name || '').toLowerCase().includes(this.search.toLowerCase())
    );

    document.getElementById('page-content').innerHTML = `
      <div style="max-width:900px">
        <div class="page-header">
          <div>
            <h1 class="page-title">Proiecte</h1>
            <p class="page-subtitle">Proiecte active și arhivate</p>
          </div>
          ${canManage ? `<button class="btn-brand" onclick="Proiecte.openNewModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Proiect nou
          </button>` : ''}
        </div>

        <!-- Filters -->
        <div class="flex gap-2 mb-4">
          ${searchInput('proj-search', 'Caută proiecte...', 'Proiecte.onSearch(this.value)')}
          <select class="select" style="width:160px" onchange="Proiecte.onFilter(this.value)">
            <option value="toate">Toate statusurile</option>
            <option value="activ">Active</option>
            <option value="finalizat">Finalizate</option>
            <option value="suspendat">Suspendate</option>
          </select>
        </div>

        <!-- Projects grid -->
        <div class="grid-3">
          ${filtered.length === 0 ? `<div style="grid-column:1/-1">${emptyState('Nu există proiecte')}</div>` :
            filtered.map(p => this.renderCard(p)).join('')
          }
        </div>
      </div>
    `;
  },

  renderCard(p) {
    const pct = p.budget_hours > 0 ? Math.min(100, Math.round(p.used_hours / p.budget_hours * 100)) : 0;
    const colorClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';
    return `
      <div class="project-card" onclick="Proiecte.openDetail(${p.id})">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="project-emoji">${p.emoji || '📁'}</div>
          ${statusBadge(p.status)}
        </div>
        <div class="project-name">${p.name}</div>
        <div class="project-client">${p.client_name || ''}</div>
        <div class="text-xs text-muted mb-2">${p.code || ''}</div>
        ${progressBar(p.used_hours || 0, p.budget_hours || 0)}
        <div class="flex justify-between text-xs text-muted mt-2">
          <span>${p.start_date ? formatDate(p.start_date) : '—'}</span>
          <span>${p.end_date ? formatDate(p.end_date) : '—'}</span>
        </div>
      </div>
    `;
  },

  async openDetail(id) {
    const project = this.projects.find(p => p.id === id);
    if (!project) return;
    const { data: tasks } = await DB.getProjectTasks(id);
    const taskList = tasks || [];
    const totalUsed = taskList.reduce((s, t) => s + (t.used_hours || 0), 0);

    openModal(project.name, `
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <span style="font-size:32px">${project.emoji || '📁'}</span>
          <div>
            <div style="font-size:16px;font-weight:700">${project.name}</div>
            <div class="text-sm text-muted">${project.client_name || ''} · ${project.code || ''}</div>
          </div>
          ${statusBadge(project.status)}
        </div>
        ${project.description ? `<p class="text-sm" style="color:var(--text-muted)">${project.description}</p>` : ''}
        <div class="form-row form-row-2">
          <div class="card p-3">
            <div class="text-xs text-muted mb-1">Ore buget</div>
            <div style="font-size:20px;font-weight:700">${project.budget_hours || 0}h</div>
          </div>
          <div class="card p-3">
            <div class="text-xs text-muted mb-1">Ore folosite</div>
            <div style="font-size:20px;font-weight:700">${project.used_hours || 0}h</div>
          </div>
        </div>
        ${progressBar(project.used_hours || 0, project.budget_hours || 0)}
        ${taskList.length > 0 ? `
          <div>
            <div style="font-size:13px;font-weight:700;margin-bottom:8px">Task-uri (${taskList.length})</div>
            <div class="space-y-2">
              ${taskList.map(t => `
                <div class="flex items-center gap-3 p-2 rounded border">
                  ${statusBadge(t.status)}
                  <span style="flex:1;font-size:13px">${t.name}</span>
                  <span class="text-xs text-muted">${t.used_hours || 0}h / ${t.budget_hours || 0}h</span>
                  <button class="btn-brand" style="font-size:11px;padding:3px 8px" onclick="closeModalForce();TimeTracking.openAddModal('${getTodayStr()}');setTimeout(()=>{const s=document.getElementById('tt-project');if(s){s.value='${project.id}';TimeTracking.onProjectChange('${project.id}');setTimeout(()=>{const ts=document.getElementById('tt-task-id');if(ts)ts.value='${t.id}';},100);}},100)">
                    ▶ Start
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `, `<button class="btn-secondary" onclick="closeModalForce()">Închide</button>`);
  },

  openNewModal() {
    openModal('Proiect nou', `
      <div class="space-y-3">
        <div class="form-row form-row-2">
          <div>
            <label class="label">Nume proiect *</label>
            <input type="text" id="proj-name" class="input" placeholder="Ex: Clădire Rezidențială" />
          </div>
          <div>
            <label class="label">Cod proiect</label>
            <input type="text" id="proj-code" class="input" placeholder="IC-2025-001" />
          </div>
        </div>
        <div class="form-row form-row-2">
          <div>
            <label class="label">Client</label>
            <input type="text" id="proj-client" class="input" placeholder="Nume client" />
          </div>
          <div>
            <label class="label">Emoji</label>
            <input type="text" id="proj-emoji" class="input" placeholder="🏢" maxlength="2" />
          </div>
        </div>
        <div class="form-row form-row-2">
          <div>
            <label class="label">Data start</label>
            <input type="date" id="proj-start" class="input" />
          </div>
          <div>
            <label class="label">Data final</label>
            <input type="date" id="proj-end" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Buget ore</label>
          <input type="number" id="proj-budget" class="input" placeholder="1000" min="0" />
        </div>
        <div>
          <label class="label">Descriere</label>
          <textarea id="proj-desc" class="textarea" placeholder="Descriere proiect..."></textarea>
        </div>
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModalForce()">Anulează</button>
      <button class="btn-brand" onclick="Proiecte.saveNew()">Salvează</button>
    `);
  },

  async saveNew() {
    const name = document.getElementById('proj-name')?.value?.trim();
    if (!name) { showToast('Completează numele proiectului', 'error'); return; }
    const project = {
      name,
      code: document.getElementById('proj-code')?.value?.trim(),
      client_name: document.getElementById('proj-client')?.value?.trim(),
      emoji: document.getElementById('proj-emoji')?.value?.trim() || '📁',
      start_date: document.getElementById('proj-start')?.value,
      end_date: document.getElementById('proj-end')?.value,
      budget_hours: parseInt(document.getElementById('proj-budget')?.value) || 0,
      description: document.getElementById('proj-desc')?.value?.trim(),
      status: 'activ',
      used_hours: 0,
      color: '#FFCB09',
    };
    const { error } = await DB.createProject(project);
    if (error) { showToast('Eroare: ' + error.message, 'error'); return; }
    closeModalForce();
    showToast('Proiect creat cu succes', 'success');
    await this.render();
  },

  onSearch(val) {
    this.search = val;
    this.renderPage();
  },

  onFilter(val) {
    this.filter = val;
    this.renderPage();
  },
};
