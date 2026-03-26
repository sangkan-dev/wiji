# Deploy to Cloudflare Pages (`wiji.sangkan.dev`)

This site is a **static SvelteKit build** (SSG) using `@sveltejs/adapter-static`.

## 1) Cloudflare Pages project

- **Connect**: GitHub → `sangkan-dev/wiji`
- **Root directory**: `site` (Cloudflare clones the full repo; [`WIJI_SPEC.md`](../WIJI_SPEC.md) must remain one level above `site/` so `/docs/spec` can prerender from it)
- **Build command**: `npm ci && npm run build`
- **Build output directory**: `build`

## 2) Custom domain

In Cloudflare Pages → **Custom domains**:

- Add `wiji.sangkan.dev`
- Follow the DNS instructions Cloudflare provides (typically a CNAME record for `wiji`).

## 3) Local build

```bash
cd site
npm install
npm run build
```

