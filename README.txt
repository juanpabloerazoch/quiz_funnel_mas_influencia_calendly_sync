QUIZ FUNNEL +INFLUENCIA — NOTION + CALENDLY + MANYCHAT SYNC

Variables requeridas en Vercel:
- NOTION_TOKEN
- CALENDLY_TOKEN
- MANYCHAT_API_KEY

Flujo:
ManyChat -> Quiz -> /api/lead -> Notion + ManyChat
Calendly -> /api/calendly -> Notion

ManyChat:
- El enlace del quiz debe incluir ?mc_id=<Id de contacto>
- Campos personalizados esperados:
  Quiz completado
  Diagnóstico Quiz
  Conclusión Quiz
  Pregunta clave Quiz
  Puntajes Quiz
  Ángulo Quiz
- Etiqueta esperada: QUIZ_COMPLETADO

El endpoint /api/lead actualiza primero los campos y después añade la etiqueta,
para que la automatización de resultado lea los datos ya actualizados.
