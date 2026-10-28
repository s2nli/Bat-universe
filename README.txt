BAT UNIVERSE - local copy (works without Lovable Cloud)

HOSTING
- Upload the whole folder to any static host (Cloudflare Pages, Netlify, Vercel).
- It needs "SPA fallback": every unknown path must serve index.html
  (Netlify: _redirects has it; Vercel: vercel.json has it; Cloudflare Pages does it by default).

DATA
- All data comes from api_dump/*.json (app_catalog, site_branding, slider_photos, social_links).
- To add/change apps, edit api_dump/app_catalog.json (id, name, logo_url, app_url..app_url_4, sort_order, is_active).
- /admin and /owner pages load but cannot save (read-only copy).

TOKEN GATE
- Off by default. In local-backend.js set TOKEN_ENABLED = true to show the gate again,
  but verifying a token needs the original backend, so it will not pass.
