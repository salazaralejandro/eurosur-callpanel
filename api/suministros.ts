import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Obtenemos las fechas de los parámetros de la URL
  const { inicio, fin } = req.query;

  // Validamos que las fechas existan
  if (!inicio || !fin) {
    return res.status(400).json({ error: 'Los parámetros "inicio" y "fin" son requeridos.' });
  }

  // Construimos la URL real de la API de Gasoges
  const apiUrl = `https://api.gasoges.es/v1/suministros/todos/${inicio}/${fin}`;

  try {
    // Hacemos la llamada a la API real desde el servidor de Vercel
    const apiResponse = await fetch(apiUrl);

    // Si la API de Gasoges da un error, lo pasamos a nuestra app
    if (!apiResponse.ok) {
      throw new Error(`La API de Gasoges respondió con el estado: ${apiResponse.status}`);
    }

    // Obtenemos los datos como JSON
    const data = await apiResponse.json();
    
    // Configuramos las cabeceras para permitir CORS (buena práctica)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Caché de 1 minuto

    // Enviamos los datos de vuelta a nuestra aplicación Vue
    return res.status(200).json(data);

  } catch (error: any) {
    // Manejamos cualquier error que ocurra
    return res.status(500).json({ error: error.message });
  }
}

