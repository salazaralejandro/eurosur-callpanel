import { Kpis } from './schema'
import { api } from '@/utils/api'
import { useMocks } from '@/utils/mock'
import { useQuery } from '@tanstack/vue-query'

function mockKpis() {
  const base = 120
  const answered = base + Math.floor(Math.random() * 20)
  const waiting = Math.floor(Math.random() * 4)
  const agents = 6 + Math.floor(Math.random() * 3)
  return { waiting_now: waiting, answered_today: answered, agents_online: agents, updated_at: new Date().toISOString() }
}

export function useKpis() {
  const mocks = useMocks()
  return useQuery({
    queryKey: ['kpis', mocks],
    queryFn: async () => {
      if (mocks) return Kpis.parse(mockKpis())
      return Kpis.parse(await api.get('kpis').json())
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
}
