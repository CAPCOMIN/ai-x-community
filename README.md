# AI+X 小院

一个完整的 Node + SQLite 社群应用，包含用户注册登录、内容互动、资源、活动、打卡、心愿、通知和管理员后台。

## 运行

```bash
pnpm start
```

默认地址：`http://127.0.0.1:3000`

独立管理员界面：`http://127.0.0.1:3000/admin.html`

首次启动会创建 `data/community.sqlite` 并写入演示数据。默认管理员：

管理员账号通过 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 环境变量配置。开发环境如果未设置环境变量，会使用内置默认值。

普通测试用户：

开发环境会自动创建两个普通测试用户，密码见后端种子配置或由测试环境统一设置。

上线前请用环境变量覆盖 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`，并妥善持久化 `data/community.sqlite`。

## 测试

```bash
pnpm test
```

测试覆盖健康检查、注册登录、用户内容流、管理员鉴权和账号管理。

## 部署要点

- 需要 Node.js 24 或更高版本，使用内置 `node:sqlite`。
- 服务提供 `/api/health`，可用于负载均衡和进程健康检查。
- SQLite 已启用 WAL、外键和 busy timeout，适合单实例公开上线；如果未来进入高并发写入场景，建议迁移到 PostgreSQL。
- 生产环境建议通过反向代理启用 HTTPS，并设置强管理员密码。
