// Devuelve el usuario de Instagram de un contacto de ManyChat,
// para que la persona solo tenga que confirmar "Sí, soy yo" en el quiz.
// Usa las mismas claves que ya usa /api/lead. Solo devuelve el usuario (dato público),
// nunca nombre, correo ni teléfono.

const ACCOUNTS = [
  { account: "sara", pid: "3909136", env: "MANYCHAT_API_KEY" },
  { account: "juan", pid: "3908852", env: "MANYCHAT_API_KEY_JUAN" }
];

async function getSubscriber(apiKey, subscriberId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(
      `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${encodeURIComponent(subscriberId)}`,
      {
        headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
        signal: controller.signal
      }
    );
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return data && data.status === "success" ? data.data || null : null;
  } finally {
    clearTimeout(timer);
  }
}

function cleanUsername(value) {
  const u = String(value || "").trim().replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(u) ? u : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  const subscriberId = String(req.query?.mc_id || "").trim();
  const pid = String(req.query?.pid || "").trim();

  if (!/^\d{1,30}$/.test(subscriberId)) {
    return res.status(200).json({ ok: true, username: null });
  }

  const keys = ACCOUNTS
    .map(item => ({ ...item, key: (process.env[item.env] || "").trim() }))
    .filter(item => item.key);
  const ordered = pid
    ? [...keys.filter(k => k.pid === pid), ...keys.filter(k => k.pid !== pid)]
    : keys;

  for (const item of ordered) {
    try {
      const subscriber = await getSubscriber(item.key, subscriberId);
      const username = cleanUsername(
        subscriber?.ig_username || subscriber?.instagram_username || subscriber?.username
      );
      if (username) return res.status(200).json({ ok: true, username });
    } catch (error) {
      console.warn(`ig-lookup failed account=${item.account}: ${error.message}`);
    }
  }

  return res.status(200).json({ ok: true, username: null });
}
