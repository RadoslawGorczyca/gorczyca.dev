# gorczyca.dev

Personal site of Radosław Gorczyca, Senior Android Developer. Static HTML, deployed on Cloudflare.

- `/` – CV and portfolio (`public/index.html`)
- `/tablescribe/` – Tablescribe waitlist landing and survey (`public/tablescribe/index.html`)

Deployed as a Cloudflare Worker with static assets (`wrangler.jsonc` serves `public/`). No build step: the build command is empty and the deploy command is `npx wrangler deploy`. Every push to `main` deploys.
