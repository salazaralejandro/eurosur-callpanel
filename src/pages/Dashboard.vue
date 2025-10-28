<script setup lang="ts">
import { RouterLink } from 'vue-router'
// Importamos el icono para Contactos (BookUser o Users)
import { Phone, Fuel, ChevronRight, BookUser } from 'lucide-vue-next'
</script>

<template>
  <main class="mx-auto max-w-[1800px] px-4 sm:px-8 py-8">
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-slate-900">Bienvenido</h1>
      <p class="mt-1 text-lg text-slate-600">Selecciona el panel que quieres gestionar.</p>
    </header>

    <!-- La rejilla ahora tendrá 3 columnas en pantallas grandes -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Card: Llamadas -->
      <RouterLink
        to="/calls"
        class="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-offset-2 transition-all
               duration-150 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1
               focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Ir al panel de Llamadas"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Llamadas</h2>
            <p class="mt-1 text-base text-slate-600">
              Accede al panel de llamadas en tiempo real.
            </p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm text-blue-700">
              Entrar <ChevronRight class="h-4 w-4" />
            </span>
          </div>
          <div
            class="ml-4 rounded-lg bg-blue-100 p-3 text-blue-600 transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            <Phone class="h-6 w-6" />
          </div>
        </div>
      </RouterLink>

      <!-- Card: Gasoil -->
      <RouterLink
        to="/gasoil"
        class="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-offset-2 transition-all
               duration-150 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1
               focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Ir al panel de Gasoil"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Depósitos y suministros</h2>
            <p class="mt-1 text-base text-slate-600">
              Niveles por depósito, alertas y entradas por día/hora.
            </p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm text-blue-700">
              Entrar <ChevronRight class="h-4 w-4" />
            </span>
          </div>
          <div
            class="ml-4 rounded-lg bg-blue-100 p-3 text-blue-600 transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            <Fuel class="h-6 w-6" />
          </div>
        </div>
      </RouterLink>

      <!-- Card: Contactos (NUEVA) -->
      <RouterLink
        to="/contacts"
        class="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-offset-2 transition-all
               duration-150 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1
               focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Ir al directorio de Contactos"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Contactos</h2>
            <p class="mt-1 text-base text-slate-600">
              Visualiza el directorio XML de los terminales.
            </p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm text-blue-700">
              Consultar <ChevronRight class="h-4 w-4" />
            </span>
          </div>
          <div
            class="ml-4 rounded-lg bg-blue-100 p-3 text-blue-600 transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            <BookUser class="h-6 w-6" />
          </div>
        </div>
      </RouterLink>
    </section>
  </main>
</template>
