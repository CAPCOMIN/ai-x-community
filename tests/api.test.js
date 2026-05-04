'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('../server/app');

async function withServer(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aix-community-'));
  const app = createApp({ dbPath: path.join(dir, 'test.sqlite') });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn({ baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    app.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function api(baseUrl, pathName, options = {}) {
  const response = await fetch(baseUrl + pathName, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

test('health check and static shell are available', async () => {
  await withServer(async ({ baseUrl }) => {
    const health = await api(baseUrl, '/api/health');
    assert.equal(health.response.status, 200);
    assert.equal(health.data.ok, true);

    const shell = await fetch(baseUrl + '/');
    assert.equal(shell.status, 200);
    assert.match(await shell.text(), /AI\+X 小院/);

    const adminShell = await fetch(baseUrl + '/admin.html');
    assert.equal(adminShell.status, 200);
    assert.match(await adminShell.text(), /AI\+X 小院管理台/);
  });
});

test('register, login, bootstrap and profile update work', async () => {
  await withServer(async ({ baseUrl }) => {
    const registered = await api(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: { email: 'new@example.com', password: 'Passw0rd!', name: '新伙伴' }
    });
    assert.equal(registered.response.status, 200);
    assert.equal(registered.data.user.name, '新伙伴');
    assert.ok(registered.data.token);
    assert.equal(registered.data.bootstrap.members.length, 3);
    assert.ok(registered.data.bootstrap.conversations.some((item) => item.title === '全员群'));

    const login = await api(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'new@example.com', password: 'Passw0rd!' }
    });
    assert.equal(login.response.status, 200);
    assert.ok(login.data.bootstrap.members.every((member) => member.role !== 'admin'));

    const profile = await api(baseUrl, '/api/profile', {
      method: 'PATCH',
      token: login.data.token,
      body: { name: '新名字', intro: '新的简介', publicContact: false }
    });
    assert.equal(profile.response.status, 200);
    assert.equal(profile.data.currentUser.name, '新名字');
    assert.equal(profile.data.currentUser.publicContact, false);
  });
});

test('authenticated community workflows persist through the API', async () => {
  await withServer(async ({ baseUrl }) => {
    const login = await api(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'test1@aix.local', password: 'User123456!' }
    });
    const token = login.data.token;

    const post = await api(baseUrl, '/api/posts', {
      method: 'POST',
      token,
      body: { type: 'moments', topic: '小确幸', content: '今天完成了第一个 API 测试' }
    });
    assert.equal(post.response.status, 200);
    const postId = post.data.posts[0].id;
    assert.equal(post.data.posts[0].content, '今天完成了第一个 API 测试');

    const liked = await api(baseUrl, `/api/posts/${postId}/like`, { method: 'POST', token });
    assert.equal(liked.data.posts[0].likes, 1);

    const commented = await api(baseUrl, `/api/posts/${postId}/comments`, {
      method: 'POST',
      token,
      body: { content: '继续完善' }
    });
    assert.equal(commented.data.posts[0].comments.length, 1);

    const resource = await api(baseUrl, '/api/resources', {
      method: 'POST',
      token,
      body: { title: '测试资源', desc: '资源说明', category: '工具', url: 'https://example.com' }
    });
    assert.equal(resource.data.resources[0].title, '测试资源');

    const wish = await api(baseUrl, '/api/wishes', {
      method: 'POST',
      token,
      body: { type: 'wish', content: '希望上线稳定', anonymous: true }
    });
    assert.equal(wish.data.wishes[0].anonymous, true);

    const checkin = await api(baseUrl, '/api/checkins', {
      method: 'POST',
      token,
      body: { content: '今天学习了鉴权测试' }
    });
    assert.equal(checkin.data.checkins[0].content, '今天学习了鉴权测试');
    assert.ok(checkin.data.posts.some((item) => item.type === 'checkin'));
  });
});

test('group chat and direct chat work', async () => {
  await withServer(async ({ baseUrl }) => {
    const first = await api(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'test1@aix.local', password: 'User123456!' }
    });
    const second = await api(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'test2@aix.local', password: 'User123456!' }
    });

    const chats = await api(baseUrl, '/api/chats', { token: first.data.token });
    assert.equal(chats.response.status, 200);
    const allHands = chats.data.conversations.find((item) => item.title === '全员群');
    assert.ok(allHands);

    const sent = await api(baseUrl, `/api/chats/${allHands.id}/messages`, {
      method: 'POST',
      token: first.data.token,
      body: { content: '全员群测试消息' }
    });
    assert.ok(sent.data.messages.some((item) => item.content === '全员群测试消息'));

    const direct = await api(baseUrl, '/api/chats/direct', {
      method: 'POST',
      token: first.data.token,
      body: { userId: second.data.user.id }
    });
    assert.equal(direct.response.status, 200);
    assert.ok(direct.data.conversations.some((item) => item.type === 'direct'));
  });
});

test('admin routes require admin role and can manage records', async () => {
  await withServer(async ({ baseUrl }) => {
    const userLogin = await api(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'test1@aix.local', password: 'User123456!' }
    });
    const denied = await api(baseUrl, '/api/admin/data', { token: userLogin.data.token });
    assert.equal(denied.response.status, 403);

    const adminLogin = await api(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@aix.local', password: 'Admin123456!' }
    });
    const adminToken = adminLogin.data.token;
    const data = await api(baseUrl, '/api/admin/data', { token: adminToken });
    assert.equal(data.response.status, 200);
    assert.equal(data.data.summary.users, 3);
    assert.ok(data.data.summary.conversations >= 1);

    const target = data.data.users.find((user) => user.email === 'test1@aix.local');
    const disabled = await api(baseUrl, `/api/admin/users/${target.id}`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'disabled' }
    });
    assert.equal(disabled.response.status, 200);

    const rejected = await api(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: 'test1@aix.local', password: 'User123456!' }
    });
    assert.equal(rejected.response.status, 403);
  });
});

test('unauthenticated API access is rejected', async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await api(baseUrl, '/api/bootstrap');
    assert.equal(response.response.status, 401);
  });
});
