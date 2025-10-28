import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  type Auth,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  query,
  getDocs,
  type Firestore,
  setLogLevel,
} from 'firebase/firestore'

// --- Configuración de Firebase ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'
const firebaseConfigJSON =
  typeof __firebase_config !== 'undefined'
    ? __firebase_config
    : '{}'
const firebaseConfig = JSON.parse(firebaseConfigJSON)
let app: FirebaseApp
let auth: Auth
let db: Firestore
// Esta ruta DEBE coincidir con la de pages/Contacts.vue
const contactsCollectionPath = `artifacts/${appId}/public/data/contacts`

// Inicializar Firebase (una sola vez)
try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  setLogLevel('Debug')
} catch (e) {
  console.error('Error al inicializar Firebase en API:', e)
}

// --- Función para autenticar el servidor ---
async function authenticateServer() {
  if (auth.currentUser) {
    return auth.currentUser
  }
  // Un servidor puede autenticarse anónimamente para leer datos públicos
  try {
    const userCredential = await signInAnonymously(auth)
    return userCredential.user
  } catch (e) {
    console.error('Error al autenticarse anónimamente en la API:', e)
    return null
  }
}

// --- Función para generar el XML ---
async function generateContactsXML(): Promise<string> {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<AddressBook>\n'
  xml += '  <version>1</version>\n'

  // Añadir grupos por defecto (basado en tu imagen original)
  xml += '  <pbgroup>\n'
  xml += '    <id>0</id>\n'
  xml += '    <name>Default</name>\n'
  xml += '    <photos/>\n'
  xml += '    <ringtones/>\n'
  xml += '    <RingtoneIndex>0</RingtoneIndex>\n'
  xml += '  </pbgroup>\n'
  xml += '  <pbgroup>\n'
  xml += '    <id>100</id>\n'
  xml += '    <name>Blacklist</name>\n'
  xml += '    <photos/>\n'
  xml += '    <ringtones/>\n'
  xml += '    <RingtoneIndex>0</RingtoneIndex>\n'
  xml += '  </pbgroup>\n'

  // Obtener contactos de Firestore
  try {
    const q = query(collection(db, contactsCollectionPath))
    const querySnapshot = await getDocs(q)

    querySnapshot.forEach((doc) => {
      const contact = doc.data()
      // Usamos el ID de Firestore (ej. "abc123xyz") como el ID del contacto
      const id = doc.id
      const firstName = contact.firstName || ''
      const lastName = contact.lastName || ''
      const phone = contact.phone || ''

      // Formatear el contacto como en tu XML original
      xml += '  <Contact>\n'
      xml += `    <id>${id}</id>\n`
      xml += `    <FirstName>${firstName}</FirstName>\n`
      xml += `    <LastName>${lastName}</LastName>\n`
      xml += '    <Department/>\n'
      xml += '    <Primary>0</Primary>\n'
      xml += '    <Frequent>0</Frequent>\n'
      xml += '    <Phone type="Work">\n'
      xml += `      <phonenumber>${phone}</phonenumber>\n`
      xml += '      <accountindex>0</accountindex>\n'
      xml += '    </Phone>\n'
      xml += '    <Mail type="Work"/>\n'
      xml += '    <PhotoUrl/>\n'
      xml += '    <RingtoneUrl/>\n'
      xml += '    <RingtoneIndex>0</RingtoneIndex>\n'
      xml += '  </Contact>\n'
    })
  } catch (e: any) {
    console.error('Error al obtener contactos de Firestore:', e)
  }

  xml += '</AddressBook>'
  return xml
}

// --- El Handler de la API de Vercel ---
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Asegurarse de que el servidor esté autenticado
    const user = await authenticateServer()
    if (!user) {
      return res
        .status(500)
        .json({ error: 'No se pudo autenticar el servidor.' })
    }

    // Generar el XML
    const xmlData = await generateContactsXML()

    // Enviar la respuesta XML
    res.setHeader('Content-Type', 'text/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300') // Cache de 1 minuto
    res.status(200).send(xmlData)
  } catch (e: any) {
    console.error('Error en la API phonebook.xml:', e)
    res.status(500).json({ error: e.message })
  }
}

