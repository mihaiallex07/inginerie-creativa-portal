// ============================================================
// Profil Module — Profilul meu + vizualizare profil angajat
// Secțiuni: Info profesionale, Date personale, CI (sensibil),
//           Date financiare (sensibil), Contact urgență, Date medicale
// Vizibilitate: angajat vede info prof + date personale + urgență + medical
//               doar proprietarul și adminul văd CI + financiar
// Mod: isSelf → mereu editabil; admin vizualizează alt angajat → preview implicit + buton Editează
// ============================================================
const Profil = {
  viewUserId: null,  // null = profilul propriu, altfel ID-ul altui utilizator
  editMode: false,   // false = preview (pt admin pe alt profil), true = editabil

  async render(userId, forceEdit) {
    this.viewUserId = userId || null;
    const currentProfile = Auth.currentProfile;
    const isAdmin = currentProfile?.role === 'admin';
    const isSelf = !this.viewUserId || this.viewUserId === Auth.currentUser?.id;

    // Dacă e profilul propriu → mereu în mod editabil
    // Dacă admin vizualizează alt angajat → preview implicit (editMode controlat de buton)
    if (isSelf) {
      this.editMode = true;
    } else if (forceEdit !== undefined) {
      this.editMode = !!forceEdit;
    } else {
      this.editMode = false; // preview implicit pentru admin
    }

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

    const isReadOnly = !this.editMode;
    const title = isSelf ? 'Profilul meu' : `Profil: ${profile.full_name || profile.name || profile.email}`;

    // Helper pentru câmp: preview vs input
    const field = (id, value, opts = {}) => {
      if (!this.editMode) {
        // Preview mode: afișează valoarea ca text
        const display = value || `<span style="color:var(--text-muted);font-style:italic">—</span>`;
        return `<div class="input" style="background:var(--bg-secondary,#f8f8f8);cursor:default;color:${value ? 'inherit' : 'var(--text-muted)'}">${display}</div>`;
      }
      const extra = opts.readonly ? 'readonly' : '';
      const style = opts.style ? `style="${opts.style}"` : '';
      const placeholder = opts.placeholder ? `placeholder="${opts.placeholder}"` : '';
      const maxlength = opts.maxlength ? `maxlength="${opts.maxlength}"` : '';
      const pattern = opts.pattern ? `pattern="${opts.pattern}" title="${opts.patternTitle || ''}"` : '';
      const type = opts.type || 'text';
      return `<input type="${type}" id="${id}" class="input" value="${(value || '').replace(/"/g,'&quot;')}" ${extra} ${placeholder} ${maxlength} ${pattern} ${style} />`;
    };

    const selectField = (id, value, options, opts = {}) => {
      if (!this.editMode) {
        const display = value || `<span style="color:var(--text-muted);font-style:italic">—</span>`;
        return `<div class="input" style="background:var(--bg-secondary,#f8f8f8);cursor:default">${display}</div>`;
      }
      const disabled = opts.disabled ? 'disabled' : '';
      const optHtml = options.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('');
      return `<select id="${id}" class="input" ${disabled}><option value="">— Selectează —</option>${optHtml}</select>`;
    };

    document.getElementById('page-content').innerHTML = `
      <div style="max-width:760px">
        <div class="page-header" style="margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:12px">
            <h1 class="page-title">${title}</h1>
            ${!isSelf && isAdmin && !this.editMode ? `
              <button class="btn-brand" onclick="Profil.render('${this.viewUserId}', true)" style="font-size:13px;padding:6px 16px">
                ✏️ Editează
              </button>
            ` : ''}
            ${!isSelf && isAdmin && this.editMode ? `
              <button class="btn-secondary" onclick="Profil.render('${this.viewUserId}', false)" style="font-size:13px;padding:6px 16px">
                👁 Preview
              </button>
            ` : ''}
          </div>
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
              ${field('prof-position', profile.job_title || profile.position, { placeholder: 'Ex: Arhitect', readonly: !isAdmin && !isSelf })}
            </div>
            <div>
              <label class="label">Departament</label>
              ${field('prof-department', profile.department, { placeholder: 'Ex: Proiectare', readonly: !isAdmin && !isSelf })}
            </div>
          </div>
          <div class="form-row form-row-2 mt-3">
            <div>
              <label class="label">Telefon mobil</label>
              ${field('prof-phone-mobile', profile.phone_mobile, { type: 'tel', placeholder: '+40 7xx xxx xxx', maxlength: '15' })}
            </div>
            <div>
              <label class="label">Telefon de serviciu <span class="text-muted">(opțional)</span></label>
              ${field('prof-phone-work', profile.phone_work, { type: 'tel', placeholder: '+40 2xx xxx xxx', maxlength: '15' })}
            </div>
          </div>
          <div class="form-row form-row-2 mt-3">
            <div>
              <label class="label">Data angajării</label>
              ${field('prof-hire-date', profile.hire_date, { type: 'date', readonly: !isAdmin && !isSelf })}
              ${profile.hire_date ? `<div class="text-sm text-muted mt-1">Vechime: ${Profil.calcVechime(profile.hire_date)}</div>` : ''}
            </div>
            <div>
              <label class="label">Cod angajat</label>
              ${field('prof-employee-code', profile.employee_code, { placeholder: 'Ex: MP', maxlength: '5', style: 'text-transform:uppercase', readonly: !isAdmin })}
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
              ${field('prof-birth-date', profile.birth_date, { type: 'date' })}
              ${profile.birth_date ? `<div class="text-sm text-muted mt-1">Vârstă: ${Profil.calcVarsta(profile.birth_date)}</div>` : ''}
            </div>
            <div>
              <label class="label">Adresă de reședință <span class="text-muted">(opțional)</span></label>
              ${field('prof-residence', profile.residence_address, { placeholder: 'Str. Exemplu nr. 1, Cluj-Napoca' })}
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
              ${field('prof-cnp', profile.cnp, { placeholder: '1234567890123', maxlength: '13', pattern: '[0-9]{13}', patternTitle: 'CNP trebuie să conțină exact 13 cifre' })}
            </div>
            <div>
              <label class="label">Serie CI</label>
              ${field('prof-ci-series', profile.ci_series, { placeholder: 'CJ', maxlength: '2', style: 'text-transform:uppercase' })}
            </div>
            <div>
              <label class="label">Număr CI</label>
              ${field('prof-ci-number', profile.ci_number, { placeholder: '123456', maxlength: '6', pattern: '[0-9]{6}', patternTitle: 'Numărul CI trebuie să conțină exact 6 cifre' })}
            </div>
          </div>
          <div class="form-row form-row-2">
            <div>
              <label class="label">Data expirare CI</label>
              ${field('prof-ci-expiry', profile.ci_expiry_date, { type: 'date' })}
              ${profile.ci_expiry_date ? Profil.ciExpiryWarning(profile.ci_expiry_date) : ''}
            </div>
            <div>
              <label class="label">Eliberat de</label>
              ${field('prof-ci-issued-by', profile.ci_issued_by, { placeholder: 'SPCLEP Cluj-Napoca', maxlength: '60' })}
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
              ${field('prof-iban', profile.iban, { placeholder: 'RO49AAAA1B31007593840000', maxlength: '24', style: 'text-transform:uppercase;letter-spacing:1px' })}
            </div>
            <div>
              <label class="label">Bancă</label>
              ${field('prof-bank', profile.bank_name, { placeholder: 'Ex: BCR, BRD, ING', maxlength: '50' })}
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
              ${field('prof-emg-name', profile.emergency_contact_name, { placeholder: 'Ion Popescu', maxlength: '80' })}
            </div>
            <div>
              <label class="label">Telefon</label>
              ${field('prof-emg-phone', profile.emergency_contact_phone, { type: 'tel', placeholder: '+40 7xx xxx xxx', maxlength: '15' })}
            </div>
            <div>
              <label class="label">Relație</label>
              ${field('prof-emg-relation', profile.emergency_contact_relation, { placeholder: 'Ex: Soț/Soție, Părinte', maxlength: '40' })}
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
              ${selectField('prof-blood-type', profile.blood_type, ['O+','O-','A+','A-','B+','B-','AB+','AB-'])}
            </div>
            <div>
              <label class="label">Alergii cunoscute</label>
              ${field('prof-allergies', profile.known_allergies, { placeholder: 'Ex: Penicilină, Polen, Nickel', maxlength: '200' })}
            </div>
          </div>
        </div>

        <!-- Butoane de acțiune (doar când e în mod editabil) -->
        ${this.editMode ? `
        <div class="flex justify-between items-center mb-6">
          ${isSelf ? `<button class="btn-danger" onclick="Auth.logout()">Deconectare</button>` : `<div></div>`}
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
    const currentProfile = Auth.currentProfile;
    const isAdmin = currentProfile?.role === 'admin';
    const isSelf = !this.viewUserId || this.viewUserId === Auth.currentUser?.id;
    // Salvează pe angajatul vizualizat, NU pe cel logat
    const targetId = isSelf ? Auth.currentUser?.id : this.viewUserId;

    if (!targetId) { showToast('Eroare: ID utilizator lipsă', 'error'); return; }

    const updates = {
      full_name: document.getElementById('prof-name')?.value?.trim() || undefined,
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
    // Elimină undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

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

    // Actualizează cache-ul local doar dacă e profilul propriu
    if (isSelf) {
      Object.assign(Auth.currentProfile, updates);
      if (typeof updateSidebarUser === 'function') updateSidebarUser();
    }
    showToast('Profil actualizat cu succes!', 'success');
    // Re-render în mod preview după salvare (dacă e alt angajat)
    setTimeout(() => this.render(this.viewUserId, isSelf ? true : false), 500);
  },
};
