// ============================================================
// Profil Module — Profilul meu + vizualizare profil angajat
// Secțiuni: Info profesionale, Date personale, CI (sensibil),
//           Date financiare (sensibil), Contact urgență, Date medicale
// Vizibilitate: angajat vede info prof + date personale + urgență + medical
//               doar proprietarul și adminul văd CI + financiar
// ============================================================
const Profil = {
  viewUserId: null, // null = profilul propriu, altfel ID-ul altui utilizator

  async render(userId) {
    this.viewUserId = userId || null;
    const currentProfile = Auth.currentProfile;
    const isAdmin = currentProfile?.role === 'admin';
    const isSelf = !this.viewUserId || this.viewUserId === Auth.currentUser?.id;
    const canSeeSensitive = isSelf || isAdmin;

    // Încarcă profilul (propriu sau al altui angajat)
    let profile = currentProfile;
    if (!isSelf && this.viewUserId) {
      const { data } = await DB.getProfile(this.viewUserId);
      profile = data;
    }
    if (!profile) {
      document.getElementById('page-content').innerHTML = `<div class="card p-6">Profil negăsit.</div>`;
      return;
    }

    const isReadOnly = !isSelf && !isAdmin;
    const title = isSelf ? 'Profilul meu' : `Profil: ${profile.full_name || profile.name || profile.email}`;

    document.getElementById('page-content').innerHTML = `
      <div style="max-width:760px">
        <div class="page-header" style="margin-bottom:24px">
          <h1 class="page-title">${title}</h1>
          ${!isSelf ? `<button class="btn-secondary" onclick="navigate('admin',null)" style="font-size:13px">← Înapoi</button>` : ''}
        </div>

        <!-- Header card cu avatar și info de bază -->
        <div class="card p-6 mb-4" style="display:flex;align-items:center;gap:20px">
          <div class="avatar avatar-xl" style="width:72px;height:72px;font-size:24px;flex-shrink:0">
            ${profile.avatar_url
              ? `<img src="${profile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
              : (profile.employee_code || Auth.getInitials(profile.full_name || profile.name))}
          </div>
          <div style="flex:1">
            <div style="font-size:20px;font-weight:700">${profile.full_name || profile.name || 'Utilizator'}</div>
            <div class="text-sm text-muted">${profile.email || ''}</div>
            <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
              ${roleBadge(profile.role || 'angajat')}
              ${profile.department ? `<span class="badge badge-gray">${profile.department}</span>` : ''}
              ${profile.job_title || profile.position ? `<span class="badge badge-gray">${profile.job_title || profile.position}</span>` : ''}
            </div>
          </div>
          ${isSelf ? `<button class="btn-brand" onclick="Profil.save()" style="flex-shrink:0">Salvează</button>` : ''}
        </div>

        <!-- 1. Informații profesionale -->
        <div class="card p-6 mb-4">
          <div class="section-title" style="font-size:15px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--primary)">
            📋 Informații profesionale
          </div>
          <div class="form-row form-row-2">
            <div>
              <label class="label">Funcție</label>
              <input type="text" id="prof-position" class="input" value="${profile.job_title || profile.position || ''}"
                ${!isSelf && !isAdmin ? 'readonly' : ''} placeholder="Ex: Arhitect" />
            </div>
            <div>
              <label class="label">Departament</label>
              <input type="text" id="prof-department" class="input" value="${profile.department || ''}"
                ${!isSelf && !isAdmin ? 'readonly' : ''} placeholder="Ex: Proiectare" />
            </div>
          </div>
          <div class="form-row form-row-2 mt-3">
            <div>
              <label class="label">Telefon mobil</label>
              <input type="tel" id="prof-phone-mobile" class="input" value="${profile.phone_mobile || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="+40 7xx xxx xxx" maxlength="15" />
            </div>
            <div>
              <label class="label">Telefon de serviciu <span class="text-muted">(opțional)</span></label>
              <input type="tel" id="prof-phone-work" class="input" value="${profile.phone_work || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="+40 2xx xxx xxx" maxlength="15" />
            </div>
          </div>
          <div class="form-row form-row-2 mt-3">
            <div>
              <label class="label">Data angajării</label>
              <input type="date" id="prof-hire-date" class="input" value="${profile.hire_date || ''}"
                ${!isSelf && !isAdmin ? 'readonly' : ''} />
              ${profile.hire_date ? `<div class="text-sm text-muted mt-1">Vechime: ${Profil.calcVechime(profile.hire_date)}</div>` : ''}
            </div>
            <div>
              <label class="label">Cod angajat</label>
              <input type="text" id="prof-employee-code" class="input" value="${profile.employee_code || ''}"
                ${!isAdmin ? 'readonly' : ''} placeholder="Ex: MP" maxlength="5"
                style="text-transform:uppercase" />
            </div>
          </div>
        </div>

        <!-- 2. Date personale -->
        <div class="card p-6 mb-4">
          <div class="section-title" style="font-size:15px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--primary)">
            👤 Date personale
          </div>
          <div class="form-row form-row-2">
            <div>
              <label class="label">Data nașterii</label>
              <input type="date" id="prof-birth-date" class="input" value="${profile.birth_date || ''}"
                ${isReadOnly ? 'readonly' : ''} />
              ${profile.birth_date ? `<div class="text-sm text-muted mt-1">Vârstă: ${Profil.calcVarsta(profile.birth_date)}</div>` : ''}
            </div>
            <div>
              <label class="label">Adresă de reședință <span class="text-muted">(opțional)</span></label>
              <input type="text" id="prof-residence" class="input" value="${profile.residence_address || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="Str. Exemplu nr. 1, Cluj-Napoca" />
            </div>
          </div>
        </div>

        <!-- 3. Date act identitate — SENSIBIL: doar proprietar + admin -->
        ${canSeeSensitive ? `
        <div class="card p-6 mb-4" style="border-left:3px solid #f59e0b">
          <div class="section-title" style="font-size:15px;font-weight:700;margin-bottom:4px;padding-bottom:8px;border-bottom:2px solid #f59e0b">
            🔒 Date act de identitate
          </div>
          <div class="text-sm text-muted mb-3" style="font-style:italic">Vizibil doar pentru tine și administratori</div>
          <div class="form-row form-row-3 mb-3">
            <div>
              <label class="label">CNP</label>
              <input type="text" id="prof-cnp" class="input" value="${profile.cnp || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="1234567890123" maxlength="13"
                pattern="[0-9]{13}" title="CNP trebuie să conțină exact 13 cifre" />
            </div>
            <div>
              <label class="label">Serie CI</label>
              <input type="text" id="prof-ci-series" class="input" value="${profile.ci_series || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="CJ" maxlength="2"
                style="text-transform:uppercase" />
            </div>
            <div>
              <label class="label">Număr CI</label>
              <input type="text" id="prof-ci-number" class="input" value="${profile.ci_number || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="123456" maxlength="6"
                pattern="[0-9]{6}" title="Numărul CI trebuie să conțină exact 6 cifre" />
            </div>
          </div>
          <div class="form-row form-row-2">
            <div>
              <label class="label">Data expirare CI</label>
              <input type="date" id="prof-ci-expiry" class="input" value="${profile.ci_expiry_date || ''}"
                ${isReadOnly ? 'readonly' : ''} />
              ${profile.ci_expiry_date ? Profil.ciExpiryWarning(profile.ci_expiry_date) : ''}
            </div>
            <div>
              <label class="label">Eliberat de</label>
              <input type="text" id="prof-ci-issued-by" class="input" value="${profile.ci_issued_by || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="SPCLEP Cluj-Napoca" maxlength="60" />
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 4. Date financiare — SENSIBIL: doar proprietar + admin -->
        ${canSeeSensitive ? `
        <div class="card p-6 mb-4" style="border-left:3px solid #f59e0b">
          <div class="section-title" style="font-size:15px;font-weight:700;margin-bottom:4px;padding-bottom:8px;border-bottom:2px solid #f59e0b">
            💳 Date financiare
          </div>
          <div class="text-sm text-muted mb-3" style="font-style:italic">Vizibil doar pentru tine și administratori</div>
          <div class="form-row form-row-2">
            <div>
              <label class="label">IBAN</label>
              <input type="text" id="prof-iban" class="input" value="${profile.iban || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="RO49AAAA1B31007593840000" maxlength="24"
                style="text-transform:uppercase;letter-spacing:1px" />
            </div>
            <div>
              <label class="label">Bancă</label>
              <input type="text" id="prof-bank" class="input" value="${profile.bank_name || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="Ex: BCR, BRD, ING" maxlength="50" />
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 5. Contact de urgență -->
        <div class="card p-6 mb-4">
          <div class="section-title" style="font-size:15px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--primary)">
            🆘 Contact de urgență
          </div>
          <div class="form-row form-row-3">
            <div>
              <label class="label">Nume complet</label>
              <input type="text" id="prof-emg-name" class="input" value="${profile.emergency_contact_name || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="Ion Popescu" maxlength="80" />
            </div>
            <div>
              <label class="label">Telefon</label>
              <input type="tel" id="prof-emg-phone" class="input" value="${profile.emergency_contact_phone || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="+40 7xx xxx xxx" maxlength="15" />
            </div>
            <div>
              <label class="label">Relație</label>
              <input type="text" id="prof-emg-relation" class="input" value="${profile.emergency_contact_relation || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="Ex: Soț/Soție, Părinte" maxlength="40" />
            </div>
          </div>
        </div>

        <!-- 6. Date medicale -->
        <div class="card p-6 mb-4">
          <div class="section-title" style="font-size:15px;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--primary)">
            🩺 Date medicale
          </div>
          <div class="form-row form-row-2">
            <div>
              <label class="label">Grupă sanguină</label>
              <select id="prof-blood-type" class="input" ${isReadOnly ? 'disabled' : ''}>
                <option value="">— Selectează —</option>
                ${['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(g =>
                  `<option value="${g}" ${profile.blood_type === g ? 'selected' : ''}>${g}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label class="label">Alergii cunoscute</label>
              <input type="text" id="prof-allergies" class="input" value="${profile.known_allergies || ''}"
                ${isReadOnly ? 'readonly' : ''} placeholder="Ex: Penicilină, Polen, Nickel" maxlength="200" />
            </div>
          </div>
        </div>

        <!-- Butoane de acțiune (doar pentru proprietar sau admin) -->
        ${isSelf || isAdmin ? `
        <div class="flex justify-between items-center mb-6">
          <button class="btn-danger" onclick="Auth.logout()">Deconectare</button>
          <button class="btn-brand" onclick="Profil.save()">💾 Salvează toate modificările</button>
        </div>
        ` : ''}
      </div>
    `;
  },

  // Calculează vechimea în ani și luni
  calcVechime(hireDateStr) {
    if (!hireDateStr) return '';
    const hire = new Date(hireDateStr);
    const now = new Date();
    let years = now.getFullYear() - hire.getFullYear();
    let months = now.getMonth() - hire.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years === 0 && months === 0) return 'mai puțin de o lună';
    const y = years > 0 ? `${years} an${years !== 1 ? 'i' : ''}` : '';
    const m = months > 0 ? `${months} lun${months !== 1 ? 'i' : 'ă'}` : '';
    return [y, m].filter(Boolean).join(' și ');
  },

  // Calculează vârsta
  calcVarsta(birthDateStr) {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return `${age} ani`;
  },

  // Avertisment expirare CI
  ciExpiryWarning(expiryDateStr) {
    if (!expiryDateStr) return '';
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return `<div class="text-sm mt-1" style="color:var(--danger)">⚠️ CI expirat!</div>`;
    if (daysLeft < 90) return `<div class="text-sm mt-1" style="color:#f59e0b">⚠️ Expiră în ${daysLeft} zile</div>`;
    return '';
  },

  async save() {
    const profile = Auth.currentProfile;
    const isAdmin = profile?.role === 'admin';
    const isSelf = !this.viewUserId || this.viewUserId === Auth.currentUser?.id;
    const targetId = this.viewUserId || Auth.currentUser?.id;

    const updates = {
      full_name: document.getElementById('prof-name')?.value?.trim() || profile?.full_name,
      phone_mobile: document.getElementById('prof-phone-mobile')?.value?.trim() || null,
      phone_work: document.getElementById('prof-phone-work')?.value?.trim() || null,
      hire_date: document.getElementById('prof-hire-date')?.value || null,
      birth_date: document.getElementById('prof-birth-date')?.value || null,
      residence_address: document.getElementById('prof-residence')?.value?.trim() || null,
      emergency_contact_name: document.getElementById('prof-emg-name')?.value?.trim() || null,
      emergency_contact_phone: document.getElementById('prof-emg-phone')?.value?.trim() || null,
      emergency_contact_relation: document.getElementById('prof-emg-relation')?.value?.trim() || null,
      blood_type: document.getElementById('prof-blood-type')?.value || null,
      known_allergies: document.getElementById('prof-allergies')?.value?.trim() || null,
    };

    // Câmpuri sensibile — doar proprietar sau admin
    if (isSelf || isAdmin) {
      updates.cnp = document.getElementById('prof-cnp')?.value?.trim() || null;
      updates.ci_series = document.getElementById('prof-ci-series')?.value?.toUpperCase().trim() || null;
      updates.ci_number = document.getElementById('prof-ci-number')?.value?.trim() || null;
      updates.ci_expiry_date = document.getElementById('prof-ci-expiry')?.value || null;
      updates.ci_issued_by = document.getElementById('prof-ci-issued-by')?.value?.trim() || null;
      updates.iban = document.getElementById('prof-iban')?.value?.toUpperCase().trim() || null;
      updates.bank_name = document.getElementById('prof-bank')?.value?.trim() || null;
    }

    // Câmpuri editabile de admin
    if (isAdmin) {
      updates.job_title = document.getElementById('prof-position')?.value?.trim() || null;
      updates.department = document.getElementById('prof-department')?.value?.trim() || null;
      updates.employee_code = document.getElementById('prof-employee-code')?.value?.toUpperCase().trim() || null;
    }

    // Validare CNP
    const cnp = updates.cnp;
    if (cnp && cnp.length !== 13) {
      showToast('CNP-ul trebuie să conțină exact 13 cifre', 'error');
      return;
    }

    // Validare CI număr
    const ciNum = updates.ci_number;
    if (ciNum && ciNum.length !== 6) {
      showToast('Numărul CI trebuie să conțină exact 6 cifre', 'error');
      return;
    }

    // Validare IBAN
    const iban = updates.iban;
    if (iban && iban.length !== 24) {
      showToast('IBAN-ul trebuie să conțină exact 24 caractere', 'error');
      return;
    }

    const { error } = await DB.updateProfile(targetId, updates);
    if (error) { showToast('Eroare la salvare: ' + error.message, 'error'); return; }

    if (isSelf) {
      Object.assign(Auth.currentProfile, updates);
      if (typeof updateSidebarUser === 'function') updateSidebarUser();
    }
    showToast('Profil actualizat cu succes!', 'success');
    // Re-render pentru a actualiza calculele de vechime/vârstă
    setTimeout(() => this.render(this.viewUserId), 500);
  },
};
