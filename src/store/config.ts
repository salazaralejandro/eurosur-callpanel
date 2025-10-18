import { defineStore } from 'pinia'

interface ConfigState {
  umbralAlerta: number
  umbralCritico: number
  sonidoHabilitado: boolean
  notificacionesSMS: boolean
  telefonosNotificacion: string[]
}

const CONFIG_KEY = 'eurosur_config'

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    umbralAlerta: 400,
    umbralCritico: 200,
    sonidoHabilitado: true,
    notificacionesSMS: false,
    telefonosNotificacion: []
  }),

  actions: {
    loadConfig() {
      const saved = localStorage.getItem(CONFIG_KEY)
      if (saved) {
        try {
          const config = JSON.parse(saved)
          Object.assign(this.$state, config)
        } catch (e) {
          console.error('Error al cargar configuración:', e)
        }
      }
    },

    saveConfig() {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.$state))
    },

    updateConfig(config: Partial<ConfigState>) {
      Object.assign(this.$state, config)
      this.saveConfig()
    },

    resetConfig() {
      this.$reset()
      localStorage.removeItem(CONFIG_KEY)
    }
  }
})