// ============================================================
// Documente Module — Portal Inginerie Creativă
// ============================================================

const Documente = {
  docs: [],
  search: '',
  category: 'toate',

  CATEGORIES: [
    { value: 'toate', label: 'Toate' },
    { value: 'regulament', label: 'Regulamente' },
    { value: 'proceduri', label: 'Proceduri' },
    { value: 'contracte', label: 'Contracte' },
    { value: 'formulare', label: 'Formulare' },
    { value: 'ghiduri', label: 'Ghiduri' },
  ],

  async render() {
    const { data } = await DB.getDocuments(this.category === 'toate' ? null : this.category);
    this.docs = data || [];
    this.renderPage();
  },

  renderPage() {
    const canUpload = Auth.isAdmin();
    let filtered = this.docs;
    if (this.search) filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(this.search.toLowerCase())
    );

    document.getElementById('page-content').innerHTML = `
      <div style="width:100%">
        <div class="page-header">
          <div>
            <h1 class="page-title">Documente</h1>
            <p class="page-subtitle">Documente interne și proceduri</p>
          </div>
          ${canUpload ? `<button class="btn-brand" onclick="Documente.openUploadModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Încarcă document
          </button>` : ''}
        </div>

        <!-- Filters -->
        <div class="flex gap-2 mb-4" style="flex-wrap:wrap">
          ${searchInput('doc-search', 'Caută documente...', 'Documente.onSearch(this.value)')}
          <div class="flex gap-1">
            ${this.CATEGORIES.map(c => `
              <button class="tab-btn ${this.category === c.value ? 'active' : ''}" onclick="Documente.onCategory('${c.value}')">${c.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Documents table -->
        <div class="card" style="overflow:hidden">
          ${filtered.length === 0 ? `<div style="padding:24px">${emptyState('Nu există documente')}</div>` : `
            <table>
              <thead>
                <tr>
                  <th style="width:44px"></th>
                  <th>Nume document</th>
                  <th>Categorie</th>
                  <th>Dimensiune</th>
                  <th>Adăugat de</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(d => `
                  <tr>
                    <td>${docIcon(d.type)}</td>
                    <td style="font-weight:600">${d.name}</td>
                    <td>${categoryBadge(d.category)}</td>
                    <td class="text-sm text-muted">${d.size || '—'}</td>
                    <td class="text-sm">${d.uploaded_by || '—'}</td>
                    <td class="text-sm text-muted">${formatDate(d.created_at)}</td>
                    <td>
                      <div class="flex gap-1">
                        ${d.url && d.url !== '#' ? `
                          <a href="${d.url}" target="_blank" class="btn-icon" title="Deschide">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        ` : `
                          <button class="btn-icon" onclick="showToast('Documentul nu este disponibil în modul demo','warning')" title="Deschide">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </button>
                        `}
                        ${d.drive_url ? `
                          <a href="${d.drive_url}" target="_blank" class="btn-icon" title="Google Drive">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          </a>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  openUploadModal() {
    openModal('Încarcă document', `
      <div class="space-y-3">
        <div>
          <label class="label">Fișier</label>
          <input type="file" id="doc-file" class="input" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
        </div>
        <div>
          <label class="label">Categorie</label>
          <select id="doc-cat" class="select">
            ${this.CATEGORIES.filter(c => c.value !== 'toate').map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="label">Link Google Drive (opțional)</label>
          <input type="url" id="doc-drive" class="input" placeholder="https://drive.google.com/..." />
        </div>
        <p class="text-xs text-muted">Fișierele sunt stocate în Supabase Storage. În modul demo, documentul apare în listă dar nu este stocat.</p>
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModalForce()">Anulează</button>
      <button class="btn-brand" onclick="Documente.saveUpload()">Încarcă</button>
    `);
  },

  async saveUpload() {
    const fileInput = document.getElementById('doc-file');
    const file = fileInput?.files?.[0];
    if (!file) { showToast('Selectează un fișier', 'error'); return; }

    const ext = file.name.split('.').pop().toLowerCase();
    const typeMap = { pdf: 'pdf', doc: 'doc', docx: 'doc', xls: 'xls', xlsx: 'xls', ppt: 'ppt', pptx: 'ppt' };

    if (APP_CONFIG.demoMode) {
      const doc = {
        name: file.name,
        type: typeMap[ext] || 'other',
        category: document.getElementById('doc-cat')?.value,
        size: formatFileSize(file.size),
        url: '#',
        drive_url: document.getElementById('doc-drive')?.value?.trim() || null,
        uploaded_by: Auth.currentProfile?.full_name || 'Utilizator',
        created_at: new Date().toISOString(),
      };
      DB.demo.documents.unshift(doc);
      closeModalForce();
      showToast('Document adăugat (demo)', 'success');
      await this.render();
      return;
    }

    // Supabase Storage upload
    const sb = getSupabase();
    const path = `documents/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadErr } = await sb.storage.from('documents').upload(path, file);
    if (uploadErr) { showToast('Eroare upload: ' + uploadErr.message, 'error'); return; }

    const { data: { publicUrl } } = sb.storage.from('documents').getPublicUrl(path);
    const doc = {
      name: file.name,
      type: typeMap[ext] || 'other',
      category: document.getElementById('doc-cat')?.value,
      size: formatFileSize(file.size),
      url: publicUrl,
      drive_url: document.getElementById('doc-drive')?.value?.trim() || null,
      uploaded_by: Auth.currentProfile?.full_name,
      uploaded_by_id: Auth.currentUser?.id,
    };
    const { error } = await sb.from('documents').insert(doc);
    if (error) { showToast('Eroare salvare: ' + error.message, 'error'); return; }

    closeModalForce();
    showToast('Document încărcat cu succes', 'success');
    await this.render();
  },

  onSearch(val) { this.search = val; this.renderPage(); },
  onCategory(val) { this.category = val; this.render(); },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
