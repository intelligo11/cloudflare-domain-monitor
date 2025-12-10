# 📘 Domain Expiry Monitor for Cloudflare
**多域名到期监控与提醒系统（基于 Cloudflare Workers + D1 + Pages）**

A lightweight, reliable domain expiry monitoring system designed to track multiple domains — including free second-level domains such as .eu.org, netlib.net, and others.  
Supports manual + automatic WHOIS scanning with flexible notifications (Telegram / Email / Webhook).

一个基于 Cloudflare 全家桶的域名到期监控系统，可监控普通域名和免费二级域名，支持手动录入 + 自动扫描，支持多种提醒方式。

## ✨ Features 功能特点

### 🟦 Core Features 核心功能
- **Track expiry time for any domain or free 2nd-level domain**  
  支持监控任意顶级域名 / 免费二级域名
- **Automatic WHOIS detection**  
  自动 WHOIS 扫描
- **Manual expiry override for non-standard domains (.eu.org 等)**  
  可手动设置特殊域名的到期时间
- **Domain grouping, tagging and notes**  
  支持分组、标签、备注
- **Local WHOIS cache (D1) to reduce load**  
  D1 缓存减少重复查询
- **Modern Web UI (React + Tailwind)**  
  现代化 Web UI（React + Tailwind）

### 🟩 Notifications 推送方式
- Telegram Bot
- Email (via MailChannels 或外部 SMTP)
- Custom Webhook（自定义回调）

### 🟧 Cloudflare Native Support
- **Cloudflare Workers** 作为 API
- **D1** 作为数据库
- **Pages** 承载前端
- **GitHub Actions** 自动扫描 + 自动部署

## 📁 Project Structure 项目结构

```text
/
├── wrangler.toml
├── worker_index.ts
├── package_json_root.json
│
├── web/
│   ├── web_app_tsx.ts
│   ├── web_dashboard.ts
│   ├── web_logs.ts
│   ├── web_settings.ts
│   ├── web_package_json.json
│
└── .github/
    └── workflows/
        └── scan.yml (每日自动 WHOIS 扫描)
