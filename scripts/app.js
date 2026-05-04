// AI+X 小院社群 - 主入口

(function() {
  'use strict';

  // 初始化应用
  async function init() {
    console.log('🌸 AI+X 小院 启动中...');

    await Store.init();

    updateShell();
    Router.navigate(Store.isAuthenticated() ? 'home' : 'login');

    // 绑定全局事件
    bindGlobalEvents();

    // 更新通知徽章
    updateNotificationBadge();

    console.log('🌸 AI+X 小院 准备就绪～');
  }

  // 绑定全局事件
  function bindGlobalEvents() {
    // ESC 关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Components.closeModal();
      }
    });

    // 点击遮罩关闭模态框
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') {
        Components.closeModal();
      }
    });

    // 页面渲染完成事件
    window.addEventListener('pageRendered', (e) => {
      console.log('页面渲染完成:', e.detail.page);
      if (e.detail.page === 'chat') {
        window.scrollChatToBottom?.();
        window.startChatPolling?.();
      } else {
        window.stopChatPolling?.();
      }
    });
  }

  // 更新通知徽章
  function updateNotificationBadge() {
    const notifications = Store.getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  }

  function updateShell() {
    const user = Store.getCurrentUser();
    const avatar = document.getElementById('user-avatar');
    const name = document.getElementById('header-user-name');
    if (avatar) avatar.textContent = user?.avatar || '我';
    if (name) name.textContent = user ? user.name : '我的小窝';

    document.querySelectorAll('.admin-only').forEach((node) => {
      node.style.display = Store.isAdmin() ? '' : 'none';
    });
    updateNotificationBadge();
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

window.updateShell = function updateShellFromOutside() {
  const user = Store.getCurrentUser();
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('header-user-name');
  if (avatar) avatar.textContent = user?.avatar || '我';
  if (name) name.textContent = user ? user.name : '我的小窝';
  document.querySelectorAll('.admin-only').forEach((node) => {
    node.style.display = Store.isAdmin() ? '' : 'none';
  });
  const notifications = Store.getNotifications();
  const unread = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
};
