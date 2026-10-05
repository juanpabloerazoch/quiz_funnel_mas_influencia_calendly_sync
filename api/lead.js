const SEGMENT_MAP = {
  clarity: "Claridad de identidad y propósito",
  action: "Activación y toma de acción",
  influence: "Expansión de influencia",
  alignment: "Alineación y sentido"
};

const QUIZ_RESULT_MAP = {
  clarity: {
    conclusion:
      "Tienes capacidades, experiencia e ideas, pero hoy necesitas convertir todo eso en una dirección concreta y comprobable.",
    question:
      "Si dentro de seis meses sigues teniendo muchas ideas pero sin una dirección clara, ¿qué sería lo más frustrante para ti?",
    angle:
      "Claridad de identidad, propósito y dirección"
  },
  action: {
    conclusion:
      "Parece que ya sabes bastante bien qué quieres hacer, pero hay una brecha entre saberlo y ejecutarlo. Ahí pueden aparecer miedo, perfeccionismo, procrastinación o esperar sentirte totalmente listo(a).",
    question:
      "Si dentro de seis meses todo sigue igual, ¿qué sería lo más frustrante de saber que pudiste haber avanzado y no lo hiciste?",
    angle:
      "Activación, toma de acción y ruptura de patrones de postergación"
  },
  influence: {
    conclusion:
      "Ya tienes conocimiento, experiencia o una transformación valiosa. El siguiente reto es estructurarlo para que otras personas entiendan con claridad qué haces, a quién ayudas y qué transformación facilitas.",
    question:
      "¿Qué sientes que te ha impedido hasta ahora convertir lo que sabes en una propuesta clara que también pueda generar ingresos?",
    angle:
      "Estructura, propuesta de valor, influencia y monetización"
  },
  alignment: {
    conclusion:
      "Has construido y avanzado, pero una parte de lo que hoy haces parece no representar por completo la vida y el propósito que sabes que quieres vivir.",
    question:
      "¿Qué parte de tu vida, trabajo o decisiones sientes hoy más desconectada de quien realmente quieres ser?",
    angle:
      "Alineación entre identidad, propósito, decisiones y estilo de vida"
  }
};

function richText(content) {
  const safe = String(content || "").slice(0, 1900);
  return { rich_text: safe ? [{ type: "text", text: { content: safe } }] : [] };
}

function title(content) {
  return {
    title: [{ type: "text", text: { content: String(content || "Lead Quiz").slice(0, 1900) } }]
  };
}

function instagramUrl(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const user = raw.replace(/^@/, "").replace(/\s+/g, "");
  return user ? `https://instagram.com/${user}` : null;
}

async function manychatPost(path, apiKey, body) {
  const response = await fetch(`https://api.manychat.com${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.detail ||
      `ManyChat respondió ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function setManychatField(apiKey, subscriberId, fieldName, fieldValue) {
  return manychatPost("/fb/subscriber/setCustomFieldByName", apiKey, {
    subscriber_id: String(subscriberId),
    field_name: fieldName,
    field_value: fieldValue
  });
}

async function syncQuizToManychat(lead, scoresText) {
  const subscriberId = String(lead.mc_id || "").trim();
  const apiKeys = [
    { account: "sara", key: (process.env.MANYCHAT_API_KEY || "").trim() },
    { account: "juan", key: (process.env.MANYCHAT_API_KEY_JUAN || "").trim() }
  ].filter(item => item.key);

  // El quiz también puede abrirse fuera de ManyChat.
  // En ese caso seguimos guardando el lead en Notion, pero no intentamos sincronizarlo.
  if (!subscriberId || !apiKeys.length) {
    return {
      attempted: false,
      synced: false,
      reason: !subscriberId ? "mc_id missing" : "ManyChat API keys missing"
    };
  }

  const result = QUIZ_RESULT_MAP[lead.segment] || QUIZ_RESULT_MAP.clarity;
  const diagnosis = SEGMENT_MAP[lead.segment] || SEGMENT_MAP.clarity;

  const fields = [
    ["Diagnóstico Quiz", diagnosis],
    ["Conclusión Quiz", result.conclusion],
    ["Pregunta clave Quiz", result.question],
    ["Puntajes Quiz", scoresText],
    ["Ángulo Quiz", result.angle],
    ["Quiz completado", "Sí"]
  ];

  let lastError = null;

  // El mismo quiz sirve para Sara y Juan.
  // Probamos cada API key hasta encontrar la cuenta de ManyChat a la que pertenece el contacto.
  for (const item of apiKeys) {
    try {
      for (const [fieldName, fieldValue] of fields) {
        await setManychatField(item.key, subscriberId, fieldName, fieldValue);
      }

      await manychatPost("/fb/subscriber/addTagByName", item.key, {
        subscriber_id: subscriberId,
        tag_name: "QUIZ_COMPLETADO"
      });

      return {
        attempted: true,
        synced: true,
        account: item.account
      };
    } catch (error) {
      lastError = error;
      console.warn(`ManyChat sync failed with ${item.account} key; trying next account.`);
    }
  }

  throw lastError || new Error("ManyChat sync failed for all configured accounts");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = (process.env.NOTION_TOKEN || "").trim();
  const dataSourceId = "ccd31324-b6ef-4661-89e7-15c4f8cc0aad";

  if (!token) {
    return res.status(500).json({
      ok: false,
      error: "Falta NOTION_TOKEN en Vercel."
    });
  }

  try {
    const lead = req.body || {};
    const segment = SEGMENT_MAP[lead.segment] || "Claridad de identidad y propósito";
    const answersText = Array.isArray(lead.answers)
      ? lead.answers.map(a => `P${a.question}: ${a.answer}`).join("\n")
      : "";
    const scoresText = lead.scores
      ? `Claridad: ${lead.scores.clarity || 0} | Activación: ${lead.scores.action || 0} | Influencia: ${lead.scores.influence || 0} | Alineación: ${lead.scores.alignment || 0}`
      : "";

    const properties = {
      "Nombre": title(lead.name || "Lead Quiz"),
      "Email": { email: lead.email || null },
      "Teléfono": { phone_number: lead.whatsapp || null },
      "Fuente": { select: { name: "Quiz Funnel" } },
      "Estado": { status: { name: "Nuevo contacto" } },
      "Resultado": { select: { name: "Sin llamada" } },
      "Tipo de llamada": { select: { name: "Sin llamada" } },
      "Diagnóstico Quiz": { select: { name: segment } },
      "Respuestas Quiz": richText(answersText),
      "Puntajes Quiz": richText(scoresText),
      "Fecha Quiz": { date: { start: lead.created_at || new Date().toISOString() } }
    };

    const ig = instagramUrl(lead.instagram);
    if (ig) properties["Instagram"] = { url: ig };

    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03"
      },
      body: JSON.stringify({
        parent: {
          type: "data_source_id",
          data_source_id: dataSourceId
        },
        properties
      })
    });

    const data = await notionResponse.json();

    if (!notionResponse.ok) {
      console.error("Notion error:", data);
      return res.status(notionResponse.status).json({
        ok: false,
        error: data.message || "Error creando lead en Notion",
        code: data.code || null
      });
    }

    // Sincronizamos el resultado con ManyChat DESPUÉS de guardar en Notion.
    // Si ManyChat falla, el quiz no se rompe ni se pierde el lead en Notion.
    let manychat = {
      attempted: false,
      synced: false
    };

    try {
      manychat = await syncQuizToManychat(lead, scoresText);
    } catch (manychatError) {
      console.error("ManyChat sync error:", manychatError);
      manychat = {
        attempted: true,
        synced: false,
        error: manychatError.message || "ManyChat sync failed"
      };
    }

    return res.status(200).json({
      ok: true,
      notion_page_id: data.id,
      notion_url: data.url,
      manychat
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error.message || "Unexpected error" });
  }
}
