// api/depositos/nivel.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { GASOGES_API_URL, GASOGES_API_USER, GASOGES_API_PASS } = process.env;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Leemos los parámetros de la consulta (query params)
  const { id, fecha } = req.query;

  if (!id || !fecha) {
    return res.status(400).json({ error: 'Parámetros "id" y "fecha" requeridos.' });
  }
  if (!GASOGES_API_USER || !GASOGES_API_PASS || !GASOGES_API_URL) {
    return res.status(500).json({ error: 'Configuración de API incompleta en servidor.' });
  }

  const token = Buffer.from(`${GASOGES_API_USER}:${GASOGES_API_PASS}`).toString('base64');
  
  // 2. Construimos la URL real de la API de Gasoges
  const apiUrl = `${GASOGES_API_URL}/depositos/nivel/${id}/${fecha}`;

  try {
    // 3. Hacemos la llamada GET
    const apiResponse = await fetch(apiUrl, {
      headers: { 'Authorization': `Basic ${token}` }
    });
    if (!apiResponse.ok) {
      throw new Error(`Error de la API: ${apiResponse.status}`);
    }
    const data = await apiResponse.json();
    res.setHeader('Cache-Control', 'no-cache'); // El nivel no se cachea
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}