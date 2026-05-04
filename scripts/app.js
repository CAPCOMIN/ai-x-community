// AI+X 小院社群 - 主入口

(function() {
  'use strict';

  // 初始化应用
  function init() {
    console.log('🌸 AI+X 小院 启动中...');

    // 检查是否首次访问
    checkFirstVisit();

    // 渲染首页
    Router.navigate('home');

    // 绑定全局事件
    bindGlobalEvents();

    // 更新通知徽章
    updateNotificationBadge();

    console.log('🌸 AI+X 小院 准备就绪～');
  }

  // 检查首次访问
  function checkFirstVisit() {
    const visited = Store.get('visited', false);
    if (!visited) {
      // 首次访问，初始化默认数据
      Store.set('visited', true);
      console.log('首次访问，已初始化默认数据');
    }
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

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
