import type { VercelRequest, VercelResponse } from '@vercel/node'

type ProviderFail = { status: number; statusText: string; bodyText: string }
type Row = { pbx_id: string; success: boolean; provider?: ProviderFail }

async function callMundoSMS(
  base: string,
  path: string,
  token: string,
  clid: string,
  flowId: string
): Promise<{ ok: true } | { ok: false; fail: ProviderFail }> {
  const url = `${base}${path}`

  const body = {
    method: 'POST',
    clid, // PBX id
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

  if (res.ok) return { ok: true }
  const text = await res.text().catch(() => '')
  return { ok: false, fail: { status: res.status, statusText: res.statusText, bodyText: text } }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const mode = String(req.query.mode || '')
    if (!['day', 'night'].includes(mode)) {
      return res.status(400).json({ ok: false, error: 'Use mode=day|night' })
    }

    // Variables
    const API_BASE  = process.env.PROVIDER_API_BASE || 'https://api.mundosms.es'
    const API_PATH  = process.env.PROVIDER_ASSIGN_PATH || '/APIV3/set_voipids'
    const API_TOKEN = process.env.PROVIDER_API_TOKEN
    const FLOW_DAY  = process.env.FLOW_ID_DAY
    const FLOW_NIGHT= process.env.FLOW_ID_NIGHT

    if (!API_TOKEN || !FLOW_DAY || !FLOW_NIGHT) {
      return res.status(500).json({ ok: false, error: 'Faltan PROVIDER_API_TOKEN / FLOW_ID_DAY / FLOW_ID_NIGHT' })
    }

    const single = (req.query.pbx as string) || ''
    const pbxIds =
      single
        ? [single]
        : (process.env.PBX_IDS || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)

    if (!pbxIds.length) {
      return res.status(400).json({ ok: false, error: 'No hay PBX_IDS configuradas ni parámetro ?pbx=' })
    }

    const targetFlowId = mode === 'day' ? FLOW_DAY : FLOW_NIGHT

    const results: Row[] = []
    for (const pbx_id of pbxIds) {
      try {
        const r = await callMundoSMS(API_BASE, API_PATH, API_TOKEN, pbx_id, targetFlowId)
        if (r.ok) {
          results.push({ pbx_id, success: true })
        } else {
          console.error('[set_voipids] PBX', pbx_id, '→', r.fail.status, r.fail.statusText, r.fail.bodyText)
          results.push({ pbx_id, success: false, provider: r.fail })
        }
      } catch (e: any) {
        results.push({
          pbx_id,
          success: false,
          provider: { status: 0, statusText: 'FETCH_ERROR', bodyText: String(e?.message || e) },
        })
      }
    }

    const allOk = results.every(r => r.success)
    return res.status(allOk ? 200 : 207).json({ ok: allOk, mode, flow_id: targetFlowId, results })
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) })
  }
}
