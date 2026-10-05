const NOTION_DATA_SOURCE_ID = "ccd31324-b6ef-4661-89e7-15c4f8cc0aad";

async function notionQueryByEmail(email, token) {
  const url = `https://api.notion.com/v1/data_sources/${NOTION_DATA_SOURCE_ID}/query`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03"
    },
    body: JSON.stringify({
      filter: {
        property: "Email",
        email: { equals: email }
      },
      page_size: 5
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Notion query failed: ${JSON.stringify(data)}`);
  return data.results || [];
}

async function notionUpdatePage(pageId, properties, token) {
  const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03"
    },
    body: JSON.stringify({ properties })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Notion update failed: ${JSON.stringify(data)}`);
  return data;
}

async function fetchCalendlyEvent(eventUri, calendlyToken) {
  const r = await fetch(eventUri, {
    headers: { "Authorization": `Bearer ${calendlyToken}` }
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Calendly event fetch failed: ${JSON.stringify(data)}`);
  return data.resource;
}

function firstNonEmpty(...vals) {
  for (const v of vals) if (v) return v;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const notionToken = (process.env.NOTION_TOKEN || "").trim();
  const calendlyToken = (process.env.CALENDLY_TOKEN || "").trim();

  if (!notionToken || !calendlyToken) {
    return res.status(500).json({ ok: false, error: "Missing NOTION_TOKEN or CALENDLY_TOKEN" });
  }

  try {
    const body = req.body || {};
    const eventType = body.event;
    const payload = body.payload || {};
    const invitee = payload.invitee || payload;
    const email = firstNonEmpty(invitee.email, payload.email);

    if (!email) {
      return res.status(200).json({ ok: true, skipped: true, reason: "No invitee email" });
    }

    const matches = await notionQueryByEmail(email, notionToken);
    if (!matches.length) {
      return res.status(200).json({ ok: true, skipped: true, reason: "No Notion lead for email", email });
    }

    const pageId = matches[0].id;

    if (eventType === "invitee.created") {
      let startTime = payload.scheduled_event?.start_time || null;
      if (!startTime && payload.event) {
        try {
          const ev = await fetchCalendlyEvent(payload.event, calendlyToken);
          startTime = ev?.start_time || null;
        } catch (_) {}
      }

      const properties = {
        "Estado": { status: { name: "Llamada agendada" } },
        "Tipo de llamada": { select: { name: "Llamada de venta" } },
        "Resultado": { select: { name: "Pendiente" } }
      };
      if (startTime) properties["Fecha de llamada"] = { date: { start: startTime } };

      await notionUpdatePage(pageId, properties, notionToken);
      return res.status(200).json({ ok: true, action: "scheduled", email, pageId, startTime });
    }

    if (eventType === "invitee.canceled") {
      const properties = {
        "Estado": { status: { name: "En seguimiento" } },
        "Resultado": { select: { name: "Sin llamada" } }
      };
      await notionUpdatePage(pageId, properties, notionToken);
      return res.status(200).json({ ok: true, action: "canceled", email, pageId });
    }

    return res.status(200).json({ ok: true, ignored_event: eventType || null });
  } catch (err) {
    console.error("Calendly webhook error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Unexpected error" });
  }
}
