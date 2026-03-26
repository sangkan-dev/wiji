# ꦱꦁꦏꦤ꧀ Sangkan — SvelteKit starter

Official-ish **[Sangkan](https://sangkan.dev)** scaffold: **Ancient Cybernetics** tokens (palette, typography, global noise) so new apps share the same visual DNA as the foundry, while leaving layout and features to each project.

Ecosystem: [github.com/sangkan-dev](https://github.com/sangkan-dev).

## Stack

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`, with `@tailwindcss/forms` and `@tailwindcss/typography`
- Design tokens and base layer live in [`src/app.css`](src/app.css)

## Design system (summary)

**Colors (Tailwind)**

| Token                  | Hex                   | Role              |
| ---------------------- | --------------------- | ----------------- |
| `andesite`             | `#0d0d0d`             | void / background |
| `andesite-light`       | `#1a1a1a`             | surfaces          |
| `gold` / `gold-bright` | `#cba153` / `#e4be6a` | artifact / accent |
| `rust`                 | `#dd6b20`             | signal / emphasis |
| `ash` / `smoke`        | `#a0a0a0` / `#666666` | secondary text    |

Body copy uses base **`#e0e0e0`** (see `body` in `app.css`). A fixed **SVG noise** overlay at **0.035** opacity matches the landing.

**Fonts (self-hosted, SIL OFL)**

Files under `static/fonts/`:

- **Plus Jakarta Sans** — `font-heading` / utility `font-heading`
- **JetBrains Mono** — body in `app.css`, utility `font-mono`
- **Noto Sans Javanese** — cultural / localization; with `html lang="jv"`, `app.css` applies Javanese-friendly line-height

Licenses: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), [Noto Sans Javanese](https://fonts.google.com/noto/specimen/Noto+Sans+Javanese) — all **OFL**.

**Re-fetch fonts**

```bash
chmod +x scripts/fetch-fonts.sh
npm run fonts:fetch
```

## Optional Sangkan layers (not enabled by default)

| Layer                       | Notes                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI sonics**               | [`src/lib/sangkan/audio.ts`](src/lib/sangkan/audio.ts) — see [`src/lib/sangkan/README.md`](src/lib/sangkan/README.md)                                                                 |
| **CRT / Threlte / Three**   | Add deps when needed (`three`, `@threlte/core`, …); keep the starter light                                                                                                            |
| **GSAP “cipher” scrambles** | Landing uses **Club GreenSock** plugins (`ScrambleText`, etc.). Public OSS projects should use **gsap** core / open patterns or own effects—do not ship paid plugins in this template |
| **i18n**                    | Follow your preferred solution (e.g. Paraglide on [sangkan](https://github.com/sangkan-dev) landing)                                                                                  |

## Deployment adapter

This repo uses **`@sveltejs/adapter-auto`**. For **Cloudflare Pages**, **static**, or **Node**, switch adapter in [`svelte.config.js`](svelte.config.js) per [SvelteKit adapters](https://svelte.dev/docs/kit/adapters).

## GitHub Template

After pushing this folder to a repo, enable **Settings → Template repository** so new projects can use _Use this template_.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run check    # svelte-check + sync
npm run lint     # prettier + eslint
npm run fonts:fetch  # re-download woff2 files
```

## License

MIT for this starter’s config and demo code. Fonts remain under their respective OFL licenses.
