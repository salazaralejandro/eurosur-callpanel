import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id, inicio, fin } = req.query
  if (!id || !inicio || !fin) {
    return res.status(400).json({ error: 'Missing id, inicio, or fin query parameter' })
  }

  const { GASOGES_API_URL, GASOGES_API_USER, GASOGES_API_PASS } = process.env
  const token = Buffer.from(`${GASOGES_API_USER}:${GASOGES_API_PASS}`).toString('base64')

  try {
    const url = `${GASOGES_API_URL}/suministros/deposito/${encodeURIComponent(
      String(id),
    )}/${encodeURIComponent(String(inicio))}/${encodeURIComponent(String(fin))}`

    const apiRes = await fetch(url, {
      headers: { Authorization: `Basic ${token}` },
    })
    if (!apiRes.ok) return res.status(apiRes.status).json({ error: 'Failed to fetch suministros-deposito' })

    const data = await apiRes.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}