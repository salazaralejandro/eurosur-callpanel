// api/deposito-nivel.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const { id, fecha } = req.body
  if (!id || !fecha) {
    return res.status(400).json({ error: 'Missing id or fecha in body' })
  }

  const { GASOGES_API_URL, GASOGES_API_USER, GASOGES_API_PASS } = process.env
  if (!GASOGES_API_URL || !GASOGES_API_USER || !GASOGES_API_PASS) {
    return res.status(500).json({ error: 'Credenciales de API no configuradas.' })
  }

  const basicAuth = Buffer.from(`${GASOGES_API_USER}:${GASOGES_API_PASS}`).toString('base64')
  const apiUrl = `${GASOGES_API_URL}/depositos/nivel/${id}/${fecha}`

  try {
    const apiResponse = await fetch(apiUrl, {
      headers: { Authorization: `Basic ${basicAuth}` },
    })
    if (!apiResponse.ok) throw new Error(`Error de la API: ${apiResponse.status}`)
    
    const data = await apiResponse.json()
    res.setHeader('Cache-Control', 'no-cache') // Nivel en tiempo real, no cachear
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}