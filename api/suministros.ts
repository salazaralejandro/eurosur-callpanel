import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { inicio, fin } = req.query;

  if (!inicio || !fin) {
    return res.status(400).json({ error: 'Los parámetros "inicio" y "fin" son requeridos.' });
  }


  const apiUser = process.env.GASOGES_API_USER;
  const apiPass = process.env.GASOGES_API_PASS;

  if (!apiUser || !apiPass) {
    return res.status(500).json({ error: 'El usuario o la contraseña de la API no están configurados en el servidor.' });
  }


  const basicAuth = Buffer.from(`${apiUser}:${apiPass}`).toString('base64');


  const apiUrl = `https://api.gasoges.es/v1/suministros/todos/${inicio}/${fin}`;

  try {

    const apiResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${basicAuth}`
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`La API de Gasoges respondió con el estado: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

