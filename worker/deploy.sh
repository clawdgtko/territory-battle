#!/bin/bash
# Deploy script for Territory Battle API

cd "$(dirname "$0")"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Login to Cloudflare (opens browser)
echo "Opening browser for Cloudflare login..."
wrangler login

echo ""
echo "After login, run: wrangler deploy"
echo ""
read -p "Press Enter when ready to deploy..."

# Deploy
wrangler deploy

echo ""
echo "Initializing database..."
curl -X POST "https://territory-battle-api.clawdgtko.workers.dev/api/init"

echo ""
echo "✅ Deployment complete!"
