🌐 Cloudflare Domain Monitor
Cloudflare 域名到期监控系统（中英文 README）

A modern domain expiration monitoring system powered by Cloudflare Workers + D1 + Cron Triggers, supporting both top-level and free second-level domains.

一个基于 Cloudflare Workers + D1 + Cron 定时任务 的现代化域名到期监控系统，同时支持一级域名和免费二级域名。

📌 Overview / 项目简介

English
Cloudflare Domain Monitor helps you automatically track the expiration dates of multiple domains. It supports WHOIS auto-detection, manual mode, D1 storage, Telegram and email/webhook notification, and includes a fully responsive dashboard built with React.

中文
Cloudflare Domain Monitor 可自动监控多个域名的到期时间，支持 WHOIS 自动查询、手动录入、D1 数据库存储、Telegram/邮件/Webhook 推送，并提供一个完全响应式的 React 管理后台。

🚀 Features / 功能特性
🔍 Domain Monitoring / 域名监控

English: Auto WHOIS for top-level domains

中文：一级域名自动 WHOIS 查询

English: Manual mode for free second-level domains (eu.org, netlib.net, etc.)

中文：支持 eu.org/netlib.net 等免费二级域名的手动模式

Mixed automatic + manual support / 自动+手动混合模式

💾 Cloudflare D1 Storage / D1 数据库存储

Structured SQL

Reliable and persistent

No KV binding issue

📊 Web Dashboard / 可视化控制台

Built with React + TypeScript:

Domain list

Expiration indicators

Grouped views

Settings page

Logs viewer

Fully responsive (mobile friendly)

📬 Multi-channel Notifications / 多渠道推送

Telegram Bot

Email (MailChannels / SMTP)

Bark

Webhook (Discord / 企业微信 / Server酱等)

🕒 Automated Cron Checks / 自动 Cron 检查

Daily expiration scan with warnings.

每日自动扫描，发现即将到期的域名会发送提醒。

📁 Project Structure / 项目结构
/
├── worker_index.ts           # Cloudflare Worker 后端逻辑
├── wrangler.toml             # Worker + D1 配置
├── package_json_root.json    # Worker 依赖
│
├── web/
│   ├── web_app_tsx.ts        # 前端入口
│   ├── web_dashboard.ts      # 控制台页面
│   ├── web_settings.ts       # 设置页面
│   ├── web_logs.ts           # 日志页面
│   ├── web_package_json.json # 前端依赖
│
└── README.md

🔧 Deployment / 部署步骤

本项目采用 GitHub Actions 自动部署，避免 Cloudflare Dashboard 覆盖项目参数。

1. Create D1 Database / 创建 D1 数据库

Cloudflare → D1 → Create → Name: domain_monitor

Run schema / 执行 SQL：

CREATE TABLE domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  provider TEXT,
  mode TEXT NOT NULL,       -- auto / manual
  expire_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

2. Configure GitHub Secrets / 配置 GitHub Secrets

进入：

GitHub → Settings → Secrets and variables → Actions

Secret 名称	描述（中文）	Description (English)
CF_API_TOKEN	Worker + D1 权限的 Token	CF API token with Worker/D1 permissions
CF_ACCOUNT_ID	Cloudflare 账户 ID	Cloudflare account ID
CF_D1_NAME	D1 名称	D1 database name
CF_D1_ID	D1 ID	D1 database ID
PASSWORD	前端访问密码	Frontend dashboard password
TGID	Telegram Chat ID	Telegram Chat ID
TGTOKEN	Telegram Bot Token	Telegram Bot Token
WEBHOOK_URL	Webhook 地址	Webhook endpoint
3. Run Deployment / 运行部署
GitHub → Actions → Deploy Worker → Run Workflow


Action 完成后会输出：

Worker URL

前端访问链接

API 端点

4. Optional: Custom Domain / 自定义域名绑定（可选）

Workers → Triggers → Add Route → your-domain.com/*

🎨 UI Preview / 页面预览

(You may place screenshots here)
（你可以在此添加截图）

🔐 Security / 安全建议

English

Use strong password

Restrict API access

Keep GitHub secrets private

Consider Cloudflare Access for Zero Trust protection

中文

使用强密码

限制 API 调用

谨慎管理 GitHub Secrets

可启用 Cloudflare Zero Trust 加固入口

🛠 Tech Stack / 技术栈
Component	技术 (Tech)
Backend	Cloudflare Workers + Hono
Database	Cloudflare D1
Frontend	React + TypeScript
UI Framework	TailwindCSS
Deploy	GitHub Actions
Notifications	Telegram, Email, Webhook
🤝 Contributing / 参与贡献

PRs & Issues are welcome!
欢迎提交 PR 和 Issue！

⭐ Support / 支持项目

If you find this project useful, please give it a Star ⭐!
如果项目对你有帮助，请点个 Star ⭐！

📄 License / 许可证

MIT License — free for personal & commercial use.
MIT 许可证 — 可用于个人和商业项目。
