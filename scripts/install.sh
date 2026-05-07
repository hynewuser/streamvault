#!/usr/bin/env bash
set -euo pipefail
echo "📦 Installing StreamVault dependencies..."
npm install --workspaces --include-workspace-root
echo "🛠️  Generating Prisma client..."
npm --workspace backend run prisma:generate
echo "🗄️  Running migrations..."
npm --workspace backend run prisma:deploy
echo "✅ Done. Run: npm run dev"
