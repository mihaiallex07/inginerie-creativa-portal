// ============================================================
// Propuneri Module — Portal Inginerie Creativă
// ============================================================
const Propuneri = {
  items: [],

  async render() {
    const { data } = await DB.getProposals();
    this.items = data || [];
    this.renderPage();
  },

  renderPage() {
    document.getElementById('page-content').innerHTML = `
      <div style="width:100%">
        <div class="page-header">
          <div>
            <h1 class="page-title">Propuneri</h1>
            <p class="page-subtitle">Idei și sugestii din echipă</p>
          </div>
          <button class="btn-brand" onclick="Propuneri.openNewModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Propunere nouă
          </button>
        </div>
        <div class="space-y-3">
          ${this.items.length === 0 ? emptyState('Nu există propuneri') :
            this.items.map(p => this.renderCard(p)).join('')
          }
        </div>
      </div>
    `;
  },

  renderCard(p) {
    const total = p.votes_for + p.votes_against;
    const forPct = total > 0 ? Math.round(p.votes_for / total * 100) : 0;
    return `
      <div class="card p-4">
        <div class="flex items-start gap-3">
          <div style="flex:1">
            <div class="flex items-center gap-2 mb-1">
              ${statusBadge(p.status)}
              <span class="text-xs text-muted">${p.author_name || 'Anonim'} · ${timeAgo(p.created_at)}</span>
            </div>
            <div style="font-size:15px;font-weight:700;margin-bottom:6px">${p.title}</div>
            <div class="text-sm text-muted mb-3">${p.description || ''}</div>
            <!-- Vote bar -->
            <div class="flex items-center gap-3">
              <button class="vote-btn for ${p.user_voted === 'for' ? 'voted' : ''}" onclick="Propuneri.vote(${p.id}, 'for')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                <span>${p.votes_for}</span>
              </button>
              <div style="flex:1">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${forPct}%;background:var(--success)"></div>
                </div>
                <div class="text-xs text-muted text-center mt-1">${total} voturi · ${forPct}% pentru</div>
              </div>
              <button class="vote-btn against ${p.user_voted === 'against' ? 'voted' : ''}" onclick="Propuneri.vote(${p.id}, 'against')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                <span>${p.votes_against}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async vote(id, vote) {
    const { error } = await DB.voteProposal(id, vote);
    if (error) { showToast('Eroare la vot', 'error'); return; }
    await this.render();
  },

  openNewModal() {
    openModal('Propunere nouă', `
      <div class="space-y-3">
        <div>
          <label class="label">Titlu *</label>
          <input type="text" id="prop-title" class="input" placeholder="Titlul propunerii" />
        </div>
        <div>
          <label class="label">Descriere detaliată *</label>
          <textarea id="prop-desc" class="textarea" placeholder="Descrie propunerea ta în detaliu..."></textarea>
        </div>
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModalForce()">Anulează</button>
      <button class="btn-brand" onclick="Propuneri.saveNew()">Trimite propunerea</button>
    `);
  },

  async saveNew() {
    const title = document.getElementById('prop-title')?.value?.trim();
    const desc = document.getElementById('prop-desc')?.value?.trim();
    if (!title || !desc) { showToast('Completează toate câmpurile', 'error'); return; }
    const { error } = await DB.createProposal({ title, description: desc, author_id: Auth.currentUser?.id });
    if (error) { showToast('Eroare: ' + error.message, 'error'); return; }
    closeModalForce();
    showToast('Propunere trimisă', 'success');
    await this.render();
  },
};
