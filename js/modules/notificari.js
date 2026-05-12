// ============================================================
// Notificări Module
// ============================================================
const Notificari = {
  items: [],

  async render() {
    const { data } = await DB.getNotifications(Auth.currentUser?.id);
    this.items = data || [];
    this.renderPage();
  },

  renderPage() {
    const unread = this.items.filter(n => !n.read).length;
    document.getElementById('page-content').innerHTML = `
      <div style="max-width:700px">
        <div class="page-header">
          <div>
            <h1 class="page-title">Notificări</h1>
            <p class="page-subtitle">${unread} necitite din ${this.items.length} total</p>
          </div>
          ${unread > 0 ? `<button class="btn-secondary" onclick="Notificari.markAllRead()">Marchează toate ca citite</button>` : ''}
        </div>
        <div class="space-y-2">
          ${this.items.length === 0 ? emptyState('Nu ai notificări') :
            this.items.map(n => `
              <div class="flex items-start gap-3 p-4 rounded card ${!n.read ? 'unread-notif' : ''}" onclick="Notificari.markRead(${n.id})">
                <div style="width:8px;height:8px;border-radius:50%;background:${!n.read ? 'var(--brand)' : 'transparent'};flex-shrink:0;margin-top:4px"></div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:${!n.read ? '700' : '400'}">${n.title}</div>
                  <div class="text-sm text-muted">${n.message}</div>
                  <div class="text-xs text-muted mt-1">${timeAgo(n.created_at)}</div>
                </div>
                <div>${badge(n.type || 'info', n.type === 'success' ? 'green' : n.type === 'warning' ? 'yellow' : n.type === 'error' ? 'red' : 'blue')}</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  },

  async markRead(id) {
    await DB.markNotificationRead(id);
    const n = this.items.find(n => n.id === id);
    if (n) n.read = true;
    this.renderPage();
    updateNotifBadge();
  },

  async markAllRead() {
    await Promise.all(this.items.filter(n => !n.read).map(n => DB.markNotificationRead(n.id)));
    this.items.forEach(n => n.read = true);
    this.renderPage();
    updateNotifBadge();
  },
};

function updateNotifBadge() {
  const badge = document.getElementById('notif-badge');
  const unread = (DB.demo.notifications || []).filter(n => !n.read).length;
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
}
