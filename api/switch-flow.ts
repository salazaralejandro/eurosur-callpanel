// /api/switch_flow.ts (ACTUALIZADO para usar GET)

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
  // 1. Creamos el body JSON que espera MundoSMS
  const body = {
    // 👇 MundoSMS usa "metodo" en español, no "method"
    metodo: 'POST',
    did,
    change_parameter: 'id_diagramflow',
    change_value: flowId,
  }

  // 2. Creamos los parámetros de la URL
  const params = new URLSearchParams()
  params.set('json', JSON.stringify(body))
  params.set('Authorization', `Bearer ${token}`)

  // 3. Construimos la URL final con los parámetros
  const url = `${base}${path}?${params.toString()}`

  // 4. Hacemos la llamada como un GET, sin cabeceras y sin body
  const res = await fetch(url, {
    method: 'GET',
  })

  // El resto de la lógica para leer la respuesta es igual
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
          .split(/[\s,]+/) // Usamos regex para separar por comas o espacios
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