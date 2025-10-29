import type { VercelRequest, VercelResponse } from '@vercel/node'

import fs from 'fs'
import path from 'path'

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Construimos la ruta al archivo que está en la carpeta /public
    // process.cwd() es la raíz de tu proyecto en Vercel
    const filePath = path.resolve(
      process.cwd(),
      'public',
      'phonebookEUROSURlogos2.xml'
    )

    // 2. Comprobamos si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error('No se encontró el archivo:', filePath)
      return res.status(404).json({ error: 'Archivo no encontrado.' })
    }

    // 3. Leemos el contenido del archivo
    const xmlData = fs.readFileSync(filePath, 'utf-8')

    // 4. ¡Añadimos las cabeceras para forzar la descarga!
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="phonebookEUROSURlogos2.xml"'
    )

    // 5. Enviamos el contenido del archivo
    res.status(200).send(xmlData)
    
  } catch (error: any) {
    console.error('Error al leer el archivo XML:', error)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
