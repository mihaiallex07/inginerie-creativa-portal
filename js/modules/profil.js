// ============================================================
// Profil Module
// ============================================================
const Profil = {
  async render() {
    const profile = Auth.currentProfile;
    document.getElementById('page-content').innerHTML = `
      <div style="max-width:600px">
        <div class="page-header">
          <h1 class="page-title">Profilul meu</h1>
        </div>
        <div class="card p-6">
          <div class="flex items-center gap-4 mb-6">
            <div class="avatar avatar-xl">${Auth.getInitials(profile?.full_name)}</div>
            <div>
              <div style="font-size:20px;font-weight:700">${profile?.full_name || 'Utilizator'}</div>
              <div class="text-sm text-muted">${profile?.email || ''}</div>
              <div class="mt-1">${roleBadge(profile?.role || 'angajat')}</div>
            </div>
          </div>
          <div class="space-y-4">
            <div class="form-row form-row-2">
              <div>
                <label class="label">Nume complet</label>
                <input type="text" id="prof-name" class="input" value="${profile?.full_name || ''}" />
              </div>
              <div>
                <label class="label">Telefon</label>
                <input type="text" id="prof-phone" class="input" value="${profile?.phone || ''}" placeholder="+40 7xx xxx xxx" />
              </div>
            </div>
            <div class="form-row form-row-2">
              <div>
                <label class="label">Departament</label>
                <input type="text" id="prof-dept" class="input" value="${profile?.department || ''}" placeholder="Ex: Arhitectură" />
              </div>
              <div>
                <label class="label">Funcție</label>
                <input type="text" id="prof-pos" class="input" value="${profile?.position || ''}" placeholder="Ex: Arhitect" />
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button class="btn-brand" onclick="Profil.save()">Salvează modificările</button>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div class="card p-6 mt-4">
          <div style="font-size:15px;font-weight:700;margin-bottom:16px">Securitate</div>
          <div class="flex items-center justify-between p-3 rounded" style="background:var(--surface-2)">
            <div>
              <div style="font-size:13px;font-weight:600">Email</div>
              <div class="text-sm text-muted">${profile?.email || ''}</div>
            </div>
            ${APP_CONFIG.demoMode ? badge('Demo', 'gray') : ''}
          </div>
          <div class="mt-3">
            <button class="btn-secondary" onclick="showToast('Funcție disponibilă cu Supabase configurat','warning')">
              Schimbă parola
            </button>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="card p-6 mt-4" style="border-color:var(--danger)">
          <div style="font-size:15px;font-weight:700;margin-bottom:8px;color:var(--danger)">Zonă periculoasă</div>
          <button class="btn-danger" onclick="Auth.logout()">Deconectare</button>
        </div>
      </div>
    `;
  },

  async save() {
    const updates = {
      full_name: document.getElementById('prof-name')?.value?.trim(),
      phone: document.getElementById('prof-phone')?.value?.trim(),
      department: document.getElementById('prof-dept')?.value?.trim(),
      position: document.getElementById('prof-pos')?.value?.trim(),
    };
    const { error } = await DB.updateProfile(Auth.currentUser?.id, updates);
    if (error) { showToast('Eroare: ' + error.message, 'error'); return; }
    Object.assign(Auth.currentProfile, updates);
    if (typeof updateSidebarUser === 'function') updateSidebarUser();
    showToast('Profil actualizat', 'success');
  },
};
