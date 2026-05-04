// AI+X 小院社群 - UI 组件模块

const Components = {
  // Toast 提示
  showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },

  // 模态框
  openModal(title, content, footer = '', onInit = null) {
    const overlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    if (!overlay || !modalContent) return;

    modalContent.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="closeModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    `;

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    if (onInit) onInit();
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('show');
    document.body.style.overflow = '';
  },

  // 发帖弹窗
  openNewPostModal(type) {
    const content = `
      <div class="input-group mb-4">
        <label class="input-label">此刻在想什么？</label>
        <textarea class="input" id="new-post-content" placeholder="随便说说～" style="min-height: 150px;"></textarea>
      </div>
      <div class="input-group">
        <label class="input-label">属于哪个话题？</label>
        <div class="flex flex-wrap gap-2" style="margin-top: 8px;">
          <span class="tag active" data-topic="all">随便聊聊</span>
          <span class="tag" data-topic="小确幸">小确幸</span>
          <span class="tag" data-topic="打气">互相打气</span>
          <span class="tag" data-topic="迷茫">成长迷茫</span>
          <span class="tag" data-topic="生活">生活分享</span>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="closeModal()">算了</button>
      <button class="btn btn-primary" onclick="submitNewPost('${type}')">发布</button>
    `;

    this.openModal('分享此刻', content, footer, () => {
      document.querySelectorAll('.modal .tag').forEach(tag => {
        tag.onclick = () => {
          document.querySelectorAll('.modal .tag').forEach(t => t.classList.remove('active'));
          tag.classList.add('active');
        };
      });
    });
  },

  // 心愿弹窗
  openWishModal(type) {
    const title = type === 'wish' ? '许个心愿' : '说句悄悄话';
    const placeholder = type === 'wish'
      ? '想学什么、想要什么资源、有什么愿望...'
      : '对社群的建议、想法、或者只是想说说心里话...';
    const content = `
      <div class="input-group mb-4">
        <textarea class="input" id="wish-content" placeholder="${placeholder}" style="min-height: 150px;"></textarea>
      </div>
      <div class="flex flex-center gap-4">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" id="wish-anonymous">
          <span style="font-size: 14px; color: var(--color-text-secondary);">匿名发布</span>
        </label>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="closeModal()">算了</button>
      <button class="btn btn-primary" onclick="submitWish('${type}')">发布</button>
    `;

    this.openModal(title, content, footer);
  },

  // 上传资源弹窗
  openUploadModal() {
    const content = `
      <div class="input-group mb-4">
        <label class="input-label">资源标题</label>
        <input type="text" class="input" id="resource-title" placeholder="给宝藏起个名字～">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">简单描述</label>
        <textarea class="input" id="resource-desc" placeholder="这是什么？怎么用？" style="min-height: 80px;"></textarea>
      </div>
      <div class="input-group mb-4">
        <label class="input-label">分类</label>
        <div class="flex flex-wrap gap-2" style="margin-top: 8px;">
          <span class="tag active" data-category="入门">入门</span>
          <span class="tag" data-category="进阶">进阶</span>
          <span class="tag" data-category="工具">工具</span>
          <span class="tag" data-category="感悟">感悟</span>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">上传文件</label>
        <div style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: 32px; text-align: center; cursor: pointer; margin-top: 8px;" onclick="document.getElementById('resource-file').click()">
          <div style="font-size: 32px; margin-bottom: 8px;">📎</div>
          <div style="color: var(--color-text-secondary); font-size: 14px;">点击选择文件 或 拖拽到这里</div>
          <input type="file" id="resource-file" style="display: none;" accept=".pdf,.doc,.docx,.txt,.md">
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="closeModal()">算了</button>
      <button class="btn btn-primary" onclick="submitResource()">分享</button>
    `;

    this.openModal('分享宝藏', content, footer, () => {
      document.querySelectorAll('.modal .tag').forEach(tag => {
        tag.onclick = () => {
          document.querySelectorAll('.modal .tag').forEach(t => t.classList.remove('active'));
          tag.classList.add('active');
        };
      });
    });
  },

  // 编辑资料弹窗
  openEditProfileModal() {
    const user = Store.getCurrentUser();
    const content = `
      <div class="input-group mb-4">
        <label class="input-label">昵称</label>
        <input type="text" class="input" id="profile-name" value="${user?.name || ''}">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">个人简介</label>
        <textarea class="input" id="profile-intro" placeholder="介绍一下自己～" style="min-height: 80px;">${user?.intro || ''}</textarea>
      </div>
      <div class="input-group mb-4">
        <label class="input-label">热爱方向</label>
        <input type="text" class="input" id="profile-interests" value="${user?.interests || ''}" placeholder="对什么感兴趣？">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">能为社群提供</label>
        <input type="text" class="input" id="profile-can-help" value="${user?.canHelp || ''}" placeholder="能帮大家什么？">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">想学习的方向</label>
        <input type="text" class="input" id="profile-want-learn" value="${user?.wantLearn || ''}" placeholder="想学什么？">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">个人座右铭</label>
        <input type="text" class="input" id="profile-motto" value="${user?.motto || ''}" placeholder="一句话代表你～">
      </div>
      <div class="input-group">
        <label class="input-label">生活小爱好</label>
        <input type="text" class="input" id="profile-hobby" value="${user?.hobby || ''}" placeholder="工作之余喜欢做什么？">
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="closeModal()">算了</button>
      <button class="btn btn-primary" onclick="saveProfile()">保存</button>
    `;

    this.openModal('编辑资料', content, footer);
  },

  // 伙伴详情弹窗
  openMemberDetailModal(member) {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px;">${member.avatar}</div>
        <h2 style="margin-bottom: 4px;">${member.name}</h2>
        <p style="color: var(--color-text-secondary); font-size: 14px;">${member.intro}</p>
      </div>

      <div class="divider"></div>

      <div style="display: grid; gap: 16px;">
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">热爱方向</div>
          <div>${member.interests || '未设置'}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">能为社群提供的</div>
          <div>${member.canHelp || '未设置'}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">想学习的方向</div>
          <div>${member.wantLearn || '未设置'}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">个人座右铭</div>
          <div style="font-style: italic;">${member.motto || '未设置'}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">生活小爱好</div>
          <div>${member.hobby || '未设置'}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-6">
        ${member.tags.map(tag => `<span class="tag tag-secondary">${tag}</span>`).join('')}
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="closeModal()">关闭</button>
      ${member.publicContact ? `<button class="btn btn-primary">打个招呼</button>` : ''}
    `;

    this.openModal('伙伴详情', content, footer);
  },

  // 评论弹窗
  openCommentsModal(postId) {
    const posts = Store.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const content = `
      <div style="margin-bottom: 24px;">
        <div class="flex gap-3 mb-4">
          <div class="post-avatar">${post.author?.avatar || '分'}</div>
          <div>
            <div class="post-author">${post.author?.name || '匿名伙伴'}</div>
            <div class="post-time" style="font-size: 12px;">${formatTime(post.timestamp)}</div>
          </div>
        </div>
        <div style="line-height: 1.7;">${post.content}</div>
      </div>

      <div class="divider"></div>

      <div style="max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
        ${post.comments?.length > 0 ? post.comments.map(comment => `
          <div style="padding: 12px 0; border-bottom: 1px solid var(--color-border-light);">
            <div class="flex gap-2 mb-2">
              <span style="font-weight: 500; font-size: 14px;">${comment.author}</span>
              <span style="font-size: 12px; color: var(--color-text-hint);">${formatTime(comment.timestamp)}</span>
            </div>
            <div style="font-size: 14px; color: var(--color-text-secondary);">${comment.content}</div>
          </div>
        `).join('') : '<p style="text-align: center; color: var(--color-text-hint); padding: 20px 0;">还没有留言，快来抢沙发～</p>'}
      </div>

      <div class="input-group">
        <textarea class="input" id="comment-input" placeholder="留个言吧～" style="min-height: 80px;"></textarea>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="closeModal()">关闭</button>
      <button class="btn btn-primary" onclick="submitComment(${postId})">发布</button>
    `;

    this.openModal('留言互动', content, footer);
  }
};

// 暴露到全局
window.Components = Components;
window.closeModal = () => Components.closeModal();
window.showToast = (msg) => Components.showToast(msg);

// ===== 业务逻辑函数 =====

// 提交新帖子
function submitNewPost(type) {
  const content = document.getElementById('new-post-content')?.value.trim();
  if (!content) {
    showToast('写点什么再发布吧～');
    return;
  }

  const topic = document.querySelector('.modal .tag.active')?.dataset.topic || 'all';
  const user = Store.getCurrentUser();

  Store.addPost({
    type,
    topic,
    content,
    author: user
  });

  closeModal();
  showToast('发布成功～');
  navigate(type === 'moments' ? 'moments' : 'chat');
}

// 提交心愿
function submitWish(type) {
  const content = document.getElementById('wish-content')?.value.trim();
  const anonymous = document.getElementById('wish-anonymous')?.checked || false;

  if (!content) {
    showToast('写点什么再发布吧～');
    return;
  }

  const user = Store.getCurrentUser();

  Store.addWish({
    type,
    content,
    author: user?.name || '匿名伙伴',
    anonymous
  });

  closeModal();
  showToast(type === 'wish' ? '心愿已许下～' : '悄悄话已发送～');
  navigate('wishes');
}

// 提交资源
function submitResource() {
  const title = document.getElementById('resource-title')?.value.trim();
  const desc = document.getElementById('resource-desc')?.value.trim();
  const category = document.querySelector('.modal .tag.active')?.dataset.category || '入门';

  if (!title) {
    showToast('给宝藏起个名字吧～');
    return;
  }

  const user = Store.getCurrentUser();

  Store.addResource({
    title,
    desc,
    category,
    uploader: user?.name || '匿名'
  });

  closeModal();
  showToast('宝藏已入库～');
  navigate('resources');
}

// 保存资料
function saveProfile() {
  const name = document.getElementById('profile-name')?.value.trim();
  const intro = document.getElementById('profile-intro')?.value.trim();
  const interests = document.getElementById('profile-interests')?.value.trim();
  const canHelp = document.getElementById('profile-can-help')?.value.trim();
  const wantLearn = document.getElementById('profile-want-learn')?.value.trim();
  const motto = document.getElementById('profile-motto')?.value.trim();
  const hobby = document.getElementById('profile-hobby')?.value.trim();

  if (!name) {
    showToast('昵称不能为空～');
    return;
  }

  const user = Store.getCurrentUser();
  const updatedUser = {
    ...user,
    name,
    avatar: name[0],
    intro,
    interests,
    canHelp,
    wantLearn,
    motto,
    hobby
  };

  Store.setCurrentUser(updatedUser);
  closeModal();
  showToast('资料已保存～');
  navigate('profile');
}

// 提交评论
function submitComment(postId) {
  const content = document.getElementById('comment-input')?.value.trim();
  if (!content) {
    showToast('写点什么再发布吧～');
    return;
  }

  const user = Store.getCurrentUser();
  const posts = Store.getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);

  if (postIndex !== -1) {
    posts[postIndex].comments = posts[postIndex].comments || [];
    posts[postIndex].comments.push({
      id: Date.now(),
      author: user?.name || '匿名',
      content,
      timestamp: new Date().toISOString()
    });
    Store.set('posts', posts);
  }

  closeModal();
  showToast('留言成功～');
}

// 点赞
function toggleLike(postId) {
  const posts = Store.getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);

  if (postIndex !== -1) {
    posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
    Store.set('posts', posts);
    showToast('谢谢你的喜欢～');
    navigate(Router.currentPage);
  }
}

// 打开评论
function openComments(postId) {
  Components.openCommentsModal(postId);
}

// 打开成员详情
function openMemberDetail(memberId) {
  const members = Store.getMembers();
  const member = members.find(m => m.id === memberId);
  if (member) {
    Components.openMemberDetailModal(member);
  }
}

// 提交打卡
function submitCheckin() {
  const content = document.getElementById('checkin-input')?.value.trim();
  if (!content) {
    showToast('写点什么再记录吧～');
    return;
  }

  const user = Store.getCurrentUser();
  Store.addPost({
    type: 'checkin',
    content,
    author: user
  });

  document.getElementById('checkin-input').value = '';
  showToast('记录成功，今天的你很棒～');
  navigate('checkin');
}

// 更新隐私设置
function updatePrivacy(key, value) {
  const user = Store.getCurrentUser();
  user[key] = value;
  Store.setCurrentUser(user);
  showToast('设置已更新～');
}

// 筛选成员
function filterMembers(tag) {
  document.querySelectorAll('.members-grid + .flex .tag, .page-section .tag').forEach(t => {
    t.classList.toggle('active', t.textContent === tag || tag === 'all');
  });
  showToast(`筛选 ${tag} 伙伴～`);
}

// 筛选资源
function filterResources(category) {
  Router.resourcesFilter = category;
  navigate('resources');
}

// 打开心愿弹窗
function openWishModal(type) {
  Components.openWishModal(type);
}

// 打开上传弹窗
function openUploadModal() {
  Components.openUploadModal();
}

// 打开发帖弹窗
function openNewPostModal(type) {
  Components.openNewPostModal(type);
}

// 打开编辑资料弹窗
function openEditProfileModal() {
  Components.openEditProfileModal();
}
