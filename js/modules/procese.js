// ============================================================
// Procese & Proceduri Module
// ============================================================
const Procese = {
  items: [],
  search: '',
  category: 'toate',
  CATS: [
    { value: 'toate', label: 'Toate' },
    { value: 'proiectare', label: 'Proiectare' },
    { value: 'calitate', label: 'Calitate' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'administrativ', label: 'Administrativ' },
  ],

  async render() {
    const { data } = await DB.getProcesses(this.category === 'toate' ? null : this.category);
    this.items = data || [];
    this.renderPage();
  },

  renderPage() {
    let filtered = this.items;
    if (this.search) filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(this.search.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(this.search.toLowerCase())
    );

    document.getElementById('page-content').innerHTML = `
      <div style="width:100%">
        <div class="page-header">
          <div>
            <h1 class="page-title">Procese &amp; Proceduri</h1>
            <p class="page-subtitle">Proceduri interne și fluxuri de lucru</p>
          </div>
        </div>
        <div class="flex gap-2 mb-4" style="flex-wrap:wrap">
          ${searchInput('proc-search', 'Caută proceduri...', 'Procese.onSearch(this.value)')}
          <div class="flex gap-1">
            ${this.CATS.map(c => `
              <button class="tab-btn ${this.category === c.value ? 'active' : ''}" onclick="Procese.onCategory('${c.value}')">${c.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="space-y-2">
          ${filtered.length === 0 ? emptyState('Nu există proceduri') :
            filtered.map(p => `
              <div class="card p-4 cursor-pointer" onclick="Procese.openDetail(${p.id})">
                <div class="flex items-center gap-3">
                  <div style="font-size:20px">📋</div>
                  <div style="flex:1">
                    <div class="flex items-center gap-2 mb-1">
                      <span style="font-size:11px;font-weight:700;color:var(--text-muted);font-family:monospace">${p.code}</span>
                      ${categoryBadge(p.category)}
                      ${statusBadge(p.status)}
                      <span class="text-xs text-muted">v${p.version}</span>
                    </div>
                    <div style="font-size:14px;font-weight:700">${p.title}</div>
                    <div class="text-sm text-muted">${p.description || ''}</div>
                  </div>
                  <div class="text-xs text-muted">${formatDate(p.updated_at)}</div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  },

  openDetail(id) {
    const p = this.items.find(p => p.id === id);
    if (!p) return;
    openModal(p.title, `
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span style="font-size:11px;font-weight:700;font-family:monospace;color:var(--text-muted)">${p.code}</span>
          ${categoryBadge(p.category)}
          ${statusBadge(p.status)}
          <span class="text-xs text-muted">Versiune ${p.version}</span>
        </div>
        <p class="text-sm" style="color:var(--text-muted)">${p.description || ''}</p>
        <div class="text-xs text-muted">Ultima actualizare: ${formatDate(p.updated_at)}</div>
        <div class="p-3 rounded" style="background:var(--surface-2);font-size:13px;color:var(--text-muted)">
          Conținutul detaliat al procedurii este disponibil în documentul atașat sau în Supabase.
        </div>
      </div>
    `, `<button class="btn-secondary" onclick="closeModalForce()">Închide</button>`);
  },

  onSearch(val) { this.search = val; this.renderPage(); },
  onCategory(val) { this.category = val; this.render(); },
};
