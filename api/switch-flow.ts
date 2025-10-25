import type { VercelRequest, VercelResponse } from '@vercel/node'

type ProviderJson = {
  status?: string
  status_code?: string
  message?: string
  data?: any
}

type Row = {
  pbx_id: string
  success: boolean
  http?: { status: number; statusText: string }
  provider?: any
}

async function setFlow({
  base,
  path,
  token,
  did,
  flowId,
}: {
  base: string
  path: string
  token: string
  did: string
  flowId: string
}) {
  const url = `${base}${path}`

  const body = {
    // 👇 MundoSMS usa "metodo" en español, no "method"
    metodo: 'POST',
    did,
    change_parameter: 'id_diagramflow',
    change_value: flowId,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text().catch(() => '')
  let json: ProviderJson | null = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }

  const okHTTP = res.ok
  const okBusiness = !!json && json.status === 'success'

  return {
    ok: okHTTP && okBusiness,
    http: { status: res.status, statusText: res.statusText },
    provider: json ?? text,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  /* === CORS === */
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const mode = String(req.query.mode || '')
    if (!['day', 'night'].includes(mode)) {
      return res.status(400).json({ ok: false, error: 'Use mode=day|night' })
    }

    const API_BASE = process.env.PROVIDER_API_BASE || 'https://api.mundosms.es'
    const API_PATH = process.env.PROVIDER_ASSIGN_PATH || '/APIV3/set_voipids'
    const API_TOKEN = process.env.PROVIDER_API_TOKEN
    const FLOW_DAY = process.env.FLOW_ID_DAY
    const FLOW_NIGHT = process.env.FLOW_ID_NIGHT

    if (!API_TOKEN || !FLOW_DAY || !FLOW_NIGHT) {
      return res
        .status(500)
        .json({ ok: false, error: 'Faltan PROVIDER_API_TOKEN / FLOW_ID_DAY / FLOW_ID_NIGHT' })
    }

    const single = (req.query.pbx as string) || ''
    const dids = single
      ? [single]
      : (process.env.PBX_IDS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

    if (!dids.length) {
      return res
        .status(400)
        .json({ ok: false, error: 'No hay PBX_IDS configuradas ni parámetro ?pbx=' })
    }

    const targetFlowId = mode === 'day' ? FLOW_DAY! : FLOW_NIGHT!

    const results: Row[] = []

    for (const did of dids) {
      try {
        const r = await setFlow({
          base: API_BASE,
          path: API_PATH,
          token: API_TOKEN!,
          did,
          flowId: targetFlowId,
        })

        if (r.ok) {
          results.push({ pbx_id: did, success: true })
        } else {
          console.error('[set_voipids FAIL]', { did, ...r })
          results.push({ pbx_id: did, success: false, http: r.http, provider: r.provider })
        }
      } catch (e: any) {
        results.push({ pbx_id: did, success: false, provider: { error: String(e?.message || e) } })
      }
    }

    const allOk = results.every((r) => r.success)
    return res.status(allOk ? 200 : 207).json({
      ok: allOk,
      mode,
      flow_id: targetFlowId,
      results,
    })
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) })
  }
}
