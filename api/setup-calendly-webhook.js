export default async function handler(req, res) {
  const token = (process.env.CALENDLY_TOKEN || "").trim();
  if (!token) return res.status(500).json({ ok:false, error:"Missing CALENDLY_TOKEN" });

  try {
    const meResp = await fetch("https://api.calendly.com/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meResp.json();
    if (!meResp.ok) return res.status(meResp.status).json(meData);

    const org = meData.resource.current_organization;
    const callback = `https://${req.headers.host}/api/calendly`;

    const existingResp = await fetch(
      `https://api.calendly.com/webhook_subscriptions?organization=${encodeURIComponent(org)}&scope=organization`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const existingData = await existingResp.json();
    if (existingResp.ok) {
      const found = (existingData.collection || []).find(x => x.callback_url === callback);
      if (found) return res.status(200).json({ ok:true, already_exists:true, webhook:found.uri, callback });
    }

    const createResp = await fetch("https://api.calendly.com/webhook_subscriptions", {
      method:"POST",
      headers:{
        Authorization:`Bearer ${token}`,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        url: callback,
        events:["invitee.created","invitee.canceled"],
        organization: org,
        scope:"organization"
      })
    });
    const createData = await createResp.json();
    return res.status(createResp.status).json(createData);
  } catch (err) {
    return res.status(500).json({ ok:false, error:err.message || "Unexpected error" });
  }
}
