// AI+X 小院社群 - 路由模块

const Router = {
  currentPage: 'home',
  resourcesFilter: '全部',

  // 页面映射
  pages: {
    home: '小院门厅',
    members: '伙伴小屋',
    moments: '暖心时刻',
    chat: '闲谈圆桌',
    resources: '成长宝藏',
    activities: '每周小聚',
    checkin: '成长打卡',
    wishes: '心愿悄悄话',
    profile: '我的小窝',
    notifications: '通知'
  },

  // 路由到页面
  navigate(page) {
    if (page === this.currentPage && page !== 'home') return;

    this.currentPage = page;

    // 更新导航状态
    this._updateNavState(page);

    // 渲染页面
    this._renderPage(page);

    // 滚动到顶部
    window.scrollTo(0, 0);
  },

  // 更新导航状态
  _updateNavState(page) {
    // 侧边导航
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // 底部导航
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  },

  // 渲染页面
  _renderPage(page) {
    const main = document.getElementById('main-content');
    if (!main) return;

    // 添加页面退出动画
    main.classList.add('page-exit-active');

    setTimeout(() => {
      // 根据页面类型渲染
      switch(page) {
        case 'home':
          main.innerHTML = this._renderHomePage();
          break;
        case 'members':
          main.innerHTML = this._renderMembersPage();
          break;
        case 'moments':
          main.innerHTML = this._renderMomentsPage();
          break;
        case 'chat':
          main.innerHTML = this._renderChatPage();
          break;
        case 'resources':
          main.innerHTML = this._renderResourcesPage();
          break;
        case 'activities':
          main.innerHTML = this._renderActivitiesPage();
          break;
        case 'checkin':
          main.innerHTML = this._renderCheckinPage();
          break;
        case 'wishes':
          main.innerHTML = this._renderWishesPage();
          break;
        case 'profile':
          main.innerHTML = this._renderProfilePage();
          break;
        case 'notifications':
          main.innerHTML = this._renderNotificationsPage();
          break;
        default:
          main.innerHTML = this._renderHomePage();
      }

      // 添加页面进入动画
      main.classList.remove('page-exit-active');
      main.classList.add('page-enter', 'page-enter-active');

      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('pageRendered', { detail: { page } }));
    }, 150);
  },

  // ===== 首页 =====
  _renderHomePage() {
    const quote = Store.getDailyQuote();
    const posts = Store.getPosts().slice(0, 5);
    const currentUser = Store.getCurrentUser();

    return `
      <div class="hero-slogan fade-in">
        <h1>🌸 AI+X 小院</h1>
        <p class="hero-daily-quote">${quote}</p>
      </div>

      <div class="bulletin-board fade-in" style="animation-delay: 100ms;">
        <div class="bulletin-board-header">
          <span>📌</span>
          <span>小院公告牌</span>
        </div>
        <div class="bulletin-board-content">
          <p>嗨，伙伴们～ 这周四是我们的 AI 碎碎念夜聊，欢迎来坐坐聊天！没有准备什么特别的话题，就随便聊聊最近用 AI 的心得体会，有坑一起踩，有灵感一起分享～ 🌟</p>
          <p style="margin-top: 12px; color: var(--color-text-hint); font-size: 14px;">—— 2024年4月15日</p>
        </div>
      </div>

      <div class="quick-entry fade-in" style="animation-delay: 200ms;">
        <div class="quick-entry-item" onclick="navigate('members')">
          <div class="quick-entry-icon">👥</div>
          <span class="quick-entry-label">伙伴小屋</span>
        </div>
        <div class="quick-entry-item" onclick="navigate('resources')">
          <div class="quick-entry-icon">📚</div>
          <span class="quick-entry-label">成长宝藏</span>
        </div>
        <div class="quick-entry-item" onclick="navigate('moments')">
          <div class="quick-entry-icon">💕</div>
          <span class="quick-entry-label">暖心时刻</span>
        </div>
        <div class="quick-entry-item" onclick="navigate('activities')">
          <div class="quick-entry-icon">☕</div>
          <span class="quick-entry-label">每周小聚</span>
        </div>
        <div class="quick-entry-item" onclick="navigate('profile')">
          <div class="quick-entry-icon">🏠</div>
          <span class="quick-entry-label">我的小窝</span>
        </div>
      </div>

      <div class="page-section fade-in" style="animation-delay: 300ms;">
        <h2 style="margin-bottom: 24px;">💬 伙伴近况</h2>
        ${posts.length > 0 ? posts.map(post => `
          <div class="post-card">
            <div class="post-header">
              <div class="post-avatar">${post.author?.avatar || '分'}</div>
              <div class="post-meta">
                <div class="post-author">${post.author?.name || '匿名伙伴'}</div>
                <div class="post-time">${formatTime(post.timestamp)}</div>
              </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
              <span class="post-action" onclick="toggleLike(${post.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>${post.likes || 0}</span>
              </span>
              <span class="post-action" onclick="openComments(${post.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>${post.comments?.length || 0}</span>
              </span>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 16px;">🌱</div>
            <h3>还没有动态</h3>
            <p>伙伴们都在这里分享日常，快来成为第一个～</p>
          </div>
        `}
      </div>
    `;
  },

  // ===== 伙伴小屋 =====
  _renderMembersPage() {
    const members = Store.getMembers();

    return `
      <div class="page-header fade-in">
        <h1>👥 伙伴小屋</h1>
        <p>在这里串串门，认识一下同频的伙伴吧～</p>
      </div>

      <div class="flex flex-wrap gap-3 mb-6 fade-in" style="animation-delay: 100ms;">
        <span class="tag active" onclick="filterMembers('all')">全部伙伴</span>
        <span class="tag" onclick="filterMembers('AI爱好者')">AI爱好者</span>
        <span class="tag" onclick="filterMembers('开发者')">开发者</span>
        <span class="tag" onclick="filterMembers('学习者')">学习者</span>
        <span class="tag" onclick="filterMembers('跨界探索')">跨界探索</span>
      </div>

      <div class="members-grid fade-in" style="animation-delay: 200ms;">
        ${members.map(member => `
          <div class="member-card" onclick="openMemberDetail(${member.id})">
            <div class="member-avatar">${member.avatar}</div>
            <div class="member-name">${member.name}</div>
            <div class="member-intro">${member.intro}</div>
            <div class="member-tags">
              ${member.tags.map(tag => `<span class="tag tag-sm">${tag}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ===== 暖心时刻 =====
  _renderMomentsPage() {
    const posts = Store.getPosts();

    return `
      <div class="page-header fade-in">
        <h1>💕 暖心时刻</h1>
        <p>这里是你的情绪安放所，随便说说心里话吧～</p>
      </div>

      <div class="topic-tabs fade-in" style="animation-delay: 100ms;">
        <span class="topic-tab active" data-topic="all">全部</span>
        <span class="topic-tab" data-topic="小确幸">今日小确幸</span>
        <span class="topic-tab" data-topic="打气">互相打气</span>
        <span class="topic-tab" data-topic="迷茫">成长迷茫</span>
        <span class="topic-tab" data-topic="生活">生活分享</span>
      </div>

      <button class="btn btn-primary mb-6 fade-in" onclick="openNewPostModal('moments')" style="animation-delay: 150ms;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        分享此刻心情
      </button>

      <div class="posts-list fade-in" style="animation-delay: 200ms;">
        ${posts.length > 0 ? posts.map(post => `
          <div class="post-card">
            <div class="post-header">
              <div class="post-avatar">${post.author?.avatar || '分'}</div>
              <div class="post-meta">
                <div class="post-author">${post.author?.name || '匿名伙伴'}</div>
                <div class="post-time">${formatTime(post.timestamp)}</div>
              </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
              <span class="post-action" onclick="toggleLike(${post.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>${post.likes || 0}</span>
              </span>
              <span class="post-action" onclick="openComments(${post.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>${post.comments?.length || 0}</span>
              </span>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 16px;">🍃</div>
            <h3>这里还是安静的</h3>
            <p>来分享你的第一个心情吧，伙伴们在等着～</p>
          </div>
        `}
      </div>
    `;
  },

  // ===== 闲谈圆桌 =====
  _renderChatPage() {
    const posts = Store.getPosts();

    return `
      <div class="page-header fade-in">
        <h1>🍵 闲谈圆桌</h1>
        <p>围坐一起，随便聊聊天～</p>
      </div>

      <div class="scene-tabs fade-in" style="animation-delay: 100ms;">
        <div class="scene-tab active" data-scene="ai">AI 随心聊</div>
        <div class="scene-tab" data-scene="cross">跨界碎碎念</div>
        <div class="scene-tab" data-scene="growth">成长组队同行</div>
      </div>

      <button class="btn btn-secondary mb-6 fade-in" onclick="openNewPostModal('chat')" style="animation-delay: 150ms;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        发起一个话题
      </button>

      <div class="posts-list fade-in" style="animation-delay: 200ms;">
        ${posts.length > 0 ? posts.map(post => `
          <div class="post-card">
            <div class="post-header">
              <div class="post-avatar">${post.author?.avatar || '分'}</div>
              <div class="post-meta">
                <div class="post-author">${post.author?.name || '匿名伙伴'}</div>
                <div class="post-time">${formatTime(post.timestamp)}</div>
              </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
              <span class="post-action" onclick="toggleLike(${post.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>${post.likes || 0}</span>
              </span>
              <span class="post-action" onclick="openComments(${post.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>${post.comments?.length || 0}</span>
              </span>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 16px;">☕</div>
            <h3>圆桌还没热起来</h3>
            <p>来发起第一个话题吧，随便聊什么都行～</p>
          </div>
        `}
      </div>
    `;
  },

  // ===== 成长宝藏 =====
  _renderResourcesPage() {
    const allResources = Store.getResources();
    const filter = this.resourcesFilter;
    const resources = filter === '全部' ? allResources : allResources.filter(r => r.category === filter);

    return `
      <div class="page-header fade-in">
        <h1>📚 成长宝藏</h1>
        <p>伙伴们攒下的宝贝，一起成长期～</p>
      </div>

      <div class="flex flex-wrap gap-3 mb-6 fade-in" style="animation-delay: 100ms;">
        <span class="tag ${this.resourcesFilter === '全部' ? 'active' : ''}" onclick="filterResources('全部')">全部</span>
        <span class="tag ${this.resourcesFilter === '入门' ? 'active' : ''}" onclick="filterResources('入门')">入门</span>
        <span class="tag ${this.resourcesFilter === '进阶' ? 'active' : ''}" onclick="filterResources('进阶')">进阶</span>
        <span class="tag ${this.resourcesFilter === '工具' ? 'active' : ''}" onclick="filterResources('工具')">工具</span>
        <span class="tag ${this.resourcesFilter === '感悟' ? 'active' : ''}" onclick="filterResources('感悟')">感悟</span>
      </div>

      <button class="btn btn-secondary mb-6 fade-in" onclick="openUploadModal()" style="animation-delay: 150ms;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        分享宝藏
      </button>

      <div class="grid grid-3 fade-in" style="animation-delay: 200ms;">
        ${resources.map(resource => `
          <div class="resource-card">
            <div class="resource-header">
              <div class="resource-icon">📄</div>
              <div class="resource-info">
                <div class="resource-title">${resource.title}</div>
                <div class="resource-desc">${resource.desc}</div>
              </div>
            </div>
            <div class="resource-meta">
              <div>
                <span class="tag">${resource.category}</span>
                <span style="font-size: 12px; color: var(--color-text-hint); margin-left: 8px;">来自 ${resource.uploader}</span>
              </div>
              <button class="btn btn-sm btn-ghost">预览</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ===== 每周小聚 =====
  _renderActivitiesPage() {
    const activities = Store.getActivities();

    return `
      <div class="page-header fade-in">
        <h1>☕ 每周小聚</h1>
        <p>坐下来，聊聊天～</p>
      </div>

      <div class="grid grid-2 fade-in" style="animation-delay: 100ms;">
        ${activities.map(activity => `
          <div class="activity-card">
            <div class="activity-header">
              <div class="activity-time">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${activity.time}
              </div>
              <div class="activity-title">${activity.title}</div>
            </div>
            <div class="activity-body">
              <div class="activity-desc">${activity.desc}</div>
              <div class="activity-footer">
                <div class="activity-attendees">
                  <div class="avatar-group">
                    ${activity.attendees.slice(0, 4).map(name => `
                      <div class="avatar">${name[0]}</div>
                    `).join('')}
                    ${activity.attendees.length > 4 ? `
                      <div class="avatar">+${activity.attendees.length - 4}</div>
                    ` : ''}
                  </div>
                  <span style="font-size: 12px; color: var(--color-text-hint); margin-left: 8px;">${activity.attendees.length}人参与</span>
                </div>
                <button class="btn btn-sm btn-primary">${activity.status === 'past' ? '看看小记' : '报名参加'}</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${(() => {
        const pastActivity = activities.find(a => a.status === 'past');
        return pastActivity?.notes?.length > 0 ? `
        <div class="mt-8 fade-in" style="animation-delay: 200ms;">
          <h2 style="margin-bottom: 24px;">📝 聚会小记</h2>
          <div class="card">
            <ul style="list-style: none; padding: 0;">
              ${pastActivity.notes.map(note => `
                <li style="padding: 12px 0; border-bottom: 1px solid var(--color-border-light);">
                  ${note}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      ` : '';
      })()}
    `;
  },

  // ===== 成长打卡 =====
  _renderCheckinPage() {
    const currentUser = Store.getCurrentUser();

    return `
      <div class="page-header fade-in">
        <h1>🌱 成长打卡</h1>
        <p>结伴前行，慢慢变好～</p>
      </div>

      <div class="checkin-input-wrapper fade-in" style="animation-delay: 100ms;">
        <div class="checkin-input-header">
          <div class="card-avatar">${currentUser?.avatar || '我'}</div>
          <div>
            <div class="card-name">${currentUser?.name || '我'}</div>
            <div class="card-time" style="font-size: 12px;">今天有什么小进步吗？</div>
          </div>
        </div>
        <textarea class="checkin-input" placeholder="今天学了什么、做了什么小尝试、有什么新感悟... 随便写~" id="checkin-input"></textarea>
        <div class="checkin-submit flex flex-between" style="align-items: center;">
          <span style="font-size: 12px; color: var(--color-text-hint);">每日自愿记录，不需要每天都打</span>
          <button class="btn btn-primary" onclick="submitCheckin()">记录一下</button>
        </div>
      </div>

      <div class="fade-in" style="animation-delay: 200ms;">
        <h2 style="margin-bottom: 24px;">📖 打卡记录</h2>
        <div class="card" style="padding: 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🌿</div>
          <h3 style="margin-bottom: 8px;">还没有记录</h3>
          <p style="color: var(--color-text-secondary);">开始记录你的成长之旅吧～</p>
        </div>
      </div>

      <div class="mt-8 fade-in" style="animation-delay: 300ms;">
        <h2 style="margin-bottom: 24px;">💝 随机鼓励</h2>
        <div class="card" style="background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light));">
          <p style="font-size: 18px; font-style: italic; text-align: center;">
            "慢一点没关系，走过的路都算数 ✨"
          </p>
        </div>
      </div>
    `;
  },

  // ===== 心愿悄悄话 =====
  _renderWishesPage() {
    const wishes = Store.getWishes();

    return `
      <div class="page-header fade-in">
        <h1>✨ 心愿 & 悄悄话</h1>
        <p>在这里说说心里话，伙伴们会听到的～</p>
      </div>

      <div class="grid grid-2 mb-8 fade-in" style="animation-delay: 100ms;">
        <div class="card" style="text-align: center; cursor: pointer;" onclick="openWishModal('wish')">
          <div style="font-size: 48px; margin-bottom: 16px;">🌟</div>
          <h3>许个心愿</h3>
          <p style="color: var(--color-text-secondary);">写下你的学习愿望、资源需求，伙伴们随缘呼应～</p>
        </div>
        <div class="card" style="text-align: center; cursor: pointer;" onclick="openWishModal('secret')">
          <div style="font-size: 48px; margin-bottom: 16px;">🤫</div>
          <h3>说句悄悄话</h3>
          <p style="color: var(--color-text-secondary);">对社群有什么想法、建议，匿名或实名都可以～</p>
        </div>
      </div>

      <div class="fade-in" style="animation-delay: 200ms;">
        <h2 style="margin-bottom: 24px;">💭 心愿池</h2>
        <div class="wishes-list">
          ${wishes.length > 0 ? wishes.map(wish => `
            <div class="wish-card">
              <div class="wish-author">${wish.anonymous ? '匿名' : wish.author} · ${formatTime(wish.timestamp)}</div>
              <div class="wish-content">${wish.content}</div>
              <div class="wish-actions">
                <span class="post-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>呼应</span>
                </span>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state">
              <div style="font-size: 48px; margin-bottom: 16px;">🌸</div>
              <h3>心愿池还是空的</h3>
              <p>来写下第一个心愿吧，说不定就有伙伴来呼应啦～</p>
            </div>
          `}
        </div>
      </div>
    `;
  },

  // ===== 个人中心 =====
  _renderProfilePage() {
    const user = Store.getCurrentUser();

    return `
      <div class="page-header fade-in">
        <h1>🏠 我的小窝</h1>
      </div>

      <div class="profile-header fade-in" style="animation-delay: 100ms;">
        <div class="profile-avatar">${user?.avatar || '我'}</div>
        <div class="profile-info">
          <h2>${user?.name || '我'}</h2>
          <p>${user?.intro || '设置你的个人简介吧～'}</p>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openEditProfileModal()">编辑资料</button>
      </div>

      <div class="profile-tabs fade-in" style="animation-delay: 150ms;">
        <div class="profile-tab active" data-tab="posts">我的动态</div>
        <div class="profile-tab" data-tab="likes">我的收藏</div>
        <div class="profile-tab" data-tab="comments">我的留言</div>
      </div>

      <div class="profile-content fade-in" style="animation-delay: 200ms;">
        <div class="empty-state">
          <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
          <h3>还没有动态</h3>
          <p>去伙伴小屋串串门，或者分享你的第一个心情～</p>
        </div>
      </div>

      <div class="mt-8 fade-in" style="animation-delay: 300ms;">
        <h3 style="margin-bottom: 16px;">⚙️ 隐私设置</h3>
        <div class="card">
          <div class="flex flex-between" style="padding: 12px 0; border-bottom: 1px solid var(--color-border-light);">
            <span>展示联系方式</span>
            <input type="checkbox" ${user?.publicContact ? 'checked' : ''} onchange="updatePrivacy('publicContact', this.checked)">
          </div>
          <div class="flex flex-between" style="padding: 12px 0;">
            <span>接收通知</span>
            <input type="checkbox" checked>
          </div>
        </div>
      </div>
    `;
  },

  // ===== 通知页面 =====
  _renderNotificationsPage() {
    const notifications = Store.getNotifications();

    return `
      <div class="page-header fade-in">
        <h1>🔔 通知</h1>
      </div>

      <div class="fade-in" style="animation-delay: 100ms;">
        ${notifications.length > 0 ? notifications.map(notif => `
          <div class="card mb-4" style="padding: 20px;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center;">
                ${notif.icon || '💬'}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 500;">${notif.title}</div>
                <div style="font-size: 14px; color: var(--color-text-secondary); margin-top: 4px;">${notif.content}</div>
                <div style="font-size: 12px; color: var(--color-text-hint); margin-top: 8px;">${formatTime(notif.timestamp)}</div>
              </div>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
            <h3>暂无通知</h3>
            <p>有伙伴互动时会在这里收到消息～</p>
          </div>
        `}
      </div>
    `;
  }
};

// 暴露到全局
window.Router = Router;
window.navigate = (page) => Router.navigate(page);

// 时间格式化
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
