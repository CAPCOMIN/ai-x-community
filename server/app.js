'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_ROOT = ROOT;
const DEFAULT_DB_PATH = path.join(ROOT, 'data', 'community.sqlite');
const SESSION_DAYS = 14;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function now() {
  return new Date().toISOString();
}

function json(value) {
  return JSON.stringify(value);
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    intro: row.intro,
    tags: parseJson(row.tags_json, []),
    interests: row.interests,
    canHelp: row.can_help,
    wantLearn: row.want_learn,
    motto: row.motto,
    hobby: row.hobby,
    publicContact: Boolean(row.public_contact),
    notificationsEnabled: Boolean(row.notifications_enabled),
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

function createDatabase(dbPath = DEFAULT_DB_PATH) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      intro TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      interests TEXT NOT NULL DEFAULT '',
      can_help TEXT NOT NULL DEFAULT '',
      want_learn TEXT NOT NULL DEFAULT '',
      motto TEXT NOT NULL DEFAULT '',
      hobby TEXT NOT NULL DEFAULT '',
      public_contact INTEGER NOT NULL DEFAULT 1,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT 'all',
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '文档',
      url TEXT NOT NULL DEFAULT '',
      uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      time TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '线上',
      status TEXT NOT NULL DEFAULT 'upcoming',
      notes_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_attendees (
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (activity_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      anonymous INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wish_echoes (
      wish_id INTEGER NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (wish_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '💬',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      PRIMARY KEY (conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_resources_created ON resources(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
  `);

  seedDatabase(db);
  return db;
}

function createUser(db, input) {
  const timestamp = now();
  const password = input.password || crypto.randomBytes(18).toString('base64url');
  const passwordParts = hashPassword(password);
  const name = String(input.name || '').trim();
  const avatar = input.avatar || Array.from(name)[0] || '友';
  const result = db.prepare(`
    INSERT INTO users (
      email, password_hash, password_salt, name, avatar, intro, tags_json, interests,
      can_help, want_learn, motto, hobby, public_contact, notifications_enabled,
      role, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.email.toLowerCase(),
    passwordParts.hash,
    passwordParts.salt,
    name,
    avatar,
    input.intro || '',
    json(input.tags || []),
    input.interests || '',
    input.canHelp || '',
    input.wantLearn || '',
    input.motto || '',
    input.hobby || '',
    input.publicContact === false ? 0 : 1,
    input.notificationsEnabled === false ? 0 : 1,
    input.role || 'user',
    input.status || 'active',
    timestamp,
    timestamp
  );
  return Number(result.lastInsertRowid);
}

function updatePassword(db, userId, password) {
  const passwordParts = hashPassword(password);
  db.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?')
    .run(passwordParts.hash, passwordParts.salt, now(), userId);
}

function ensureUser(db, input) {
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email.toLowerCase());
  if (!existing) return createUser(db, input);
  db.prepare(`
    UPDATE users SET name = ?, avatar = ?, intro = ?, tags_json = ?, interests = ?, can_help = ?,
      want_learn = ?, motto = ?, hobby = ?, public_contact = ?, notifications_enabled = ?,
      role = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(
    input.name,
    input.avatar || Array.from(input.name)[0] || '友',
    input.intro || '',
    json(input.tags || []),
    input.interests || '',
    input.canHelp || '',
    input.wantLearn || '',
    input.motto || '',
    input.hobby || '',
    input.publicContact === false ? 0 : 1,
    input.notificationsEnabled === false ? 0 : 1,
    input.role || existing.role || 'user',
    input.status || 'active',
    now(),
    existing.id
  );
  if (input.password) updatePassword(db, existing.id, input.password);
  return existing.id;
}

function seedDatabase(db) {
  const legacyDemoEmails = [
    'tong@example.com',
    'lin@example.com',
    'anran@example.com',
    'aze@example.com',
    'xiaoxue@example.com',
    'zhiyuan@example.com',
    'xiaoqing@example.com',
    'yunfei@example.com'
  ];
  for (const email of legacyDemoEmails) db.prepare('DELETE FROM users WHERE email = ?').run(email);

  const adminId = ensureUser(db, {
    email: process.env.ADMIN_EMAIL || 'admin@aix.local',
    password: process.env.ADMIN_PASSWORD || 'Admin123456!',
    name: '管理员',
    avatar: '管',
    intro: 'AI+X 小院管理员',
    tags: ['管理员'],
    role: 'admin'
  });

  const userIds = [
    ensureUser(db, {
      email: 'test1@aix.local',
      password: 'User123456!',
      name: '测试用户一',
      avatar: '一',
      intro: '用于上线前验收的普通测试用户',
      tags: ['测试用户'],
      interests: 'AI 应用体验',
      canHelp: '功能验收、反馈问题',
      wantLearn: 'AI 社群协作',
      motto: '认真验证每个关键流程',
      hobby: '读书',
      role: 'user'
    }),
    ensureUser(db, {
      email: 'test2@aix.local',
      password: 'User123456!',
      name: '测试用户二',
      avatar: '二',
      intro: '用于群聊和私聊联调的普通测试用户',
      tags: ['测试用户'],
      interests: '产品体验、群聊协作',
      canHelp: '聊天联调、内容测试',
      wantLearn: 'AI 产品运营',
      motto: '把流程走完整',
      hobby: '咖啡',
      role: 'user'
    })
  ];

  if (db.prepare('SELECT COUNT(*) AS count FROM activities').get().count === 0) {
    const insertActivity = db.prepare('INSERT INTO activities (title, description, time, type, status, notes_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const activities = [
      ['AI 实践交流会', '围绕近期 AI 工具使用、学习路线和项目实践做一次线上交流。', '每周四 20:00', '线上', 'upcoming', []],
      ['成长组队：一对一配对', '两两配对，互相陪伴监督学习，每周一次简单交流。', '持续进行', '长期', 'ongoing', []]
    ];
    for (const activity of activities) insertActivity.run(...activity.slice(0, 5), json(activity[5]), now(), now());
  }

  const join = db.prepare('INSERT OR IGNORE INTO activity_attendees (activity_id, user_id, created_at) VALUES (?, ?, ?)');
  userIds.forEach((id) => join.run(1, id, now()));
  ensureAllHandsConversation(db, adminId);
}

function ensureAllHandsConversation(db, createdBy) {
  let conversation = db.prepare("SELECT * FROM conversations WHERE type = 'group' AND title = '全员群'").get();
  if (!conversation) {
    const result = db.prepare('INSERT INTO conversations (type, title, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run('group', '全员群', createdBy, now(), now());
    conversation = { id: Number(result.lastInsertRowid) };
  }
  const join = db.prepare('INSERT OR IGNORE INTO conversation_participants (conversation_id, user_id, created_at) VALUES (?, ?, ?)');
  db.prepare("SELECT id FROM users WHERE status = 'active'").all().forEach((user) => join.run(conversation.id, user.id, now()));
  const messageCount = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE conversation_id = ?').get(conversation.id).count;
  if (messageCount === 0) {
    db.prepare('INSERT INTO messages (conversation_id, author_id, content, created_at) VALUES (?, ?, ?, ?)')
      .run(conversation.id, createdBy, '欢迎来到全员群，这里用于小院成员的日常交流。', now());
  }
}

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new HttpError(400, `${field} 不能为空`);
    }
  }
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, '密码至少需要 8 个字符');
  }
}

function normalizeEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new HttpError(400, '邮箱格式不正确');
  }
  return value;
}

function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  db.prepare('INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)').run(userId, sha256(token), expires, now());
  return { token, expiresAt: expires };
}

function mapPost(db, row, viewerId) {
  const comments = db.prepare(`
    SELECT c.*, u.name AS author_name, u.avatar AS author_avatar
    FROM comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.post_id = ? AND c.status != 'deleted'
    ORDER BY c.created_at ASC
  `).all(row.id).map((comment) => ({
    id: comment.id,
    author: comment.author_name,
    authorId: comment.author_id,
    content: comment.content,
    timestamp: comment.created_at
  }));

  return {
    id: row.id,
    type: row.type,
    topic: row.topic,
    content: row.content,
    author: publicUser({
      id: row.author_id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      intro: row.intro,
      tags_json: row.tags_json,
      interests: row.interests,
      can_help: row.can_help,
      want_learn: row.want_learn,
      motto: row.motto,
      hobby: row.hobby,
      public_contact: row.public_contact,
      notifications_enabled: row.notifications_enabled,
      role: row.role,
      status: row.user_status,
      created_at: row.user_created_at
    }),
    authorId: row.author_id,
    timestamp: row.created_at,
    status: row.status,
    likes: Number(row.likes || 0),
    liked: Boolean(row.liked),
    comments
  };
}

function listPosts(db, viewerId, includeAll = false) {
  const statusWhere = includeAll ? '1 = 1' : "p.status = 'published'";
  return db.prepare(`
    SELECT p.*, u.email, u.name, u.avatar, u.intro, u.tags_json, u.interests, u.can_help, u.want_learn,
           u.motto, u.hobby, u.public_contact, u.notifications_enabled, u.role, u.status AS user_status,
           u.created_at AS user_created_at,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes,
           EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) AS liked
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE ${statusWhere}
    ORDER BY p.created_at DESC
  `).all(viewerId).map((row) => mapPost(db, {
    ...row
  }, viewerId));
}

function listMembers(db, includeInactive = false) {
  const where = includeInactive ? '1 = 1' : "status = 'active' AND role != 'admin'";
  return db.prepare(`SELECT * FROM users WHERE ${where} ORDER BY id ASC`).all().map(publicUser);
}

function listResources(db, includeAll = false) {
  const where = includeAll ? '1 = 1' : "r.status = 'published'";
  return db.prepare(`
    SELECT r.*, u.name AS uploader_name
    FROM resources r
    JOIN users u ON u.id = r.uploader_id
    WHERE ${where}
    ORDER BY r.created_at DESC
  `).all().map((row) => ({
    id: row.id,
    title: row.title,
    desc: row.description,
    category: row.category,
    type: row.type,
    url: row.url,
    uploader: row.uploader_name,
    uploaderId: row.uploader_id,
    status: row.status,
    uploadTime: row.created_at
  }));
}

function listActivities(db) {
  return db.prepare('SELECT * FROM activities ORDER BY id ASC').all().map((activity) => ({
    id: activity.id,
    title: activity.title,
    desc: activity.description,
    time: activity.time,
    type: activity.type,
    status: activity.status,
    notes: parseJson(activity.notes_json, []),
    attendees: db.prepare(`
      SELECT u.name FROM activity_attendees aa
      JOIN users u ON u.id = aa.user_id
      WHERE aa.activity_id = ?
      ORDER BY aa.created_at ASC
    `).all(activity.id).map((row) => row.name)
  }));
}

function listWishes(db, includeAll = false) {
  const where = includeAll ? '1 = 1' : "w.status = 'published'";
  return db.prepare(`
    SELECT w.*, u.name AS author_name,
           (SELECT COUNT(*) FROM wish_echoes we WHERE we.wish_id = w.id) AS echoes
    FROM wishes w
    JOIN users u ON u.id = w.author_id
    WHERE ${where}
    ORDER BY w.created_at DESC
  `).all().map((row) => ({
    id: row.id,
    type: row.type,
    content: row.content,
    author: row.author_name,
    authorId: row.author_id,
    anonymous: Boolean(row.anonymous),
    status: row.status,
    echoes: Number(row.echoes || 0),
    timestamp: row.created_at
  }));
}

function listCheckins(db, userId, includeAll = false) {
  const where = includeAll ? "c.status != 'deleted'" : "c.status = 'published'";
  const extra = includeAll ? '' : 'AND c.author_id = ?';
  const params = includeAll ? [] : [userId];
  return db.prepare(`
    SELECT c.*, u.name AS author_name, u.avatar AS author_avatar
    FROM checkins c
    JOIN users u ON u.id = c.author_id
    WHERE ${where} ${extra}
    ORDER BY c.created_at DESC
  `).all(...params).map((row) => ({
    id: row.id,
    content: row.content,
    author: row.author_name,
    authorId: row.author_id,
    avatar: row.author_avatar,
    status: row.status,
    timestamp: row.created_at
  }));
}

function listNotifications(db, userId, includeAll = false) {
  const rows = includeAll
    ? db.prepare('SELECT n.*, u.name AS user_name FROM notifications n JOIN users u ON u.id = n.user_id ORDER BY n.created_at DESC').all()
    : db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    title: row.title,
    content: row.content,
    icon: row.icon,
    read: Boolean(row.read),
    timestamp: row.created_at
  }));
}

function mapMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatar: row.author_avatar,
    content: row.content,
    status: row.status,
    timestamp: row.created_at
  };
}

function listMessages(db, conversationId, userId, includeAll = false) {
  if (!includeAll) assertConversationAccess(db, conversationId, userId);
  return db.prepare(`
    SELECT m.*, u.name AS author_name, u.avatar AS author_avatar
    FROM messages m
    JOIN users u ON u.id = m.author_id
    WHERE m.conversation_id = ? AND m.status != 'deleted'
    ORDER BY m.created_at ASC
  `).all(conversationId).map(mapMessage);
}

function assertConversationAccess(db, conversationId, userId) {
  const row = db.prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?')
    .get(conversationId, userId);
  if (!row) throw new HttpError(404, '会话不存在或无权访问');
}

function listConversations(db, userId, includeAll = false) {
  const rows = includeAll
    ? db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all()
    : db.prepare(`
      SELECT c.*
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE cp.user_id = ? AND c.status = 'active'
      ORDER BY c.updated_at DESC
    `).all(userId);

  return rows.map((row) => {
    const participants = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.email, u.role
      FROM conversation_participants cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.conversation_id = ?
      ORDER BY u.id ASC
    `).all(row.id);
    const lastMessage = db.prepare(`
      SELECT m.*, u.name AS author_name, u.avatar AS author_avatar
      FROM messages m JOIN users u ON u.id = m.author_id
      WHERE m.conversation_id = ? AND m.status != 'deleted'
      ORDER BY m.created_at DESC LIMIT 1
    `).get(row.id);
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      participants,
      lastMessage: lastMessage ? mapMessage(lastMessage) : null,
      updatedAt: row.updated_at
    };
  });
}

function getAllHandsConversationId(db) {
  const row = db.prepare("SELECT id FROM conversations WHERE type = 'group' AND title = '全员群'").get();
  return row?.id || null;
}

function bootstrap(db, user) {
  ensureAllHandsConversation(db, user.id);
  const conversations = listConversations(db, user.id);
  const activeConversationId = getAllHandsConversationId(db) || conversations[0]?.id || null;
  return {
    currentUser: publicUser(user),
    members: listMembers(db),
    posts: listPosts(db, user.id),
    resources: listResources(db),
    activities: listActivities(db),
    wishes: listWishes(db),
    checkins: listCheckins(db, user.id),
    notifications: listNotifications(db, user.id),
    conversations,
    activeConversationId,
    messages: activeConversationId ? listMessages(db, activeConversationId, user.id) : []
  };
}

function createApp(options = {}) {
  const db = createDatabase(options.dbPath);
  const routes = [];

  function send(res, status, payload, headers = {}) {
    const body = payload === undefined ? '' : JSON.stringify(payload);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers
    });
    res.end(body);
  }

  function route(method, pattern, handler) {
    const names = [];
    const regex = new RegExp(`^${pattern.replace(/\/:([^/]+)/g, (_, name) => {
      names.push(name);
      return '/([^/]+)';
    })}$`);
    routes.push({ method, regex, names, handler });
  }

  async function parseBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) throw new HttpError(413, '请求体过大');
      chunks.push(chunk);
    }
    if (chunks.length === 0) return {};
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new HttpError(400, 'JSON 格式不正确');
    }
  }

  function authenticate(req, required = true) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      if (required) throw new HttpError(401, '请先登录');
      return null;
    }
    const session = db.prepare(`
      SELECT s.*, u.*
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(sha256(token), now());
    if (!session || session.status !== 'active') {
      if (required) throw new HttpError(401, '登录已过期，请重新登录');
      return null;
    }
    return getUserById(db, session.user_id);
  }

  function requireAdmin(req) {
    const user = authenticate(req);
    if (user.role !== 'admin') throw new HttpError(403, '需要管理员权限');
    return user;
  }

  function notify(userId, title, content, icon = '💬') {
    db.prepare('INSERT INTO notifications (user_id, title, content, icon, read, created_at) VALUES (?, ?, ?, ?, 0, ?)')
      .run(userId, title, content, icon, now());
  }

  function updateAllowed(table, id, body, allowed) {
    const entries = Object.entries(allowed)
      .filter(([inputKey]) => Object.prototype.hasOwnProperty.call(body, inputKey))
      .map(([inputKey, column]) => [column, body[inputKey]]);
    if (entries.length === 0) throw new HttpError(400, '没有可更新字段');
    const sets = entries.map(([column]) => `${column} = ?`).join(', ');
    const noUpdatedAt = ['notifications', 'wishes', 'checkins', 'messages'].includes(table);
    db.prepare(`UPDATE ${table} SET ${sets}${noUpdatedAt ? '' : ', updated_at = ?'} WHERE id = ?`)
      .run(...entries.map((entry) => String(entry[1] ?? '').trim()), ...(noUpdatedAt ? [] : [now()]), Number(id));
  }

  route('GET', '/api/health', async () => ({ ok: true, uptime: process.uptime(), timestamp: now() }));

  route('POST', '/api/auth/register', async (ctx) => {
    requireFields(ctx.body, ['email', 'password', 'name']);
    const email = normalizeEmail(ctx.body.email);
    validatePassword(ctx.body.password);
    const name = ctx.body.name.trim().slice(0, 40);
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) throw new HttpError(409, '该邮箱已注册');
    const userId = createUser(db, {
      email,
      password: ctx.body.password,
      name,
      avatar: Array.from(name)[0] || '友',
      intro: ctx.body.intro || '刚刚加入 AI+X 小院的新伙伴',
      tags: ['新伙伴']
    });
    notify(userId, '欢迎来到 AI+X 小院', '资料可以在“我的小窝”继续完善。', '🌸');
    const user = getUserById(db, userId);
    return { ...createSession(db, userId), user: publicUser(user), bootstrap: bootstrap(db, user) };
  });

  route('POST', '/api/auth/login', async (ctx) => {
    requireFields(ctx.body, ['email', 'password']);
    const email = normalizeEmail(ctx.body.email);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(ctx.body.password, user.password_salt, user.password_hash)) {
      throw new HttpError(401, '邮箱或密码不正确');
    }
    if (user.status !== 'active') throw new HttpError(403, '账号已被停用');
    return { ...createSession(db, user.id), user: publicUser(user), bootstrap: bootstrap(db, user) };
  });

  route('POST', '/api/auth/logout', async (ctx) => {
    const header = ctx.req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    return { ok: true };
  });

  route('GET', '/api/bootstrap', async (ctx) => bootstrap(db, authenticate(ctx.req)));

  route('GET', '/api/members', async (ctx) => {
    authenticate(ctx.req);
    return { members: listMembers(db) };
  });

  route('PATCH', '/api/profile', async (ctx) => {
    const user = authenticate(ctx.req);
    const body = ctx.body;
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 40) : user.name;
    db.prepare(`
      UPDATE users SET name = ?, avatar = ?, intro = ?, interests = ?, can_help = ?, want_learn = ?,
        motto = ?, hobby = ?, public_contact = ?, notifications_enabled = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      Array.from(name)[0] || user.avatar,
      String(body.intro ?? user.intro).trim().slice(0, 500),
      String(body.interests ?? user.interests).trim().slice(0, 200),
      String(body.canHelp ?? user.can_help).trim().slice(0, 200),
      String(body.wantLearn ?? user.want_learn).trim().slice(0, 200),
      String(body.motto ?? user.motto).trim().slice(0, 160),
      String(body.hobby ?? user.hobby).trim().slice(0, 160),
      body.publicContact === undefined ? user.public_contact : (body.publicContact ? 1 : 0),
      body.notificationsEnabled === undefined ? user.notifications_enabled : (body.notificationsEnabled ? 1 : 0),
      now(),
      user.id
    );
    return bootstrap(db, getUserById(db, user.id));
  });

  route('GET', '/api/posts', async (ctx) => ({ posts: listPosts(db, authenticate(ctx.req).id) }));

  route('POST', '/api/posts', async (ctx) => {
    const user = authenticate(ctx.req);
    requireFields(ctx.body, ['content']);
    const type = ['moments', 'chat', 'checkin'].includes(ctx.body.type) ? ctx.body.type : 'moments';
    const topic = String(ctx.body.topic || 'all').slice(0, 40);
    db.prepare('INSERT INTO posts (type, topic, content, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(type, topic, ctx.body.content.trim().slice(0, 2000), user.id, now(), now());
    return { posts: listPosts(db, user.id) };
  });

  route('POST', '/api/posts/:id/like', async (ctx) => {
    const user = authenticate(ctx.req);
    const postId = Number(ctx.params.id);
    const exists = db.prepare('SELECT post_id FROM post_likes WHERE post_id = ? AND user_id = ?').get(postId, user.id);
    if (exists) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, user.id);
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)').run(postId, user.id, now());
      const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(postId);
      if (post && post.author_id !== user.id) notify(post.author_id, `${user.name} 喜欢了你的分享`, '去暖心时刻看看互动吧。', '💕');
    }
    return { posts: listPosts(db, user.id) };
  });

  route('POST', '/api/posts/:id/comments', async (ctx) => {
    const user = authenticate(ctx.req);
    requireFields(ctx.body, ['content']);
    const postId = Number(ctx.params.id);
    db.prepare('INSERT INTO comments (post_id, author_id, content, created_at) VALUES (?, ?, ?, ?)')
      .run(postId, user.id, ctx.body.content.trim().slice(0, 1000), now());
    const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(postId);
    if (post && post.author_id !== user.id) notify(post.author_id, `${user.name} 留言了你的分享`, ctx.body.content.trim().slice(0, 80), '💬');
    return { posts: listPosts(db, user.id) };
  });

  route('GET', '/api/resources', async (ctx) => ({ resources: listResources(db, false, authenticate(ctx.req).id) }));

  route('POST', '/api/resources', async (ctx) => {
    const user = authenticate(ctx.req);
    requireFields(ctx.body, ['title']);
    const category = ['入门', '进阶', '工具', '感悟'].includes(ctx.body.category) ? ctx.body.category : '入门';
    db.prepare('INSERT INTO resources (title, description, category, type, url, uploader_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(ctx.body.title.trim().slice(0, 120), String(ctx.body.desc || '').trim().slice(0, 500), category, String(ctx.body.type || '文档').slice(0, 40), String(ctx.body.url || '').slice(0, 500), user.id, now(), now());
    return { resources: listResources(db) };
  });

  route('GET', '/api/activities', async (ctx) => {
    authenticate(ctx.req);
    return { activities: listActivities(db) };
  });

  route('POST', '/api/activities/:id/join', async (ctx) => {
    const user = authenticate(ctx.req);
    db.prepare('INSERT OR IGNORE INTO activity_attendees (activity_id, user_id, created_at) VALUES (?, ?, ?)')
      .run(Number(ctx.params.id), user.id, now());
    return { activities: listActivities(db) };
  });

  route('GET', '/api/wishes', async (ctx) => {
    authenticate(ctx.req);
    return { wishes: listWishes(db) };
  });

  route('POST', '/api/wishes', async (ctx) => {
    const user = authenticate(ctx.req);
    requireFields(ctx.body, ['content']);
    const type = ctx.body.type === 'secret' ? 'secret' : 'wish';
    db.prepare('INSERT INTO wishes (type, content, author_id, anonymous, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(type, ctx.body.content.trim().slice(0, 1200), user.id, ctx.body.anonymous ? 1 : 0, now());
    return { wishes: listWishes(db) };
  });

  route('POST', '/api/wishes/:id/echo', async (ctx) => {
    const user = authenticate(ctx.req);
    db.prepare('INSERT OR IGNORE INTO wish_echoes (wish_id, user_id, created_at) VALUES (?, ?, ?)')
      .run(Number(ctx.params.id), user.id, now());
    return { wishes: listWishes(db) };
  });

  route('GET', '/api/checkins', async (ctx) => {
    const user = authenticate(ctx.req);
    return { checkins: listCheckins(db, user.id) };
  });

  route('POST', '/api/checkins', async (ctx) => {
    const user = authenticate(ctx.req);
    requireFields(ctx.body, ['content']);
    const content = ctx.body.content.trim().slice(0, 1200);
    db.prepare('INSERT INTO checkins (content, author_id, created_at) VALUES (?, ?, ?)').run(content, user.id, now());
    db.prepare('INSERT INTO posts (type, topic, content, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run('checkin', '成长打卡', content, user.id, now(), now());
    return { checkins: listCheckins(db, user.id), posts: listPosts(db, user.id) };
  });

  route('GET', '/api/notifications', async (ctx) => {
    const user = authenticate(ctx.req);
    return { notifications: listNotifications(db, user.id) };
  });

  route('PATCH', '/api/notifications/:id/read', async (ctx) => {
    const user = authenticate(ctx.req);
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(Number(ctx.params.id), user.id);
    return { notifications: listNotifications(db, user.id) };
  });

  route('GET', '/api/chats', async (ctx) => {
    const user = authenticate(ctx.req);
    ensureAllHandsConversation(db, user.id);
    const conversations = listConversations(db, user.id);
    const activeConversationId = getAllHandsConversationId(db) || conversations[0]?.id || null;
    return {
      conversations,
      activeConversationId,
      messages: activeConversationId ? listMessages(db, activeConversationId, user.id) : []
    };
  });

  route('GET', '/api/chats/:id/messages', async (ctx) => {
    const user = authenticate(ctx.req);
    const conversationId = Number(ctx.params.id);
    const timestamp = now();
    db.prepare('UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?')
      .run(timestamp, conversationId, user.id);
    return {
      conversationId,
      messages: listMessages(db, conversationId, user.id),
      conversations: listConversations(db, user.id)
    };
  });

  route('POST', '/api/chats/:id/messages', async (ctx) => {
    const user = authenticate(ctx.req);
    requireFields(ctx.body, ['content']);
    const conversationId = Number(ctx.params.id);
    assertConversationAccess(db, conversationId, user.id);
    const content = ctx.body.content.trim().slice(0, 2000);
    db.prepare('INSERT INTO messages (conversation_id, author_id, content, created_at) VALUES (?, ?, ?, ?)')
      .run(conversationId, user.id, content, now());
    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now(), conversationId);
    const conversation = db.prepare('SELECT type, title FROM conversations WHERE id = ?').get(conversationId);
    if (conversation?.type === 'direct') {
      db.prepare('SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != ?')
        .all(conversationId, user.id)
        .forEach((participant) => notify(participant.user_id, `${user.name} 发来私聊`, content.slice(0, 80), '💬'));
    }
    return {
      conversationId,
      messages: listMessages(db, conversationId, user.id),
      conversations: listConversations(db, user.id)
    };
  });

  route('POST', '/api/chats/direct', async (ctx) => {
    const user = authenticate(ctx.req);
    const targetId = Number(ctx.body.userId);
    if (!targetId || targetId === user.id) throw new HttpError(400, '私聊对象不正确');
    const target = db.prepare("SELECT * FROM users WHERE id = ? AND status = 'active' AND role != 'admin'").get(targetId);
    if (!target) throw new HttpError(404, '私聊对象不存在');
    const existing = db.prepare(`
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants a ON a.conversation_id = c.id AND a.user_id = ?
      JOIN conversation_participants b ON b.conversation_id = c.id AND b.user_id = ?
      WHERE c.type = 'direct'
      LIMIT 1
    `).get(user.id, targetId);
    let conversationId = existing?.id;
    if (!conversationId) {
      const result = db.prepare('INSERT INTO conversations (type, title, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run('direct', `${user.name}、${target.name}`, user.id, now(), now());
      conversationId = Number(result.lastInsertRowid);
      const join = db.prepare('INSERT INTO conversation_participants (conversation_id, user_id, created_at) VALUES (?, ?, ?)');
      join.run(conversationId, user.id, now());
      join.run(conversationId, targetId, now());
      db.prepare('INSERT INTO messages (conversation_id, author_id, content, created_at) VALUES (?, ?, ?, ?)')
        .run(conversationId, user.id, '你好，很高兴认识你。', now());
    }
    return {
      conversationId,
      conversations: listConversations(db, user.id),
      messages: listMessages(db, conversationId, user.id)
    };
  });

  route('GET', '/api/admin/data', async (ctx) => {
    requireAdmin(ctx.req);
    const users = listMembers(db, true);
    const posts = listPosts(db, 0, true);
    const resources = listResources(db, true);
    const wishes = listWishes(db, true);
    const checkins = listCheckins(db, 0, true);
    const notifications = listNotifications(db, 0, true);
    const activities = listActivities(db);
    const conversations = listConversations(db, 0, true);
    return {
      summary: {
        users: users.length,
        posts: posts.length,
        resources: resources.length,
        activities: activities.length,
        wishes: wishes.length,
        checkins: checkins.length,
        notifications: notifications.length,
        conversations: conversations.length
      },
      users,
      posts,
      resources,
      activities,
      wishes,
      checkins,
      notifications,
      conversations
    };
  });

  route('PATCH', '/api/admin/users/:id', async (ctx) => {
    const admin = requireAdmin(ctx.req);
    const id = Number(ctx.params.id);
    if (id === admin.id && ctx.body.status && ctx.body.status !== 'active') throw new HttpError(400, '不能停用当前管理员');
    const role = ['user', 'admin'].includes(ctx.body.role) ? ctx.body.role : undefined;
    const status = ['active', 'disabled'].includes(ctx.body.status) ? ctx.body.status : undefined;
    if (!role && !status) throw new HttpError(400, '没有可更新字段');
    if (role) db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now(), id);
    if (status) db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), id);
    return { ok: true };
  });

  route('PATCH', '/api/admin/:entity/:id', async (ctx) => {
    requireAdmin(ctx.req);
    const entity = ctx.params.entity;
    const id = Number(ctx.params.id);
    const allowed = {
      posts: ['posts', { status: 'status', content: 'content', topic: 'topic' }],
      resources: ['resources', { status: 'status', title: 'title', desc: 'description', category: 'category', type: 'type', url: 'url' }],
      activities: ['activities', { status: 'status', title: 'title', desc: 'description', time: 'time', type: 'type' }],
      wishes: ['wishes', { status: 'status', content: 'content' }],
      checkins: ['checkins', { status: 'status', content: 'content' }],
      notifications: ['notifications', { read: 'read', title: 'title', content: 'content' }],
      conversations: ['conversations', { status: 'status', title: 'title' }],
      messages: ['messages', { status: 'status', content: 'content' }]
    }[entity];
    if (!allowed) throw new HttpError(404, '未知管理对象');
    updateAllowed(allowed[0], id, ctx.body, allowed[1]);
    return { ok: true };
  });

  route('DELETE', '/api/admin/:entity/:id', async (ctx) => {
    const admin = requireAdmin(ctx.req);
    const entity = ctx.params.entity;
    const id = Number(ctx.params.id);
    const map = {
      users: 'users',
      posts: 'posts',
      resources: 'resources',
      activities: 'activities',
      wishes: 'wishes',
      checkins: 'checkins',
      notifications: 'notifications',
      comments: 'comments',
      conversations: 'conversations',
      messages: 'messages'
    };
    const table = map[entity];
    if (!table) throw new HttpError(404, '未知管理对象');
    if (table === 'users' && id === admin.id) throw new HttpError(400, '不能删除当前管理员');
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return { ok: true };
  });

  async function serveStatic(req, res) {
    const requestUrl = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === '/') pathname = '/index.html';
    const allowedRoot = pathname === '/index.html' || pathname === '/admin.html' || pathname.startsWith('/scripts/') || pathname.startsWith('/styles/') || pathname.startsWith('/assets/');
    const filePath = path.resolve(PUBLIC_ROOT, `.${pathname}`);
    if (!allowedRoot || !filePath.startsWith(PUBLIC_ROOT)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    try {
      const stat = await fsp.stat(filePath);
      if (!stat.isFile()) throw new Error('not file');
      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  }

  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, 'http://localhost');
    const started = Date.now();
    try {
      if (!requestUrl.pathname.startsWith('/api/')) {
        await serveStatic(req, res);
        return;
      }

      const matched = routes.find((candidate) => candidate.method === req.method && candidate.regex.test(requestUrl.pathname));
      if (!matched) throw new HttpError(404, '接口不存在');
      const match = requestUrl.pathname.match(matched.regex);
      const params = Object.fromEntries(matched.names.map((name, index) => [name, match[index + 1]]));
      const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await parseBody(req) : {};
      const payload = await matched.handler({ req, res, params, query: requestUrl.searchParams, body });
      send(res, 200, payload);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (status >= 500) console.error(error);
      send(res, status, { error: error.message || '服务器错误', details: error.details });
    } finally {
      if (process.env.NODE_ENV === 'development' && requestUrl.pathname.startsWith('/api/')) {
        console.log(`${req.method} ${requestUrl.pathname} ${Date.now() - started}ms`);
      }
    }
  });

  server.closeDatabase = () => db.close();
  server.close = ((originalClose) => function close(callback) {
    return originalClose.call(this, callback);
  })(server.close);
  server.db = db;
  return {
    listen: (...args) => server.listen(...args),
    close: () => db.close(),
    server,
    db
  };
}

module.exports = { createApp, createDatabase, hashPassword, verifyPassword };
