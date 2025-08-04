// File: api/klaviyo-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { email, campaignId, ...rest } = req.body
    if (!email || !campaignId) {
      return res.status(400).json({ error: 'Missing required `email` or `campaignId` in payload.' })
    }

    const API = 'https://api.instantly.ai'
    const headers = {
      'Authorization': `Bearer ${process.env.INSTANTLY_API_KEY}`,
      'Content-Type': 'application/json'
    }

    // 1. Check if lead exists
    const listResp = await fetch(`${API}/api/v2/leads/list`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ contacts: [email], limit: 1 })
    })

    if (!listResp.ok) {
      const error = await listResp.text()
      return res.status(listResp.status).json({ error })
    }

    const listJson = await listResp.json()
    const existing = Array.isArray(listJson.items) ? listJson.items[0] : null

    // 2. If lead does not exist → create
    if (!existing) {
      const createResp = await fetch(`${API}/api/v2/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          campaign: campaignId,
          custom_variables: rest
        })
      })

      const created = await createResp.json()
      return res.status(createResp.status).json({
        action: 'created_new',
        lead: created
      })
    }

    // 3. Lead exists — update metadata
    await fetch(`${API}/api/v2/leads/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ custom_variables: rest })
    })

    // 4. Check active campaign memberships
    const mapResp = await fetch(`${API}/api/v2/account-campaign-mappings/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers
    })

    const mapJson = mapResp.ok ? await mapResp.json() : { items: [] }
    const active = mapJson.items.find((m: any) =>
      m.status === 1 && m.campaign_id !== campaignId
    )

    if (active) {
      return res.status(202).json({
        action: 'in_active_campaign',
        currentCampaignId: active.campaign_id,
        message: 'User already in active campaign. Delayed for now.'
      })
    }

    // 5. Move to new campaign
    const moveResp = await fetch(`${API}/api/v2/leads/move`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contacts: [email],
        to_campaign_id: campaignId,
        check_duplicates_in_campaigns: true
      })
    })

    const moved = await moveResp.json()
    return res.status(moveResp.status).json({
      action: 'moved',
      job: moved
    })

  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Server error', detail: err instanceof Error ? err.message : err })
  }
}