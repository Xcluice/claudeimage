# claudeimage-mcp

Free image generation MCP server. Proxies to a Cloudflare Workers AI image
worker (https://github.com/dotusmanali/Cloudflare-Image-Worker) and exposes
it as a single MCP tool: `generate_image`.

## Setup

1. Deploy the Cloudflare Worker (see the repo above) and note its URL and
   the `API_KEY` secret you set on it.
2. In this Vercel project's Environment Variables, set:
   - `CF_WORKER_URL` — e.g. `https://xcluice-image-ai.your-subdomain.workers.dev`
   - `CF_WORKER_API_KEY` — the API_KEY you set on the worker
   - `MCP_SECRET` — any random string; this becomes part of your MCP URL
     for auth (e.g. `openssl rand -hex 24`)
3. Deploy. Your MCP endpoint will be:
   `https://<your-vercel-domain>/<MCP_SECRET>/mcp`
4. In Claude, add a custom connector pointing at that URL.

## Local dev

```
npm install
npm run dev
```
