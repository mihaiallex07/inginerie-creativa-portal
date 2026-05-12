// ============================================================
// Dashboard Module — Portal Inginerie Creativă
// ============================================================

const Dashboard = {
  async render() {
    const [projectsRes, timeRes, newsRes, notifRes] = await Promise.all([
      DB.getProjects(),
      DB.getTimeEntries(Auth.currentUser?.id, getDateStr(-7), getTodayStr()),
      DB.getNews(),
      DB.getNotifications(Auth.currentUser?.id),
    ]);

    const projects = projectsRes.data || [];
    const timeEntries = timeRes.data || [];
    const news = (newsRes.data || []).slice(0, 3);
    const notifications = (notifRes.data || []).filter(n => !n.read).slice(0, 5);

    const activeProjects = projects.filter(p => p.status === 'activ');
    const todayEntries = timeEntries.filter(e => e.date === getTodayStr());
    const todayMinutes = todayEntries.filter(e => e.count_in_time).reduce((s, e) => s + e.duration_minutes, 0);
    const weekMinutes = timeEntries.filter(e => e.count_in_time).reduce((s, e) => s + e.duration_minutes, 0);
    const unreadNotifs = notifications.length;

    const profile = Auth.currentProfile;
    const greeting = getGreeting();

    document.getElementById('page-content').innerHTML = `
      <div style="max-width:1200px">
        <!-- Greeting -->
        <div class="mb-4">
          <h1 style="font-size:20px;font-weight:700;color:var(--text)">${greeting}, ${profile?.full_name?.split(' ')[0] || 'bun venit'}!</h1>
          <p class="text-sm text-muted">${formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <!-- Metric cards -->
        <div class="dashboard-grid mb-4">
          <div class="metric-card">
            <div class="metric-label">Proiecte active</div>
            <div class="metric-value">${activeProjects.length}</div>
            <div class="metric-sub">${projects.length} total</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Ore azi</div>
            <div class="metric-value">${(todayMinutes / 60).toFixed(1)}h</div>
            <div class="metric-sub">${todayEntries.length} activități</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Ore săptămâna</div>
            <div class="metric-value">${(weekMinutes / 60).toFixed(1)}h</div>
            <div class="metric-sub">ultimele 7 zile</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Notificări noi</div>
            <div class="metric-value" style="color:${unreadNotifs > 0 ? 'var(--brand-dark)' : 'var(--text)'}">${unreadNotifs}</div>
            <div class="metric-sub">necitite</div>
          </div>
        </div>

        <!-- Main grid -->
        <div class="dashboard-main">
          <div class="dashboard-left">
            <!-- Activitate azi -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Activitate azi</span>
                <button class="btn-brand" style="font-size:12px;padding:5px 12px" onclick="navigate('time-tracking', null)">
                  + Adaugă activitate
                </button>
              </div>
              <div class="card-body" style="padding:0">
                ${todayEntries.length === 0
                  ? emptyState('Nu ai înregistrat activități azi')
                  : todayEntries.map(e => `
                    <div class="flex items-center gap-3 p-3" style="border-bottom:1px solid var(--border)">
                      <div style="width:3px;height:36px;border-radius:2px;background:${getActivityColor(e.activity_type)};flex-shrink:0"></div>
                      <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.task_name}</div>
                        <div class="text-xs text-muted">${formatHours(e.duration_minutes)} · ${getActivityLabel(e.activity_type)}</div>
                      </div>
                      <div class="text-xs text-muted">${String(e.start_hour).padStart(2,'0')}:${String(e.start_min).padStart(2,'0')}</div>
                    </div>
                  `).join('')
                }
              </div>
            </div>

            <!-- Proiecte active -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Proiecte active</span>
                <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="navigate('proiecte', null)">
                  Vezi toate
                </button>
              </div>
              <div class="card-body" style="padding:0">
                ${activeProjects.length === 0
                  ? emptyState('Nu există proiecte active')
                  : activeProjects.slice(0, 4).map(p => {
                    const pct = p.budget_hours > 0 ? Math.min(100, Math.round(p.used_hours / p.budget_hours * 100)) : 0;
                    const colorClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';
                    return `
                      <div class="flex items-center gap-3 p-3 cursor-pointer" style="border-bottom:1px solid var(--border)" onclick="navigate('proiecte', null)">
                        <div style="font-size:20px">${p.emoji || '📁'}</div>
                        <div style="flex:1;min-width:0">
                          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
                          <div class="text-xs text-muted mb-1">${p.client_name || ''}</div>
                          <div class="progress-bar"><div class="progress-fill ${colorClass}" style="width:${pct}%"></div></div>
                        </div>
                        <div class="text-xs text-muted" style="text-align:right;flex-shrink:0">
                          <div style="font-weight:600">${pct}%</div>
                          <div>${p.used_hours}h / ${p.budget_hours}h</div>
                        </div>
                      </div>
                    `;
                  }).join('')
                }
              </div>
            </div>
          </div>

          <div class="dashboard-right">
            <!-- Mini calendar -->
            ${MiniCalendar.render()}

            <!-- Știri recente -->
            <div class="card">
              <div class="card-header">
                <span class="card-title">Știri recente</span>
                <button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="navigate('stiri', null)">Toate</button>
              </div>
              <div style="padding:0">
                ${news.length === 0
                  ? `<div style="padding:16px">${emptyState('Nu există știri')}</div>`
                  : news.map(n => `
                    <div class="p-3 cursor-pointer" style="border-bottom:1px solid var(--border)" onclick="navigate('stiri', null)">
                      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                        ${n.is_pinned ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="var(--brand-dark)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' : ''}
                        ${categoryBadge(n.category)}
                      </div>
                      <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.4;margin-bottom:4px">${n.title}</div>
                      <div class="text-xs text-muted">${timeAgo(n.created_at)}</div>
                    </div>
                  `).join('')
                }
              </div>
            </div>

            <!-- Notificări recente -->
            ${unreadNotifs > 0 ? `
              <div class="card">
                <div class="card-header">
                  <span class="card-title">Notificări</span>
                  <button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="navigate('notificari', null)">Toate</button>
                </div>
                <div style="padding:0">
                  ${notifications.map(n => `
                    <div class="flex items-center gap-3 p-3" style="border-bottom:1px solid var(--border)">
                      <div style="width:7px;height:7px;border-radius:50%;background:var(--brand);flex-shrink:0"></div>
                      <div style="flex:1;min-width:0">
                        <div style="font-size:12px;font-weight:600">${n.title}</div>
                        <div class="text-xs text-muted truncate">${n.message}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    MiniCalendar.init();
  }
};

// ── MINI CALENDAR ─────────────────────────────────────────────
const MiniCalendar = {
  currentDate: new Date(),

  render() {
    const d = this.currentDate;
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthNames = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
    const dayNames = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du'];

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let cells = '';
    // Empty cells
    for (let i = 0; i < startOffset; i++) {
      cells += `<div class="mini-cal-day other-month"></div>`;
    }
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      cells += `<div class="mini-cal-day ${isToday ? 'today' : ''}">${day}</div>`;
    }

    return `
      <div class="mini-cal" id="mini-calendar">
        <div class="mini-cal-header">
          <button class="mini-cal-nav" onclick="MiniCalendar.prevMonth()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="mini-cal-title">${monthNames[month]} ${year}</span>
          <button class="mini-cal-nav" onclick="MiniCalendar.nextMonth()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="mini-cal-grid">
          ${dayNames.map(d => `<div class="mini-cal-day-name">${d}</div>`).join('')}
          ${cells}
        </div>
      </div>
    `;
  },

  init() {
    // Calendar is rendered inline, no extra init needed
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    const cal = document.getElementById('mini-calendar');
    if (cal) cal.outerHTML = this.render();
    // Re-init after replace
    const newCal = document.getElementById('mini-calendar');
    if (newCal) newCal.outerHTML = this.render();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    const cal = document.getElementById('mini-calendar');
    if (cal) cal.outerHTML = this.render();
  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bună dimineața';
  if (h < 18) return 'Bună ziua';
  return 'Bună seara';
}
