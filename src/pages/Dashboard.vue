<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Phone, Fuel } from 'lucide-vue-next'
</script>

<template>
    <main class="mx-auto max-w-[1800px] px-4 sm:px-8 py-8">
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-slate-900">Bienvenido</h1>
      <p class="mt-1 text-lg text-slate-600">Selecciona el panel que quieres gestionar.</p>
    </header>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      
      <RouterLink
        to="/calls"
        class="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-offset-2 transition-all 
               duration-150 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Llamadas</h2>
            <p class="mt-1 text-base text-slate-600">
              Monitoriza las llamadas en tiempo real y KPIs del call-center.
            </p>
          </div>
          
          <div
            class="ml-4 rounded-lg bg-blue-100 p-3 text-blue-600 
                   transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            <Phone class="h-6 w-6" />
          </div>
        </div>
      </RouterLink>

      <RouterLink
        to="/gasoil"
        class="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-offset-2 transition-all 
               duration-150 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Gasoil</h2>
            <p class="mt-1 text-base text-slate-600">
              Revisa suministros diarios y el estado de los depósitos.
            </p>
          </div>

          <div
            class="ml-4 rounded-lg bg-blue-100 p-3 text-blue-600 
                   transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            <Fuel class="h-6 w-6" />
          </div>
        </div>
      </RouterLink>

    </section>
  </main>
</template>