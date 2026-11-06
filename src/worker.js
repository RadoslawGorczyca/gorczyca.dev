// gorczyca.dev Worker: serves the static site from ./public and stores
// Tablescribe waitlist signups in D1 (POST /api/waitlist).

const ALLOWED_ORIGINS = ["https://gorczyca.dev", "https://www.gorczyca.dev"];
const LIMITS = { email: 254, role: 20, systems: 200, scribe: 100, notes_tool: 100, top_feature: 50, price: 10, pain: 2000, source: 50, lang: 5 };

const SCHEMA = `CREATE TABLE IF NOT EXISTS signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  role TEXT, systems TEXT, scribe TEXT, notes_tool TEXT,
  top_feature TEXT, price TEXT, pain TEXT, source TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

let langColumnReady = false;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function handleWaitlist(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: "Forbidden" }, 403);

  if ((request.headers.get("Content-Type") || "").split(";")[0].trim() !== "application/json") {
    return json({ error: "Expected JSON" }, 415);
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > 10000) return json({ error: "Payload too large" }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const data = {};
  for (const [key, max] of Object.entries(LIMITS)) data[key] = clean(body[key], max);
  data.email = data.email.toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return json({ error: "Invalid email" }, 400);
  if (!["gm", "player", "both"].includes(data.role)) return json({ error: "Invalid role" }, 400);

  await env.DB.prepare(SCHEMA).run();
  if (!langColumnReady) {
    try { await env.DB.prepare("ALTER TABLE signups ADD COLUMN lang TEXT").run(); } catch (e) { /* column already exists */ }
    langColumnReady = true;
  }
  await env.DB.prepare(
    `INSERT INTO signups (email, role, systems, scribe, notes_tool, top_feature, price, pain, source, country, lang)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
     ON CONFLICT(email) DO UPDATE SET
       role = excluded.role, systems = excluded.systems, scribe = excluded.scribe,
       notes_tool = excluded.notes_tool, top_feature = excluded.top_feature, price = excluded.price,
       pain = excluded.pain, source = excluded.source, country = excluded.country, lang = excluded.lang,
       updated_at = datetime('now')`
  ).bind(
    data.email, data.role, data.systems, data.scribe, data.notes_tool,
    data.top_feature, data.price, data.pain, data.source || "direct",
    (request.cf && request.cf.country) || "",
    data.lang || "en"
  ).run();

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/waitlist") {
      try {
        return await handleWaitlist(request, env);
      } catch (e) {
        console.error("waitlist error", e);
        return json({ error: "Server error" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
