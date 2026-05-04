// AI+X 小院社群 - API 数据层

const Store = {
  PREFIX: 'ai_x_',
  API_BASE: '/api',
  state: {
    currentUser: null,
    members: [],
    posts: [],
    resources: [],
    activities: [],
    wishes: [],
    checkins: [],
    notifications: [],
    conversations: [],
    activeConversationId: null,
    messagesByConversation: {},
    admin: null
  },

  getToken() {
    return localStorage.getItem(this.PREFIX + 'token') || '';
  },

  setToken(token) {
    if (token) localStorage.setItem(this.PREFIX + 'token', token);
    else localStorage.removeItem(this.PREFIX + 'token');
  },

  isAuthenticated() {
    return Boolean(this.getToken() && this.state.currentUser);
  },

  isAdmin() {
    return this.state.currentUser?.role === 'admin';
  },

  get(key, defaultValue = null) {
    if (key === 'currentUser') return this.getCurrentUser();
    return this.state[key] ?? defaultValue;
  },

  set(key, value) {
    this.state[key] = value;
    return true;
  },

  remove(key) {
    delete this.state[key];
  },

  async init() {
    if (!this.getToken()) return false;
    try {
      await this.refresh();
      return true;
    } catch (error) {
      console.warn('初始化登录态失败', error);
      this.setToken('');
      this.resetState();
      return false;
    }
  },

  resetState() {
    this.state = {
      currentUser: null,
      members: [],
      posts: [],
      resources: [],
      activities: [],
      wishes: [],
      checkins: [],
      notifications: [],
      conversations: [],
      activeConversationId: null,
      messagesByConversation: {},
      admin: null
    };
  },

  applyBootstrap(data) {
    if (!data) return;
    this.state.currentUser = data.currentUser || data.user || this.state.currentUser;
    this.state.members = data.members || this.state.members;
    this.state.posts = data.posts || this.state.posts;
    this.state.resources = data.resources || this.state.resources;
    this.state.activities = data.activities || this.state.activities;
    this.state.wishes = data.wishes || this.state.wishes;
    this.state.checkins = data.checkins || this.state.checkins;
    this.state.notifications = data.notifications || this.state.notifications;
    this.state.conversations = data.conversations || this.state.conversations;
    this.state.activeConversationId = data.activeConversationId || this.state.activeConversationId;
    if (data.messages && (data.activeConversationId || this.state.activeConversationId)) {
      this.state.messagesByConversation[data.activeConversationId || this.state.activeConversationId] = data.messages;
    }
  },

  async request(path, options = {}) {
    const headers = {
      'Accept': 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(this.API_BASE + path, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        this.setToken('');
        this.resetState();
        if (!['login', 'register'].includes(window.Router?.currentPage)) {
          window.Router?.navigate('login');
        }
      }
      throw new Error(data.error || '请求失败');
    }
    return data;
  },

  async refresh() {
    const data = await this.request('/bootstrap');
    this.applyBootstrap(data);
    return data;
  },

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    this.setToken(data.token);
    this.applyBootstrap(data.bootstrap);
    this.state.currentUser = data.user;
    return data;
  },

  async register(payload) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: payload
    });
    this.setToken(data.token);
    this.applyBootstrap(data.bootstrap);
    this.state.currentUser = data.user;
    return data;
  },

  async logout() {
    try {
      if (this.getToken()) await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken('');
      this.resetState();
    }
  },

  getMembers() {
    return this.state.members || [];
  },

  getCurrentUser() {
    return this.state.currentUser;
  },

  async setCurrentUser(user) {
    const data = await this.request('/profile', {
      method: 'PATCH',
      body: user
    });
    this.applyBootstrap(data);
    return this.state.currentUser;
  },

  getPosts() {
    return this.state.posts || [];
  },

  async addPost(post) {
    const data = await this.request('/posts', {
      method: 'POST',
      body: post
    });
    this.state.posts = data.posts || [];
    return this.state.posts;
  },

  async likePost(postId) {
    const data = await this.request(`/posts/${postId}/like`, { method: 'POST' });
    this.state.posts = data.posts || [];
    return this.state.posts;
  },

  async addComment(postId, content) {
    const data = await this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content }
    });
    this.state.posts = data.posts || [];
    return this.state.posts;
  },

  getResources() {
    return this.state.resources || [];
  },

  async addResource(resource) {
    const data = await this.request('/resources', {
      method: 'POST',
      body: resource
    });
    this.state.resources = data.resources || [];
    return this.state.resources;
  },

  getActivities() {
    return this.state.activities || [];
  },

  async joinActivity(activityId) {
    const data = await this.request(`/activities/${activityId}/join`, { method: 'POST' });
    this.state.activities = data.activities || [];
    return this.state.activities;
  },

  getWishes() {
    return this.state.wishes || [];
  },

  async addWish(wish) {
    const data = await this.request('/wishes', {
      method: 'POST',
      body: wish
    });
    this.state.wishes = data.wishes || [];
    return this.state.wishes;
  },

  async echoWish(wishId) {
    const data = await this.request(`/wishes/${wishId}/echo`, { method: 'POST' });
    this.state.wishes = data.wishes || [];
    return this.state.wishes;
  },

  getCheckins() {
    return this.state.checkins || [];
  },

  async addCheckin(content) {
    const data = await this.request('/checkins', {
      method: 'POST',
      body: { content }
    });
    this.state.checkins = data.checkins || [];
    this.state.posts = data.posts || this.state.posts;
    return this.state.checkins;
  },

  getNotifications() {
    return this.state.notifications || [];
  },

  async addNotification() {
    return this.state.notifications;
  },

  async markNotificationRead(id) {
    const data = await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
    this.state.notifications = data.notifications || [];
    return this.state.notifications;
  },

  getConversations() {
    return this.state.conversations || [];
  },

  getActiveConversationId() {
    return this.state.activeConversationId || this.state.conversations[0]?.id || null;
  },

  setActiveConversationId(id) {
    this.state.activeConversationId = Number(id);
  },

  getMessages(conversationId = this.getActiveConversationId()) {
    return this.state.messagesByConversation[conversationId] || [];
  },

  async loadChats() {
    const data = await this.request('/chats');
    this.state.conversations = data.conversations || [];
    this.state.activeConversationId = data.activeConversationId || this.state.activeConversationId;
    if (data.messages && this.state.activeConversationId) {
      this.state.messagesByConversation[this.state.activeConversationId] = data.messages;
    }
    return data;
  },

  async loadMessages(conversationId) {
    const data = await this.request(`/chats/${conversationId}/messages`);
    this.state.activeConversationId = Number(conversationId);
    this.state.conversations = data.conversations || this.state.conversations;
    this.state.messagesByConversation[conversationId] = data.messages || [];
    return data.messages || [];
  },

  async sendMessage(conversationId, content) {
    const data = await this.request(`/chats/${conversationId}/messages`, {
      method: 'POST',
      body: { content }
    });
    this.state.activeConversationId = Number(conversationId);
    this.state.conversations = data.conversations || this.state.conversations;
    this.state.messagesByConversation[conversationId] = data.messages || [];
    return data;
  },

  async startDirectChat(userId) {
    const data = await this.request('/chats/direct', {
      method: 'POST',
      body: { userId }
    });
    this.state.activeConversationId = data.conversationId;
    this.state.conversations = data.conversations || [];
    this.state.messagesByConversation[data.conversationId] = data.messages || [];
    return data;
  },

  async loadAdminData() {
    const data = await this.request('/admin/data');
    this.state.admin = data;
    return data;
  },

  getAdminData() {
    return this.state.admin;
  },

  async adminUpdateUser(id, payload) {
    await this.request(`/admin/users/${id}`, { method: 'PATCH', body: payload });
    return this.loadAdminData();
  },

  async adminPatchRecord(entity, id, payload) {
    await this.request(`/admin/${entity}/${id}`, { method: 'PATCH', body: payload });
    return this.loadAdminData();
  },

  async adminDeleteRecord(entity, id) {
    await this.request(`/admin/${entity}/${id}`, { method: 'DELETE' });
    return this.loadAdminData();
  },

  getDailyQuote() {
    const quotes = [
      '今天也要对自己温柔一点呀 🌸',
      '慢一点没关系，走过的路都算数 ✨',
      '和同频的伙伴在一起，就是最好的成长 🌿',
      '每一个小进步都值得被看见 💫',
      '记得给自己泡杯热茶，休息一下吧 🍵',
      '今天有什么让你开心的小事吗？ 😊',
      '我们一起慢慢变好，好吗？ 🌱',
      '允许自己休息，也是勇敢的表现 🌼'
    ];
    const day = Math.floor(Date.now() / 86400000);
    return quotes[day % quotes.length];
  }
};

window.Store = Store;
