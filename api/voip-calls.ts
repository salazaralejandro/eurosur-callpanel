import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_: VercelRequest, res: VercelResponse) {
  try {
    const r = await fetch('https://api.mundosms.es/APIV3/list_voipcalls', {
      headers: { Authorization: `Bearer ${process.env.PROVIDER_API_TOKEN}` },
    })
    const text = await r.text()
    res.status(r.ok ? 200 : r.status).send(text)
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) })
  }
}
