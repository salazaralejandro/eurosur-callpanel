<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  type Firestore,
  setLogLevel,
} from 'firebase/firestore'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  BookUser,
} from 'lucide-vue-next'

// --- Tipos de Datos ---
type Contact = {
  id: string
  firstName: string
  lastName: string
  phone: string
}

const newContactBase: Omit<Contact, 'id'> = {
  firstName: '',
  lastName: '',
  phone: '',
}

// --- Configuración de Firebase ---
// Leemos la configuración desde las variables de entorno de Vercel
const appId = import.meta.env.VITE_APP_ID || 'default-app-id'
const firebaseConfigJSON = import.meta.env.VITE_FIREBASE_CONFIG || '{}'

let app: FirebaseApp
let auth: Auth
let db: Firestore
// Esta ruta DEBE coincidir con tus Reglas de Seguridad de Firestore
let contactsCollectionPath: string

// --- Estado de la UI ---
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const searchTerm = ref('')
const showModal = ref(false)
const isEditing = ref(false)

// --- Estado de los Datos ---
const userId = ref<string | null>(null)
const contacts = ref<Contact[]>([])
const currentContact = reactive<Contact>({ id: '', ...newContactBase })

// --- Inicialización ---
onMounted(() => {
  try {
    const firebaseConfig = JSON.parse(firebaseConfigJSON)
    if (!firebaseConfig.apiKey) {
      throw new Error('VITE_FIREBASE_CONFIG no está configurada en Vercel.')
    }
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    setLogLevel('debug')
    contactsCollectionPath = `artifacts/${appId}/public/data/contacts`

    // Escuchar cambios de autenticación
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Usuario autenticado:', user.uid)
        userId.value = user.uid
        // Una vez autenticados, escuchar los contactos
        setupContactsListener()
      } else {
        // Autenticarse anónimamente para poder escribir
        await authenticate()
      }
    })
  } catch (e: any) {
    console.error('Error al inicializar Firebase:', e)
    error.value = `Error al inicializar la base de datos: ${e.message}`
  }
})

async function authenticate() {
  try {
    // En Vercel, solo podemos usar signInAnonymously
    await signInAnonymously(auth)
  } catch (e) {
    console.error('Error de autenticación:', e)
    error.value = 'Error de autenticación.'
  }
}

// --- Lógica de Datos (Firestore) ---
function setupContactsListener() {
  if (!db || !userId.value) return

  isLoading.value = true
  const q = query(collection(db, contactsCollectionPath))

  // onSnapshot escucha en tiempo real
  onSnapshot(
    q,
    (querySnapshot) => {
      const liveContacts: Contact[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        liveContacts.push({
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
        })
      })
      // Ordenar alfabéticamente por nombre
      contacts.value = liveContacts.sort((a, b) =>
        a.firstName.localeCompare(b.firstName)
      )
      isLoading.value = false
    },
    (err) => {
      console.error('Error escuchando contactos:', err)
      error.value = 'No se pudieron cargar los contactos.'
      isLoading.value = false
    }
  )
}

// --- Lógica de Búsqueda ---
const filteredContacts = computed(() => {
  const term = searchTerm.value.toLowerCase()
  if (!term) {
    return contacts.value
  }
  return contacts.value.filter(
    (c) =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term)
  )
})

// --- Lógica de CRUD (Crear, Editar, Borrar) ---
function openAddModal() {
  isEditing.value = false
  Object.assign(currentContact, { id: '', ...newContactBase })
  showModal.value = true
}

function openEditModal(contact: Contact) {
  isEditing.value = true
  Object.assign(currentContact, contact) // Copia el contacto para editar
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSave() {
  if (!db || !userId.value || !currentContact.firstName || !currentContact.phone) {
    error.value = 'Nombre y Teléfono son obligatorios.'
    return
  }

  isSaving.value = true
  error.value = null
  const contactData = {
    firstName: currentContact.firstName,
    lastName: currentContact.lastName,
    phone: currentContact.phone,
  }

  try {
    if (isEditing.value) {
      // Actualizar un contacto existente
      const docRef = doc(db, contactsCollectionPath, currentContact.id)
      await setDoc(docRef, contactData)
    } else {
      // Añadir un nuevo contacto
      const colRef = collection(db, contactsCollectionPath)
      await addDoc(colRef, contactData)
    }
    closeModal()
  } catch (e: any) {
    console.error('Error al guardar:', e)
    error.value = 'No se pudo guardar el contacto.'
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(id: string) {
  if (!db || !userId.value) return

  try {
    const docRef = doc(db, contactsCollectionPath, id)
    await deleteDoc(docRef)
  } catch (e: any) {
    console.error('Error al borrar:', e)
    error.value = 'No se pudo borrar el contacto.'
  }
}
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <main class="mx-auto max-w-[1800px] px-4 sm:px-8 py-8">
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-slate-800 flex items-center gap-3">
          <BookUser class="h-10 w-10" />
          Directorio de Contactos
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Gestiona la agenda de contactos de los terminales telefónicos.
        </p>
        <p class="mt-1 text-xs text-slate-500 font-mono">
          URL para teléfonos:
          <code class="bg-slate-200 p-1 rounded">/api/phonebook.xml</code>
        </p>
      </header>

      <!-- Barra de Acciones -->
      <section class="mb-6 flex flex-col sm:flex-row gap-4">
        <!-- Buscador -->
        <div class="relative flex-grow">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar por nombre, apellido o teléfono..."
            class="w-full rounded-lg border border-slate-300 px-4 py-2 pl-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
          />
        </div>
        <!-- Botón Añadir -->
        <button
          @click="openAddModal"
          class="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus class="h-5 w-5" />
          Añadir Contacto
        </button>
      </section>

      <!-- Mensaje de Carga o Error -->
      <div
        v-if="isLoading && !error"
        class="flex justify-center items-center gap-2 py-10 text-slate-500"
      >
        <Loader2 class="h-6 w-6 animate-spin" />
        <span>Cargando contactos...</span>
      </div>
      <div
        v-if="error"
        class="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-200"
      >
        <strong>Error:</strong> {{ error }}
      </div>

      <!-- Tabla de Contactos -->
      <section
        v-if="!isLoading"
        class="rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Nombre
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Apellido
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Teléfono
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr v-if="filteredContacts.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-slate-500">
                  {{ searchTerm ? 'No se encontraron contactos' : 'No hay contactos. Añade el primero.' }}
                </td>
              </tr>
              <tr
                v-for="contact in filteredContacts"
                :key="contact.id"
                class="hover:bg-slate-50"
              >
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900"
                >
                  {{ contact.firstName }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {{ contact.lastName }}
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm text-slate-600 font-mono"
                >
                  {{ contact.phone }}
                </td>
                <td
                  class="whitespace-nowrap px-6 py-4 text-sm font-medium text-right space-x-2"
                >
                  <button
                    @click="openEditModal(contact)"
                    class="p-1 text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit class="h-5 w-5" />
                  </button>
                  <button
                    @click="handleDelete(contact.id)"
                    class="p-1 text-red-600 hover:text-red-800"
                    title="Borrar"
                  >
                    <Trash2 class="h-5 w-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Modal para Añadir/Editar Contacto -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div
        class="m-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl transition-all"
      >
        <header
          class="flex items-center justify-between border-b border-slate-200 p-4"
        >
          <h2 class="text-xl font-semibold text-slate-800">
            {{ isEditing ? 'Editar Contacto' : 'Añadir Contacto' }}
          </h2>
          <button
            @click="closeModal"
            class="rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X class="h-6 w-6" />
          </button>
        </header>

        <!-- Formulario -->
        <form @submit.prevent="handleSave">
          <div class="space-y-4 p-6">
            <div>
              <label
                for="firstName"
                class="block text-sm font-medium text-slate-700"
                >Nombre</label
              >
              <input
                v-model="currentContact.firstName"
                id="firstName"
                type="text"
                required
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                for="lastName"
                class="block text-sm font-medium text-slate-700"
                >Apellido</label
              >
              <input
                v-model="currentContact.lastName"
                id="lastName"
                type="text"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                for="phone"
                class="block text-sm font-medium text-slate-700"
                >Teléfono</label
              >
              <input
                v-model="currentContact.phone"
                id="phone"
                type="tel"
                required
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Pie del Modal -->
          <footer
            class="flex justify-end gap-3 rounded-b-2xl bg-slate-50 p-4"
          >
            <button
              type="button"
              @click="closeModal"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </div>
</template>

