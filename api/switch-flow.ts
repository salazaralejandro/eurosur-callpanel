// /api/switch-flow.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

async function postJSON(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json().catch(() => ({}))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1) Autenticación: confía en la sesión del dashboard (misma cookie/token)
    //    Si usas un middleware de auth, ya te llega autenticado aquí.
    //    (Si quieres reforzar, comprueba cabeceras, rol, etc.)

    // 2) Validación de input
    const mode = (req.query.mode as string) // "day" | "night"
    if (!['day', 'night'].includes(mode)) {
      return res.status(400).json({ ok: false, error: 'Use mode=day|night' })
    }

    // ¿Aplicar a una PBX concreta?
    const singlePbx = (req.query.pbx as string) || ''
    const pbxIds = singlePbx
      ? [singlePbx]
      : (process.env.PBX_IDS || '').split(',').map(s => s.trim()).filter(Boolean)

    const FLOW_DAY   = process.env.FLOW_ID_DAY
    const FLOW_NIGHT = process.env.FLOW_ID_NIGHT
    const API_BASE   = process.env.PROVIDER_API_BASE
    const API_TOKEN  = process.env.PROVIDER_API_TOKEN

    if (!pbxIds.length || !FLOW_DAY || !FLOW_NIGHT || !API_BASE || !API_TOKEN) {
      return res.status(500).json({ ok: false, error: 'Faltan variables de entorno requeridas.' })
    }

    const targetFlowId = mode === 'day' ? FLOW_DAY : FLOW_NIGHT

    // 3) Llamada real a tu proveedor (ajusta la ruta/payload a su doc)
    const assignUrl = `${API_BASE}/pbx/flows/assign`

    const results: Array<{ pbx_id: string; success: boolean; error?: string }> = []
    for (const pbx_id of pbxIds) {
      try {
        await postJSON(
          assignUrl,
          { pbx_id, flow_id: targetFlowId },
          { Authorization: `Bearer ${API_TOKEN}` }
        )
        results.push({ pbx_id, success: true })
      } catch (e: any) {
        results.push({ pbx_id, success: false, error: String(e?.message || e) })
      }
    }

    const ok = results.every(r => r.success)
    res.status(ok ? 200 : 207).json({ ok, mode, flow_id: targetFlowId, results })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) })
  }
}
