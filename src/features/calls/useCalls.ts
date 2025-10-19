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
    const start  = c?.date_start ? Date.parse(c.date_start.replace(' ', 'T')) : null
    const answer = c?.date_answer ? Date.parse(c.date_answer.replace(' ', 'T')) : null
    const end    = c?.date_end   ? Date.parse(c.date_end.replace(' ', 'T'))   : null
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
 * - POST + header Authorization (recomendado) por defecto.
 * - Si VITE_MUNDOSMS_USE_GET = '1', usa GET con json y Authorization en query (modo prueba).
 */
export function useCallsKpis(refetchMs = 5000, windowSeconds = 60, agentActiveMinutes = 10) {
  const endpoint = import.meta.env.VITE_MUNDOSMS_CALLS_ENDPOINT || 'APIv3/list_voipcalls'
  const useGet = import.meta.env.VITE_MUNDOSMS_USE_GET === '1'
  const token = import.meta.env.VITE_MUNDOSMS_TOKEN

  return useQuery({
    queryKey: ['mundosms-calls', ymd(new Date()), useGet ? 'GET' : 'POST'],
    queryFn: async () => {
      const body = {
        metodo: 'POST',
        type: 'in',
        from_datetime: '',   // si quieres desde hoy, usa: ymd(new Date())
        from_id: '',
        showall: '0',
      }

      let res: any
      if (useGet) {
        // MODO PRUEBA (como tu enlace)
        res = await mundosmsApi.get(endpoint, {
          searchParams: {
            json: JSON.stringify(body),
            Authorization: `Bearer ${token ?? ''}`,
          },
        }).json<any>()
      } else {
        // MODO RECOMENDADO
        res = await mundosmsApi.post(endpoint, { json: body }).json<any>()
      }

      const calls = parseCalls(res)
      return toKpis(calls, windowSeconds, agentActiveMinutes)
    },
    refetchInterval: refetchMs,
    refetchIntervalInBackground: true,
    staleTime: Math.floor(refetchMs * 0.5),
    initialData: { waiting_now: 0, answered_today: 0, agents_online: 0 } as CallsKpis,
  })
}
