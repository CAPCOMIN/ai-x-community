// AI+X 小院社群 - 数据存储模块 (localStorage 封装)

const Store = {
  // 存储键前缀
  PREFIX: 'ai_x_',

  // 基础获取
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn(`Store.get error: ${key}`, e);
      return defaultValue;
    }
  },

  // 基础设置
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Store.set error: ${key}`, e);
      return false;
    }
  },

  // 移除
  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  // ===== 成员相关 =====
  getMembers() {
    return this.get('members', this._defaultMembers());
  },

  setMembers(members) {
    this.set('members', members);
  },

  getCurrentUser() {
    return this.get('currentUser', this._defaultCurrentUser());
  },

  setCurrentUser(user) {
    this.set('currentUser', user);
  },

  // ===== 动态/帖子相关 =====
  getPosts() {
    return this.get('posts', []);
  },

  addPost(post) {
    const posts = this.getPosts();
    posts.unshift({
      id: Date.now(),
      ...post,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: []
    });
    this.set('posts', posts);
    return posts;
  },

  // ===== 资源相关 =====
  getResources() {
    return this.get('resources', this._defaultResources());
  },

  addResource(resource) {
    const resources = this.getResources();
    resources.unshift({
      id: Date.now(),
      ...resource,
      uploadTime: new Date().toISOString()
    });
    this.set('resources', resources);
    return resources;
  },

  // ===== 活动相关 =====
  getActivities() {
    return this.get('activities', this._defaultActivities());
  },

  // ===== 心愿墙相关 =====
  getWishes() {
    return this.get('wishes', []);
  },

  addWish(wish) {
    const wishes = this.getWishes();
    wishes.unshift({
      id: Date.now(),
      ...wish,
      timestamp: new Date().toISOString()
    });
    this.set('wishes', wishes);
    return wishes;
  },

  // ===== 通知相关 =====
  getNotifications() {
    return this.get('notifications', []);
  },

  addNotification(notification) {
    const notifications = this.getNotifications();
    notifications.unshift({
      id: Date.now(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    });
    this.set('notifications', notifications);
    return notifications;
  },

  markNotificationRead(id) {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      this.set('notifications', notifications);
    }
    return notifications;
  },

  // ===== 每日句子 =====
  getDailyQuote() {
    const data = this.get('dailyQuote', { date: '', quote: '' });
    const today = new Date().toDateString();
    if (data.date !== today) {
      const quotes = [
        "今天也要对自己温柔一点呀 🌸",
        "慢一点没关系，走过的路都算数 ✨",
        "和同频的伙伴在一起，就是最好的成长 🌿",
        "每一个小进步都值得被看见 💫",
        "记得给自己泡杯热茶，休息一下吧 🍵",
        "今天有什么让你开心的小事吗？ 😊",
        "我们一起慢慢变好，好吗？ 🌱",
        "允许自己休息，也是勇敢的表现 🌼",
        "今天也是被伙伴们治愈的一天 💕",
        "有空来小院坐坐，聊聊天呀 🏡"
      ];
      data.quote = quotes[Math.floor(Math.random() * quotes.length)];
      data.date = today;
      this.set('dailyQuote', data);
    }
    return data.quote;
  },

  // ===== 默认数据 =====
  _defaultMembers() {
    return [
      {
        id: 1,
        name: "桐",
        avatar: "桐",
        intro: "AI 学习者，喜欢探索新事物，正在寻找同频伙伴一起成长 🌱",
        tags: ["AI爱好者", "学习搭子"],
        interests: "AI、产品思维",
        canHelp: "产品设计思路、资料整理",
        wantLearn: "编程基础、数据分析",
        motto: "慢慢来，比较快",
        hobby: "读书、咖啡",
        publicContact: true
      },
      {
        id: 2,
        name: "林",
        avatar: "林",
        intro: "前端开发，对 AI 应用感兴趣，希望能和大家一起探讨",
        tags: ["开发者", "AI爱好者"],
        interests: "前端技术、AI应用",
        canHelp: "前端开发、代码review",
        wantLearn: "AI模型原理、产品运营",
        motto: "代码改变世界",
        hobby: "音乐、旅行",
        publicContact: false
      },
      {
        id: 3,
        name: "安然",
        avatar: "安",
        intro: "做教育产品的运营一枚，相信终身学习，也在学AI~",
        tags: ["运营", "学习者"],
        interests: "教育科技、AI应用",
        canHelp: "运营经验、资源对接",
        wantLearn: "AI提示词、数据分析",
        motto: "Stay hungry, stay foolish",
        hobby: "摄影、写作",
        publicContact: true
      },
      {
        id: 4,
        name: "阿泽",
        avatar: "泽",
        intro: "正在从传统行业转型到AI领域，欢迎交流学习",
        tags: ["转型中", "AI探索"],
        interests: "AI在各行业的应用",
        canHelp: "行业经验、职业转型",
        wantLearn: "编程、AI应用",
        motto: "种一棵树最好的时间是十年前，其次是现在",
        hobby: "跑步、读书",
        publicContact: true
      },
      {
        id: 5,
        name: "小雪",
        avatar: "雪",
        intro: "AI + 医疗从业者，想在这里找到跨界伙伴",
        tags: ["医疗AI", "跨界探索"],
        interests: "AI医疗应用",
        canHelp: "医疗行业洞察",
        wantLearn: "产品设计、数据处理",
        motto: "用AI让医疗更温暖",
        hobby: "瑜伽、冥想",
        publicContact: false
      },
      {
        id: 6,
        name: "志远",
        avatar: "志",
        intro: "自由职业者，专注AI内容创作，一起加油",
        tags: ["内容创作", "AI探索"],
        interests: "AI内容创作、新媒体",
        canHelp: "内容策划、写作建议",
        wantLearn: "AI工具使用、个人品牌",
        motto: "创作是一种修行",
        hobby: "电影、咖啡",
        publicContact: true
      },
      {
        id: 7,
        name: "小青",
        avatar: "青",
        intro: "数据分析师，正在探索AI和数据的结合",
        tags: ["数据", "AI学习"],
        interests: "数据分析、AI应用",
        canHelp: "数据分析方法、图表制作",
        wantLearn: "AI模型、数据可视化",
        motto: "数据会说话",
        hobby: "爬山、园艺",
        publicContact: true
      },
      {
        id: 8,
        name: "云飞",
        avatar: "云",
        intro: "设计师，对 AI 生成艺术很感兴趣，求交流",
        tags: ["设计", "AI创意"],
        interests: "AI设计工具、AIGC",
        canHelp: "设计方案、视觉建议",
        wantLearn: "AI提示词、艺术创作",
        motto: "设计让世界更美好",
        hobby: "绘画、展览",
        publicContact: false
      }
    ];
  },

  _defaultCurrentUser() {
    return this._defaultMembers()[0];
  },

  _defaultResources() {
    return [
      {
        id: 1,
        title: "AI 入门指南：新手必读",
        desc: "整理了学习 AI 的入门路径和优质资源，适合刚起步的伙伴",
        category: "入门",
        uploader: "桐",
        type: "文档"
      },
      {
        id: 2,
        title: "100+ 实用 AI Prompts 汇总",
        desc: "涵盖写作、分析、创意等多个场景的提示词模板",
        category: "工具",
        uploader: "林",
        type: "文档"
      },
      {
        id: 3,
        title: "ChatGPT 使用心得分享",
        desc: "结合实际工作场景，分享一些使用技巧和注意事项",
        category: "感悟",
        uploader: "安然",
        type: "文章"
      },
      {
        id: 4,
        title: "Midjourney 入门教程",
        desc: "一步步教你用 AI 画出想要的图片，图文并茂",
        category: "工具",
        uploader: "云飞",
        type: "教程"
      },
      {
        id: 5,
        title: "AI 产品分析报告合集",
        desc: "收集了近期比较火的 AI 产品分析，了解行业动态",
        category: "进阶",
        uploader: "志远",
        type: "报告"
      }
    ];
  },

  _defaultActivities() {
    return [
      {
        id: 1,
        title: "AI 碎碎念夜聊",
        desc: "随便聊聊最近用 AI 过程中遇到的趣事、坑或者灵感，不需要准备什么，来就行~",
        time: "每周四 20:00",
        type: "线上",
        attendees: ["桐", "林", "安然", "阿泽"],
        status: "upcoming",
        notes: []
      },
      {
        id: 2,
        title: "成长组队：一对一配对",
        desc: "两两配对，互相陪伴监督学习，每周一次简单交流，有兴趣的伙伴快来~",
        time: "持续进行",
        type: "长期",
        attendees: ["桐", "小雪"],
        status: "ongoing",
        notes: []
      },
      {
        id: 3,
        title: "线下小聚：咖啡馆见面会",
        desc: "上个月的城市小聚记录，大家聊得很开心，期待下次~",
        time: "2024年3月15日",
        type: "线下",
        attendees: ["桐", "林", "安然", "志远"],
        status: "past",
        notes: [
          "阿泽分享了他的转型经历，很受启发",
          "大家一致认为小院氛围超棒",
          "下次计划去郊外踏青"
        ]
      }
    ];
  }
};

// 暴露到全局
window.Store = Store;
