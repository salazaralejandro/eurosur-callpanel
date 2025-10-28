<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

type Contact = {
  id: string
  name: string
  phone: string
}

const contacts = ref<Contact[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const lastLoadedAt = ref<string | null>(null)

// UI state
const search = ref('')
const debouncedSearch = ref('')
const page = ref(1)
const perPage = ref(10)
const sortBy = ref<'id' | 'name' | 'phone'>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

// debounce search
let searchTimer: number | undefined
watch(search, (v) => {
  if (searchTimer) clearTimeout(searchTimer)
  // @ts-ignore - window is available
  searchTimer = window.setTimeout(() => (debouncedSearch.value = v.trim()), 250)
})

// Parse XML -> Contact[]
function parseContactsXML(xmlText: string): Contact[] {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml')

    // Detect parser errors
    const parsererror = xmlDoc.querySelector('parsererror')
    if (parsererror) {
      throw new Error('El XML contiene errores de formato.')
    }

    // Intento flexible de selección (por si las mayúsculas varían)
    const contactNodes =
      xmlDoc.querySelectorAll('Contact').length > 0
        ? xmlDoc.querySelectorAll('Contact')
        : xmlDoc.querySelectorAll('contact, contacto')

    const parsed: Contact[] = []
    contactNodes.forEach((node) => {
      const text = (sel: string) =>
        node.querySelector(sel)?.textContent?.trim() || ''

      const id =
        text('id') ||
        text('ID') ||
        text('Id') ||
        Math.random().toString(36).slice(2)

      const firstName = text('FirstName') || text('firstName') || text('Nombre') || ''
      const lastName = text('LastName') || text('lastName') || text('Apellidos') || ''
      const phone =
        text('phonenumber') ||
        text('PhoneNumber') ||
        text('Telefono') ||
        text('phone') ||
        ''

      const name = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim() || '—'
      parsed.push({ id, name, phone })
    })

    return parsed
  } catch (e) {
    console.error('Error parsing XML:', e)
    throw new Error('No se pudo leer el formato del XML.')
  }
}

async function loadXML() {
  try {
    isLoading.value = true
    error.value = null
    const response = await fetch('/contactsEUROSUR.xml', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(
        `Error ${response.status}: No se encontró /public/contactsEUROSUR.xml`
      )
    }
    const xmlText = await response.text()
    contacts.value = parseContactsXML(xmlText)
    lastLoadedAt.value = new Date().toLocaleString()
    // reset controles
    page.value = 1
    search.value = ''
    debouncedSearch.value = ''
    sortBy.value = 'name'
    sortDir.value = 'asc'
  } catch (e: any) {
    error.value = e.message || 'Error al cargar el XML.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadXML)

// Derivados: filtrado, orden y paginación
const filtered = computed(() => {
  const q = debouncedSearch.value.toLowerCase()
  if (!q) return contacts.value
  return contacts.value.filter(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
  )
})

const sorted = computed(() => {
  const arr = [...filtered.value]
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortBy.value
  return arr.sort((a, b) => {
    const va = (a[key] || '').toString().toLowerCase()
    const vb = (b[key] || '').toString().toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

const total = computed(() => sorted.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))
const pageItems = computed(() => {
  const start = (page.value - 1) * perPage.value
  return sorted.value.slice(start, start + perPage.value)
})

watch([perPage, total], () => {
  // si cambia perPage o total, asegura que la página existe
  page.value = Math.min(page.value, totalPages.value)
})

// Helpers UI
function toggleSort(column: 'id' | 'name' | 'phone') {
  if (sortBy.value === column) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortDir.value = 'asc'
  }
}

async function copyPhone(p: string) {
  try {
    await navigator.clipboard.writeText(p)
    // Feedback simple
    alert('Teléfono copiado')
  } catch {
    alert('No se pudo copiar el teléfono')
  }
}

function downloadCSV() {
  const headers = ['ID', 'Nombre', 'Teléfono']
  const rows = sorted.value.map((c) => [c.id, c.name, c.phone])
  const csv =
    [headers, ...rows].map((r) =>
      r
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contactos.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <main class="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
      <!-- Header -->
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Directorio de Contactos</h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ total }} contacto{{ total === 1 ? '' : 's' }}
            <span v-if="lastLoadedAt" class="text-slate-400">• Última carga: {{ lastLoadedAt }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadXML"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 active:scale-[0.99]"
          >
            <span class="i-lucide-refresh-cw" aria-hidden="true"></span>
            Recargar
          </button>
          <button
            @click="downloadCSV"
            class="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:opacity-95 active:scale-[0.99]"
          >
            <span class="i-lucide-download" aria-hidden="true"></span>
            Exportar CSV
          </button>
        </div>
      </header>

      <!-- Toolbar -->
      <div class="mb-4 grid gap-3 sm:grid-cols-3">
        <label class="col-span-2">
          <span class="mb-1 block text-xs font-medium text-slate-600">Buscar</span>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar por ID, nombre o teléfono…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Buscar contactos"
          />
        </label>

        <label class="col-span-1">
          <span class="mb-1 block text-xs font-medium text-slate-600">Elementos por página</span>
          <select
            v-model.number="perPage"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Elementos por página"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>

      <!-- Estados -->
      <div v-if="isLoading" class="rounded-2xl border border-slate-200 bg-white p-6">
        <div class="grid gap-3">
          <div class="h-4 w-1/3 animate-pulse rounded bg-slate-200"></div>
          <div class="h-4 w-1/2 animate-pulse rounded bg-slate-200"></div>
          <div class="h-40 animate-pulse rounded bg-slate-100"></div>
        </div>
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
        role="alert"
      >
        <p class="font-semibold">No se pudieron cargar los contactos.</p>
        <p class="text-sm mt-1">{{ error }}</p>
        <button
          @click="loadXML"
          class="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm hover:bg-red-100"
        >
          Reintentar
        </button>
      </div>

      <!-- Lista -->
      <section v-else>
        <!-- Móvil: tarjetas -->
        <div class="grid gap-3 sm:hidden">
          <div
            v-for="c in pageItems"
            :key="c.id"
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-500">ID</p>
                <p class="font-mono text-sm text-slate-700">{{ c.id }}</p>
              </div>
              <button
                v-if="c.phone"
                @click="copyPhone(c.phone)"
                class="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
              >
                Copiar teléfono
              </button>
            </div>
            <div class="mt-3">
              <p class="text-xs uppercase tracking-wide text-slate-500">Nombre</p>
              <p class="text-base font-medium text-slate-900">{{ c.name }}</p>
            </div>
            <div class="mt-3">
              <p class="text-xs uppercase tracking-wide text-slate-500">Teléfono</p>
              <p class="font-mono text-sm text-slate-700">{{ c.phone || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Escritorio: tabla -->
        <div class="hidden sm:block rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <button
                      class="inline-flex items-center gap-1 hover:underline"
                      @click="toggleSort('id')"
                      aria-label="Ordenar por ID"
                    >
                      ID
                      <span v-if="sortBy === 'id'">({{ sortDir === 'asc' ? '↑' : '↓' }})</span>
                    </button>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <button
                      class="inline-flex items-center gap-1 hover:underline"
                      @click="toggleSort('name')"
                      aria-label="Ordenar por nombre"
                    >
                      Nombre
                      <span v-if="sortBy === 'name'">({{ sortDir === 'asc' ? '↑' : '↓' }})</span>
                    </button>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <button
                      class="inline-flex items-center gap-1 hover:underline"
                      @click="toggleSort('phone')"
                      aria-label="Ordenar por teléfono"
                    >
                      Teléfono
                      <span v-if="sortBy === 'phone'">({{ sortDir === 'asc' ? '↑' : '↓' }})</span>
                    </button>
                  </th>
                  <th class="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr v-if="sorted.length === 0">
                  <td colspan="4" class="px-6 py-10 text-center text-slate-500">
                    No hay resultados para “{{ debouncedSearch }}”.
                  </td>
                </tr>

                <tr v-for="c in pageItems" :key="c.id" class="hover:bg-slate-50">
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-600 font-mono">{{ c.id }}</td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{{ c.name }}</td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-slate-700 font-mono">{{ c.phone || '—' }}</td>
                  <td class="px-6 py-4">
                    <div class="flex justify-end">
                      <button
                        v-if="c.phone"
                        @click="copyPhone(c.phone)"
                        class="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100"
                      >
                        Copiar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Paginación -->
        <nav class="mt-4 flex items-center justify-between gap-3">
          <button
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
            :disabled="page <= 1"
            @click="page = Math.max(1, page - 1)"
          >
            Anterior
          </button>
          <p class="text-sm text-slate-600">
            Página {{ page }} de {{ totalPages }}
          </p>
          <button
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
            :disabled="page >= totalPages"
            @click="page = Math.min(totalPages, page + 1)"
          >
            Siguiente
          </button>
        </nav>
      </section>
    </main>
  </div>
</template>
