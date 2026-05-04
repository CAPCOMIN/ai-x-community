// AI+X 小院社群 - UI 组件模块

let chatPollTimer = null;
let chatPollBusy = false;

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
        <input type="text" class="input" id="profile-name" value="${escapeHtml(user?.name || '')}">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">个人简介</label>
        <textarea class="input" id="profile-intro" placeholder="介绍一下自己～" style="min-height: 80px;">${escapeHtml(user?.intro || '')}</textarea>
      </div>
      <div class="input-group mb-4">
        <label class="input-label">热爱方向</label>
        <input type="text" class="input" id="profile-interests" value="${escapeHtml(user?.interests || '')}" placeholder="对什么感兴趣？">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">能为社群提供</label>
        <input type="text" class="input" id="profile-can-help" value="${escapeHtml(user?.canHelp || '')}" placeholder="能帮大家什么？">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">想学习的方向</label>
        <input type="text" class="input" id="profile-want-learn" value="${escapeHtml(user?.wantLearn || '')}" placeholder="想学什么？">
      </div>
      <div class="input-group mb-4">
        <label class="input-label">个人座右铭</label>
        <input type="text" class="input" id="profile-motto" value="${escapeHtml(user?.motto || '')}" placeholder="一句话代表你～">
      </div>
      <div class="input-group">
        <label class="input-label">生活小爱好</label>
        <input type="text" class="input" id="profile-hobby" value="${escapeHtml(user?.hobby || '')}" placeholder="工作之余喜欢做什么？">
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
        <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px;">${escapeHtml(member.avatar)}</div>
        <h2 style="margin-bottom: 4px;">${escapeHtml(member.name)}</h2>
        <p style="color: var(--color-text-secondary); font-size: 14px;">${escapeHtml(member.intro)}</p>
      </div>

      <div class="divider"></div>

      <div style="display: grid; gap: 16px;">
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">热爱方向</div>
          <div>${escapeHtml(member.interests || '未设置')}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">能为社群提供的</div>
          <div>${escapeHtml(member.canHelp || '未设置')}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">想学习的方向</div>
          <div>${escapeHtml(member.wantLearn || '未设置')}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">个人座右铭</div>
          <div style="font-style: italic;">${escapeHtml(member.motto || '未设置')}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--color-text-hint); margin-bottom: 4px;">生活小爱好</div>
          <div>${escapeHtml(member.hobby || '未设置')}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-6">
        ${(member.tags || []).map(tag => `<span class="tag tag-secondary">${escapeHtml(tag)}</span>`).join('')}
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="closeModal()">关闭</button>
      ${member.publicContact ? `<button class="btn btn-primary" onclick="startDirectChat(${member.id})">打个招呼</button>` : ''}
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
          <div class="post-avatar">${escapeHtml(post.author?.avatar || '分')}</div>
          <div>
            <div class="post-author">${escapeHtml(post.author?.name || '匿名伙伴')}</div>
            <div class="post-time" style="font-size: 12px;">${formatTime(post.timestamp)}</div>
          </div>
        </div>
        <div style="line-height: 1.7;">${escapeHtml(post.content)}</div>
      </div>

      <div class="divider"></div>

      <div style="max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
        ${post.comments?.length > 0 ? post.comments.map(comment => `
          <div style="padding: 12px 0; border-bottom: 1px solid var(--color-border-light);">
            <div class="flex gap-2 mb-2">
              <span style="font-weight: 500; font-size: 14px;">${escapeHtml(comment.author)}</span>
              <span style="font-size: 12px; color: var(--color-text-hint);">${formatTime(comment.timestamp)}</span>
            </div>
            <div style="font-size: 14px; color: var(--color-text-secondary);">${escapeHtml(comment.content)}</div>
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
async function submitNewPost(type) {
  const content = document.getElementById('new-post-content')?.value.trim();
  if (!content) {
    showToast('写点什么再发布吧～');
    return;
  }

  const topic = document.querySelector('.modal .tag.active')?.dataset.topic || 'all';
  const user = Store.getCurrentUser();

  try {
    await Store.addPost({ type, topic, content, author: user });
    closeModal();
    showToast('发布成功～');
    navigate(type === 'moments' ? 'moments' : 'chat');
  } catch (error) {
    showToast(error.message);
  }
}

// 提交心愿
async function submitWish(type) {
  const content = document.getElementById('wish-content')?.value.trim();
  const anonymous = document.getElementById('wish-anonymous')?.checked || false;

  if (!content) {
    showToast('写点什么再发布吧～');
    return;
  }

  const user = Store.getCurrentUser();

  try {
    await Store.addWish({
      type,
      content,
      author: user?.name || '匿名伙伴',
      anonymous
    });
    closeModal();
    showToast(type === 'wish' ? '心愿已许下～' : '悄悄话已发送～');
    navigate('wishes');
  } catch (error) {
    showToast(error.message);
  }
}

// 提交资源
async function submitResource() {
  const title = document.getElementById('resource-title')?.value.trim();
  const desc = document.getElementById('resource-desc')?.value.trim();
  const category = document.querySelector('.modal .tag.active')?.dataset.category || '入门';

  if (!title) {
    showToast('给宝藏起个名字吧～');
    return;
  }

  const user = Store.getCurrentUser();

  try {
    await Store.addResource({
      title,
      desc,
      category,
      uploader: user?.name || '匿名'
    });
    closeModal();
    showToast('宝藏已入库～');
    navigate('resources');
  } catch (error) {
    showToast(error.message);
  }
}

// 保存资料
async function saveProfile() {
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

  try {
    await Store.setCurrentUser(updatedUser);
    closeModal();
    window.updateShell?.();
    showToast('资料已保存～');
    navigate('profile');
  } catch (error) {
    showToast(error.message);
  }
}

// 提交评论
async function submitComment(postId) {
  const content = document.getElementById('comment-input')?.value.trim();
  if (!content) {
    showToast('写点什么再发布吧～');
    return;
  }

  try {
    await Store.addComment(postId, content);
    closeModal();
    showToast('留言成功～');
    navigate(Router.currentPage);
  } catch (error) {
    showToast(error.message);
  }
}

// 点赞
async function toggleLike(postId) {
  try {
    await Store.likePost(postId);
    showToast('已更新喜欢～');
    navigate(Router.currentPage);
  } catch (error) {
    showToast(error.message);
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
async function submitCheckin() {
  const content = document.getElementById('checkin-input')?.value.trim();
  if (!content) {
    showToast('写点什么再记录吧～');
    return;
  }

  try {
    await Store.addCheckin(content);
    document.getElementById('checkin-input').value = '';
    showToast('记录成功，今天的你很棒～');
    navigate('checkin');
  } catch (error) {
    showToast(error.message);
  }
}

// 更新隐私设置
async function updatePrivacy(key, value) {
  const user = Store.getCurrentUser();
  user[key] = value;
  try {
    await Store.setCurrentUser(user);
    showToast('设置已更新～');
  } catch (error) {
    showToast(error.message);
  }
}

// 筛选成员
function filterMembers(tag) {
  Router.membersFilter = tag;
  Router._renderPage('members');
}

// 筛选资源
function filterResources(category) {
  Router.resourcesFilter = category;
  Router._renderPage('resources');
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

async function joinActivity(activityId) {
  try {
    await Store.joinActivity(activityId);
    showToast('已报名参加～');
    navigate('activities');
  } catch (error) {
    showToast(error.message);
  }
}

async function echoWish(wishId) {
  try {
    await Store.echoWish(wishId);
    showToast('已呼应～');
    navigate('wishes');
  } catch (error) {
    showToast(error.message);
  }
}

async function markNotificationRead(id) {
  try {
    await Store.markNotificationRead(id);
    window.updateShell?.();
    Router._renderPage('notifications');
  } catch (error) {
    showToast(error.message);
  }
}

async function submitLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  try {
    await Store.login(email, password);
    window.updateShell?.();
    showToast('登录成功～');
    navigate('home');
  } catch (error) {
    showToast(error.message);
  }
}

async function submitRegister(event) {
  event.preventDefault();
  const name = document.getElementById('register-name')?.value.trim();
  const email = document.getElementById('register-email')?.value.trim();
  const password = document.getElementById('register-password')?.value;
  try {
    await Store.register({ name, email, password });
    window.updateShell?.();
    showToast('欢迎加入小院～');
    navigate('home');
  } catch (error) {
    showToast(error.message);
  }
}

async function openConversation(conversationId) {
  try {
    await Store.loadMessages(conversationId);
    Router._renderPage('chat');
    scrollChatToBottom();
  } catch (error) {
    showToast(error.message);
  }
}

async function sendChatMessage(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input');
  const content = input?.value.trim();
  if (!content) return;
  try {
    await Store.sendMessage(Store.getActiveConversationId(), content);
    if (input) input.value = '';
    Router._renderPage('chat');
    scrollChatToBottom();
  } catch (error) {
    showToast(error.message);
  }
}

async function startDirectChat(userId) {
  try {
    await Store.startDirectChat(userId);
    closeModal();
    navigate('chat');
    scrollChatToBottom();
  } catch (error) {
    showToast(error.message);
  }
}

function scrollChatToBottom() {
  requestAnimationFrame(() => {
    const node = document.getElementById('chat-messages');
    if (node) node.scrollTop = node.scrollHeight;
  });
}

function startChatPolling() {
  stopChatPolling();
  chatPollTimer = setInterval(refreshActiveChat, 2500);
}

function stopChatPolling() {
  if (chatPollTimer) {
    clearInterval(chatPollTimer);
    chatPollTimer = null;
  }
}

async function refreshActiveChat() {
  if (chatPollBusy || Router.currentPage !== 'chat') return;
  const conversationId = Store.getActiveConversationId();
  if (!conversationId) return;

  const before = Store.getMessages(conversationId);
  const beforeLastId = before.at(-1)?.id || 0;
  const draft = document.getElementById('chat-input')?.value || '';

  chatPollBusy = true;
  try {
    await Store.loadMessages(conversationId);
    const after = Store.getMessages(conversationId);
    const afterLastId = after.at(-1)?.id || 0;
    if (after.length !== before.length || afterLastId !== beforeLastId) {
      Router._renderPage('chat');
      const input = document.getElementById('chat-input');
      if (input && draft) {
        input.value = draft;
        input.focus();
      }
      scrollChatToBottom();
    }
  } catch (error) {
    console.warn('群聊刷新失败', error);
  } finally {
    chatPollBusy = false;
  }
}

async function logout() {
  await Store.logout();
  Store.state.admin = null;
  window.updateShell?.();
  showToast('已退出登录');
  navigate('login');
}

function switchAdminTab(tab) {
  Router.adminTab = tab;
  Router._renderPage('admin');
}

async function adminToggleRole(id, currentRole) {
  try {
    await Store.adminUpdateUser(id, { role: currentRole === 'admin' ? 'user' : 'admin' });
    showToast('角色已更新');
    Router._renderPage('admin');
  } catch (error) {
    showToast(error.message);
  }
}

async function adminToggleUserStatus(id, currentStatus) {
  try {
    await Store.adminUpdateUser(id, { status: currentStatus === 'active' ? 'disabled' : 'active' });
    showToast('账号状态已更新');
    Router._renderPage('admin');
  } catch (error) {
    showToast(error.message);
  }
}

async function adminToggleRecordStatus(entity, id, currentStatus) {
  const nextStatus = currentStatus === 'published' || currentStatus === 'upcoming' || currentStatus === 'ongoing'
    ? 'hidden'
    : 'published';
  try {
    await Store.adminPatchRecord(entity, id, { status: nextStatus });
    showToast('状态已更新');
    Router._renderPage('admin');
  } catch (error) {
    showToast(error.message);
  }
}

async function adminDeleteRecord(entity, id) {
  if (!confirm('确认删除这条数据？')) return;
  try {
    await Store.adminDeleteRecord(entity, id);
    showToast('已删除');
    Router._renderPage('admin');
  } catch (error) {
    showToast(error.message);
  }
}
