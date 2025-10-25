// /api/voip-calls.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS para tu app (si quieres restringir, cambia '*' por tu dominio)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const token = process.env.PROVIDER_API_TOKEN
    if (!token) return res.status(500).json({ error: 'Missing PROVIDER_API_TOKEN' })

    // Si MundoSMS permite filtros, léelos del query string y añádelos
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(req.query)) if (typeof v === 'string') qs.set(k, v)

    const url = `https://api.mundosms.es/APIV3/list_voipcalls${qs.size ? `?${qs}` : ''}`

    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

    // Puede devolver JSON o texto; reenvía tal cual pero conservando el status
    const text = await r.text()
    // Intenta JSON; si no es JSON, envía texto
    try {
      const json = JSON.parse(text)
      return res.status(r.status).json(json)
    } catch {
      return res.status(r.status).send(text)
    }
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
