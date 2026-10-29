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


// Adaptaciones de la ruta TEST del Guion Maestro; voces revisadas por separado.
// Solo borradores en Notion: este código no envía mensajes al prospecto.
const QUIZ_VOICE_TEMPLATES = {
  "clarity": {
    "sara": "Estuve mirando tu resultado y me gustaría conocerte un poquito más. Parece que hoy lo que más necesitas es encontrar una dirección que tenga sentido para ti.\n\nCuéntame, ¿en qué parte de tu vida estás sintiendo más esa falta de claridad?",
    "juan": "Revisé tu resultado. El punto que más aparece es la claridad sobre tu propósito y hacia dónde enfocar tus próximos pasos.\n\n¿En qué parte de tu vida te está afectando más no tener esa dirección clara?"
  },
  "action": {
    "sara": "Estuve mirando tu resultado y parece que hay algo que quieres hacer, pero te está costando dar el paso.\n\nCuéntame, ¿qué es eso que hoy quieres poner en marcha y todavía se te está quedando pendiente?",
    "juan": "Revisé tu resultado. Lo que más aparece es la dificultad para pasar de la intención a la acción.\n\n¿Cuál es el paso concreto que quieres dar y hoy se te está dificultando?"
  },
  "influence": {
    "sara": "Estuve mirando tu resultado y parece que quieres darle forma a lo que sabes para ayudar a otras personas.\n\nCuéntame, ¿qué te gustaría que alguien pudiera transformar en su vida con tu ayuda?",
    "juan": "Revisé tu resultado. El siguiente punto por ordenar parece ser cómo convertir lo que sabes en una propuesta concreta.\n\n¿Qué problema te gustaría ayudar a resolver con tu experiencia?"
  },
  "alignment": {
    "sara": "Estuve mirando tu resultado y parece que el reto no es simplemente hacer más, sino sentir que lo que haces de verdad te representa.\n\n¿En qué parte de tu vida sientes que estás cumpliendo, pero no viviendo algo que tenga sentido para ti?",
    "juan": "Revisé tu resultado. Parece que necesitas alinear mejor lo que estás construyendo con la vida que quieres vivir.\n\n¿Qué parte de lo que haces hoy sientes más desconectada de ese propósito?"
  }
};
const QUIZ_CONTEXT_OPTIONS = [
  [
    "Siento que fui creado(a) para más, pero todavía no tengo claridad de para qué.",
    "Sé bastante bien lo que quiero hacer, pero sigo postergando, dudando o frenándome.",
    "Tengo experiencia, conocimiento o un proyecto, pero no sé cómo convertirlo en una propuesta clara que genere impacto e ingresos.",
    "He logrado cosas importantes, pero por dentro siento que algo no está alineado o que falta sentido."
  ],
  [
    "Confusión: tengo muchas ideas, pero no una dirección clara.",
    "Miedo, perfeccionismo, procrastinación o necesidad de aprobación.",
    "No sé estructurar mi mensaje, mi oferta o cómo monetizar lo que sé.",
    "Estoy funcionando por inercia: hago muchas cosas, pero no siento conexión profunda con ellas."
  ],
  [
    "Menos de 3 meses.",
    "Entre 3 y 12 meses.",
    "Entre 1 y 3 años.",
    "Más de 3 años. Ya no quiero seguir aplazándolo."
  ],
  [
    "Todavía no sé con claridad qué podría aportar.",
    "Sé que podría ayudar, pero aún no me atrevo a ponerme al frente.",
    "La gente ya me busca o ayudo de manera informal, pero no tengo una oferta estructurada.",
    "Ya tengo servicios, proyecto o audiencia, pero quiero que todo tenga más propósito, profundidad y dirección."
  ]
];
function quizContext(lead){
  if(Array.isArray(lead.context) && lead.context.length===4 && lead.context.every(x=>Number.isInteger(x)&&x>=-1&&x<=3))return lead.context;
  const answers=Array.isArray(lead.answers)?lead.answers:[];
  const normalize=s=>String(s||"").trim().replace(/\s+/g," ").toLowerCase();
  return [1,3,4,6].map((q,i)=>{
    const answer=answers.find(a=>Number(a.question)===q);
    return answer?QUIZ_CONTEXT_OPTIONS[i].findIndex(t=>normalize(t)===normalize(answer.answer)):-1;
  });
}
const QUIZ_PROFILE_NAMES = {
  clarity: "Claridad de diseño",
  action: "Activación",
  influence: "Expansión de influencia",
  alignment: "Alineación"
};
// Pregunta 8 (ocupación): frases en segunda persona para el mensaje de Sara/Juan.
const QUIZ_OCCUPATION_PHRASES = [
  "trabajas como empleado(a)",
  "tienes tu propio negocio o emprendimiento",
  "trabajas de forma independiente",
  "estás estudiando",
  "estás en una etapa de transición"
];
function quizFlag(code) {
  const c = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
}
function cleanText(value, max) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}
function buildQuizMessages(lead) {
  const rawName = cleanText(lead.name, 120);
  const firstName = rawName.split(" ")[0] || "";
  const [situation, blocker, duration] = quizContext(lead);
  const descriptions = [
    "sientes que hay algo más para ti, pero todavía te falta claridad sobre la dirección que quieres tomar",
    "sabes lo que quieres hacer, pero las dudas o la postergación te están frenando",
    "tienes experiencia o conocimiento y quieres convertirlo en una propuesta clara que genere impacto",
    "has logrado cosas importantes, pero sientes que algo no está alineado con la vida que quieres vivir"
  ];
  const blockers = [
    "te está costando encontrar una dirección clara entre tantas ideas",
    "te identificaste con algunas dificultades para pasar a la acción",
    "te está costando estructurar tu mensaje o tu oferta",
    "haces muchas cosas, pero no sientes la conexión que quisieras con ellas"
  ];
  const fallbackBySegment = {
    clarity: "hoy estás buscando mayor claridad sobre tu propósito y dirección",
    action: "quieres pasar de lo que sabes a dar pasos concretos",
    influence: "quieres dar forma a tu experiencia para ayudar a otras personas",
    alignment: "quieres alinear lo que haces con la vida que deseas construir"
  };
  const problem = situation === 1 ? "sabes lo que quieres hacer, pero todavía hay algo que te está frenando para pasar a la acción" : situation >= 0 ? descriptions[situation] :
    blocker >= 0 ? blockers[blocker] :
    fallbackBySegment[lead.segment] || "hay algo importante que quieres trabajar en esta etapa";
  const durations = ["menos de 3 meses", "3 a 12 meses", "1 a 3 años", "más de 3 años"];
  const durationKnown = duration >= 0 && duration < durations.length;
  const time = durationKnown ? durations[duration] : "";
  const actions = {
    clarity: "encontrar esa claridad",
    action: "lograr dar ese paso",
    influence: "darle forma a esa propuesta",
    alignment: "sentirte más alineado con lo que quieres vivir"
  };
  const goal = actions[lead.segment] || "resolver esta situación";
  // El mensaje SIEMPRE termina con una pregunta (paso 5 del Guion Maestro si se conoce el tiempo; si no, paso 4).
  const question = durationKnown
    ? `¿qué has hecho durante estos ${time} que mencionaste en el test para ${goal}?`
    : "¿hace cuánto tiempo vienes viviendo esta situación?";

  const country = cleanText(lead.country, 40);
  const countryCode = cleanText(lead.country_code, 2).toUpperCase();
  const isColombia = countryCode === "CO" || /^colombia$/i.test(country);
  const flag = quizFlag(countryCode);
  const occIndex = Number.isInteger(lead.occupation) ? lead.occupation : -1;
  const occ = QUIZ_OCCUPATION_PHRASES[occIndex] || "";

  const profileName = QUIZ_PROFILE_NAMES[lead.segment] || "";
  const problemSentence = problem.charAt(0).toUpperCase() + problem.slice(1) + ".";
  const diagnosis = profileName ? `Tu diagnóstico fue: ${profileName}. ${problemSentence}` : `Veo que ${problem}.`;

  function aboutYou(voice) {
    let line = "";
    if (country) {
      if (isColombia) line = voice === "sara" ? "Veo que me escribes desde Colombia, ¡qué bueno, eres de aquí mismo!" : "Veo que eres de Colombia, de aquí mismo.";
      else line = voice === "sara" ? `Veo que me escribes desde ${country}${flag ? " " + flag : ""}, ¡qué bueno que esto llegue hasta allá!` : `Veo que me escribes desde ${country}${flag ? " " + flag : ""}, qué bueno tenerte por aquí.`;
    }
    if (occ) line += line ? ` Y que ${occ}.` : `Veo que ${occ}.`;
    return line;
  }
  function build(voice) {
    const hello = voice === "sara"
      ? (firstName ? `Hola, ${firstName} 👋` : "Hola 👋")
      : (firstName ? `Hola, ${firstName}.` : "Hola.");
    const opener = voice === "sara" ? "Recibí tus respuestas del diagnóstico." : "Revisé tus respuestas del diagnóstico.";
    const about = aboutYou(voice);
    // Prospecto calificado: cierra invitando a la llamada (siempre con pregunta).
    const close = lead.qualified === true
      ? `Y como me dijiste que resolver esto es una prioridad para ti, creo que vale la pena revisarlo juntos.\n\n¿Te gustaría que agendemos una llamada corta de diagnóstico con ${voice === "sara" ? "Juan" : "Sara"} y conmigo?`
      : `Cuéntame, ${question}`;
    return `${hello}\n\n${opener}${about ? " " + about : ""}\n\n${diagnosis}\n\n${close}`;
  }
  return { sara: build("sara"), juan: build("juan") };
}

const QUIZ_PRIORITY_ANSWER = "Es una prioridad. Estoy dispuesto(a) a tomar decisiones y aplicar acompañamiento.";
function isQualifiedLead(lead) {
  const answers = Array.isArray(lead.answers) ? lead.answers : [];
  const normalize = s => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
  const p7 = answers.find(a => Number(a.question) === 7);
  const priority = !!p7 && normalize(p7.answer) === normalize(QUIZ_PRIORITY_ANSWER);
  return priority && [0, 1, 2].includes(lead.occupation);
}
function quizCopyUrl(lead) {
  const name=typeof lead.name==="string"?lead.name.trim().replace(/\s+/g," ").slice(0,120):"";
  const segment=Object.prototype.hasOwnProperty.call(QUIZ_VOICE_TEMPLATES,lead.segment)?lead.segment:"clarity";
  const occupation=Number.isInteger(lead.occupation)&&lead.occupation>=0&&lead.occupation<=4?lead.occupation:-1;
  const params=new URLSearchParams({datos:JSON.stringify({v:3,n:name,s:segment,c:quizContext(lead),p:cleanText(lead.country,40),k:cleanText(lead.country_code,2),o:occupation,q:lead.qualified===true?1:0})});
  return "https://quizfunnelmasinfluenciacalendlysync.vercel.app/copiar#"+params.toString();
}
function quizMessageBlocks(messages,copyUrl) {
  const text=content=>[{type:"text",text:{content}}];
  return [
    {object:"block",type:"heading_2",heading_2:{rich_text:text("📋 Mensajes para copiar · Sara y Juan")}},
    {object:"block",type:"paragraph",paragraph:{rich_text:[{type:"text",text:{content:"📋 ABRIR BOTONES PARA COPIAR SARA / JUAN",link:{url:copyUrl}},annotations:{bold:true}}]}},
    {object:"block",type:"paragraph",paragraph:{rich_text:text("Abre el enlace y pulsa Copiar mensaje de Sara o Copiar mensaje de Juan. Cada botón copia el mensaje completo. Borradores para revisar: si este punto ya se conversó o la persona ya agendó, continúa desde lo que ya sabes.")}},
    {object:"block",type:"heading_3",heading_3:{rich_text:text("Voz Sara")}},
    {object:"block",type:"paragraph",paragraph:{rich_text:text(messages.sara)}},
    {object:"block",type:"heading_3",heading_3:{rich_text:text("Voz Juan")}},
    {object:"block",type:"paragraph",paragraph:{rich_text:text(messages.juan)}}
  ];
}

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function manychatPost(path, apiKey, body) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
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

    if (response.ok) return data;

    const message =
      data?.message ||
      data?.error ||
      data?.detail ||
      `ManyChat respondió ${response.status}`;

    lastError = new Error(message);

    const rateLimited =
      response.status === 429 ||
      /max rps|rate limit/i.test(String(message));

    if (!rateLimited || attempt === 2) {
      throw lastError;
    }

    await sleep(700 * (attempt + 1));
  }

  throw lastError || new Error("ManyChat request failed");
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
  const pid = String(lead.mc_pid || "").trim();
  const allKeys = [
    { account: "sara", pid: "3909136", key: (process.env.MANYCHAT_API_KEY || "").trim() },
    { account: "juan", pid: "3908852", key: (process.env.MANYCHAT_API_KEY_JUAN || "").trim() }
  ].filter(item => item.key);

  const apiKeys = pid
    ? [
        ...allKeys.filter(item => item.pid === pid),
        ...allKeys.filter(item => item.pid !== pid)
      ]
    : allKeys;

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

  // Campo adicional para el nuevo mensaje; no altera los campos ni el flujo existente.
  // Se elige la voz usando la cuenta que realmente acepta al suscriptor.
  const voiceMessages = buildQuizMessages(lead);
  const fieldsBase = [
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
      // Quitamos primero la etiqueta para que una nueva finalización del quiz
      // pueda volver a disparar la automatización, incluso si el contacto ya había hecho el test antes.
      try {
        await manychatPost("/fb/subscriber/removeTagByName", item.key, {
          subscriber_id: subscriberId,
          tag_name: "QUIZ_COMPLETADO"
        });
        await sleep(350);
      } catch (removeTagError) {
        // Si la etiqueta no estaba puesta, continuamos normalmente.
        console.warn(`ManyChat remove tag skipped account=${item.account}: ${removeTagError.message}`);
      }

      const fieldResults = [];
      let successfulFields = 0;
      const fields = [
        ...fieldsBase,
        ["Mensaje personalizado Quiz", voiceMessages[item.account]]
      ];

      for (const [fieldName, fieldValue] of fields) {
        try {
          await setManychatField(item.key, subscriberId, fieldName, fieldValue);
          successfulFields += 1;
          fieldResults.push({ field: fieldName, ok: true });
        } catch (fieldError) {
          console.warn(`ManyChat field failed account=${item.account} field=${fieldName} subscriber=${subscriberId}: ${fieldError.message}`);
          fieldResults.push({ field: fieldName, ok: false, error: fieldError.message });
        }
      }

      if (successfulFields === 0) {
        throw new Error("No ManyChat fields could be updated for this account");
      }

      await manychatPost("/fb/subscriber/addTagByName", item.key, {
        subscriber_id: subscriberId,
        tag_name: "QUIZ_COMPLETADO"
      });

      return {
        attempted: true,
        synced: true,
        account: item.account,
        fields_updated: successfulFields,
        fields: fieldResults
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
    lead.qualified = isQualifiedLead(lead);
    const segment = SEGMENT_MAP[lead.segment] || "Claridad de identidad y propósito";
    const answersText = [
      ...(Array.isArray(lead.answers) ? lead.answers.map(a => `P${a.question}: ${a.answer}`) : []),
      lead.country ? `País: ${cleanText(lead.country, 40)}` : "",
      `Calificado para llamada: ${lead.qualified ? "Sí" : "No"}`
    ].filter(Boolean).join("\n");
    const scoresText = lead.scores
      ? `Claridad: ${lead.scores.clarity || 0} | Activación: ${lead.scores.action || 0} | Influencia: ${lead.scores.influence || 0} | Alineación: ${lead.scores.alignment || 0}`
      : "";

    const voiceMessages = buildQuizMessages(lead);
    const copyUrl = quizCopyUrl(lead);
    const properties = {
      "Nombre": title(lead.name || "Lead Quiz"),
      "📋 Mensaje copiable": richText(`VOZ SARA\n${voiceMessages.sara}\n\nVOZ JUAN\n${voiceMessages.juan}`),
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
        properties,
        children: quizMessageBlocks(voiceMessages, copyUrl)
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
