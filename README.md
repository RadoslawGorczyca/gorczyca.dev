# gorczyca.dev

Personal site of Radosław Gorczyca, Senior Android Developer. Static HTML, deployed on Cloudflare.

- `/` – CV and portfolio (`public/index.html`)
- `/plotbond/` – Plotbond waitlist landing and survey (`public/plotbond/index.html`); old `/tablescribe/` links redirect here

Deployed as a Cloudflare Worker with static assets (`wrangler.jsonc` serves `public/`). No build step: the build command is empty and the deploy command is `npx wrangler deploy`. Every push to `main` deploys.
