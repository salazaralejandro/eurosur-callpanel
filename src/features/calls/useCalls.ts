import { mundosmsApi } from '@/utils/api'
import { useQuery } from '@tanstack/vue-query'

export type CallsKpis = {
  waiting_now: number
  answered_today: number
  agents_online: number
}

function ymd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseCalls(res: any): any[] {
  if (res?.data?.calls && Array.isArray(res.data.calls)) return res.data.calls
  if (res?.calls && Array.isArray(res.calls)) return res.calls
  if (Array.isArray(res)) return res
  return []
}

function getAgentKey(call: any): string | null {
  if (call?.agent_id) return String(call.agent_id)
  if (call?.callerid_text) return String(call.callerid_text)
  if (call?.arr_related && Array.isArray(call.arr_related) && call.arr_related[0]?.id) {
    return String(call.arr_related[0].id)
  }
  return null
}

function toKpis(calls: any[], windowSeconds = 60, agentActiveMinutes = 10): CallsKpis {
  const now = Date.now()
  const recentCutoff = now - windowSeconds * 1000
  const agentCutoff = now - agentActiveMinutes * 60 * 1000

  let waiting_now = 0
  let answered_today = 0
  const activeAgents = new Set<string>()

  for (const c of calls) {
    const start = c?.date_start ? Date.parse(c.date_start.replace(' ', 'T')) : null
    const answer = c?.date_answer ? Date.parse(c.date_answer.replace(' ', 'T')) : null
    const end = c?.date_end ? Date.parse(c.date_end.replace(' ', 'T')) : null
    const status = String(c?.status ?? '')

    if (status === '1') {
      answered_today++
      if (answer && answer >= agentCutoff) {
        const agent = getAgentKey(c)
        if (agent) activeAgents.add(agent)
      }
    }

    if (start && !answer && !end && start >= recentCutoff) {
      waiting_now++
    }
  }

  return { waiting_now, answered_today, agents_online: activeAgents.size }
}

/**
 * KPIs de MundoSMS.
 * Llama al proxy seguro /api/voip.calls
 */
export function useCallsKpis(refetchMs = 5000, windowSeconds = 60, agentActiveMinutes = 10) {
  // ❌ ELIMINADAS las variables 'endpoint', 'useGet' y 'token'.
  // El frontend ya no necesita saber nada de esto.

  return useQuery({
    queryKey: ['mundosms-calls', ymd(new Date())],
    queryFn: async () => {
      // Parámetros que enviaremos a nuestro proxy /api/voip.calls
      // Tu proxy los reenviará a MundoSMS
      const searchParams = {
        type: 'in',
        from_datetime: '', // si quieres desde hoy, usa: ymd(new Date())
        from_id: '',
        showall: '0',
      }

      // ✅ MODO SEGURO:
      // 1. Llama a 'voip.calls' (el nombre de tu archivo /api/voip.calls.ts)
      // 2. 'mundosmsApi' tiene prefixUrl: '/api', por lo que la URL real es '/api/voip.calls'
      // 3. Usa 'GET' con 'searchParams', que es como tu proxy está diseñado
      const res = await mundosmsApi
        .get('voip.calls', {
          searchParams,
        })
        .json<any>()

      const calls = parseCalls(res)
      return toKpis(calls, windowSeconds, agentActiveMinutes)
    },
    refetchInterval: refetchMs,
    refetchIntervalInBackground: true,
    staleTime: Math.floor(refetchMs * 0.5),
    initialData: { waiting_now: 0, answered_today: 0, agents_online: 0 } as CallsKpis,
  })
}