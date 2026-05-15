// ============================================================
// Process Overview — Portal Inginerie Creativă
// Gantt-style timeline: proiecte × angajați înrolați × 90 zile
// Afișează DOAR angajații care sunt membri ai proiectului
// ============================================================

const ProcessOverview = {
  ZOOM_PX: 28,
  LABEL_W: 220,
  ROW_H: 40,
  BAR_H: 22,
  DEPT_H: 32,
  DAYS: 90,
  offsetDays: 0,

  projects: [],
  users: [],
  memberships: [],   // toate înregistrările din project_members

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Se încarcă...</p></div>`;

    // Încarcă proiecte, utilizatori și TOȚI membrii proiectelor active
    const [projRes, userRes] = await Promise.all([DB.getProjects(), DB.getUsers()]);
    this.projects = (projRes.data || []).filter(p => p.status !== 'arhivat');
    this.users = userRes.data || [];

    // Încarcă membrii pentru toate proiectele active
    const activeProjects = this.projects.filter(p => p.status === 'activ' || p.status === 'in_progress');
    if (activeProjects.length > 0) {
      const membRes = await dbQuery('project_members', q =>
        q.select('project_id,user_id,role')
         .in('project_id', activeProjects.map(p => p.id)),
        []
      );
      this.memberships = membRes.data || [];
    } else {
      this.memberships = [];
    }

    this.renderPage();
  },

  renderPage() {
    const content = document.getElementById('page-content');
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + this.offsetDays);

    const days = this.DAYS;
    const totalW = days * this.ZOOM_PX;
    const LW = this.LABEL_W;

    const activeProjects = this.projects.filter(p => p.status === 'activ' || p.status === 'in_progress');

    // Construiește un map: userId → lista proiectelor în care e înrolat
    const userProjectMap = {};
    this.memberships.forEach(m => {
      if (!userProjectMap[m.user_id]) userProjectMap[m.user_id] = [];
      const proj = this.projects.find(p => p.id === m.project_id);
      if (proj) userProjectMap[m.user_id].push({ ...proj, memberRole: m.role });
    });

    // Filtrează utilizatorii care sunt înrolați în cel puțin un proiect activ
    const enrolledUsers = this.users.filter(u => userProjectMap[u.id] && userProjectMap[u.id].length > 0);

    // Grupează pe departamente (doar utilizatorii înrolați)
    const deptMap = {};
    enrolledUsers.forEach(u => {
      const dept = u.department || 'General';
      if (!deptMap[dept]) deptMap[dept] = [];
      deptMap[dept].push(u);
    });

    // Month header segments
    let monthSegs = [];
    for (let d = 0; d < days; d++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + d);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (!monthSegs.length || monthSegs[monthSegs.length - 1].key !== key) {
        monthSegs.push({ key, label: dt.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }), start: d, count: 1 });
      } else {
        monthSegs[monthSegs.length - 1].count++;
      }
    }

    // Day header
    let dayHeader = '';
    for (let d = 0; d < days; d++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + d);
      const isToday = dt.toDateString() === today.toDateString();
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
      dayHeader += `<div class="gantt-day-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">${dt.getDate()}</div>`;
    }

    // Rows
    let rowsHtml = '';
    let totalRows = 0;

    if (Object.keys(deptMap).length === 0) {
      rowsHtml = `
        <div style="padding:48px;text-align:center;color:var(--text-muted)">
          <div style="font-size:32px;margin-bottom:12px">📋</div>
          <div style="font-size:15px;font-weight:500">Niciun angajat înrolat în proiecte active</div>
          <div style="font-size:13px;margin-top:6px">Adaugă membri în echipa proiectelor pentru a-i vedea aici.</div>
        </div>
      `;
    } else {
      Object.entries(deptMap).forEach(([dept, members]) => {
        rowsHtml += `
          <div class="gantt-row dept-row">
            <div class="gantt-label dept-label" style="width:${LW}px">${dept}</div>
            <div class="gantt-cells" style="width:${totalW}px">
              ${this._weekendCells(startDate, days)}
            </div>
          </div>
        `;

        members.forEach(user => {
          // Proiectele în care e înrolat acest utilizator
          const userProjects = userProjectMap[user.id] || [];

          let bars = '';
          userProjects.forEach((proj, idx) => {
            if (!proj.start_date || !proj.end_date) return;
            const ps = new Date(proj.start_date);
            const pe = new Date(proj.end_date);
            const gs = new Date(startDate);
            const ge = new Date(startDate);
            ge.setDate(ge.getDate() + days - 1);

            const barStart = ps < gs ? gs : ps;
            const barEnd = pe > ge ? ge : pe;
            if (barStart > barEnd) return;

            const left = Math.round((barStart - gs) / 86400000) * this.ZOOM_PX;
            const width = Math.max(this.ZOOM_PX, Math.round((barEnd - barStart) / 86400000 + 1) * this.ZOOM_PX);
            const top = idx * (this.BAR_H + 4);
            const color = proj.color || '#FFCB09';
            const roleLabel = proj.memberRole === 'coordonator' ? ' ★' : '';

            bars += `
              <div class="gantt-bar" style="left:${left}px;top:${top}px;width:${width}px;background:${color};color:${isLightColor(color) ? '#221F1F' : '#fff'}"
                   title="${proj.name} (${proj.code})${roleLabel ? ' — Coordonator' : ''}">
                <span>${proj.abbreviation || proj.code}${roleLabel}</span>
              </div>
            `;
          });

          // Înălțimea rândului depinde de câte proiecte are
          const rowHeight = Math.max(this.ROW_H, userProjects.length * (this.BAR_H + 4) + 12);

          rowsHtml += `
            <div class="gantt-row" style="height:${rowHeight}px">
              <div class="gantt-label" style="width:${LW}px;height:${rowHeight}px">
                <div class="gantt-user-avatar">${Auth.getInitials(user.full_name)}</div>
                <div class="gantt-user-info">
                  <div class="gantt-user-name">${user.full_name}</div>
                  <div class="gantt-user-pos">${user.position || user.job_title || ''}</div>
                </div>
              </div>
              <div class="gantt-cells" style="width:${totalW}px;position:relative;height:${rowHeight}px">
                ${this._weekendCells(startDate, days)}
                ${this._todayLine(startDate, days)}
                ${bars}
              </div>
            </div>
          `;
          totalRows++;
        });
      });
    }

    const monthHeaderHtml = monthSegs.map(s =>
      `<div class="gantt-month-cell" style="width:${s.count * this.ZOOM_PX}px">${s.label}</div>`
    ).join('');

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Process Overview</h1>
          <p class="page-subtitle">Vizualizare Gantt — proiecte active per angajat înrolat</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary" onclick="ProcessOverview.shiftDays(-${this.DAYS})" title="Perioadă anterioară">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Anterior
          </button>
          <button class="btn-secondary" onclick="ProcessOverview.resetView()">Azi</button>
          <button class="btn-secondary" onclick="ProcessOverview.shiftDays(${this.DAYS})" title="Perioadă următoare">
            Următor
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <!-- Gantt legend -->
        ${activeProjects.length > 0 ? `
        <div class="gantt-legend">
          ${activeProjects.map(p =>
            `<div class="gantt-legend-item">
              <div class="gantt-legend-dot" style="background:${p.color || '#FFCB09'}"></div>
              <span>${p.abbreviation || p.code} — ${p.name}</span>
            </div>`
          ).join('')}
        </div>` : ''}

        <!-- Gantt table -->
        <div class="gantt-container" id="gantt-scroll">
          <div class="gantt-header-row">
            <div class="gantt-header-label" style="width:${LW}px">Angajat</div>
            <div class="gantt-header-timeline" style="width:${totalW}px">
              <div class="gantt-months">${monthHeaderHtml}</div>
              <div class="gantt-days">${dayHeader}</div>
            </div>
          </div>
          <div class="gantt-body">
            ${rowsHtml}
          </div>
        </div>
      </div>
    `;
  },

  _weekendCells(startDate, days) {
    let html = '';
    for (let d = 0; d < days; d++) {
      const dt = new Date(startDate);
      dt.setDate(dt.getDate() + d);
      if (dt.getDay() === 0 || dt.getDay() === 6) {
        html += `<div class="gantt-weekend-shade" style="left:${d * this.ZOOM_PX}px;width:${this.ZOOM_PX}px"></div>`;
      }
    }
    return html;
  },

  _todayLine(startDate, days) {
    const today = new Date();
    const diff = Math.round((today - startDate) / 86400000);
    if (diff < 0 || diff >= days) return '';
    const left = diff * this.ZOOM_PX + this.ZOOM_PX / 2;
    return `<div class="gantt-today-line" style="left:${left}px"></div>`;
  },

  shiftDays(n) {
    this.offsetDays += n;
    this.renderPage();
    const scroll = document.getElementById('gantt-scroll');
    if (scroll) scroll.scrollLeft = 0;
  },

  resetView() {
    this.offsetDays = 0;
    this.renderPage();
  },
};
