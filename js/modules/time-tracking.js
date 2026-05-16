// Time Tracking Module — Portal Inginerie Creativă
// Schema Supabase time_entries (camelCase):
//   id, userId(int), projectId(int), date(date), startHour(int), startMin(int),
//   endHour(int), endMin(int), durationMinutes(int), activityType(enum), taskName(varchar),
//   description(text), isBillable(bool), isRunning(bool), status(enum), createdAt, updatedAt
// ============================================================

const TimeTracking = {
  currentWeekStart: null,
  entries: [],
  projects: [],
  tasks: [],

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Returnează data locală ca YYYY-MM-DD (fără UTC shift)
  localDateStr(d) {
    const dt = d || new Date();
    return dt.getFullYear() + '-' +
      String(dt.getMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getDate()).padStart(2, '0');
  },

  // Returnează ziua de Luni a săptămânii care conține `d`
  weekStart(d) {
    const dt = new Date(d);
    const day = dt.getDay(); // 0=Sun, 1=Mon...
    const diff = (day === 0 ? -6 : 1 - day);
    dt.setDate(dt.getDate() + diff);
    dt.setHours(0, 0, 0, 0);
    return dt;
  },

  // Formatare dată dd/mm/yyyy
  fmtDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = String(dateStr).split('-');
    return `${d}/${m}/${y}`;
  },

  // Formatare ore din minute
  fmtDuration(mins) {
    if (!mins) return '0h';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  },

  // Formatare oră HH:MM
  fmtTime(h, m) {
    return String(h || 0).padStart(2, '0') + ':' + String(m || 0).padStart(2, '0');
  },

  // userId numeric al utilizatorului curent
  getNumericUserId() {
    // Auth.currentProfile.id este integer (serial din users table)
    return Auth.currentProfile?.id || null;
  },

  // ── Lifecycle ────────────────────────────────────────────────────────────

  async render() {
    this.currentWeekStart = this.weekStart(new Date());
    await this.loadData();
    this.renderPage();
  },

  async loadData() {
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const userId = this.getNumericUserId();
    const isAdmin = Auth.currentProfile?.role === 'admin';

    // Încarcă time entries pentru săptămâna curentă
    const sb = getSupabase();
    if (!sb) {
      this.entries = [];
      this.projects = [];
      this.tasks = [];
      return;
    }

    const dateFrom = this.localDateStr(this.currentWeekStart);
    const dateTo = this.localDateStr(weekEnd);

    const [entriesRes, projectsRes, membershipsRes] = await Promise.all([
      sb.from('time_entries')
        .select('*')
        .eq('userId', userId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: true })
        .order('startHour', { ascending: true }),
      sb.from('projects').select('id,name,color,emoji').eq('status', 'activ'),
      sb.from('project_members').select('project_id,role').eq('user_id', userId),
    ]);

    this.entries = entriesRes.data || [];
    const allProjects = projectsRes.data || [];
    const memberships = membershipsRes.data || [];

    if (isAdmin) {
      this.projects = allProjects;
    } else {
      const enrolledIds = new Set(memberships.map(m => m.project_id));
      this.projects = allProjects.filter(p => enrolledIds.has(p.id));
    }

    // Încarcă task-urile pentru proiectele accesibile
    if (this.projects.length > 0) {
      const projectIds = this.projects.map(p => p.id);
      const tasksRes = await sb.from('project_tasks')
        .select('id,name,project_id,phase_id,assigned_user_id,budget_hours,minutes_worked')
        .in('project_id', projectIds)
        .order('display_order');
      const allTasks = tasksRes.data || [];
      if (isAdmin) {
        this.tasks = allTasks;
      } else {
        const coordProjectIds = new Set(memberships.filter(m => m.role === 'coordonator').map(m => m.project_id));
        this.tasks = allTasks.filter(t =>
          coordProjectIds.has(t.project_id) || t.assigned_user_id === userId
        );
      }
    } else {
      this.tasks = [];
    }
  },

  // ── Navigare săptămână ───────────────────────────────────────────────────

  async prevWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    await this.loadData();
    this.renderPage();
  },

  async nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    await this.loadData();
    this.renderPage();
  },

  async thisWeek() {
    this.currentWeekStart = this.weekStart(new Date());
    await this.loadData();
    this.renderPage();
  },

  // ── Render ───────────────────────────────────────────────────────────────

  renderPage() {
    const days = this.getWeekDays();
    const totalMins = this.entries.reduce((s, e) => s + (e.durationMinutes || 0), 0);
    const todayStr = this.localDateStr();

    // Construiește header-ul zilelor
    const DAY_LABELS = ['LU', 'MA', 'MI', 'JO', 'VI', 'SÂ', 'DU'];
    const dayHeaders = days.map((d, i) => {
      const dStr = this.localDateStr(d);
      const isToday = dStr === todayStr;
      const dayNum = d.getDate();
      return `<th style="text-align:center;padding:8px 4px;font-weight:600;font-size:12px;color:var(--text-muted)">
        <div>${DAY_LABELS[i]}</div>
        <div style="width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-top:2px;
          ${isToday ? 'background:var(--primary);color:#fff;font-weight:700' : 'color:var(--text)'}">
          ${dayNum}
        </div>
      </th>`;
    }).join('');

    // Construiește rândurile de ore (8-18)
    const HOURS = [8,9,10,11,12,13,14,15,16,17,18];
    const rows = HOURS.map(hour => {
      const cells = days.map(d => {
        const dStr = this.localDateStr(d);
        const dayEntries = this.entries.filter(e => e.date === dStr && (e.startHour || 0) === hour);
        const blocks = dayEntries.map(e => {
          const proj = this.projects.find(p => p.id === e.projectId);
          const color = proj?.color || '#3B82F6';
          const emoji = proj?.emoji || '';
          const heightPx = Math.max(20, Math.round((e.durationMinutes || 60) / 60 * 40));
          return `<div onclick="TimeTracking.viewEntry(${e.id})"
            title="${e.taskName || ''} · ${this.fmtDuration(e.durationMinutes)}"
            style="background:${color}22;border-left:3px solid ${color};border-radius:3px;padding:2px 4px;
              margin:1px 0;cursor:pointer;font-size:10px;line-height:1.3;overflow:hidden;
              max-height:${heightPx}px;min-height:18px">
            <span style="font-weight:600;color:${color}">${emoji} ${e.taskName || 'Activitate'}</span>
          </div>`;
        }).join('');
        return `<td style="border:1px solid var(--border);padding:2px;vertical-align:top;min-width:80px;height:40px">${blocks}</td>`;
      }).join('');
      return `<tr>
        <td style="padding:4px 8px;font-size:11px;color:var(--text-muted);white-space:nowrap;border-right:1px solid var(--border)">${String(hour).padStart(2,'0')}:00</td>
        ${cells}
      </tr>`;
    }).join('');

    // Tabel activități
    const tableRows = this.entries.length === 0
      ? `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">
          <div style="font-size:32px;margin-bottom:8px">⏱</div>
          Nu există activități înregistrate pentru această săptămână
        </td></tr>`
      : this.entries.map(e => {
          const proj = this.projects.find(p => p.id === e.projectId);
          return `<tr style="border-bottom:1px solid var(--border)">
            <td style="padding:8px 12px">${this.fmtDate(e.date)}</td>
            <td style="padding:8px 12px;font-weight:500">${e.taskName || '—'}</td>
            <td style="padding:8px 12px;color:var(--text-muted)">${proj ? `${proj.emoji || ''} ${proj.name}` : '—'}</td>
            <td style="padding:8px 12px">${this.fmtTime(e.startHour, e.startMin)}${e.endHour != null ? ' → ' + this.fmtTime(e.endHour, e.endMin) : ''}</td>
            <td style="padding:8px 12px"><span class="badge badge-blue">${this.fmtDuration(e.durationMinutes)}</span></td>
            <td style="padding:8px 12px">
              <button onclick="TimeTracking.deleteEntry(${e.id})" title="Șterge"
                style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:14px;padding:2px 6px">🗑</button>
            </td>
          </tr>`;
        }).join('');

    document.getElementById('page-content').innerHTML = `
      <div style="width:100%">
        <div class="page-header">
          <div>
            <h1 class="page-title">Time-Tracking</h1>
            <p class="page-subtitle">Total săptămână: <strong>${this.fmtDuration(totalMins)}</strong></p>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary" onclick="TimeTracking.prevWeek()">
              ‹ Săptămâna anterioară
            </button>
            <button class="btn-secondary" onclick="TimeTracking.thisWeek()">Săptămâna curentă</button>
            <button class="btn-secondary" onclick="TimeTracking.nextWeek()">
              Săptămâna viitoare ›
            </button>
            <button class="btn-brand" onclick="TimeTracking.openAddModal()">
              + Adaugă activitate
            </button>
          </div>
        </div>

        <!-- Calendar săptămânal -->
        <div class="card mb-3" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:600px">
            <thead>
              <tr>
                <th style="width:50px;border-right:1px solid var(--border)"></th>
                ${dayHeaders}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <!-- Tabel activități -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)">
            <h3 style="margin:0;font-size:14px;font-weight:600">Activități săptămâna aceasta</h3>
            <span style="font-size:12px;color:var(--text-muted)">${this.entries.length} înregistrări</span>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:var(--bg-secondary,#f8f9fa)">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--text-muted)">Data</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--text-muted)">Activitate</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--text-muted)">Proiect</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--text-muted)">Interval</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--text-muted)">Durată</th>
                <th style="padding:8px 12px;width:50px"></th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  getWeekDays() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  },

  // ── Modal adăugare activitate ─────────────────────────────────────────────

  openAddModal(prefillDate) {
    const today = prefillDate || this.localDateStr();
    const now = new Date();
    const projectOptions = this.projects.map(p =>
      `<option value="${p.id}">${p.emoji || ''} ${p.name}</option>`
    ).join('');

    openModal('Adaugă activitate', `
      <div class="space-y-3">
        <div class="flex gap-3">
          <div style="flex:1">
            <label class="label">Data *</label>
            <input type="date" id="tt-date" class="input" value="${today}">
          </div>
          <div style="flex:1">
            <label class="label">Durată (minute) *</label>
            <input type="number" id="tt-duration" class="input" value="60" min="1" max="720">
          </div>
        </div>
        <div class="flex gap-3">
          <div style="flex:1">
            <label class="label">Ora start</label>
            <input type="number" id="tt-hour" class="input" value="${now.getHours()}" min="0" max="23" placeholder="9">
          </div>
          <div style="flex:1">
            <label class="label">Minut start</label>
            <input type="number" id="tt-min" class="input" value="0" min="0" max="59" placeholder="0">
          </div>
        </div>
        <div>
          <label class="label">Descriere activitate *</label>
          <input type="text" id="tt-task" class="input" placeholder="Ex: Planșe arhitectură etaj 2">
        </div>
        <div>
          <label class="label">Proiect</label>
          <select id="tt-project" class="select" onchange="TimeTracking.onProjectChange(this.value)">
            <option value="">— Fără proiect —</option>
            ${projectOptions}
          </select>
        </div>
        <div>
          <label class="label">Task proiect</label>
          <select id="tt-task-id" class="select">
            <option value="">— Selectează task —</option>
          </select>
        </div>
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModalForce()">Anulează</button>
      <button class="btn-brand" onclick="TimeTracking.saveEntry()">Salvează</button>
    `);
  },

  onProjectChange(projectId) {
    const taskSelect = document.getElementById('tt-task-id');
    if (!taskSelect) return;
    const pid = parseInt(projectId);
    const tasks = this.tasks.filter(t => t.project_id === pid);
    taskSelect.innerHTML = `<option value="">— Selectează task —</option>` +
      tasks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  },

  async saveEntry() {
    const taskName = document.getElementById('tt-task')?.value?.trim();
    if (!taskName) { showToast('Completează descrierea activității', 'error'); return; }

    const dateVal = document.getElementById('tt-date')?.value;
    if (!dateVal) { showToast('Selectează data', 'error'); return; }

    const startHour = parseInt(document.getElementById('tt-hour')?.value) || 0;
    const startMin = parseInt(document.getElementById('tt-min')?.value) || 0;
    const durationMinutes = parseInt(document.getElementById('tt-duration')?.value) || 60;
    const projectId = document.getElementById('tt-project')?.value || null;
    const taskId = document.getElementById('tt-task-id')?.value || null;
    const userId = this.getNumericUserId();

    if (!userId) { showToast('Eroare: utilizator neidentificat', 'error'); return; }

    // Calculăm endHour/endMin din start + durată
    const totalStartMins = startHour * 60 + startMin;
    const totalEndMins = totalStartMins + durationMinutes;
    const endHour = Math.floor(totalEndMins / 60) % 24;
    const endMin = totalEndMins % 60;

    const entry = {
      userId: userId,
      date: dateVal,
      startHour: startHour,
      startMin: startMin,
      endHour: endHour,
      endMin: endMin,
      durationMinutes: durationMinutes,
      taskName: taskName,
      activityType: 'proiectare',
      projectId: projectId ? parseInt(projectId) : null,
      isBillable: true,
      status: 'salvat',
    };

    const sb = getSupabase();
    if (!sb) { showToast('Eroare: conexiune Supabase indisponibilă', 'error'); return; }

    const { data, error } = await sb.from('time_entries').insert(entry).select().single();
    if (error) {
      console.error('[TT] saveEntry error:', error);
      showToast('Eroare la salvare: ' + error.message, 'error');
      return;
    }

    // Actualizează minutes_worked pe task dacă e selectat
    if (taskId && durationMinutes) {
      const task = this.tasks.find(t => String(t.id) === String(taskId));
      if (task) {
        const newMinutes = (task.minutes_worked || 0) + durationMinutes;
        await sb.from('project_tasks').update({ minutes_worked: newMinutes }).eq('id', parseInt(taskId));
        task.minutes_worked = newMinutes;
      }
    }

    closeModalForce();
    showToast('✅ Activitate salvată', 'success');
    await this.loadData();
    this.renderPage();
  },

  // ── Vizualizare intrare ───────────────────────────────────────────────────

  viewEntry(id) {
    const e = this.entries.find(e => e.id === id);
    if (!e) return;
    const proj = this.projects.find(p => p.id === e.projectId);
    openModal('Detalii activitate', `
      <div class="space-y-3">
        <div style="font-size:16px;font-weight:600">${e.taskName || 'Activitate'}</div>
        <div style="color:var(--text-muted);font-size:13px">
          ${this.fmtDate(e.date)} · ${this.fmtTime(e.startHour, e.startMin)}
          ${e.endHour != null ? ' → ' + this.fmtTime(e.endHour, e.endMin) : ''}
          · ${this.fmtDuration(e.durationMinutes)}
        </div>
        ${proj ? `<div style="font-size:13px">Proiect: <strong>${proj.emoji || ''} ${proj.name}</strong></div>` : ''}
        ${e.description ? `<div style="font-size:13px;color:var(--text-muted)">${e.description}</div>` : ''}
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModalForce()">Închide</button>
      <button class="btn-danger" onclick="TimeTracking.deleteEntry(${id});closeModalForce()">🗑 Șterge</button>
    `);
  },

  async deleteEntry(id) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('time_entries').delete().eq('id', id);
    if (error) { showToast('Eroare la ștergere: ' + error.message, 'error'); return; }
    showToast('Activitate ștearsă', 'success');
    await this.loadData();
    this.renderPage();
  },

  // ── Integrare cu timer din Proiecte / Start Task ──────────────────────────
  // Apelat de Proiecte.stopTask() și stopActiveTimer() din app.js

  async saveFromTimer(timerData, minutes) {
    const userId = this.getNumericUserId();
    if (!userId) return { error: { message: 'Utilizator neidentificat' } };

    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase indisponibil' } };

    const now = new Date();
    const localDate = this.localDateStr(now);
    const endHour = now.getHours();
    const endMin = now.getMinutes();

    const totalStartMins = (timerData.startHour || 0) * 60 + (timerData.startMin || 0);
    // Recalculăm startHour/Min din startTime dacă nu sunt setate
    let startHour = timerData.startHour;
    let startMin = timerData.startMin;
    if (startHour === undefined || startHour === null) {
      const startDate = new Date(timerData.startTime);
      startHour = startDate.getHours();
      startMin = startDate.getMinutes();
    }

    const entry = {
      userId: userId,
      date: localDate,
      startHour: startHour,
      startMin: startMin,
      endHour: endHour,
      endMin: endMin,
      durationMinutes: minutes,
      taskName: timerData.taskName || '',
      activityType: 'proiectare',
      projectId: timerData.projectId ? parseInt(timerData.projectId) : null,
      isBillable: true,
      status: 'salvat',
    };

    const result = await sb.from('time_entries').insert(entry).select().single();
    return result;
  },
};
