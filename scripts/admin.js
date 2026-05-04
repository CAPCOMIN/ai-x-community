// AI+X 小院 - 独立管理员界面

const AdminApp = {
  tab: 'users',
  tabs: [
    ['users', '用户'],
    ['posts', '动态'],
    ['resources', '资源'],
    ['activities', '活动'],
    ['wishes', '心愿'],
    ['checkins', '打卡'],
    ['conversations', '会话'],
    ['notifications', '通知']
  ],

  async init() {
    if (Store.getToken()) {
      try {
        await Store.refresh();
        if (Store.isAdmin()) {
          await Store.loadAdminData();
          this.render();
          return;
        }
      } catch {
        Store.setToken('');
      }
    }
    this.renderLogin();
  },

  renderLogin() {
    document.getElementById('admin-app').innerHTML = `
      <main class="admin-login">
        <section class="admin-login-panel">
          <h1>管理台登录</h1>
          <p>请使用管理员账号进入独立管理界面。</p>
          <form onsubmit="AdminApp.login(event)">
            <div class="input-group">
              <label class="input-label">邮箱</label>
              <input class="input" id="admin-email" type="email" autocomplete="email" required>
            </div>
            <div class="input-group">
              <label class="input-label">密码</label>
              <input class="input" id="admin-password" type="password" autocomplete="current-password" required>
            </div>
            <button class="btn btn-primary btn-lg" type="submit">进入管理台</button>
          </form>
          <div class="auth-switch"><a href="/">返回小院</a></div>
        </section>
      </main>
    `;
  },

  async login(event) {
    event.preventDefault();
    try {
      await Store.login(
        document.getElementById('admin-email').value.trim(),
        document.getElementById('admin-password').value
      );
      if (!Store.isAdmin()) throw new Error('该账号不是管理员');
      await Store.loadAdminData();
      this.render();
    } catch (error) {
      this.toast(error.message);
    }
  },

  render() {
    const data = Store.getAdminData();
    const summary = data?.summary || {};
    document.getElementById('admin-app').innerHTML = `
      <div class="admin-shell">
        <aside class="admin-side">
          <div class="admin-brand">AI+X 管理台</div>
          <nav class="admin-nav">
            ${this.tabs.map(([key, label]) => `<button class="${this.tab === key ? 'active' : ''}" onclick="AdminApp.switchTab('${key}')">${label}</button>`).join('')}
          </nav>
        </aside>
        <main class="admin-main">
          <header class="admin-top">
            <div>
              <h1>${this.currentTitle()}</h1>
              <p>查看、治理和维护小院全部数据。</p>
            </div>
            <div class="admin-actions">
              <a class="btn btn-ghost" href="/">返回小院</a>
              <button class="btn btn-ghost" onclick="AdminApp.logout()">退出</button>
            </div>
          </header>
          <section class="admin-metrics">
            ${this.tabs.slice(0, 8).map(([key, label]) => `
              <div class="admin-metric">
                <span>${label}</span>
                <strong>${summary[key] || 0}</strong>
              </div>
            `).join('')}
          </section>
          <section class="admin-card">
            ${this.renderTable(data?.[this.tab] || [])}
          </section>
        </main>
      </div>
    `;
  },

  currentTitle() {
    return this.tabs.find(([key]) => key === this.tab)?.[1] || '数据';
  },

  renderTable(rows) {
    if (!rows.length) return '<div class="empty-state"><h3>暂无数据</h3></div>';
    if (this.tab === 'users') {
      return `
        <div class="admin-table-wrap"><table class="admin-data-table">
          <thead><tr><th>用户</th><th>简介</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead>
          <tbody>
            ${rows.map(user => `
              <tr>
                <td><strong>${escapeAdmin(user.name)}</strong><small>${escapeAdmin(user.email)}</small></td>
                <td>${escapeAdmin(user.intro || '')}</td>
                <td>${user.role === 'admin' ? '管理员' : '普通用户'}</td>
                <td>${user.status === 'active' ? '正常' : '停用'}</td>
                <td>${formatAdminTime(user.createdAt)}</td>
                <td class="admin-actions">
                  <button class="btn btn-sm btn-ghost" onclick="AdminApp.updateUser(${user.id}, { role: '${user.role === 'admin' ? 'user' : 'admin'}' })">${user.role === 'admin' ? '设为用户' : '设为管理员'}</button>
                  <button class="btn btn-sm btn-ghost" onclick="AdminApp.updateUser(${user.id}, { status: '${user.status === 'active' ? 'disabled' : 'active'}' })">${user.status === 'active' ? '停用' : '启用'}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      `;
    }

    const projector = {
      posts: row => [row.author?.name, row.content, row.status, row.timestamp],
      resources: row => [row.uploader, row.title, row.status, row.uploadTime],
      activities: row => [row.type, row.title, row.status, row.time],
      wishes: row => [row.anonymous ? '匿名' : row.author, row.content, row.status, row.timestamp],
      checkins: row => [row.author, row.content, row.status, row.timestamp],
      conversations: row => [row.type === 'group' ? '群聊' : '私聊', displayAdminConversation(row), row.status, row.updatedAt],
      notifications: row => [row.userName || row.userId, row.title, row.read ? '已读' : '未读', row.timestamp]
    }[this.tab];

    return `
      <div class="admin-table-wrap"><table class="admin-data-table">
        <thead><tr><th>来源</th><th>内容</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>
          ${rows.map(row => {
            const cols = projector(row);
            return `
              <tr>
                <td>${escapeAdmin(cols[0] || '')}</td>
                <td>${escapeAdmin(String(cols[1] || '').slice(0, 180))}</td>
                <td>${escapeAdmin(cols[2] || '')}</td>
                <td>${formatAdminTime(cols[3]) || escapeAdmin(cols[3] || '')}</td>
                <td class="admin-actions">
                  ${this.tab !== 'notifications' ? `<button class="btn btn-sm btn-ghost" onclick="AdminApp.toggleRecord('${this.tab}', ${row.id}, '${row.status || ''}')">${row.status === 'hidden' ? '恢复' : '隐藏'}</button>` : ''}
                  <button class="btn btn-sm btn-ghost" onclick="AdminApp.deleteRecord('${this.tab}', ${row.id})">删除</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table></div>
    `;
  },

  async switchTab(tab) {
    this.tab = tab;
    this.render();
  },

  async updateUser(id, payload) {
    try {
      await Store.adminUpdateUser(id, payload);
      this.render();
    } catch (error) {
      this.toast(error.message);
    }
  },

  async toggleRecord(entity, id, status) {
    try {
      await Store.adminPatchRecord(entity, id, { status: status === 'hidden' ? 'published' : 'hidden' });
      this.render();
    } catch (error) {
      this.toast(error.message);
    }
  },

  async deleteRecord(entity, id) {
    if (!confirm('确认删除这条数据？')) return;
    try {
      await Store.adminDeleteRecord(entity, id);
      this.render();
    } catch (error) {
      this.toast(error.message);
    }
  },

  async logout() {
    await Store.logout();
    this.renderLogin();
  },

  toast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }
};

function escapeAdmin(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatAdminTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function displayAdminConversation(row) {
  if (row.type === 'group') return row.title;
  return (row.participants || []).map(user => user.name).join('、') || row.title;
}

AdminApp.init();
