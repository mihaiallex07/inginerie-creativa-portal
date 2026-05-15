// ============================================================
// Time Tracking Module — Portal Inginerie Creativă
// ============================================================

const TimeTracking = {
  currentWeekStart: null,
  entries: [],
  projects: [],
  tasks: [],
  activeTimer: null,
  timerInterval: null,
  selectedDate: getTodayStr(),

  async render() {
    this.currentWeekStart = getWeekStart(new Date());
    await this.loadData();
    this.renderPage();
  },

  async loadData() {
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const userId = Auth.currentUser?.id;
    const isAdmin = Auth.currentProfile?.role === 'admin';

    const [entriesRes, projectsRes, membershipsRes] = await Promise.all([
      DB.getTimeEntries(userId, formatDateISO(this.currentWeekStart), formatDateISO(weekEnd)),
      DB.getProjects(),
      dbQuery('project_members', q => q.select('project_id').eq('user_id', userId), []),
    ]);
    this.entries = entriesRes.data || [];
    const allProjects = (projectsRes.data || []).filter(p => p.status === 'activ');

    // Filtrare proiecte: admin vede toate, angajat vede doar proiectele la care e înrolat
    if (isAdmin) {
      this.projects = allProjects;
    } else {
      const enrolledIds = new Set((membershipsRes.data || []).map(m => m.project_id));
      this.projects = allProjects.filter(p => enrolledIds.has(p.id));
    }

    // Load tasks for accessible projects
    const allTasksRes = await Promise.all(this.projects.map(p => DB.getProjectTasks(p.id)));
    const allTasks = allTasksRes.flatMap(r => r.data || []);
    // Filtrare task-uri: admin vede toate, angajat vede STRICT task-urile asignate lui
    if (isAdmin) {
      this.tasks = allTasks;
    } else {
      // Verificăm și dacă e coordonator pe vreun proiect
      const coordProjectIds = new Set((membershipsRes.data || []).filter(m => m.role === 'coordonator').map(m => m.project_id));
      this.tasks = allTasks.filter(t => {
        if (coordProjectIds.has(t.project_id)) return true; // coordonatorii văd toate task-urile din proiectele lor
        return t.assigned_user_id === userId; // angajații văd STRICT task-urile asignate lor
      });
    }
  },

  renderPage() {
    const days = this.getWeekDays();
    const totalMins = this.entries.filter(e => e.count_in_time).reduce((s, e) => s + e.duration_minutes, 0);

    document.getElementById('page-content').innerHTML = `
      <div style="width:100%">
        <div class="page-header">
          <div>
            <h1 class="page-title">Time-Tracking</h1>
            <p class="page-subtitle">Total săptămână: <strong>${(totalMins/60).toFixed(1)}h</strong> (${totalMins} min)</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary" onclick="TimeTracking.prevWeek()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              Săptămâna anterioară
            </button>
            <button class="btn-secondary" onclick="TimeTracking.thisWeek()">Săptămâna curentă</button>
            <button class="btn-secondary" onclick="TimeTracking.nextWeek()">
              Săptămâna viitoare
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="btn-brand" onclick="TimeTracking.openAddModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adaugă activitate
            </button>
          </div>
        </div>

        <!-- Week calendar -->
        <div class="card mb-3" style="overflow:hidden">
          <!-- Day headers -->
          <div style="display:grid;grid-template-columns:52px repeat(7,1fr);border-bottom:1px solid var(--border);background:var(--surface-2)">
            <div style="border-right:1px solid var(--border);padding:8px 4px;font-size:10px;color:var(--text-muted);text-align:center">ORA</div>
            ${days.map(d => {
              const isToday = d.str === getTodayStr();
              const dayEntries = this.entries.filter(e => e.date === d.str);
              const dayMins = dayEntries.filter(e => e.count_in_time).reduce((s, e) => s + e.duration_minutes, 0);
              return `
                <div style="border-right:1px solid var(--border);padding:6px 4px;text-align:center;${isToday ? 'background:rgba(255,203,9,0.08)' : ''}">
                  <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase">${d.dayName}</div>
                  <div style="font-size:16px;font-weight:700;color:${isToday ? 'var(--nero)' : 'var(--text)'}">
                    ${isToday
                      ? `<span style="background:var(--brand);color:var(--nero);width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">${d.dayNum}</span>`
                      : d.dayNum
                    }
                  </div>
                  <div style="font-size:10px;color:var(--text-muted)">${dayMins > 0 ? (dayMins/60).toFixed(1)+'h' : ''}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Time grid (8:00 - 20:00) -->
          <div style="display:grid;grid-template-columns:52px repeat(7,1fr);max-height:480px;overflow-y:auto;position:relative">
            ${Array.from({length: 13}, (_, i) => i + 8).map(hour => `
              <div style="border-right:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface-2)">
                <div style="height:48px;display:flex;align-items:flex-start;justify-content:flex-end;padding:2px 6px 0 0;font-size:10px;color:var(--text-light)">${hour}:00</div>
              </div>
              ${days.map(d => {
                const isToday = d.str === getTodayStr();
                const cellEntries = this.entries.filter(e => e.date === d.str && e.start_hour === hour);
                return `
                  <div style="border-right:1px solid var(--border);border-bottom:1px solid var(--border);height:48px;position:relative;${isToday ? 'background:rgba(255,203,9,0.03)' : ''}"
                       onclick="TimeTracking.openAddModal('${d.str}', ${hour})">
                    ${cellEntries.map(e => {
                      const top = (e.start_min / 60) * 48;
                      const height = Math.max(16, (e.duration_minutes / 60) * 48);
                      const color = e.project_id
                        ? (this.projects.find(p => p.id === e.project_id)?.color || getActivityColor(e.activity_type))
                        : getActivityColor(e.activity_type);
                      return `
                        <div class="tt-entry" style="top:${top}px;height:${height}px;background:${color};color:${isLightColor(color) ? '#221F1F' : '#fff'}"
                             onclick="event.stopPropagation();TimeTracking.viewEntry(${e.id})"
                             title="${e.task_name}">
                          ${e.task_name}
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }).join('')}
            `).join('')}
          </div>
        </div>

        <!-- Entries list -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Activități săptămâna aceasta</span>
            <span class="text-sm text-muted">${this.entries.length} înregistrări</span>
          </div>
          <div style="overflow-x:auto">
            ${this.entries.length === 0 ? emptyState('Nu există activități înregistrate pentru această săptămână') : `
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Ora</th>
                    <th>Activitate</th>
                    <th>Tip</th>
                    <th>Proiect</th>
                    <th>Durată</th>
                    <th>Pontaj</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${this.entries.map(e => {
                    const project = this.projects.find(p => p.id === e.project_id);
                    return `
                      <tr>
                        <td>${formatDate(e.date)}</td>
                        <td style="font-family:monospace;font-size:12px">${String(e.start_hour).padStart(2,'0')}:${String(e.start_min).padStart(2,'0')}</td>
                        <td style="font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.task_name}</td>
                        <td><span style="display:inline-flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${getActivityColor(e.activity_type)};display:inline-block"></span>${getActivityLabel(e.activity_type)}</span></td>
                        <td>${project ? `<span style="display:inline-flex;align-items:center;gap:4px">${project.emoji || '📁'} ${project.abbreviation || project.name}</span>` : '—'}</td>
                        <td style="font-weight:600">${formatHours(e.duration_minutes)}</td>
                        <td>${e.count_in_time ? badge('Da', 'green') : badge('Nu', 'gray')}</td>
                        <td>
                          <button class="btn-icon" onclick="TimeTracking.deleteEntry(${e.id})" title="Șterge" style="color:var(--danger)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </div>
    `;
  },

  openAddModal(date = getTodayStr(), hour = 9) {
    const projectOptions = this.projects.map(p =>
      `<option value="${p.id}">${p.emoji || ''} ${p.name}</option>`
    ).join('');

    const taskOptions = `<option value="">— Selectează task —</option>`;

    openModal('Adaugă activitate', `
      <div class="space-y-3">
        <div class="form-row form-row-2">
          <div>
            <label class="label">Data</label>
            <input type="date" id="tt-date" class="input" value="${date}" />
          </div>
          <div>
            <label class="label">Tip activitate</label>
            <select id="tt-type" class="select">
              <option value="proiectare">Proiectare</option>
              <option value="verificare">Verificare</option>
              <option value="administrativ">Administrativ</option>
              <option value="deplasare">Deplasare</option>
              <option value="formare">Formare</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Descriere activitate *</label>
          <input type="text" id="tt-task" class="input" placeholder="Ex: Planșe arhitectură etaj 2" />
        </div>
        <div class="form-row form-row-2">
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
              ${taskOptions}
            </select>
          </div>
        </div>
        <div class="form-row form-row-3">
          <div>
            <label class="label">Ora start</label>
            <input type="number" id="tt-hour" class="input" value="${hour}" min="0" max="23" />
          </div>
          <div>
            <label class="label">Minut start</label>
            <input type="number" id="tt-min" class="input" value="0" min="0" max="59" step="15" />
          </div>
          <div>
            <label class="label">Durată (minute)</label>
            <input type="number" id="tt-duration" class="input" value="60" min="15" max="480" step="15" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="tt-count" checked style="width:16px;height:16px;accent-color:var(--brand)" />
          <label for="tt-count" style="font-size:13px;cursor:pointer">Contorizează în pontaj</label>
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

    const hour = parseInt(document.getElementById('tt-hour')?.value) || 9;
    const min = parseInt(document.getElementById('tt-min')?.value) || 0;
    const projectId = document.getElementById('tt-project')?.value || null;
    const taskId = document.getElementById('tt-task-id')?.value || null;

    // Găsim phase_id din task selectat
    let phaseId = null;
    if (taskId) {
      const task = this.tasks.find(t => String(t.id) === String(taskId));
      if (task) phaseId = task.phase_id || null;
    }

    const entry = {
      user_id: Auth.currentUser?.id,
      date: document.getElementById('tt-date')?.value,
      start_time: String(hour).padStart(2,'0') + ':' + String(min).padStart(2,'0') + ':00',
      duration_minutes: parseInt(document.getElementById('tt-duration')?.value) || 60,
      task_name: taskName,
      activity_type: document.getElementById('tt-type')?.value || 'proiectare',
      project_id: projectId ? parseInt(projectId) : null,
      project_task_id: taskId ? parseInt(taskId) : null,
      phase_id: phaseId,
      is_billable: document.getElementById('tt-count')?.checked ?? true,
      status: 'draft',
    };

    const result = await dbQuery('time_entries', q => q.insert(entry).select().single(), null);
    if (result && result.error) { showToast('Eroare la salvare: ' + result.error.message, 'error'); return; }

    // Actualizează minutes_worked pe task dacă e selectat
    if (taskId && entry.duration_minutes) {
      const task = this.tasks.find(t => String(t.id) === String(taskId));
      if (task) {
        const newMinutes = (task.minutes_worked || 0) + entry.duration_minutes;
        await dbQuery('project_tasks', q => q.update({ minutes_worked: newMinutes }).eq('id', taskId), null);
      }
    }

    closeModalForce();
    showToast('Activitate salvată', 'success');
    await this.loadData();
    this.renderPage();
  },

  viewEntry(id) {
    const e = this.entries.find(e => e.id === id);
    if (!e) return;
    const project = this.projects.find(p => p.id === e.project_id);
    openModal('Detalii activitate', `
      <div class="space-y-3">
        <div><strong>${e.task_name}</strong></div>
        <div class="text-sm text-muted">${formatDate(e.date)} · ${String(e.start_hour).padStart(2,'0')}:${String(e.start_min).padStart(2,'0')} · ${formatHours(e.duration_minutes)}</div>
        <div>${badge(getActivityLabel(e.activity_type), 'blue')}</div>
        ${project ? `<div class="text-sm">Proiect: <strong>${project.name}</strong></div>` : ''}
        <div class="text-sm">Pontaj: ${e.count_in_time ? badge('Da', 'green') : badge('Nu', 'gray')}</div>
      </div>
    `, `
      <button class="btn-secondary" onclick="closeModalForce()">Închide</button>
      <button class="btn-danger" onclick="TimeTracking.deleteEntry(${id});closeModalForce()">Șterge</button>
    `);
  },

  async deleteEntry(id) {
    const { error } = await DB.deleteTimeEntry(id);
    if (error) { showToast('Eroare la ștergere', 'error'); return; }
    showToast('Activitate ștearsă', 'success');
    await this.loadData();
    this.renderPage();
  },

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
    this.currentWeekStart = getWeekStart(new Date());
    await this.loadData();
    this.renderPage();
  },

  getWeekDays() {
    const days = [];
    const dayNames = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push({
        str: formatDateISO(d),
        dayName: dayNames[i],
        dayNum: d.getDate(),
      });
    }
    return days;
  },
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

function isLightColor(hex) {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// Timer functions are now handled globally in app.js
// startGlobalTimer(), stopGlobalTimerInterval(), updateHeaderTimer(), stopActiveTimer()
// window.activeTimerData and window.pausedTimerData are the shared state
