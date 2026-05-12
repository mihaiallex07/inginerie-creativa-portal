// ============================================================
// Organigramă Module
// ============================================================
const Organigrama = {
  async render() {
    const { data: users } = await DB.getUsers();
    const orgData = DB.demo.orgChart;
    document.getElementById('page-content').innerHTML = `
      <div style="max-width:900px">
        <div class="page-header">
          <div>
            <h1 class="page-title">Organigramă</h1>
            <p class="page-subtitle">Structura organizatorică Inginerie Creativă</p>
          </div>
        </div>
        <div class="card p-4" style="overflow-x:auto">
          <div class="org-tree">
            ${this.renderNode(orgData, true)}
          </div>
        </div>
        <!-- Team list -->
        <div class="card mt-4">
          <div class="card-header"><span class="card-title">Echipa</span></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:16px">
            ${(users || []).map(u => `
              <div class="flex items-center gap-3 p-3 rounded" style="background:var(--surface-2)">
                ${avatarHtml(u.full_name, u.avatar_url)}
                <div style="min-width:0">
                  <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.full_name}</div>
                  <div class="text-xs text-muted">${u.position || u.department || ''}</div>
                  ${roleBadge(u.role)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderNode(node, isRoot = false) {
    const hasChildren = node.children && node.children.length > 0;
    return `
      <div class="org-node-wrap ${isRoot ? 'root' : ''}">
        <div class="org-node ${isRoot ? 'org-node-root' : ''}">
          <div style="font-size:13px;font-weight:700">${node.name}</div>
          <div class="text-xs text-muted">${node.position || ''}</div>
          ${node.department ? `<div class="text-xs" style="color:var(--brand-dark)">${node.department}</div>` : ''}
        </div>
        ${hasChildren ? `
          <div class="org-children">
            ${node.children.map(c => this.renderNode(c)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },
};
