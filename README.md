# 🌌 StreamVault

> Real-time YouTube livestream chat intelligence & archival platform.
> No API keys. No quotas. No limits.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-20.x-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)

## ✨ Features

- 📡 **Capture** every YouTube livechat message in real time using unofficial Innertube methods
- 🔁 **Multi-stream** — track unlimited livestreams concurrently
- 💾 **Permanent storage** — every message persisted with full metadata
- 📦 **Auto-archive** — JSONL/CSV/ZIP exports every 6 hours
- 🔔 **ntfy alerts** — instant push when tracked channels chat
- 🔍 **Powerful search** — by author, channel, keyword, time range
- 📊 **Live dashboard** — beautiful Next.js UI with realtime feed
- 🐳 **One-command deploy** — Docker Compose, Railway, Fly.io, Render
- 🛡️ **Production hardened** — Helmet, CORS, rate-limiting, graceful shutdown
- 🤖 **Smart features** — spam detection, top chatters, velocity charts, keyword alerts

## 🚀 Quick Start (Docker — recommended)

```bash
git clone https://github.com/yourname/streamvault.git
cd streamvault
cp .env.example .env
docker compose up -d
